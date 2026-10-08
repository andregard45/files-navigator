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
import type { NotebookNavigatorSettings } from '../../src/settings';
import { DEFAULT_SETTINGS } from '../../src/settings/defaultSettings';
import {
    createPropertyGroupingOption,
    getPropertyGroupingOrder,
    getPropertyGroupingKey,
    normalizeListNoteGroupingOption
} from '../../src/settings/types';
import { buildPropertyKeyNodeId } from '../../src/utils/propertyTree';
import { ItemType } from '../../src/types';
import {
    areListGroupingOptionsEqual,
    areListGroupingOptionsSameKind,
    reconcileDefaultNoteGrouping,
    resolveEffectiveListGroupingForSort,
    resolveListGrouping,
    resolveListGroupingOverrideForDefault,
    resolvePropertyGroupingDirection,
    updateDefaultNoteGroupingKey,
    updatePropertyGroupKeySetting
} from '../../src/utils/listGrouping';

type GroupingSettings = Pick<NotebookNavigatorSettings, 'noteGrouping'>;

function createGroupingSettings(noteGrouping: GroupingSettings['noteGrouping']): GroupingSettings {
    return {
        noteGrouping
    };
}

describe('resolveListGrouping', () => {
    it('follows the global default grouping (per-selection overrides were removed)', () => {
        const settings = createGroupingSettings('folder');

        const result = resolveListGrouping({
            settings
        });

        expect(result.defaultGrouping).toBe('folder');
        expect(result.effectiveGrouping).toBe('folder');
        expect(result.normalizedOverride).toBeUndefined();
        expect(result.hasCustomOverride).toBe(false);
    });

    it('falls back to none when no global grouping is configured', () => {
        const settings = createGroupingSettings(undefined as unknown as GroupingSettings['noteGrouping']);

        const result = resolveListGrouping({ settings });

        expect(result.defaultGrouping).toBe('none');
        expect(result.effectiveGrouping).toBe('none');
        expect(result.normalizedOverride).toBeUndefined();
        expect(result.hasCustomOverride).toBe(false);
    });
});

describe('resolveEffectiveListGroupingForSort', () => {
    it('uses no grouping when property sort would otherwise use date grouping', () => {
        expect(
            resolveEffectiveListGroupingForSort({
                groupBy: 'date',
                sortOption: 'property-asc',
                selectionType: ItemType.FOLDER
            })
        ).toBe('none');
    });

    it('keeps folder grouping for property-sorted folder views', () => {
        expect(
            resolveEffectiveListGroupingForSort({
                groupBy: 'folder',
                sortOption: 'property-asc',
                selectionType: ItemType.FOLDER
            })
        ).toBe('folder');
    });

    it('uses no grouping for property-sorted tag and property views', () => {
        expect(
            resolveEffectiveListGroupingForSort({
                groupBy: 'date',
                sortOption: 'property-asc',
                selectionType: ItemType.TAG
            })
        ).toBe('none');
        expect(
            resolveEffectiveListGroupingForSort({
                groupBy: 'date',
                sortOption: 'property-asc',
                selectionType: ItemType.PROPERTY
            })
        ).toBe('none');
    });


    it('uses no grouping when date grouping is paired with a non-date sort', () => {
        expect(
            resolveEffectiveListGroupingForSort({
                groupBy: 'date',
                sortOption: 'title-asc',
                selectionType: ItemType.FOLDER
            })
        ).toBe('none');
    });

    it('keeps date grouping with date sorts', () => {
        expect(
            resolveEffectiveListGroupingForSort({
                groupBy: 'date',
                sortOption: 'modified-desc',
                selectionType: ItemType.FOLDER
            })
        ).toBe('date');
    });

    it('keeps property grouping under every sort and selection type', () => {
        const groupBy = createPropertyGroupingOption('status', 'asc');
        (['modified-desc', 'title-asc', 'property-asc'] as const).forEach(sortOption => {
            expect(
                resolveEffectiveListGroupingForSort({
                    groupBy,
                    sortOption,
                    selectionType: ItemType.FOLDER
                })
            ).toBe(groupBy);
        });
        expect(
            resolveEffectiveListGroupingForSort({
                groupBy,
                sortOption: 'property-asc',
                selectionType: ItemType.TAG
            })
        ).toBe(groupBy);
    });

});

