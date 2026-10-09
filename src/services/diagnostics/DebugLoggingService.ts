import { Platform, type App } from 'obsidian';

/**
 * Startup debug logging service.
 *
 * ZERO-OVERHEAD CONTRACT: when `startupDebugLogging` is disabled, every public
 * method returns immediately. No timers, no allocations beyond a boolean check,
 * no file writes. The plugin's normal startup path is untouched.
 *
 * When enabled, this service:
 * - Tracks a startup timeline relative to onload using performance.now().
 * - Detects main-thread stalls by sampling with setInterval (~100ms) and
 *   flagging gaps above a 250ms threshold.
 * - After the last recorded event plus a settle delay (2000ms), writes a
 *   timestamped Markdown report (`nn-debug-<ISO>.md`) to the vault root via
 *   app.vault.adapter.write(), then stops.
 */

export interface ContentProviderBatchSummary {
    provider: string;
    requested: number;
    processed: number;
    skipped: number;
    failed: number;
    durationMs: number;
}

interface StartupEventRecord {
    event: string;
    elapsedMs: number;
    details?: Record<string, unknown>;
}

interface StorageReadyDetails {
    status?: string;
    indexableFileCount?: number;
    cachedFileCount?: number;
    diff?: { toAdd?: number; toUpdate?: number; toRemove?: number };
    queued?: { markdownFiles?: number; fileThumbnailFiles?: number };
    timingsMs?: Record<string, number>;
    [key: string]: unknown;
}

const SETTLE_DELAY_MS = 2000;
const STALL_SAMPLE_INTERVAL_MS = 100;
const STALL_THRESHOLD_MS = 250;

/**
 * Vault-local (per-device, never synced through data.json) storage key for the
 * startup debug logging toggle. Follows the same pattern as the uiScale local
 * preference: Obsidian's `loadLocalStorage`/`saveLocalStorage` are namespaced
 * per vault and plugin, so this survives restarts without being uploaded by
 * Obsidian Sync.
 */
export const STARTUP_DEBUG_LOGGING_STORAGE_KEY = 'notebook-navigator-startup-debug-logging';

/** Reads the persisted toggle from vault-local storage (false when unset). */
export function readStartupDebugLoggingPreference(): boolean {
    try {
        return window.localStorage.getItem(STARTUP_DEBUG_LOGGING_STORAGE_KEY) === 'true';
    } catch {
        return false;
    }
}

/** Persists the toggle to vault-local storage. Never throws. */
export function writeStartupDebugLoggingPreference(enabled: boolean): void {
    try {
        window.localStorage.setItem(STARTUP_DEBUG_LOGGING_STORAGE_KEY, String(enabled));
    } catch {
        // Storage unavailable (private mode etc.): the in-memory toggle still applies for this session.
    }
}

function isoFileNameStamp(date: Date): string {
    return date.toISOString().replace(/:/g, '-');
}

function formatSeconds(elapsedMs: number): string {
    return `${(elapsedMs / 1000).toFixed(3)}s`;
}

function truncateDetailValue(value: unknown): string {
    let text: string;
    if (value === null || value === undefined) {
        text = '';
    } else if (typeof value === 'object') {
        try {
            text = JSON.stringify(value);
        } catch {
            text = '[unserializable]';
        }
    } else {
        text = typeof value === 'string' ? value : JSON.stringify(value) ?? String(typeof value);
    }
    if (text.length > 120) {
        text = `${text.slice(0, 117)}...`;
    }
    return text.replace(/\|/g, '\\|').replace(/\n/g, ' ');
}

export class DebugLoggingService {
    private app: App;
    private pluginVersion: string;
    private enabled = false;
    private active = false;
    private disposed = false;

    private startTimeMs = 0;
    private logPath = '';
    private events: StartupEventRecord[] = [];
    private storageDetails: StorageReadyDetails | null = null;
    private userVisibleDetails: Record<string, unknown> | null = null;
    private contentProviderBatches: ContentProviderBatchSummary[] = [];
    private extraReportDetails: Record<string, unknown> = {};

