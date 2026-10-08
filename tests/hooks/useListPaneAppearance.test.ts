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
    getStoredListPaneAppearanceFields,
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
    it('resolves grouping overrides while keeping titles hardcoded to one row', () => {
        const result = resolveListPaneAppearance({
            settings: createSettings(),
            appearance: { groupBy: 'folder' },
            selectionType: ItemType.FOLDER
        });

        expect(result).toEqual({ groupBy: 'folder' });
    });

    it('falls back to the global grouping when no override is stored', () => {
        const result = resolveListPaneAppearance({
            settings: createSettings({ noteGrouping: 'date-created' }),
            appearance: undefined,
            selectionType: ItemType.PROPERTY
        });

        expect(result.groupBy).toBe('date-created');
    });
});

describe('stored list appearance intent', () => {
    it('no longer stores display fields (title rows are hardcoded)', () => {
        expect(getStoredListPaneAppearanceFields()).toBeNull();
    });

    it('preserves grouping while resetting appearance fields', () => {
        expect(mergeListPaneAppearanceAndGrouping(null, 'folder')).toEqual({ groupBy: 'folder' });
        expect(mergeListPaneAppearanceAndGrouping(null, undefined)).toBeNull();
    });
});

describe('appearance map snapshots', () => {
    it('preserves map identity when an unrelated settings update leaves appearances unchanged', () => {
        const current = {
            Writing: { groupBy: 'folder' }
        } satisfies Record<string, ListPaneAppearance>;
        const initialSnapshot = snapshotListPaneAppearanceMap(current);
        const nextSnapshot = snapshotListPaneAppearanceMap(current, initialSnapshot);

        expect(nextSnapshot).toBe(initialSnapshot);
        expect(nextSnapshot).not.toBe(current);
        expect(nextSnapshot.Writing).not.toBe(current.Writing);
    });

    it('publishes a new immutable snapshot after an in-place appearance mutation', () => {
        const current = {
            Writing: { groupBy: 'folder' }
        } satisfies Record<string, ListPaneAppearance>;
        const initialSnapshot = snapshotListPaneAppearanceMap(current);

        current.Writing.groupBy = 'tag';
        const nextSnapshot = snapshotListPaneAppearanceMap(current, initialSnapshot);

        expect(nextSnapshot).not.toBe(initialSnapshot);
        expect(nextSnapshot.Writing.groupBy).toBe('tag');
        expect(initialSnapshot.Writing.groupBy).toBe('folder');
    });
});
