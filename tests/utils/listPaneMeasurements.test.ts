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
    calculateNormalListFileRowHeightEstimate,
    estimateFileRowHeight,
    getFileItemLayoutState,
    getListPaneMeasurements,
    getSelectedPropertyValuePillToHide,
    getPropertyRowCount
} from '../../src/utils/listPaneMeasurements';
import { ItemType } from '../../src/types';
import { buildPropertyValueNodeId } from '../../src/utils/propertyTree';
import { createTestTFile } from './createTestTFile';

describe('listPaneMeasurements layout helpers', () => {
    const desktopHeights = getListPaneMeasurements(false);

    it('uses explicit compact mode instead of inferring it from hidden date, preview, and image sections', () => {
        expect(
            getFileItemLayoutState({
                isCompactMode: false,
                showSearchExcerpt: false,
                isPinned: false,
                hasPreviewContent: false,
                hasVisiblePillRows: false
            })
        ).toMatchObject({ isCompactMode: false });

        expect(
            getFileItemLayoutState({
                isCompactMode: true,
                showSearchExcerpt: false,
                isPinned: false,
                hasPreviewContent: false,
                hasVisiblePillRows: false
            })
        ).toMatchObject({ isCompactMode: true });
    });

    it('collapses empty preview space when pills are visible and no image is shown', () => {
        expect(
            getFileItemLayoutState({
                showSearchExcerpt: true,
                isPinned: false,
                hasPreviewContent: false,
                hasVisiblePillRows: true
            })
        ).toMatchObject({
            shouldShowMultilinePreview: false,
            shouldReplaceEmptyPreviewWithPills: true        });
    });

    it('uses a title-only row height when normal rows render no content or image', () => {
        const layoutState = getFileItemLayoutState({
            showSearchExcerpt: true,
            isPinned: false,
            hasPreviewContent: false,
            hasVisiblePillRows: false
        });

        expect(
            calculateNormalListFileRowHeightEstimate({
                heights: desktopHeights,
                titleRows: 1,
                previewRows: 3,
                layoutState,
                visiblePillRowCount: 0
            })
        ).toBe(desktopHeights.basePadding + desktopHeights.titleLineHeight);
    });

    it('estimates compact file rows from compact padding, title rows, and visible pill rows', () => {
        expect(
            estimateFileRowHeight(
                {
                    isPinned: false,
                    hasPreviewContent: false,
                    visiblePillRowCount: 2
                },
                {
                    heights: desktopHeights,
                    titleRows: 2,
                    previewRows: 3,
                    isCompactMode: true,
                    showSearchExcerpt: false,
                    compactPaddingTotal: 18
                }
            )
        ).toBe(18 + desktopHeights.titleLineHeight * 2 + desktopHeights.tagRowHeight * 2);
    });

    it('uses a title-only row height in standard mode when date, preview, and image are hidden', () => {
        expect(
            estimateFileRowHeight(
                {
                    isPinned: false,
                    hasPreviewContent: false,
                    visiblePillRowCount: 0
                },
                {
                    heights: desktopHeights,
                    titleRows: 1,
                    previewRows: 3,
                    isCompactMode: false,
                    showSearchExcerpt: false,
                    compactPaddingTotal: 18
                }
            )
        ).toBe(desktopHeights.basePadding + desktopHeights.titleLineHeight);
    });

    it('estimates pinned rows with the pinned preview row count', () => {
        const inputs = {
            isPinned: true,
            hasPreviewContent: true,
            visiblePillRowCount: 1
        };
        const layoutState = getFileItemLayoutState({
            showSearchExcerpt: true,
            isPinned: inputs.isPinned,
            hasPreviewContent: inputs.hasPreviewContent,
            hasVisiblePillRows: true
        });

        expect(
            estimateFileRowHeight(inputs, {
                heights: desktopHeights,
                titleRows: 1,
                previewRows: 4,
                isCompactMode: false,
                showSearchExcerpt: true,
                compactPaddingTotal: 18
            })
        ).toBe(
            calculateNormalListFileRowHeightEstimate({
                heights: desktopHeights,
                titleRows: 1,
                previewRows: 1,
                layoutState,
                visiblePillRowCount: 1
            })
        );
    });

    it('uses configured preview rows when no pills replace the preview', () => {
        const layoutState = getFileItemLayoutState({
            showSearchExcerpt: true,
            isPinned: false,
            hasPreviewContent: true,
            hasVisiblePillRows: false
        });

        expect(layoutState.shouldShowMultilinePreview).toBe(true);
        expect(
            calculateNormalListFileRowHeightEstimate({
                heights: desktopHeights,
                titleRows: 1,
                previewRows: 2,
                layoutState,
                visiblePillRowCount: 0
            })
        ).toBe(
            desktopHeights.basePadding +
                desktopHeights.titleLineHeight +
                desktopHeights.multilineTextLineHeight * 2
        );
    });

    it('uses one preview row for pinned items', () => {
        const layoutState = getFileItemLayoutState({
            showSearchExcerpt: true,
            isPinned: true,
            hasPreviewContent: true,
            hasVisiblePillRows: false
        });
        const pinnedPreviewRows = 1;

        expect(layoutState.shouldShowMultilinePreview).toBe(true);
        expect(
            calculateNormalListFileRowHeightEstimate({
                heights: desktopHeights,
                titleRows: 1,
                previewRows: pinnedPreviewRows,
                layoutState,
                visiblePillRowCount: 0
            })
        ).toBe(desktopHeights.basePadding + desktopHeights.titleLineHeight + desktopHeights.multilineTextLineHeight);
    });

    it('keeps pinned task progress and preview in one secondary row', () => {
        const layoutState = getFileItemLayoutState({
            showSearchExcerpt: true,
            isPinned: true,
            hasPreviewContent: true,
            hasVisiblePillRows: false
        });

        expect(
            calculateNormalListFileRowHeightEstimate({
                heights: desktopHeights,
                titleRows: 1,
                previewRows: 1,
                layoutState,
                visiblePillRowCount: 0
            })
        ).toBe(desktopHeights.basePadding + desktopHeights.titleLineHeight + desktopHeights.multilineTextLineHeight);
    });

    it('does not show the pinned preview slot when preview text is disabled', () => {
        const layoutState = getFileItemLayoutState({
            showSearchExcerpt: false,
            isPinned: true,
            hasPreviewContent: true,
            hasVisiblePillRows: false
        });

        expect(layoutState.shouldShowMultilinePreview).toBe(false);
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
