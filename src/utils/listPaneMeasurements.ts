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

import type { TFile } from 'obsidian';
import { ItemType, ListPaneItemType, type NavigationItemType } from '../types';
import type { FileData } from '../storage/IndexedDBStorage';
import type { ListPaneItem } from '../types/virtualization';
import {
    buildPropertyKeyNodeId,
    buildPropertyValueNodeId,
    isPropertyKeyOnlyValuePath,
    normalizePropertyNodeId,
    normalizePropertyTreeValuePath,
    parsePropertyNodeId
} from './propertyTree';
import { casefold } from './recordUtils';

/**
 * Layout measurements used by the list pane virtualizer.
 * These values mirror the CSS variables defined in styles.css.
 */
export interface ListPaneMeasurements {
    basePadding: number;
    titleLineHeight: number;
    singleTextLineHeight: number;
    multilineTextLineHeight: number;
    tagRowHeight: number;
    groupHeaderHeight: number;
    groupHeaderSpacerBefore: number;
    fileIconSize: number;
    topSpacer: number;
    bottomSpacer: number;
}

const DESKTOP_MEASUREMENTS: ListPaneMeasurements = Object.freeze({
    basePadding: 16, // 8px padding on each side
    titleLineHeight: 20,
    singleTextLineHeight: 19,
    multilineTextLineHeight: 18,
    tagRowHeight: 26, // 22px row + 4px gap
    groupHeaderHeight: 27,
    groupHeaderSpacerBefore: 20,
    fileIconSize: 16,
    topSpacer: 8,
    bottomSpacer: 20
});

const MOBILE_MEASUREMENTS: ListPaneMeasurements = Object.freeze({
    basePadding: 24, // 12px padding on each side
    titleLineHeight: 21,
    singleTextLineHeight: 20,
    multilineTextLineHeight: 19,
    tagRowHeight: 26, // 22px row + 4px gap
    groupHeaderHeight: 35, // 27px + 8px mobile increment
    groupHeaderSpacerBefore: 20,
    fileIconSize: 20, // 16px + 4px mobile increment
    topSpacer: 8,
    bottomSpacer: 20
});

/**
 * Returns the static measurement set for the current platform.
 */
export function getListPaneMeasurements(isMobile: boolean): ListPaneMeasurements {
    return isMobile ? MOBILE_MEASUREMENTS : DESKTOP_MEASUREMENTS;
}

export function getListPaneHeaderHeight(_item: ListPaneItem | undefined, measurements: ListPaneMeasurements): number {
    return measurements.groupHeaderHeight;
}

export function getSelectedPropertyValuePillToHide({
    selectionType,
    selectedProperty,
    showSelectedNavigationPills
}: {
    selectionType: NavigationItemType | null | undefined;
    selectedProperty: string | null | undefined;
    showSelectedNavigationPills: boolean;
}): string | null {
    if (showSelectedNavigationPills || selectionType !== ItemType.PROPERTY || !selectedProperty) {
        return null;
    }

    const parsedNode = parsePropertyNodeId(selectedProperty);
    if (!parsedNode?.valuePath) {
        return null;
    }

    return normalizePropertyNodeId(selectedProperty) ?? selectedProperty;
}

type FrontmatterPropertyEntry = NonNullable<FileData['properties']>[number];
type FrontmatterPropertyEntries = NonNullable<FileData['properties']>;

export interface VisibleFrontmatterPropertyEntry {
    entry: FrontmatterPropertyEntry;
    trimmedFieldKey: string;
    rawValue: string;
    normalizedValuePath: string;
    isKeyOnlyValue: boolean;
    propertyNodeId?: string;
}

export function forEachVisibleFrontmatterProperty({
    properties,
    visiblePropertyKeys,
    hiddenPropertyValueNodeId,
    visitor
}: {
    properties: FileData['properties'] | undefined;
    visiblePropertyKeys?: ReadonlySet<string>;
    hiddenPropertyValueNodeId?: string | null;
    visitor: (property: VisibleFrontmatterPropertyEntry) => void | false;
}): void {
    if (!properties || properties.length === 0) {
        return;
    }

    for (const entry of properties) {
        const normalizedFieldKey = casefold(entry.fieldKey);
        if (visiblePropertyKeys && !visiblePropertyKeys.has(normalizedFieldKey)) {
            continue;
        }

        const rawValue = entry.value;
        if (rawValue.trim().length === 0) {
            continue;
        }

        const normalizedValuePath = normalizePropertyTreeValuePath(rawValue);
        const isKeyOnlyValue = entry.valueKind === 'boolean' ? false : isPropertyKeyOnlyValuePath(normalizedValuePath, entry.valueKind);
        if (entry.valueKind === undefined && isKeyOnlyValue) {
            continue;
        }

        const trimmedFieldKey = entry.fieldKey.trim();
        const rawPropertyNodeId =
            trimmedFieldKey.length === 0
                ? undefined
                : isKeyOnlyValue
                  ? buildPropertyKeyNodeId(trimmedFieldKey)
                  : buildPropertyValueNodeId(trimmedFieldKey, normalizedValuePath);
        const propertyNodeId = rawPropertyNodeId ? (normalizePropertyNodeId(rawPropertyNodeId) ?? rawPropertyNodeId) : undefined;

        if (hiddenPropertyValueNodeId && propertyNodeId === hiddenPropertyValueNodeId) {
            continue;
        }

        const result = visitor({
            entry,
            trimmedFieldKey,
            rawValue,
            normalizedValuePath,
            isKeyOnlyValue,
            propertyNodeId
        });
        if (result === false) {
            return;
        }
    }
}

