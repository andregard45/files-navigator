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
    titleRows: number;
    groupBy: ListNoteGroupingOption;
}

/**
 * Content toggles that can be stored per folder, tag, or property selection.
 * The file-display property pills feature was removed; no content toggles remain.
 */
export const LIST_PANE_TOGGLE_KEYS = [] as const;

export type ListPaneToggleKey = (typeof LIST_PANE_TOGGLE_KEYS)[number];

export type ListPaneAppearanceFields = Omit<ListPaneAppearance, 'groupBy'>;

const LIST_PANE_APPEARANCE_FIELD_KEYS = [
    'titleRows',
    ...LIST_PANE_TOGGLE_KEYS
] as const satisfies readonly (keyof ListPaneAppearanceFields)[];

function isValidTitleRows(value: unknown): value is number {
    return typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 3;
}

/**
 * Returns the stored appearance intent without grouping, dropping invalid and unknown fields.
 * Returns null when the appearance stores no valid field, so callers can delete the record.
 */
export function getStoredListPaneAppearanceFields(appearance: ListPaneAppearance | undefined): ListPaneAppearanceFields | null {
    if (!appearance) {
        return null;
    }

    const normalized: ListPaneAppearanceFields = {};
    if (isValidTitleRows(appearance.titleRows)) {
        normalized.titleRows = appearance.titleRows;
    }
    LIST_PANE_TOGGLE_KEYS.forEach(key => {
        if (typeof appearance[key] === 'boolean') {
            normalized[key] = appearance[key];
        }
    });

    return Object.keys(normalized).length > 0 ? normalized : null;
}

export function hasStoredListPaneAppearanceOverride(appearance: ListPaneAppearance | undefined): boolean {
    return getStoredListPaneAppearanceFields(appearance) !== null;
}

export function areStoredListPaneAppearanceFieldsEqual(
    left: ListPaneAppearance | undefined,
    right: ListPaneAppearance | undefined
): boolean {
    const normalizedLeft = getStoredListPaneAppearanceFields(left);
    const normalizedRight = getStoredListPaneAppearanceFields(right);
    if (!normalizedLeft || !normalizedRight) {
        return normalizedLeft === normalizedRight;
    }

    return LIST_PANE_APPEARANCE_FIELD_KEYS.every(key => normalizedLeft[key] === normalizedRight[key]);
}

/** Combines appearance-only fields with grouping while keeping the two toolbar concerns independent. */
export function mergeListPaneAppearanceAndGrouping(
    appearanceFields: ListPaneAppearanceFields | null,
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
 * Compact is the only list mode, so per-selection overrides cover title rows and grouping only.
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
        titleRows: isValidTitleRows(appearance?.titleRows) ? appearance.titleRows : settings.fileNameRows,
        groupBy: grouping.effectiveGrouping
    };
}