    // Main-thread stall detection state
    private stallTimer: number | null = null;
    private lastSampleMs = 0;
    private stallSamplesMs: number[] = [];
    private maxGapMs = 0;

    // Settle timer state
    private settleTimer: number | null = null;
    private reportWritten = false;
    private writeInFlight: Promise<void> | null = null;

    constructor(app: App, pluginVersion: string) {
        this.app = app;
        this.pluginVersion = pluginVersion;
    }

    initialize(): void {
        this.disposed = false;
    }

    dispose(): void {
        this.disposed = true;
        this.stopStallSampler();
        if (this.settleTimer !== null) {
            window.clearTimeout(this.settleTimer);
            this.settleTimer = null;
        }
        this.active = false;
    }

    isEnabled(): boolean {
        return this.enabled;
    }

    isActive(): boolean {
        return this.active;
    }

    getLogPath(): string {
        return this.logPath;
    }

    setEnabled(enabled: boolean): void {
        if (this.disposed) return;
        if (enabled === this.enabled) return;
        // Persist the toggle as a vault-local preference so it survives restarts
        // without ever being synced through data.json ("not synced" label).
        writeStartupDebugLoggingPreference(enabled);
        this.enabled = enabled;
        if (!enabled) {
            // Turning off mid-startup: abandon tracking entirely.
            this.active = false;
            this.stopStallSampler();
            if (this.settleTimer !== null) {
                window.clearTimeout(this.settleTimer);
                this.settleTimer = null;
            }
            return;
        }
        this.beginSession();
    }

    recordStartupEvent(event: string, details?: Record<string, unknown>): void {
        if (!this.enabled) return;
        // Late enable (e.g. toggle flipped mid-session): start the timeline now
        // so this event still lands in a report instead of being silently dropped.
        if (!this.active && !this.reportWritten) this.beginSession();
        const elapsedMs = performance.now() - this.startTimeMs;
        this.events.push({ event, elapsedMs, details });
        this.scheduleSettle();
    }

    recordStorageReady(details: StorageReadyDetails): void {
        if (!this.enabled || !this.active) return;
        this.storageDetails = { ...details };
        this.recordStartupEvent('storage.ready', { ...details });
    }

    recordUserVisible(details?: Record<string, unknown>): void {
        if (!this.enabled || !this.active) return;
        if (this.userVisibleDetails) return; // first one only
        this.userVisibleDetails = { ...(details ?? {}) };
        this.recordStartupEvent('userVisible', details);
    }

    finishStartupReport(reason: string, details?: Record<string, unknown>): void {
        if (!this.enabled || !this.active) return;
        if (this.reportWritten) return;
        if (details) {
            this.extraReportDetails = { ...this.extraReportDetails, ...details };
        }
        void this.writeReport(reason);
    }

    logReport(title: string, details: Record<string, unknown>): void {
        if (!this.enabled) return;
        // Standalone diagnostic report: reuse the same writer with an explicit title.
        this.extraReportDetails = { ...this.extraReportDetails, reportTitle: title, ...details };
        if (this.active && !this.reportWritten) {
            void this.writeReport('manual-report');
        }
    }

    recordContentProviderBatch(summary: ContentProviderBatchSummary): void {
        if (!this.enabled || !this.active) return;
        this.contentProviderBatches.push(summary);
        this.scheduleSettle();
    }

    async flush(): Promise<void> {
        if (this.writeInFlight) {
            await this.writeInFlight;
        }
    }

    // ------------------------------------------------------------------
    // Internals
    // ------------------------------------------------------------------

    private beginSession(): void {
        if (this.active || this.reportWritten) return;
        this.active = true;
        this.startTimeMs = performance.now();
        this.events = [];
        this.stallSamplesMs = [];
        this.maxGapMs = 0;
        this.lastSampleMs = this.startTimeMs;
        this.logPath = `nn-debug-${isoFileNameStamp(new Date())}.md`;
        this.startStallSampler();
        this.recordStartupEventInternal('debugLogging.initialized', {
            pluginVersion: this.pluginVersion,
            platform: this.getPlatform(),
            logPath: this.logPath,
        }, false);
        this.scheduleSettle();
    }

