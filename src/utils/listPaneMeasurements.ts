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

import { SEARCH_EXCERPT_ROWS } from '../settings/listPaneAppearance';
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

interface VisibleFrontmatterPropertyEntry {
    entry: FrontmatterPropertyEntry;
    trimmedFieldKey: string;
    rawValue: string;
    normalizedValuePath: string;
    isKeyOnlyValue: boolean;
    propertyNodeId?: string;
}

function forEachVisibleFrontmatterProperty({
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

/**
 * Shared clamp height for the Omnisearch excerpt area of a search-result row.
 * The excerpt always reserves `SEARCH_EXCERPT_ROWS` clamped lines regardless of
 * whether the excerpt text itself is rendered or replaced by property pills.
 */
const SEARCH_EXCERPT_SLOT_HEIGHT = DESKTOP_MEASUREMENTS.multilineTextLineHeight * SEARCH_EXCERPT_ROWS;

export interface FileRowHeightInputs {
    /** Unused placeholder kept so callers can pass per-item inputs; row height no longer depends on file properties. */
    hasSearchExcerptContent?: boolean;
}

export interface FileRowHeightConfig {
    heights: ListPaneMeasurements;
    titleRows: number;
    isCompactMode: boolean;
    /** True when the current row set is an Omnisearch result list (excerpt lines are shown). */
    showSearchExcerpt: boolean;
    compactPaddingTotal: number;
}

/** Flat estimator for regular (non-search) file rows: title only. */
export function estimatePlainRowHeight(config: Pick<FileRowHeightConfig, 'heights' | 'titleRows'>): number {
    const titleContentHeight = config.heights.titleLineHeight * config.titleRows;
    return config.heights.basePadding + titleContentHeight;
}

/**
 * Flat estimator for Omnisearch search-result rows. The excerpt slot always reserves
 * `SEARCH_EXCERPT_ROWS` clamped lines.
 */
export function estimateSearchRowHeight(
    config: Pick<FileRowHeightConfig, 'heights' | 'titleRows'>
): number {
    const titleContentHeight = config.heights.titleLineHeight * config.titleRows;
    return config.heights.basePadding + titleContentHeight + SEARCH_EXCERPT_SLOT_HEIGHT;
}

export function estimateFileRowHeight(inputs: FileRowHeightInputs, config: FileRowHeightConfig): number {
    const { heights, titleRows, compactPaddingTotal } = config;

    if (config.isCompactMode) {
        const textContentHeight = heights.titleLineHeight * titleRows;
        return compactPaddingTotal + textContentHeight;
    }

    // Excerpt rows are only ever reserved while the Omnisearch excerpt feature is on;
    // it no longer matters whether this particular row actually has excerpt text.
    if (config.showSearchExcerpt) {
        return estimateSearchRowHeight(config);
    }

    return estimatePlainRowHeight(config);
}