describe('property grouping option encoding', () => {
    it('extracts trimmed property keys from encoded options', () => {
        expect(getPropertyGroupingKey('property:status')).toBe('status');
        expect(getPropertyGroupingKey('property: status ')).toBe('status');
        expect(getPropertyGroupingKey('property-desc:status')).toBe('status');
        expect(getPropertyGroupingKey('property:')).toBeNull();
        expect(getPropertyGroupingKey('folder')).toBeNull();
    });

    it('extracts the group order direction from the prefix', () => {
        expect(getPropertyGroupingOrder('property:status')).toBe('asc');
        expect(getPropertyGroupingOrder('property-desc:status')).toBe('desc');
        expect(getPropertyGroupingOrder('property-follow:status')).toBe('follow');
        expect(getPropertyGroupingOrder('folder')).toBeNull();
        expect(createPropertyGroupingOption('status', 'desc')).toBe('property-desc:status');
        expect(createPropertyGroupingOption('status', 'asc')).toBe('property:status');
        expect(createPropertyGroupingOption('status', 'follow')).toBe('property-follow:status');
    });

    it('keeps keys containing separator characters intact under both prefixes', () => {
        expect(getPropertyGroupingKey('property:-desc:odd')).toBe('-desc:odd');
        expect(getPropertyGroupingOrder('property:-desc:odd')).toBe('asc');
    });

    it('normalizes property grouping options to trimmed canonical form', () => {
        expect(normalizeListNoteGroupingOption('property: status ')).toBe('property:status');
        expect(normalizeListNoteGroupingOption('property-desc: status ')).toBe('property-desc:status');
        expect(normalizeListNoteGroupingOption('property:')).toBeNull();
        expect(normalizeListNoteGroupingOption('property-desc:')).toBeNull();
        expect(normalizeListNoteGroupingOption('none')).toBe('none');
        expect(normalizeListNoteGroupingOption('date')).toBe('date');
    });

    it('accepts property encodings for the vault-wide default grouping', () => {
        expect(normalizeListNoteGroupingOption('property:status')).toBe('property:status');
        expect(normalizeListNoteGroupingOption('property-desc:status')).toBe('property-desc:status');
        expect(normalizeListNoteGroupingOption('none')).toBe('none');
        expect(normalizeListNoteGroupingOption('folder')).toBe('folder');
        expect(normalizeListNoteGroupingOption('date')).toBe('date');
    });

    it('compares property grouping options case-insensitively including direction', () => {
        expect(areListGroupingOptionsEqual('property:Status', 'property:status')).toBe(true);
        expect(areListGroupingOptionsEqual('property:status', 'property-desc:status')).toBe(false);
        expect(areListGroupingOptionsEqual('property:status', 'property:genre')).toBe(false);
        expect(areListGroupingOptionsEqual('property:status', 'folder')).toBe(false);
        expect(areListGroupingOptionsEqual('date', 'date')).toBe(true);
    });

    it('matches grouping options of the same kind regardless of direction', () => {
        expect(areListGroupingOptionsSameKind('property:status', 'property-desc:Status')).toBe(true);
        expect(areListGroupingOptionsSameKind('property:status', 'property:genre')).toBe(false);
        expect(areListGroupingOptionsSameKind('date', 'date')).toBe(true);
        expect(areListGroupingOptionsSameKind('property:status', 'none')).toBe(false);
    });

    it('retains a grouping override when only one component matches the default', () => {
        expect(resolveListGroupingOverrideForDefault('property:genre', 'property:status')).toBe('property:genre');
        expect(resolveListGroupingOverrideForDefault('property-desc:status', 'property:status')).toBe('property-desc:status');
    });

    it('removes a grouping override when the complete selection matches the default', () => {
        expect(resolveListGroupingOverrideForDefault('property:Status', 'property:status')).toBeUndefined();
        expect(resolveListGroupingOverrideForDefault('date', 'date')).toBeUndefined();
    });
});

