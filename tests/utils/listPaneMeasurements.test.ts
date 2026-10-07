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
    estimateFileRowHeight,
    estimatePlainRowHeight,
    estimateSearchRowHeight,
    getListPaneMeasurements,
    getSelectedPropertyValuePillToHide,
    getPropertyRowCount
} from '../../src/utils/listPaneMeasurements';
import { SEARCH_EXCERPT_ROWS } from '../../src/settings/listPaneAppearance';
import { ItemType } from '../../src/types';
import { buildPropertyValueNodeId } from '../../src/utils/propertyTree';
import { createTestTFile } from './createTestTFile';

describe('listPaneMeasurements layout helpers', () => {
    const desktopHeights = getListPaneMeasurements(false);

    it('estimates compact file rows from compact padding, title rows, and visible pill rows', () => {
        expect(
            estimateFileRowHeight(
                {
                    hasSearchExcerptContent: false,
                    visiblePillRowCount: 2
                },
                {
                    heights: desktopHeights,
                    titleRows: 2,
                    isCompactMode: true,
                    showSearchExcerpt: false,
                    compactPaddingTotal: 18
                }
            )
        ).toBe(18 + desktopHeights.titleLineHeight * 2 + desktopHeights.tagRowHeight * 2);
    });

    it('uses a title-only row height in standard mode when there are no pill rows', () => {
        expect(
            estimateFileRowHeight(
                {
                    hasSearchExcerptContent: false,
                    visiblePillRowCount: 0
                },
                {
                    heights: desktopHeights,
                    titleRows: 1,
                    isCompactMode: false,
                    showSearchExcerpt: false,
                    compactPaddingTotal: 18
                }
            )
        ).toBe(desktopHeights.basePadding + desktopHeights.titleLineHeight);
    });

    it('delegates plain (non-search) rows to estimatePlainRowHeight', () => {
        expect(estimatePlainRowHeight({ heights: desktopHeights, titleRows: 1 }, 0)).toBe(
            desktopHeights.basePadding + desktopHeights.titleLineHeight
        );
        expect(estimatePlainRowHeight({ heights: desktopHeights, titleRows: 2 }, 1)).toBe(
            desktopHeights.basePadding + desktopHeights.titleLineHeight * 2 + desktopHeights.tagRowHeight
        );
        expect(estimatePlainRowHeight({ heights: desktopHeights, titleRows: 1 }, 3)).toBe(
            desktopHeights.basePadding + desktopHeights.titleLineHeight + desktopHeights.tagRowHeight * 3
        );

        // estimateFileRowHeight routes non-search rows through the same estimator.
        expect(
            estimateFileRowHeight(
                { hasSearchExcerptContent: false, visiblePillRowCount: 3 },
                {
                    heights: desktopHeights,
                    titleRows: 1,
                    isCompactMode: false,
                    showSearchExcerpt: false,
                    compactPaddingTotal: 18
                }
            )
        ).toBe(estimatePlainRowHeight({ heights: desktopHeights, titleRows: 1 }, 3));
    });

    it('reserves the shared search excerpt slot for search rows', () => {
        const excerptSlot = desktopHeights.multilineTextLineHeight * SEARCH_EXCERPT_ROWS;

        expect(estimateSearchRowHeight({ heights: desktopHeights, titleRows: 1 }, { visiblePillRowCount: 0 })).toBe(
            desktopHeights.basePadding + desktopHeights.titleLineHeight + excerptSlot
        );

        // Pill rows up to the reserved excerpt slot do not grow the row...
        expect(estimateSearchRowHeight({ heights: desktopHeights, titleRows: 1 }, { visiblePillRowCount: 1 })).toBe(
            desktopHeights.basePadding + desktopHeights.titleLineHeight + excerptSlot
        );

        // ...but taller pill stacks add their excess height on top.
        expect(estimateSearchRowHeight({ heights: desktopHeights, titleRows: 1 }, { visiblePillRowCount: 3 })).toBe(
            desktopHeights.basePadding +
                desktopHeights.titleLineHeight +
                excerptSlot +
                (desktopHeights.tagRowHeight * 3 - excerptSlot)
        );

        // estimateFileRowHeight routes search rows (showSearchExcerpt on) through it.
        expect(
            estimateFileRowHeight(
                { hasSearchExcerptContent: true, visiblePillRowCount: 1 },
                {
                    heights: desktopHeights,
                    titleRows: 1,
                    isCompactMode: false,
                    showSearchExcerpt: true,
                    compactPaddingTotal: 18
                }
            )
        ).toBe(estimateSearchRowHeight({ heights: desktopHeights, titleRows: 1 }, { visiblePillRowCount: 1 }));
    });

    it('counts numeric frontmatter properties as visible property rows', () => {
        expect(
            getPropertyRowCount({
                showFileProperties: true,
                showPropertiesOnSeparateRows: false,
                showFilePropertiesInCompactMode: true,
                isCompactMode: false,
                file: createTestTFile('Notes/Numbers.md'),
                properties: [{ fieldKey: 'rating', value: '4.5', valueKind: 'number' }],
                visiblePropertyKeys: new Set<string>(['rating'])
            })
        ).toBe(1);
    });

    it('counts boolean frontmatter properties as visible property rows', () => {
        expect(
            getPropertyRowCount({
                showFileProperties: true,
                showPropertiesOnSeparateRows: false,
                showFilePropertiesInCompactMode: true,
                isCompactMode: false,
                file: createTestTFile('Notes/Flags.md'),
                properties: [{ fieldKey: 'flag', value: 'true', valueKind: 'boolean' }],
                visiblePropertyKeys: new Set<string>(['flag'])
            })
        ).toBe(1);
    });

    it('counts frontmatter property rows when separate rows are enabled', () => {
        const file = createTestTFile('Notes/Properties.md');
        const properties = [
            { fieldKey: 'topic', value: 'alpha', valueKind: 'string' as const },
            { fieldKey: 'topic', value: 'beta', valueKind: 'string' as const },
            { fieldKey: 'priority', value: 'high', valueKind: 'string' as const }
        ];

        expect(
            getPropertyRowCount({
                showFileProperties: true,
                showPropertiesOnSeparateRows: false,
                showFilePropertiesInCompactMode: true,
                isCompactMode: false,
                file,
                properties,
                visiblePropertyKeys: new Set<string>(['topic', 'priority'])
            })
        ).toBe(1);

        expect(
            getPropertyRowCount({
                showFileProperties: true,
                showPropertiesOnSeparateRows: true,
                showFilePropertiesInCompactMode: true,
                isCompactMode: false,
                file,
                properties,
                visiblePropertyKeys: new Set<string>(['topic', 'priority'])
            })
        ).toBe(2);
    });

    it('reduces property row counts when the selected property value pill is hidden', () => {
        const selectedPropertyValueNodeIdToHide = getSelectedPropertyValuePillToHide({
            selectionType: ItemType.PROPERTY,
            selectedProperty: buildPropertyValueNodeId('status', 'done'),
            showSelectedNavigationPills: false
        });

        expect(
            getPropertyRowCount({
                showFileProperties: true,
                showPropertiesOnSeparateRows: false,
                showFilePropertiesInCompactMode: true,
                isCompactMode: false,
                file: createTestTFile('Notes/Status.md'),
                properties: [{ fieldKey: 'status', value: 'done', valueKind: 'string' }],
                visiblePropertyKeys: new Set<string>(['status']),
                hiddenPropertyValueNodeId: selectedPropertyValueNodeIdToHide
            })
        ).toBe(0);

        expect(
            getPropertyRowCount({
                showFileProperties: true,
                showPropertiesOnSeparateRows: false,
                showFilePropertiesInCompactMode: true,
                isCompactMode: false,
                file: createTestTFile('Notes/Status.md'),
                properties: [
                    { fieldKey: 'status', value: 'done', valueKind: 'string' },
                    { fieldKey: 'priority', value: 'high', valueKind: 'string' }
                ],
                visiblePropertyKeys: new Set<string>(['status', 'priority']),
                hiddenPropertyValueNodeId: selectedPropertyValueNodeIdToHide
            })
        ).toBe(1);
    });

    it('keeps property row counts correct across repeated calls with different filters', () => {
        const properties = [
            { fieldKey: 'status', value: 'done', valueKind: 'string' as const },
            { fieldKey: 'priority', value: 'high', valueKind: 'string' as const }
        ];

        expect(
            getPropertyRowCount({
                showFileProperties: true,
                showPropertiesOnSeparateRows: false,
                showFilePropertiesInCompactMode: true,
                isCompactMode: false,
                file: createTestTFile('Notes/Status.md'),
                properties,
                visiblePropertyKeys: new Set<string>(['status'])
            })
        ).toBe(1);

        expect(
            getPropertyRowCount({
                showFileProperties: true,
                showPropertiesOnSeparateRows: false,
                showFilePropertiesInCompactMode: true,
                isCompactMode: false,
                file: createTestTFile('Notes/Status.md'),
                properties,
                visiblePropertyKeys: new Set<string>(['missing'])
            })
        ).toBe(0);

        expect(
            getPropertyRowCount({
                showFileProperties: true,
                showPropertiesOnSeparateRows: false,
                showFilePropertiesInCompactMode: true,
                isCompactMode: false,
                file: createTestTFile('Notes/Status.md'),
                properties,
                visiblePropertyKeys: new Set<string>(['status'])
            })
        ).toBe(1);
    });
});