    private getPlatform(): string {
        try {
            return Platform.isMobile ? 'mobile' : 'desktop';
        } catch {
            // ignore
        }
        return 'desktop';
    }

    private recordStartupEventInternal(
        event: string,
        details?: Record<string, unknown>,
        reschedule = true,
    ): void {
        const elapsedMs = performance.now() - this.startTimeMs;
        this.events.push({ event, elapsedMs, details });
        if (reschedule) this.scheduleSettle();
    }

    private startStallSampler(): void {
        this.stopStallSampler();
        this.stallTimer = window.setInterval(() => {
            const now = performance.now();
            const gap = now - this.lastSampleMs - STALL_SAMPLE_INTERVAL_MS;
            this.lastSampleMs = now;
            if (gap >= STALL_THRESHOLD_MS) {
                this.stallSamplesMs.push(Math.round(gap));
                if (gap > this.maxGapMs) this.maxGapMs = gap;
            }
        }, STALL_SAMPLE_INTERVAL_MS);
    }

    private stopStallSampler(): void {
        if (this.stallTimer !== null) {
            window.clearInterval(this.stallTimer);
            this.stallTimer = null;
        }
    }

    private scheduleSettle(): void {
        if (this.settleTimer !== null) {
            window.clearTimeout(this.settleTimer);
        }
        this.settleTimer = window.setTimeout(() => {
            this.settleTimer = null;
            if (!this.enabled || !this.active || this.reportWritten) return;
            void this.writeReport('settled');
        }, SETTLE_DELAY_MS);
    }

    private buildMarkdown(reason: string): string {
        const nowIso = new Date().toISOString();
        const elapsedMs = Math.round(performance.now() - this.startTimeMs);
        const events = this.events;

        const storageReady = events.find((e) => e.event === 'storage.ready');
        const layoutReady = events.find((e) => e.event === 'layout.ready');
        const userVisible = events.find((e) => e.event === 'userVisible');

        const storage = this.storageDetails ?? {};
        const diff = storage.diff ?? {};
        const queued = storage.queued ?? {};
        const timings = storage.timingsMs ?? {};

        const lines: string[] = [];
        lines.push(`## [${nowIso}] Startup diagnostics`);
        lines.push('');
        lines.push('### Summary');
        lines.push('');
        lines.push(`- Result: ${reason}`);
        lines.push('- Scope: starts when Obsidian calls Notebook Navigator onload; timeline gaps can include Obsidian or other plugins.');
        lines.push(`- User visible: ${userVisible ? Math.round(userVisible.elapsedMs) : 'n/a'} ms`);
        lines.push(`- Ready markers: storage ${storageReady ? Math.round(storageReady.elapsedMs) : 'n/a'} ms, layout ${layoutReady ? Math.round(layoutReady.elapsedMs) : 'n/a'} ms`);
        lines.push(`- Diagnostic window: ${elapsedMs} ms, including ${SETTLE_DELAY_MS} ms settle delay`);
        lines.push(`- Platform: ${this.getPlatform()}`);
        lines.push(`- Main-thread stalls: ${this.stallSamplesMs.length}, max ${Math.round(this.maxGapMs)} ms`);
        lines.push(`- Files: ${storage.indexableFileCount ?? 'n/a'} indexed, ${storage.cachedFileCount ?? 'n/a'} cached`);
        lines.push(`- Diff: add ${diff.toAdd ?? 0}, update ${diff.toUpdate ?? 0}, remove ${diff.toRemove ?? 0}`);
        const timingParts: string[] = [];
        for (const key of ['initialLoad', 'diff', 'tags', 'properties']) {
            if (timings[key] !== undefined) {
                timingParts.push(`${key} ${Math.round(timings[key])} ms`);
            }
        }
        lines.push(`- Storage timings: ${timingParts.length > 0 ? timingParts.join(', ') : 'n/a'}`);
        lines.push(`- Queued: ${queued.markdownFiles ?? 0} markdown, ${queued.fileThumbnailFiles ?? 0} file thumbnails`);
        lines.push('');
        lines.push('### Timeline');
        lines.push('');
        lines.push('|    Time | Event | Details |');
        lines.push('| ------: | ----- | ------- |');
        for (const ev of events) {
            const detailText = ev.details
                ? Object.entries(ev.details).map(([k, v]) => `${k}=${truncateDetailValue(v)}`).join(', ')
                : '';
            lines.push(`| ${formatSeconds(ev.elapsedMs)} | ${ev.event} | ${detailText} |`);
        }
        lines.push('');
        lines.push('### Raw data');
        lines.push('');
        lines.push('```json');
        const raw = {
            pluginVersion: this.pluginVersion,
            platform: this.getPlatform(),
            logPath: this.logPath,
            reason,
            elapsedMs,
            mainThreadStalls: {
                thresholdMs: STALL_THRESHOLD_MS,
                count: this.stallSamplesMs.length,
                maxGapMs: Math.round(this.maxGapMs),
                samplesMs: this.stallSamplesMs,
            },
            events: events.map((e) => ({
                event: e.event,
                elapsedMs: Math.round(e.elapsedMs),
                ...(e.details ? { details: e.details } : {}),
            })),
            storage,
            userVisible: this.userVisibleDetails ?? undefined,
            settleDelayMs: SETTLE_DELAY_MS,
            ...(Object.keys(this.extraReportDetails).length > 0
                ? { extra: this.extraReportDetails }
                : {}),
            ...(this.contentProviderBatches.length > 0
                ? { contentProviderBatches: this.contentProviderBatches }
                : {}),
        };
        lines.push(JSON.stringify(raw, null, 2));
        lines.push('```');
        lines.push('');
        return lines.join('\n');
    }

