/*
 * Notebook Navigator - Plugin for Obsidian
 * Copyright (c) 2025-2026 Johan Sanneblad
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

/**
 * Startup debug logging for plugin load performance monitoring.
 *
 * Restored during refactoring for debugging purposes: groups all startup messages under a single
 * collapsible console group, records the total load window with console.time/timeEnd, and measures
 * the duration of each major initialization phase (settings loading, service initialization, view
 * registration, layout-ready UI work). All output goes to the Obsidian developer console
 * (Ctrl+Shift+I on desktop, Cmd+Option+I on macOS).
 */

// NOTE ON LINTING: This module's sole purpose is writing startup diagnostics to the developer
// console, which the Obsidian plugin guidelines normally discourage (obsidianmd/rule-custom-message
// wraps the no-console rule). Because eslint-comments forbids inline disables of console rules, the
// guideline is exempted for this one file through a scoped "obsidianmd/rule-custom-message": "off"
// override in eslint.config.mjs instead. All other source files must keep using the project logger.

import { Platform } from 'obsidian';

const LOG_PREFIX = '[Notebook Navigator]';
const TIMER_NAME = `${LOG_PREFIX} startup`;

interface ActiveTimer {
    label: string;
    startedAt: number;
}

// Timers keyed by id so start/stop calls pair correctly even if phases overlap or are skipped
const activeTimers = new Map<string, ActiveTimer>();

let sessionStarted = false;

// Ids accepted by recordStartupTimestamp(). Each maps to one module-level timestamp slot below.
// The set brackets the two unlogged startup gaps ("black holes") found in granular timing data:
// #1 onload start → database init scheduled (310 ms) and #2 services initialized → storage initial
// load (231 ms). frontmatterSync/eventListeners probes attribute black hole #2 within main.ts.
export type StartupProbeId =
    | 'plugin.constructor.start'
    | 'plugin.constructor.complete'
    | 'onload.start'
    | 'modules.imported'
    | 'services.registered'
    | 'localStorage.read'
    | 'database.init.scheduled'
    | 'services.initialized'
    | 'frontmatterSync.init.start'
    | 'frontmatterSync.init.complete'
    | 'eventListeners.setup.start'
    | 'eventListeners.setup.complete'
    | 'vault.getMarkdownFiles.start'
    | 'vault.getMarkdownFiles.complete'
    | 'contentProvider.queue.start'
    | 'contentProvider.queue.complete';

// Bottleneck-probe timestamps. Plain performance.now() reads (microseconds of overhead), recorded
// on every load regardless of the debug toggle; they only surface through the console helpers
// below when a startup session is open, keeping the probes zero-cost when logging is off.
const probeTimestamps = new Map<StartupProbeId, number>();

/** Returns milliseconds since the plugin class was constructed, or null when no constructor ran (tests). */
export function getMsSinceConstructor(): number | null {
    const startMs = probeTimestamps.get('plugin.constructor.start');
    return startMs === undefined ? null : performance.now() - startMs;
}

/** Returns the recorded timestamp for a probe id, or null if it never fired. */
export function getProbeMs(id: StartupProbeId): number | null {
    return probeTimestamps.get(id) ?? null;
}

function formatDuration(elapsedMs: number): string {
    return elapsedMs >= 100 ? `${elapsedMs.toFixed(0)} ms` : `${elapsedMs.toFixed(1)} ms`;
}

// Formats a gap between two probe timestamps relative to the onload() entry point, e.g.
// "284–310 ms". Returns an empty string when either timestamp or onload start is missing.
function formatWindow(fromMs: number | null, toMs: number | null): string {
    const onloadStart = probeTimestamps.get('onload.start');
    if (onloadStart === undefined || fromMs === null || toMs === null) {
        return '';
    }
    return `${Math.round(fromMs - onloadStart)}–${Math.round(toMs - onloadStart)} ms`;
}

