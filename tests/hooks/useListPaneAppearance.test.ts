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
    SEARCH_EXCERPT_ROWS,
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
    it('lets a selection hide globally shown content', () => {
        const settings = createSettings({
            showFileProperties: true,
        });
        const result = resolveListPaneAppearance({
            settings,
            appearance: {
                showProperties: false,
            },
            selectionType: ItemType.FOLDER
        });

        expect(result).toMatchObject({
            showProperties: false,
        });
    });

    it('lets a selection enable content that global settings turn off', () => {
        const settings = createSettings({
            showFileProperties: false,
        });
        const result = resolveListPaneAppearance({
            settings,
            appearance: {
                showProperties: true,
            },
            selectionType: ItemType.FOLDER
        });

        expect(result).toMatchObject({
            showProperties: true,
        });
    });

    it('applies compact mode gates without deleting stored Standard-mode preferences', () => {
        const result = resolveListPaneAppearance({
            settings: createSettings({
                defaultListMode: 'standard',
            }),
            appearance: { mode: 'compact' },
            selectionType: ItemType.PROPERTY
        });

        expect(result).toMatchObject({
            mode: 'compact',
            // The file-display preview feature was removed; excerpt sizing is a fixed internal constant.
            previewRows: 1,
        });
    });

    it('uses the standard excerpt row constant outside compact mode', () => {
        const result = resolveListPaneAppearance({
            settings: createSettings({ defaultListMode: 'standard' }),
            appearance: undefined,
            selectionType: ItemType.FOLDER
        });

        expect(result.previewRows).toBe(SEARCH_EXCERPT_ROWS);
    });

    it('keeps compact property visibility as a global style choice', () => {
        const result = resolveListPaneAppearance({
            settings: createSettings({
                defaultListMode: 'compact',
                showFileProperties: false,
                showFilePropertiesInCompactMode: true
            }),
            appearance: { showProperties: true },
            selectionType: ItemType.FOLDER
        });

        expect(result.showProperties).toBe(true);
    });

});

describe('stored list appearance intent', () => {
    it('retains both enabling and hiding toggles and drops invalid or unknown fields', () => {
        const stored = getStoredListPaneAppearanceFields({
            mode: 'standard',
            titleRows: 2,
            previewRows: 9,
            showProperties: true
        } as unknown as ListPaneAppearance);

        expect(stored).toEqual({
            mode: 'standard',
            titleRows: 2,
            showProperties: true,
        });
        expect(hasStoredListPaneAppearanceOverride(stored ?? undefined)).toBe(true);
    });

    it('treats toggles stored with different values as different overrides', () => {
        expect(areStoredListPaneAppearanceFieldsEqual({ showProperties: true }, { showProperties: false })).toBe(false);
        expect(areStoredListPaneAppearanceFieldsEqual({ showProperties: true }, { showProperties: true })).toBe(true);
        expect(areStoredListPaneAppearanceFieldsEqual(undefined, { showProperties: undefined })).toBe(true);
    });

    it('preserves grouping while resetting appearance fields', () => {
        expect(mergeListPaneAppearanceAndGrouping(null, 'folder')).toEqual({ groupBy: 'folder' });
        expect(mergeListPaneAppearanceAndGrouping(null, undefined)).toBeNull();
    });
});

describe('appearance map snapshots', () => {
    it('preserves map identity when an unrelated settings update leaves appearances unchanged', () => {
        const current = {
            Writing: { mode: 'standard', showProperties: true }
        } satisfies Record<string, ListPaneAppearance>;
        const initialSnapshot = snapshotListPaneAppearanceMap(current);
        const nextSnapshot = snapshotListPaneAppearanceMap(current, initialSnapshot);

        expect(nextSnapshot).toBe(initialSnapshot);
        expect(nextSnapshot).not.toBe(current);
        expect(nextSnapshot.Writing).not.toBe(current.Writing);
    });

    it('publishes a new immutable snapshot after an in-place appearance mutation', () => {
        const current = {
            Writing: { mode: 'standard', showProperties: true }
        } satisfies Record<string, ListPaneAppearance>;
        const initialSnapshot = snapshotListPaneAppearanceMap(current);

        current.Writing.showProperties = false;
        const nextSnapshot = snapshotListPaneAppearanceMap(current, initialSnapshot);

        expect(nextSnapshot).not.toBe(initialSnapshot);
        expect(nextSnapshot.Writing.showProperties).toBe(false);
        expect(initialSnapshot.Writing.showProperties).toBe(true);
    });
});