    private async writeReport(reason: string): Promise<void> {
        if (this.reportWritten || !this.active) return;
        this.reportWritten = true;
        this.active = false;
        this.stopStallSampler();
        if (this.settleTimer !== null) {
            window.clearTimeout(this.settleTimer);
            this.settleTimer = null;
        }
        const markdown = this.buildMarkdown(reason);
        const task = (async () => {
            try {
                await this.app.vault.adapter.write(this.logPath, markdown);
            } catch (error) {
                // Never break startup because of diagnostics.
                console.error('[Notebook Navigator] Failed to write startup debug log:', error);
            }
        })();
        this.writeInFlight = task;
        await task;
        this.writeInFlight = null;
    }
}

// ----------------------------------------------------------------------
// Module-level singleton + helpers (used by startup/storage/content code)
// ----------------------------------------------------------------------

let activeService: DebugLoggingService | null = null;

export function initDebugLoggingService(app: App, pluginVersion: string): DebugLoggingService {
    if (activeService) {
        return activeService;
    }
    activeService = new DebugLoggingService(app, pluginVersion);
    activeService.initialize();
    return activeService;
}

export function getDebugLoggingService(): DebugLoggingService | null {
    return activeService;
}

export function disposeDebugLoggingService(): void {
    if (activeService) {
        activeService.dispose();
        activeService = null;
    }
}

export function recordStartupDiagnostic(
    event: string,
    details?: Record<string, unknown>,
): void {
    const svc = activeService;
    if (!svc || !svc.isEnabled()) return;
    svc.recordStartupEvent(event, details);
}

export function finishStartupDiagnostics(details: Record<string, unknown>): void {
    const svc = activeService;
    if (!svc || !svc.isEnabled()) return;
    svc.finishStartupReport(typeof details.reason === 'string' ? details.reason : 'settled', details);
}

export function recordStartupUserVisible(details?: Record<string, unknown>): void {
    const svc = activeService;
    if (!svc || !svc.isEnabled()) return;
    svc.recordUserVisible(details);
}

export function recordDebugReport(title: string, details: Record<string, unknown>): void {
    const svc = activeService;
    if (!svc || !svc.isEnabled()) return;
    svc.logReport(title, details);
}

export function recordContentProviderBatch(summary: ContentProviderBatchSummary): void {
    const svc = activeService;
    if (!svc || !svc.isEnabled()) return;
    svc.recordContentProviderBatch(summary);
}