/**
 * Records a probe timestamp for a startup milestone used in bottleneck attribution. This is a single
 * performance.now() read plus a Map.set — effectively zero overhead and safe to call even when no
 * console session is open (the value only surfaces later through endPhase()/logProbePair() window
 * annotations).
 */
export function recordStartupTimestamp(id: StartupProbeId): void {
    probeTimestamps.set(id, performance.now());
}

// Window annotation appended to a phase completion line when both bracketing probes exist, e.g.
// "{ windowSinceOnloadStart: '310–420 ms' }". Keeps the console lines parseable for gap analysis.
function windowAnnotation(fromMs: number | null, toMs: number | null): Record<string, unknown> {
    const window = formatWindow(fromMs, toMs);
    return window ? { windowSinceOnloadStart: window } : {};
}

/**
 * Logs a completed probe pair as a single console line with its duration, e.g.
 * "✓ vault.getMarkdownFiles — 12 ms { count: 1543 }". No-op unless a startup session is open,
 * which keeps all bottleneck attribution silent while the debug toggle is OFF.
 */
export function logProbePair(label: string, startId: StartupProbeId, endId: StartupProbeId, detail?: Record<string, unknown>): void {
    if (!sessionStarted) {
        return;
    }
    const from = probeTimestamps.get(startId) ?? null;
    const to = probeTimestamps.get(endId) ?? null;
    if (from === null || to === null) {
        return;
    }
    console.log(`✓ ${label} — ${formatDuration(to - from)}`, { ...windowAnnotation(from, to), ...(detail ?? {}) });
}

/**
 * Opens the startup console group and starts the overall startup timer. Call once at the top of onload().
 */
export function beginStartupSession(pluginName: string, version: string): void {
    if (sessionStarted) {
        return;
    }
    sessionStarted = true;
    console.group(LOG_PREFIX);
    console.time(TIMER_NAME);
    console.log(`${pluginName} v${version}: startup began`, {
        timestamp: new Date().toISOString(),
        platform: Platform.isMobile ? 'mobile' : Platform.isDesktop ? 'desktop' : 'unknown'
    });
}

/**
 * Starts timing an initialization phase. Safe to call for phases that may never stop (e.g., when
 * startup aborts early); unpaired timers are cleaned up by endStartupSession().
 */
export function startPhase(id: string, label: string): void {
    if (!sessionStarted || activeTimers.has(id)) {
        return;
    }
    activeTimers.set(id, { label, startedAt: performance.now() });
    console.log(`… ${label}`);
}

/**
 * Stops a phase timer started by startPhase() and logs its duration. No-op for unknown ids.
 */
export function endPhase(id: string, detail?: Record<string, unknown>): void {
    const timer = activeTimers.get(id);
    if (!timer) {
        return;
    }
    activeTimers.delete(id);
    const elapsedMs = performance.now() - timer.startedAt;
    console.log(`✓ ${timer.label} — ${formatDuration(elapsedMs)}`, detail ?? {});
}

/**
 * Logs an informational message inside the startup group (e.g., "Layout ready").
 */
export function logStartupInfo(message: string, data?: unknown): void {
    if (!sessionStarted) {
        return;
    }
    console.log(`${message}`, data ?? '');
}

/**
 * Ends the startup session: stops remaining phase timers, ends the overall timer, logs the total
 * duration, and closes the console group. Call from the layout-ready callback (the last startup
 * milestone) and again defensively from onunload() in case startup never reached layout ready.
 */
export function endStartupSession(): void {
    if (!sessionStarted) {
        return;
    }
    sessionStarted = false;
    // Close out any phases that never paired (aborted or skipped startup paths)
    for (const [id, timer] of activeTimers) {
        const elapsedMs = performance.now() - timer.startedAt;
        console.log(`⚠ ${timer.label} did not complete cleanly — ${formatDuration(elapsedMs)}`);
        activeTimers.delete(id);
    }
    console.timeEnd(TIMER_NAME);
    console.log('Plugin loaded and ready.');
    console.groupEnd();
}
