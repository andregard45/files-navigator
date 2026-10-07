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
    getSelectedPropertyValuePillToHide
} from '../../src/utils/listPaneMeasurements';
import { SEARCH_EXCERPT_ROWS } from '../../src/settings/listPaneAppearance';
import { ItemType } from '../../src/types';
import { buildPropertyValueNodeId } from '../../src/utils/propertyTree';

describe('listPaneMeasurements layout helpers', () => {
    const desktopHeights = getListPaneMeasurements(false);

    it('estimates compact file rows from compact padding and title rows', () => {
        expect(
            estimateFileRowHeight(
                {},
                {
                    heights: desktopHeights,
                    titleRows: 2,
                    showSearchExcerpt: false,
                    compactPaddingTotal: 18
                }
            )
        ).toBe(18 + desktopHeights.titleLineHeight * 2);
    });

    it('reserves the excerpt slot only for rows that carry search excerpt content', () => {
        const excerptSlot = desktopHeights.multilineTextLineHeight * SEARCH_EXCERPT_ROWS;
        const config = {
            heights: desktopHeights,
            titleRows: 1,
            showSearchExcerpt: true,
            compactPaddingTotal: 18
        };

        expect(estimateFileRowHeight({ hasSearchExcerptContent: true }, config)).toBe(
            18 + desktopHeights.titleLineHeight + excerptSlot
        );
        expect(estimateFileRowHeight({ hasSearchExcerptContent: false }, config)).toBe(
            18 + desktopHeights.titleLineHeight
        );
        expect(estimateFileRowHeight({}, config)).toBe(18 + desktopHeights.titleLineHeight);
    });

    it('computes plain (non-search) row height from base padding and title rows', () => {
        expect(estimatePlainRowHeight({ heights: desktopHeights, titleRows: 1 })).toBe(
            desktopHeights.basePadding + desktopHeights.titleLineHeight
        );
        expect(estimatePlainRowHeight({ heights: desktopHeights, titleRows: 2 })).toBe(
            desktopHeights.basePadding + desktopHeights.titleLineHeight * 2
        );
    });

    it('reserves the shared search excerpt slot in the standalone search estimator', () => {
        const excerptSlot = desktopHeights.multilineTextLineHeight * SEARCH_EXCERPT_ROWS;

        expect(estimateSearchRowHeight({ heights: desktopHeights, titleRows: 1 })).toBe(
            desktopHeights.basePadding + desktopHeights.titleLineHeight + excerptSlot
        );
        expect(estimateSearchRowHeight({ heights: desktopHeights, titleRows: 2 })).toBe(
            desktopHeights.basePadding + desktopHeights.titleLineHeight * 2 + excerptSlot
        );
    });

    it('returns the selected property value node id to hide only when appropriate', () => {
        expect(
            getSelectedPropertyValuePillToHide({
                selectionType: ItemType.PROPERTY,
                selectedProperty: buildPropertyValueNodeId('status', 'done'),
                showSelectedNavigationPills: false
            })
        ).toBeTruthy();

        expect(
            getSelectedPropertyValuePillToHide({
                selectionType: ItemType.PROPERTY,
                selectedProperty: buildPropertyValueNodeId('status', 'done'),
                showSelectedNavigationPills: true
            })
        ).toBeNull();

        expect(
            getSelectedPropertyValuePillToHide({
                selectionType: ItemType.FILE,
                selectedProperty: null,
                showSelectedNavigationPills: false
            })
        ).toBeNull();
    });
});
