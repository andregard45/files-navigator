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

import type { TFile } from 'obsidian';
import type { CalendarNoteConfig, CalendarNoteKind } from '../../utils/calendarNotes';
import type { MomentInstance } from '../../utils/moment';

export interface CalendarHoverTooltipData {
    imageUrl: string | null;
    title: string;
    dateTimestamp: number;
    previewPath: string | null;
    previewEnabled: boolean;
    showDate: boolean;
}

export interface CalendarHoverTooltipState {
    anchorEl: HTMLElement;
    tooltipData: CalendarHoverTooltipData;
}

/**
 * Calendar note state. Calendar notes are always shown, so profile visibility filters never hide them.
 *
 * - `existingFile` is the vault result for the target path (may be null when the note does not exist).
 * - `visibleFile` is the file the calendar may render, preview, count, or mark as active.
 * - `isHidden` is always false; it remains in the type because downstream action guards read it.
 * - `targetPath` identifies the destination even when no file exists.
 */
export interface CalendarNoteTarget {
    existingFile: TFile | null;
    visibleFile: TFile | null;
    isHidden: boolean;
    targetPath: string | null;
}

export interface CalendarDay {
    date: MomentInstance;
    iso: string;
    inMonth: boolean;
    note: CalendarNoteTarget;
}

export interface CalendarWeek {
    key: string;
    weekNumber: number;
    days: CalendarDay[];
}

export interface CalendarYearMonthEntry {
    date: MomentInstance;
    fullLabel: string;
    hasDailyNote: boolean;
    hasUnfinishedTasks: boolean;
    key: string;
    monthIndex: number;
    shortLabel: string;
}

export interface CalendarHeaderPeriodNoteTargets {
    month: CalendarNoteTarget;
    quarter: CalendarNoteTarget;
    year: CalendarNoteTarget;
}

export interface CalendarNoteContextMenuTarget {
    kind: CustomCalendarNoteKind;
    date: MomentInstance;
    note: CalendarNoteTarget;
    canCreate: boolean;
    monthKey?: string | null;
    dayIso?: string | null;
    currentMonthHighlightDayIso?: string | null;
}

export type CustomCalendarNoteKind = CalendarNoteKind;
export type CustomCalendarNoteConfig = CalendarNoteConfig;
