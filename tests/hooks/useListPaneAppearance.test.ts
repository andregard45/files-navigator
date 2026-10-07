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

import { describe, expect, it } from 'vitest';
import {
    areStoredListPaneAppearanceFieldsEqual,
    getStoredListPaneAppearanceFields,
    hasStoredListPaneAppearanceOverride,
    mergeListPaneAppearanceAndGrouping,
    resolveListPaneAppearance,
    snapshotListPaneAppearanceMap,
    type ListPaneAppearance
} from '../../src/settings/listPaneAppearance';
import { DEFAULT_SETTINGS } from '../../src/settings/defaultSettings';
import type { NotebookNavigatorSettings } from '../../src/settings/types';
import { ItemType } from '../../src/types';

function createSettings(overrides: Partial<NotebookNavigatorSettings> = {}): NotebookNavigatorSettings {
    return { ...structuredClone(DEFAULT_SETTINGS), ...overrides };
}

describe('resolveListPaneAppearance', () => {
    it('lets a selection override the stored title rows', () => {
        const result = resolveListPaneAppearance({
            settings: createSettings({ fileNameRows: 1 }),
            appearance: { titleRows: 2 },
            selectionType: ItemType.FOLDER
        });

        expect(result).toMatchObject({ titleRows: 2 });
    });

    it('falls back to the global file name rows when no override is stored', () => {
        const result = resolveListPaneAppearance({
            settings: createSettings({ fileNameRows: 3 }),
            appearance: undefined,
            selectionType: ItemType.PROPERTY
        });

        expect(result).toMatchObject({ titleRows: 3 });
    });
});

describe('stored list appearance intent', () => {
    it('retains valid fields and drops invalid or unknown fields', () => {
        const stored = getStoredListPaneAppearanceFields({
            titleRows: 2,
            previewRows: 9,
            showProperties: true
        } as unknown as ListPaneAppearance);

        expect(stored).toEqual({
            titleRows: 2,
        });
        expect(hasStoredListPaneAppearanceOverride(stored ?? undefined)).toBe(true);
    });

    it('treats toggles stored with different values as different overrides', () => {
        expect(areStoredListPaneAppearanceFieldsEqual({ titleRows: 2 }, { titleRows: 3 })).toBe(false);
        expect(areStoredListPaneAppearanceFieldsEqual({ titleRows: 2 }, { titleRows: 2 })).toBe(true);
        expect(areStoredListPaneAppearanceFieldsEqual(undefined, { titleRows: undefined })).toBe(true);
    });

    it('preserves grouping while resetting appearance fields', () => {
        expect(mergeListPaneAppearanceAndGrouping(null, 'folder')).toEqual({ groupBy: 'folder' });
        expect(mergeListPaneAppearanceAndGrouping(null, undefined)).toBeNull();
    });
});

describe('appearance map snapshots', () => {
    it('preserves map identity when an unrelated settings update leaves appearances unchanged', () => {
        const current = {
            Writing: { titleRows: 2 }
        } satisfies Record<string, ListPaneAppearance>;
        const initialSnapshot = snapshotListPaneAppearanceMap(current);
        const nextSnapshot = snapshotListPaneAppearanceMap(current, initialSnapshot);

        expect(nextSnapshot).toBe(initialSnapshot);
        expect(nextSnapshot).not.toBe(current);
        expect(nextSnapshot.Writing).not.toBe(current.Writing);
    });

    it('publishes a new immutable snapshot after an in-place appearance mutation', () => {
        const current = {
            Writing: { titleRows: 2 }
        } satisfies Record<string, ListPaneAppearance>;
        const initialSnapshot = snapshotListPaneAppearanceMap(current);

        current.Writing.titleRows = 3;
        const nextSnapshot = snapshotListPaneAppearanceMap(current, initialSnapshot);

        expect(nextSnapshot).not.toBe(initialSnapshot);
        expect(nextSnapshot.Writing.titleRows).toBe(3);
        expect(initialSnapshot.Writing.titleRows).toBe(2);
    });
});