export interface FileItemLayoutState {
    isCompactMode: boolean;
    isPinned: boolean;
    shouldShowMultilinePreview: boolean;
    shouldReplaceEmptyPreviewWithPills: boolean;
}

export interface FileRowHeightInputs {
    isPinned: boolean;
    hasPreviewContent: boolean;
    visiblePillRowCount: number;
}

export interface FileRowHeightConfig {
    heights: ListPaneMeasurements;
    titleRows: number;
    /** Row count reserved for the Omnisearch excerpt area in search result rows. */
    previewRows: number;
    isCompactMode: boolean;
    /** True when the current row set is an Omnisearch result list (excerpt lines are shown). */
    showSearchExcerpt: boolean;
    compactPaddingTotal: number;
}

export function getFileItemLayoutState({
    isCompactMode = false,
    showSearchExcerpt,
    isPinned,
    hasPreviewContent,
    hasVisiblePillRows
}: {
    isCompactMode?: boolean;
    showSearchExcerpt: boolean;
    isPinned: boolean;
    hasPreviewContent: boolean;
    hasVisiblePillRows: boolean;
}): FileItemLayoutState {
    const shouldReplaceEmptyPreviewWithPills = !hasPreviewContent && hasVisiblePillRows;
    const shouldShowMultilinePreview = showSearchExcerpt && !shouldReplaceEmptyPreviewWithPills && hasPreviewContent;

    return {
        isCompactMode,
        isPinned,
        shouldShowMultilinePreview,
        shouldReplaceEmptyPreviewWithPills
    };
}

export function calculateNormalListFileRowHeightEstimate({
    heights,
    titleRows,
    previewRows,
    layoutState,
    visiblePillRowCount
}: {
    heights: ListPaneMeasurements;
    titleRows: number;
    previewRows: number;
    layoutState: FileItemLayoutState;
    visiblePillRowCount: number;
}): number {
    const titleContentHeight = heights.titleLineHeight * titleRows;
    const pillRowCount = Math.max(0, visiblePillRowCount);
    const hasPillRows = pillRowCount > 0;
    const hasPreviewSlot = layoutState.shouldShowMultilinePreview;
    const previewSlotHeight = hasPreviewSlot ? heights.multilineTextLineHeight * previewRows : 0;
    const contentLineCount = pillRowCount;
    const canUseBaseHeight = !hasPreviewSlot;

    if (canUseBaseHeight && contentLineCount === 0) {
        return heights.basePadding + titleContentHeight;
    }

    if (canUseBaseHeight && contentLineCount <= 1) {
        return heights.basePadding + titleContentHeight + (hasPillRows ? heights.tagRowHeight : 0);
    }

    const richContentHeight = titleContentHeight + previewSlotHeight;
    const pillRowsHeight = heights.tagRowHeight * pillRowCount;
    const pillRowsReservedHeight = previewSlotHeight;
    const pillRowsExtraHeight = Math.max(0, pillRowsHeight - pillRowsReservedHeight);

    return heights.basePadding + richContentHeight + pillRowsExtraHeight;
}

export function estimateFileRowHeight(inputs: FileRowHeightInputs, config: FileRowHeightConfig): number {
    const { heights, titleRows, previewRows, compactPaddingTotal } = config;
    const visiblePillRowCount = Math.max(0, inputs.visiblePillRowCount);
    const layoutState = getFileItemLayoutState({
        isCompactMode: config.isCompactMode,
        showSearchExcerpt: config.showSearchExcerpt,
        isPinned: inputs.isPinned,
        hasPreviewContent: inputs.hasPreviewContent,
        hasVisiblePillRows: visiblePillRowCount > 0
    });

    if (layoutState.isCompactMode) {
        const textContentHeight = heights.titleLineHeight * titleRows + heights.tagRowHeight * visiblePillRowCount;
        return compactPaddingTotal + textContentHeight;
    }

    return calculateNormalListFileRowHeightEstimate({
        heights,
        titleRows,
        previewRows: inputs.isPinned ? 1 : previewRows,
        layoutState,
        visiblePillRowCount
    });
}

