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
    getListPaneMeasurements,
    getSelectedPropertyValuePillToHide
} from '../../src/utils/listPaneMeasurements';
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
                    compactPaddingTotal: 18
                }
            )
        ).toBe(18 + desktopHeights.titleLineHeight * 2);
    });

    it('does not reserve any excerpt slot for search rows', () => {
        const config = {
            heights: desktopHeights,
            titleRows: 1,
            compactPaddingTotal: 18
        };

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
