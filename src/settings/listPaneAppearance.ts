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

import { ItemType } from '../types';
import { resolveListGroupingOverride } from '../utils/listGrouping';
import {
    type ListNoteGroupingOption,
    type ListPaneAppearance,
    type NotebookNavigatorSettings
} from './types';

export type { ListPaneAppearance } from './types';

export interface ListPaneAppearanceSettings {
    groupBy: ListNoteGroupingOption;
}

/**
 * Returns the stored display-appearance intent for a folder/tag/property record.
 * Title rows are hardcoded to one row everywhere, so no display fields remain and
 * this always returns null; callers use it to drop stale records while preserving grouping.
 */
export function getStoredListPaneAppearanceFields(): null {
    return null;
}

/** Combines appearance-only fields with grouping while keeping the two toolbar concerns independent. */
export function mergeListPaneAppearanceAndGrouping(
    appearanceFields: Record<string, never> | null,
    groupBy: ListNoteGroupingOption | undefined
): ListPaneAppearance | null {
    const merged: ListPaneAppearance = appearanceFields ? { ...appearanceFields } : {};
    if (groupBy !== undefined) {
        merged.groupBy = groupBy;
    }
    return Object.keys(merged).length > 0 ? merged : null;
}

function areAppearanceValuesEqual(left: ListPaneAppearance, right: ListPaneAppearance): boolean {
    const leftRecord = left as Record<string, unknown>;
    const rightRecord = right as Record<string, unknown>;
    const leftKeys = Object.keys(leftRecord);
    const rightKeys = Object.keys(rightRecord);
    return leftKeys.length === rightKeys.length && leftKeys.every(key => leftRecord[key] === rightRecord[key]);
}

function areAppearanceMapsEqual<T extends ListPaneAppearance>(left: Record<string, T>, right: Record<string, T> | undefined): boolean {
    const rightRecord = right ?? {};
    const leftKeys = Object.keys(left);
    const rightKeys = Object.keys(rightRecord);
    return (
        leftKeys.length === rightKeys.length &&
        leftKeys.every(key => {
            if (!Object.prototype.hasOwnProperty.call(rightRecord, key)) {
                return false;
            }
            const rightValue = rightRecord[key];
            return rightValue !== undefined && areAppearanceValuesEqual(left[key], rightValue);
        })
    );
}

function cloneAppearanceMap<T extends ListPaneAppearance>(map: Record<string, T> | undefined): Record<string, T> {
    const cloned = Object.create(null) as Record<string, T>;
    Object.entries(map ?? {}).forEach(([key, value]) => {
        cloned[key] = { ...value };
    });
    return cloned;
}

/**
 * Returns an immutable appearance-map snapshot, reusing the previous snapshot when its contents
 * still match. Settings are mutated in place, so reference equality alone cannot detect changes;
 * comparing with the previous clone preserves both mutation isolation and stable context identity.
 */
export function snapshotListPaneAppearanceMap<T extends ListPaneAppearance>(
    map: Record<string, T> | undefined,
    previous?: Record<string, T>
): Record<string, T> {
    if (previous && areAppearanceMapsEqual(previous, map)) {
        return previous;
    }
    return cloneAppearanceMap(map);
}

/**
 * Resolves the effective list pane appearance for a selection.
 *
 * Compact is the only list mode and titles always render on a single row, so per-selection
 * overrides cover grouping only.
 */
export function resolveListPaneAppearance({
    settings,
    appearance,
    selectionType
}: {
    settings: NotebookNavigatorSettings;
    appearance?: ListPaneAppearance;
    selectionType: ItemType;
}): ListPaneAppearanceSettings {
    const grouping = resolveListGroupingOverride({
        noteGrouping: settings.noteGrouping,
        selectionType,
        groupBy: appearance?.groupBy
    });

    return {
        groupBy: grouping.effectiveGrouping
    };
}