type VisibleFrontmatterPropertySummary = {
    hasVisiblePills: boolean;
    separateRowCount: number;
};

const EMPTY_VISIBLE_FRONTMATTER_PROPERTY_SUMMARY: VisibleFrontmatterPropertySummary = {
    hasVisiblePills: false,
    separateRowCount: 0
};

type VisibleFrontmatterPropertySummaryCache = {
    unfiltered: Map<string, VisibleFrontmatterPropertySummary>;
    filtered: WeakMap<ReadonlySet<string>, Map<string, VisibleFrontmatterPropertySummary>>;
};

const visibleFrontmatterPropertySummaryCache = new WeakMap<FrontmatterPropertyEntries, VisibleFrontmatterPropertySummaryCache>();

function getVisibleFrontmatterPropertySummary({
    properties,
    visiblePropertyKeys,
    hiddenPropertyValueNodeId
}: {
    properties: FileData['properties'] | undefined;
    visiblePropertyKeys?: ReadonlySet<string>;
    hiddenPropertyValueNodeId?: string | null;
}): VisibleFrontmatterPropertySummary {
    if (!properties || properties.length === 0) {
        return EMPTY_VISIBLE_FRONTMATTER_PROPERTY_SUMMARY;
    }

    let cacheContainer = visibleFrontmatterPropertySummaryCache.get(properties);
    if (!cacheContainer) {
        cacheContainer = {
            unfiltered: new Map<string, VisibleFrontmatterPropertySummary>(),
            filtered: new WeakMap<ReadonlySet<string>, Map<string, VisibleFrontmatterPropertySummary>>()
        };
        visibleFrontmatterPropertySummaryCache.set(properties, cacheContainer);
    }

    let cacheBucket: Map<string, VisibleFrontmatterPropertySummary>;
    if (!visiblePropertyKeys) {
        cacheBucket = cacheContainer.unfiltered;
    } else {
        const existingFilteredBucket = cacheContainer.filtered.get(visiblePropertyKeys);
        if (existingFilteredBucket) {
            cacheBucket = existingFilteredBucket;
        } else {
            cacheBucket = new Map<string, VisibleFrontmatterPropertySummary>();
            cacheContainer.filtered.set(visiblePropertyKeys, cacheBucket);
        }
    }

    const hiddenPropertyCacheKey = hiddenPropertyValueNodeId ?? '';
    const cachedSummary = cacheBucket.get(hiddenPropertyCacheKey);
    if (cachedSummary) {
        return cachedSummary;
    }

    let hasVisiblePills = false;
    let hasUnkeyedRow = false;
    const separateRows = new Set<string>();

    forEachVisibleFrontmatterProperty({
        properties,
        visiblePropertyKeys,
        hiddenPropertyValueNodeId,
        visitor: ({ trimmedFieldKey }) => {
            hasVisiblePills = true;

            if (trimmedFieldKey.length === 0) {
                hasUnkeyedRow = true;
                return;
            }

            separateRows.add(trimmedFieldKey);
        }
    });

    const summary = {
        hasVisiblePills,
        separateRowCount: separateRows.size + (hasUnkeyedRow ? 1 : 0)
    };
    cacheBucket.set(hiddenPropertyCacheKey, summary);
    return summary;
}

export function getPropertyRowCount({
    showFileProperties,
    showPropertiesOnSeparateRows,
    showFilePropertiesInCompactMode,
    isCompactMode,
    file,
    properties,
    visiblePropertyKeys,
    hiddenPropertyValueNodeId
}: {
    showFileProperties: boolean;
    showPropertiesOnSeparateRows: boolean;
    showFilePropertiesInCompactMode: boolean;
    isCompactMode: boolean;
    file: TFile | null;
    properties: FileData['properties'] | undefined;
    visiblePropertyKeys?: ReadonlySet<string>;
    hiddenPropertyValueNodeId?: string | null;
}): number {
    // Computes the number of visual rows the property area will occupy.
    // This is used by the list pane virtualizer height estimator and must stay consistent with FileItem rendering.
    if (!file || file.extension !== 'md') {
        return 0;
    }

    if (isCompactMode && !showFilePropertiesInCompactMode) {
        return 0;
    }

    const propertySummary = showFileProperties
        ? getVisibleFrontmatterPropertySummary({
              properties,
              visiblePropertyKeys,
              hiddenPropertyValueNodeId
          })
        : EMPTY_VISIBLE_FRONTMATTER_PROPERTY_SUMMARY;

    if (!propertySummary.hasVisiblePills) {
        return 0;
    }

    if (!showPropertiesOnSeparateRows) {
        return 1;
    }

    return propertySummary.separateRowCount;
}
