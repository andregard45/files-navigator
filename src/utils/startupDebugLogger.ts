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

function formatDuration(elapsedMs: number): string {
    return elapsedMs >= 100 ? `${elapsedMs.toFixed(0)} ms` : `${elapsedMs.toFixed(1)} ms`;
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