describe('reconcileDefaultNoteGrouping', () => {
    it('keeps property groupings whose key is configured, matching case-insensitively', () => {
        const settings = structuredClone(DEFAULT_SETTINGS);
        settings.propertyGroupKey = 'Status, genre';
        settings.noteGrouping = 'property:status';

        expect(reconcileDefaultNoteGrouping(settings)).toEqual({ changed: false, reset: false });
        expect(settings.noteGrouping).toBe('property:status');
    });



    it('leaves base grouping modes untouched', () => {
        const settings = structuredClone(DEFAULT_SETTINGS);
        settings.noteGrouping = 'folder';

        expect(reconcileDefaultNoteGrouping(settings)).toEqual({ changed: false, reset: false });
        expect(settings.noteGrouping).toBe('folder');
    });
});

describe('updateDefaultNoteGroupingKey', () => {
    it('rewrites the default grouping key on rename and keeps the direction', () => {
        const settings = structuredClone(DEFAULT_SETTINGS);
        settings.noteGrouping = 'property-desc:status';

        expect(updateDefaultNoteGroupingKey(settings, 'status', 'Stage')).toBe(true);
        expect(settings.noteGrouping).toBe('property-desc:Stage');
    });

    it('resets the default grouping when the key is deleted', () => {
        const settings = structuredClone(DEFAULT_SETTINGS);
        settings.noteGrouping = 'property:status';

        expect(updateDefaultNoteGroupingKey(settings, 'status', null)).toBe(true);
        expect(settings.noteGrouping).toBe(DEFAULT_SETTINGS.noteGrouping);
    });

    it('ignores renames of other keys and base grouping modes', () => {
        const settings = structuredClone(DEFAULT_SETTINGS);
        settings.noteGrouping = 'property:status';

        expect(updateDefaultNoteGroupingKey(settings, 'genre', 'Stage')).toBe(false);
        expect(settings.noteGrouping).toBe('property:status');

        settings.noteGrouping = 'date';
        expect(updateDefaultNoteGroupingKey(settings, 'status', 'Stage')).toBe(false);
        expect(settings.noteGrouping).toBe('date');
    });
});

describe('resolvePropertyGroupingDirection', () => {
    it('borrows the sort direction for follow-sort group orders', () => {
        expect(resolvePropertyGroupingDirection('property-follow:status', 'modified-desc')).toBe('desc');
        expect(resolvePropertyGroupingDirection('property-follow:status', 'title-asc')).toBe('asc');
        expect(resolvePropertyGroupingDirection('property-follow:status', 'property-desc')).toBe('desc');
    });

    it('returns fixed group orders unchanged regardless of the sort direction', () => {
        expect(resolvePropertyGroupingDirection('property:status', 'modified-desc')).toBe('asc');
        expect(resolvePropertyGroupingDirection('property-desc:status', 'title-asc')).toBe('desc');
    });
});

describe('updatePropertyGroupKeySetting', () => {
    it('rewrites the configured grouping list on rename and removes the key on delete', () => {
        const settings = structuredClone(DEFAULT_SETTINGS);
        settings.propertyGroupKey = 'status, genre';

        expect(updatePropertyGroupKeySetting(settings, 'status', 'Stage')).toBe(true);
        expect(settings.propertyGroupKey).toBe('Stage, genre');

        expect(updatePropertyGroupKeySetting(settings, 'genre', null)).toBe(true);
        expect(settings.propertyGroupKey).toBe('Stage');
    });

    it('reports no change for unknown keys and empty lists', () => {
        const settings = structuredClone(DEFAULT_SETTINGS);
        settings.propertyGroupKey = 'status';

        expect(updatePropertyGroupKeySetting(settings, 'genre', 'Stage')).toBe(false);
        expect(settings.propertyGroupKey).toBe('status');

        settings.propertyGroupKey = '';
        expect(updatePropertyGroupKeySetting(settings, 'status', 'Stage')).toBe(false);
    });
});
