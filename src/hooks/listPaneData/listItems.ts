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

import { TFile, TFolder, normalizePath } from 'obsidian';
import type { App } from 'obsidian';
import type { AlphaSortOrder, ListNoteGroupingOption, NotebookNavigatorSettings, SortOption } from '../../settings/types';
import { ListPaneItemType, ItemType, PINNED_SECTION_HEADER_KEY } from '../../types';
import type { ListPaneItem } from '../../types/virtualization';
import { strings } from '../../i18n';
import { FILE_VISIBILITY, type FileVisibility } from '../../utils/fileTypeUtils';
import {
    compareByAlphaSortOrder,
    getDateField,
    getPropertyGroupingValueFromRecord,
    isDateSortOption,
    isPropertySortOption
} from '../../utils/sortUtils';
import { getPropertyGroupingKey } from '../../settings/types';
import { resolvePropertyGroupingDirection } from '../../utils/listGrouping';
import { partitionPinnedFiles } from '../../utils/fileFinder';
import { resolvePropertyDisplayText } from '../../utils/propertyUtils';
import { DateUtils } from '../../utils/dateUtils';
import { buildListGroupCollapseKey } from '../../utils/listGroupCollapse';
import type { AliasSearchMatch, PropertySearchMatch, SearchResultMeta } from '../../types/search';
import type { PropertySelectionNodeId } from '../../utils/propertyTree';
import type { ListPaneFolderPathSegment } from '../../types/virtualization';

export interface ListPaneConfig {
    filterPinnedByFolder: boolean;
    folderGroupSortOrder: AlphaSortOrder;
    groupBy: ListNoteGroupingOption;
    pinnedGroupExpanded: boolean;
    pinnedNotes: NotebookNavigatorSettings['pinnedNotes'];
    showCurrentFolderFilesAtBottom: boolean;
    showFolderGroupPaths: boolean;
}

interface BuildListItemsArgs {
    app: App;
    dayKey: string;
    fileVisibility: FileVisibility;
    files: TFile[];
    getFileTimestamps: (file: TFile) => { created: number; modified: number };
    hiddenFileState: ReadonlyMap<string, boolean>;
    listConfig: ListPaneConfig;
    collapsedListGroups?: ReadonlySet<string>;
    matchedAliases?: ReadonlyMap<string, readonly AliasSearchMatch[]>;
    matchedProperties?: ReadonlyMap<string, readonly PropertySearchMatch[]>;
    searchMetaMap: ReadonlyMap<string, SearchResultMeta>;
    selectedFolder: TFolder | null;
    selectedTag?: string | null;
    selectedProperty?: PropertySelectionNodeId | null;
    selectionType: ItemType | null;
    sortOption: SortOption;
    propertySortKey?: string;
    groupItemCountData?: ListGroupItemCountData;
}

export type CollapsedListGroupRevealTarget = { type: 'pinned' } | { type: 'list-group'; collapseKey: string };

export interface ListGroupExpansionToggleState {
    /** Collapse keys affected by the toggle, including persisted descendants hidden by collapsed parents when expanding. */
    collapseKeys: string[];
    /** Whether the current list renders the separately persisted pinned header. */
    hasPinnedGroup: boolean;
    /** False when the current list has no collapsible headers. */
    canToggle: boolean;
    /** True when at least one rendered collapsible header is expanded. */
    shouldCollapse: boolean;
}

/**
 * Search-independent group data built from the unfiltered file sequence.
 */
interface ListGroupItemCountData {
    groupItemCountByKey: ReadonlyMap<string, number>;
}

interface BuildListItemsResult extends ListGroupItemCountData {
    items: ListPaneItem[];
}

const EMPTY_GROUP_ITEM_COUNT_BY_KEY = new Map<string, number>();

function splitFolderPath(path: string): string[] {
    return path.split('/').filter(Boolean);
}

function getLastFolderPathSegment(path: string, fallback: string): string {
    const segments = splitFolderPath(path);
    return segments.length > 0 ? segments[segments.length - 1] : fallback;
}

function buildFolderGroupHeaderSegments(folderPath: string, visiblePath: string): ListPaneFolderPathSegment[] {
    const folderSegments = splitFolderPath(folderPath);
    const visibleSegments = splitFolderPath(visiblePath);
    if (folderSegments.length === 0 || visibleSegments.length === 0) {
        return [];
    }

    const firstVisibleFolderSegmentIndex = Math.max(0, folderSegments.length - visibleSegments.length);
    return visibleSegments.map((label, index) => ({
        label,
        path: folderSegments.slice(0, firstVisibleFolderSegmentIndex + index + 1).join('/')
    }));
}

export function buildListItems(args: BuildListItemsArgs): ListPaneItem[] {
    return buildListItemsInternal(args, true, false).items;
}

/**
 * Counts each group without creating file rows or resolving row-only metadata.
 * The caller can retain this data across search query changes because it depends on the unfiltered file set.
 */
export function buildListGroupItemCountData(args: BuildListItemsArgs): ListGroupItemCountData {
    const { groupItemCountByKey } = buildListItemsInternal(args, false, true);
    return { groupItemCountByKey };
}

function buildListItemsInternal(
    {
        app,
        dayKey,
        fileVisibility,
        files,
        getFileTimestamps,
        hiddenFileState,
        listConfig,
        collapsedListGroups,
        matchedAliases,
        matchedProperties,
        searchMetaMap,
        selectedFolder,
        selectedTag = null,
        selectedProperty = null,
        selectionType,
        sortOption,
        propertySortKey = '',
        groupItemCountData
    }: BuildListItemsArgs,
    includeFileItems: boolean,
    collectGroupItemCounts: boolean
): BuildListItemsResult {
    const items: ListPaneItem[] = [
        {
            type: ListPaneItemType.TOP_SPACER,
            data: '',
            key: 'top-spacer'
        }
    ];
    const groupItemCountByKey = collectGroupItemCounts ? new Map<string, number>() : null;

    const contextFilter =
        selectionType === ItemType.TAG
            ? ItemType.TAG
            : selectionType === ItemType.FOLDER
              ? ItemType.FOLDER
              : selectionType === ItemType.PROPERTY
                ? ItemType.PROPERTY
                : undefined;
    const pinnedDisplayScope =
        listConfig.filterPinnedByFolder && selectionType === ItemType.FOLDER && selectedFolder
            ? { restrictToFolderPath: selectedFolder.path }
            : undefined;
    const { pinnedFiles, unpinnedFiles } = partitionPinnedFiles(files, listConfig.pinnedNotes, contextFilter, pinnedDisplayScope);

    const groupingMode = listConfig.groupBy;
    const selectedFolderPath = selectedFolder?.path ?? null;
    const createCollapseKey = (groupId: string): string =>
        buildListGroupCollapseKey({
            selectionType,
            selectedFolderPath,
            selectedTag,
            selectedProperty,
            groupingMode,
            groupId
        });

    let activeListGroupCollapsed = false;
    let activeCollapsedHeaderKind: ListPaneItem['headerKind'] | null = null;
    let activeGroupHeaderItem: ListPaneItem | null = null;
    let activeGroupHeaderKey: string | null = null;
    let fileIndexCounter = 0;
    type FileItemOverrides = Partial<
        Omit<
            ListPaneItem,
            'type' | 'data' | 'fileIndex' | 'isHidden' | 'key' | 'matchedAliases' | 'matchedProperties' | 'searchMeta'
        >
    >;
    const pushFileItem = (file: TFile, overrides: FileItemOverrides = {}) => {
        activeGroupHeaderItem?.groupFilePaths?.push(file.path);
        if (activeGroupHeaderKey && groupItemCountByKey) {
            groupItemCountByKey.set(activeGroupHeaderKey, (groupItemCountByKey.get(activeGroupHeaderKey) ?? 0) + 1);
        }

        if (activeListGroupCollapsed || !includeFileItems) {
            return;
        }

        const baseItem: ListPaneItem = {
            type: ListPaneItemType.FILE,
            data: file,
            key: file.path,
            fileIndex: fileIndexCounter++,
            matchedAliases: matchedAliases?.get(file.path),
            matchedProperties: matchedProperties?.get(file.path),
            searchMeta: searchMetaMap.get(file.path),
            isHidden: hiddenFileState.get(file.path) ?? false
        };
        items.push({ ...baseItem, ...overrides });
    };

    const pushHeaderItem = ({
        data,
        key,
        headerFolderPath,
        headerFolderSegments,
        headerKind,
        collapseKey,
        groupFiles
    }: Pick<ListPaneItem, 'data' | 'key' | 'headerFolderPath' | 'headerFolderSegments' | 'headerKind' | 'collapseKey'> & {
        groupFiles?: readonly TFile[];
    }) => {
        const isCollapsed = collapseKey ? collapsedListGroups?.has(collapseKey) === true : false;
        activeListGroupCollapsed = isCollapsed;
        activeCollapsedHeaderKind = isCollapsed ? (headerKind ?? null) : null;
        const useHeaderSpacers = items.length > 1;
        if (useHeaderSpacers) {
            items.push({
                type: ListPaneItemType.HEADER_SPACER,
                data: '',
                key: `${key}-spacer-before`
            });
        }

        const headerItem: ListPaneItem = {
            type: ListPaneItemType.HEADER,
            data,
            headerFolderPath,
            headerFolderSegments,
            groupFilePaths: collectGroupItemCounts ? undefined : groupFiles ? groupFiles.map(file => file.path) : [],
            groupTotalItemCount: groupItemCountData?.groupItemCountByKey.get(key),
            headerKind,
            collapseKey,
            isCollapsed,
            key
        };
        items.push(headerItem);
        activeGroupHeaderItem = groupFiles || collectGroupItemCounts ? null : headerItem;
        if (groupItemCountByKey) {
            groupItemCountByKey.set(key, groupFiles?.length ?? 0);
        }
        activeGroupHeaderKey = groupFiles || !groupItemCountByKey ? null : key;
    };

    if (pinnedFiles.length > 0) {
        pushHeaderItem({
            data: strings.listPane.pinnedSection,
            key: PINNED_SECTION_HEADER_KEY,
            headerKind: 'pinned',
            groupFiles: pinnedFiles
        });

        if (listConfig.pinnedGroupExpanded) {
            pinnedFiles.forEach(file => {
                pushFileItem(file, { isPinned: true });
            });
        }
    }

    const shouldGroupByDate = groupingMode === 'date' && isDateSortOption(sortOption);
    const shouldGroupByFolder = groupingMode === 'folder' && selectionType === ItemType.FOLDER;
    const propertyGroupingKey = getPropertyGroupingKey(groupingMode);

    if (!shouldGroupByDate && !shouldGroupByFolder && propertyGroupingKey === null) {
        const sortedFiles: TFile[] = [...unpinnedFiles];

        const firstSortedFile = sortedFiles[0] ?? null;
        if (pinnedFiles.length > 0 && sortedFiles.length > 0) {
            const label = fileVisibility === FILE_VISIBILITY.DOCUMENTS ? strings.listPane.notesSection : strings.listPane.filesSection;
            pushHeaderItem({
                data: label,
                key: `header-${label}`,
                headerKind: 'section',
                groupFiles: sortedFiles
            });
        }

        sortedFiles.forEach(file => {
            pushFileItem(file);
        });
    } else if (shouldGroupByDate) {
        const now = DateUtils.parseLocalDayKey(dayKey) ?? new Date();
        const dateField = getDateField(sortOption);
        let currentGroupKey: string | null = null;

        unpinnedFiles.forEach(file => {
            const timestamps = getFileTimestamps(file);
            const timestamp = dateField === 'ctime' ? timestamps.created : timestamps.modified;
            const group = DateUtils.getDateGroupInfo(timestamp, now);
            const groupKey = group.key;
            if (groupKey !== currentGroupKey) {
                currentGroupKey = groupKey;
                pushHeaderItem({
                    data: group.label,
                    collapseKey: createCollapseKey(`date:${dateField}:${groupKey}`),
                    // Key by group key rather than label so two distinct groups can never share a
                    // list item key; duplicate keys break virtualizer and React row reconciliation.
                    key: `header-${groupKey}`,
                    headerKind: 'date'
                });
            }

            pushFileItem(file);
        });
    } else if (propertyGroupingKey !== null) {
        // Buckets match the extracted value parts element-wise and groups sort in the configured
        // direction: number-keyed groups first in numeric order, then text groups in natural string
        // order, following how Obsidian Bases groups by property. Files inside each group keep
        // the active sort order. The bucket key joins parts with a separator that cannot appear in
        // trimmed part values, so lists with different element boundaries such as ["a b", "c"] and
        // ["a", "b c"] stay in separate groups. The label shows link display text instead of the raw
        // markup so "[[Note]]" reads as "Note", matching the property pills on file rows, while the
        // bucket key keeps the raw value so "[[Note]]" and "Note" stay separate groups.
        const propertyGroupingDirection = resolvePropertyGroupingDirection(groupingMode, sortOption);
        const propertyGroups = new Map<string, { label: string; numericValue: number | null; files: TFile[] }>();
        const ungroupedFiles: TFile[] = [];

        unpinnedFiles.forEach(file => {
            const groupingValue =
                file.extension === 'md'
                    ? getPropertyGroupingValueFromRecord(app.metadataCache.getFileCache(file)?.frontmatter, propertyGroupingKey)
                    : null;
            if (groupingValue === null) {
                ungroupedFiles.push(file);
                return;
            }

            const bucketKey = groupingValue.parts.join('\u0000');
            const group = propertyGroups.get(bucketKey);
            if (group) {
                group.files.push(file);
                return;
            }

            // The first file to create a bucket decides whether the group carries a numeric key,
            // matching how the first encountered value becomes the group key in Obsidian Bases.
            propertyGroups.set(bucketKey, {
                label: groupingValue.parts.map(part => resolvePropertyDisplayText(part)).join(', '),
                numericValue: groupingValue.numericValue,
                files: [file]
            });
        });

        const directionMultiplier = propertyGroupingDirection === 'desc' ? -1 : 1;
        const alphaOrder = propertyGroupingDirection === 'desc' ? 'alpha-desc' : 'alpha-asc';
        const orderedPropertyGroups = Array.from(propertyGroups.entries())
            .map(([bucketKey, group]) => ({ bucketKey, ...group }))
            .sort((left, right) => {
                // The comparator must be a total order or the group order depends on file encounter
                // order. Bases compares mixed numeric/text pairs by label, which turns intransitive
                // once text labels mix with negative or decimal numbers (numerically -10 < -2 while
                // the collator places "-2" before "-10") and leaves its result unspecified, so there
                // is no defined Bases order to match; number-keyed groups sort before text groups.
                if (left.numericValue !== null && right.numericValue !== null) {
                    if (left.numericValue !== right.numericValue) {
                        return directionMultiplier * (left.numericValue < right.numericValue ? -1 : 1);
                    }
                } else if (left.numericValue !== null || right.numericValue !== null) {
                    return directionMultiplier * (left.numericValue !== null ? -1 : 1);
                } else {
                    const labelCompare = compareByAlphaSortOrder(left.label, right.label, alphaOrder);
                    if (labelCompare !== 0) {
                        return labelCompare;
                    }
                }
                // Labels of distinct buckets can compare equal because the collator ignores case and
                // accent differences, and some locales also ignore punctuation; the bucket key breaks
                // the tie so such groups keep one stable order. Bucket keys are unique map keys, so
                // equal keys never reach this comparison and no zero branch is needed.
                return directionMultiplier * (left.bucketKey < right.bucketKey ? -1 : 1);
            });

        const renderPropertyGroup = (label: string, groupFiles: TFile[], groupId: string): void => {
            pushHeaderItem({
                data: label,
                collapseKey: createCollapseKey(groupId),
                key: `header-${groupId}`,
                headerKind: 'property',
                groupFiles
            });
            groupFiles.forEach(file => {
                pushFileItem(file);
            });
        };

        // Group ids use the bucket key rather than the display label so collapse state and item
        // counts stay stable if the label formatting changes.
        orderedPropertyGroups.forEach(group => {
            renderPropertyGroup(group.label, group.files, `property-value:${group.bucketKey}`);
        });

        // Files without the property collect into one trailing group, matching the Bases "None" group placement.
        if (ungroupedFiles.length > 0) {
            renderPropertyGroup(strings.listPane.propertyGroupNoValue, ungroupedFiles, 'property-none');
        }
    } else {
        const baseFolderPath = selectedFolder?.path ?? null;
        const baseFolderName = selectedFolder?.name ?? null;
        const basePrefix = baseFolderPath && baseFolderPath !== '/' ? `${baseFolderPath}/` : null;
        const vaultRootLabel = strings.navigationPane.vaultRootLabel;
        const folderGroupSortOrder = listConfig.folderGroupSortOrder;
        const showFolderGroupPaths = listConfig.showFolderGroupPaths;

        const folderGroups = new Map<
            string,
            {
                label: string;
                sortLabel: string;
                files: TFile[];
                isCurrentFolder: boolean;
                folderPath: string | null;
                folderSegments?: ListPaneFolderPathSegment[];
            }
        >();

        const createFolderGroupHeader = (
            folderPath: string,
            visiblePath: string,
            fallbackName: string
        ): { label: string; sortLabel: string; folderPath: string; folderSegments?: ListPaneFolderPathSegment[] } => {
            const normalizedFolderPath = normalizePath(folderPath);
            const label = showFolderGroupPaths ? visiblePath : getLastFolderPathSegment(visiblePath, fallbackName);
            return {
                label,
                sortLabel: visiblePath,
                folderPath: normalizedFolderPath,
                folderSegments: showFolderGroupPaths ? buildFolderGroupHeaderSegments(normalizedFolderPath, visiblePath) : undefined
            };
        };

        const resolveFolderGroup = (
            file: TFile
        ): {
            key: string;
            label: string;
            sortLabel: string;
            isCurrentFolder: boolean;
            folderPath: string | null;
            folderSegments?: ListPaneFolderPathSegment[];
        } => {
            const parent = file.parent;
            if (!(parent instanceof TFolder)) {
                return { key: 'folder:/', label: vaultRootLabel, sortLabel: vaultRootLabel, isCurrentFolder: false, folderPath: null };
            }

            if (selectionType === ItemType.FOLDER && baseFolderPath) {
                if (parent.path === baseFolderPath) {
                    const label = baseFolderName ?? parent.name;
                    return {
                        key: `folder:${baseFolderPath}`,
                        label,
                        sortLabel: label,
                        isCurrentFolder: true,
                        folderPath: baseFolderPath === '/' ? null : baseFolderPath
                    };
                }

                if (baseFolderPath === '/' && parent.path !== '/') {
                    const header = createFolderGroupHeader(parent.path, parent.path, parent.name);
                    return {
                        key: `folder:/${parent.path}`,
                        label: header.label,
                        sortLabel: header.sortLabel,
                        isCurrentFolder: false,
                        folderPath: header.folderPath,
                        folderSegments: header.folderSegments
                    };
                }

                if (basePrefix && parent.path.startsWith(basePrefix)) {
                    const relativePath = parent.path.slice(basePrefix.length);
                    if (relativePath.length > 0) {
                        const header = createFolderGroupHeader(parent.path, relativePath, parent.name);
                        return {
                            key: `folder:${parent.path}`,
                            label: header.label,
                            sortLabel: header.sortLabel,
                            isCurrentFolder: false,
                            folderPath: header.folderPath,
                            folderSegments: header.folderSegments
                        };
                    }
                }
            }

            const parentPath = parent.path === '/' ? '' : parent.path;
            const [topLevel] = parentPath.split('/');
            if (topLevel && topLevel.length > 0) {
                return {
                    key: `folder:/${topLevel}`,
                    label: showFolderGroupPaths ? topLevel : getLastFolderPathSegment(topLevel, topLevel),
                    sortLabel: topLevel,
                    isCurrentFolder: false,
                    folderPath: topLevel,
                    folderSegments: showFolderGroupPaths ? buildFolderGroupHeaderSegments(topLevel, topLevel) : undefined
                };
            }

            return { key: 'folder:/', label: vaultRootLabel, sortLabel: vaultRootLabel, isCurrentFolder: false, folderPath: null };
        };

        unpinnedFiles.forEach(file => {
            const groupInfo = resolveFolderGroup(file);
            const group = folderGroups.get(groupInfo.key);
            if (group) {
                group.files.push(file);
                return;
            }

            folderGroups.set(groupInfo.key, {
                label: groupInfo.label,
                sortLabel: groupInfo.sortLabel,
                files: [file],
                isCurrentFolder: groupInfo.isCurrentFolder,
                folderPath: groupInfo.folderPath,
                folderSegments: groupInfo.folderSegments
            });
        });

        const orderedGroups = Array.from(folderGroups.entries())
            .map(([key, group]) => ({ key, ...group }))
            .sort((left, right) => {
                const labelCompare = compareByAlphaSortOrder(left.sortLabel, right.sortLabel, folderGroupSortOrder);
                if (labelCompare !== 0) {
                    return labelCompare;
                }

                if (left.key === right.key) {
                    return 0;
                }

                return left.key < right.key ? -1 : 1;
            });

        const currentFolderGroup = orderedGroups.find(group => group.isCurrentFolder) ?? null;
        const childFolderGroups = orderedGroups.filter(group => !group.isCurrentFolder);
        const shouldAddCurrentFolderBoundary =
            currentFolderGroup !== null &&
            ((listConfig.showCurrentFolderFilesAtBottom && (pinnedFiles.length > 0 || childFolderGroups.length > 0)) ||
                (!listConfig.showCurrentFolderFilesAtBottom && pinnedFiles.length > 0));
        const renderFolderGroup = (group: (typeof orderedGroups)[number]): void => {
            if (group.files.length === 0) {
                return;
            }

            if (!group.isCurrentFolder) {
                pushHeaderItem({
                    data: group.label,
                    collapseKey: createCollapseKey(group.key),
                    headerFolderPath: group.folderPath,
                    headerFolderSegments: group.folderSegments,
                    key: `header-${group.key}`,
                    headerKind: 'folder',
                    groupFiles: group.files
                });
            } else if (shouldAddCurrentFolderBoundary) {
                pushHeaderItem({
                    data: strings.listPane.filesSection,
                    key: `header-${group.key}-current-folder-boundary`,
                    headerKind: 'section',
                    groupFiles: group.files
                });
            }

            group.files.forEach(file => {
                pushFileItem(file);
            });
        };

        if (currentFolderGroup && !listConfig.showCurrentFolderFilesAtBottom) {
            renderFolderGroup(currentFolderGroup);
        }

        childFolderGroups.forEach(renderFolderGroup);

        if (currentFolderGroup && listConfig.showCurrentFolderFilesAtBottom) {
            renderFolderGroup(currentFolderGroup);
        }
    }

    items.push({
        type: ListPaneItemType.BOTTOM_SPACER,
        data: '',
        key: 'bottom-spacer'
    });

    return {
        items,
        groupItemCountByKey: groupItemCountByKey ?? EMPTY_GROUP_ITEM_COUNT_BY_KEY
    };
}

export function buildFilePathToIndexMap(listItems: ListPaneItem[]): Map<string, number> {
    const filePathToIndex = new Map<string, number>();
    listItems.forEach((item, index) => {
        if (item.type === ListPaneItemType.FILE && item.data instanceof TFile) {
            filePathToIndex.set(item.data.path, index);
        }
    });
    return filePathToIndex;
}

export function buildFileIndexMap(files: TFile[]): Map<string, number> {
    const fileIndexMap = new Map<string, number>();
    files.forEach((file, index) => {
        fileIndexMap.set(file.path, index);
    });
    return fileIndexMap;
}

export function buildOrderedFiles(listItems: ListPaneItem[]): {
    orderedFiles: TFile[];
    orderedFileIndexMap: Map<string, number>;
} {
    const orderedFiles: TFile[] = [];
    const orderedFileIndexMap = new Map<string, number>();

    listItems.forEach(item => {
        if (item.type === ListPaneItemType.FILE && item.data instanceof TFile) {
            orderedFileIndexMap.set(item.data.path, orderedFiles.length);
            orderedFiles.push(item.data);
        }
    });

    return { orderedFiles, orderedFileIndexMap };
}

export function findCollapsedListGroupRevealTarget(
    listItems: readonly ListPaneItem[],
    filePath: string,
    pinnedGroupExpanded: boolean
): CollapsedListGroupRevealTarget | null {
    for (const item of listItems) {
        if (item.type !== ListPaneItemType.HEADER || !item.groupFilePaths?.includes(filePath)) {
            continue;
        }

        if (item.key === PINNED_SECTION_HEADER_KEY) {
            if (!pinnedGroupExpanded) {
                return { type: 'pinned' };
            }
            continue;
        }

        if (item.collapseKey && item.isCollapsed === true) {
            return { type: 'list-group', collapseKey: item.collapseKey };
        }
    }

    return null;
}

/**
 * Resolves the bulk toggle from the collapsible headers rendered in the current list.
 * Zero expanded groups expands every persisted key in the current scope, including descendants
 * hidden by collapsed parents; any expanded group collapses the rendered headers.
 */
export function resolveListGroupExpansionToggleState(
    listItems: readonly ListPaneItem[],
    pinnedGroupExpanded: boolean,
    collapsedListGroups: ReadonlySet<string>,
    collapseKeyPrefix: string
): ListGroupExpansionToggleState {
    const collapseKeys = new Set<string>();
    let hasPinnedGroup = false;
    let hasExpandedGroup = false;

    listItems.forEach(item => {
        if (item.type !== ListPaneItemType.HEADER) {
            return;
        }

        if (item.key === PINNED_SECTION_HEADER_KEY) {
            hasPinnedGroup = true;
            hasExpandedGroup ||= pinnedGroupExpanded;
            return;
        }

        if (!item.collapseKey) {
            return;
        }

        collapseKeys.add(item.collapseKey);
        hasExpandedGroup ||= item.isCollapsed !== true;
    });

    const canToggle = hasPinnedGroup || collapseKeys.size > 0;
    if (canToggle && !hasExpandedGroup) {
        // Collapsed parents omit manual-sort descendant headers from listItems, so expanding must also
        // clear persisted keys in the same selection and grouping scope that are currently hidden.
        collapsedListGroups.forEach(collapseKey => {
            if (collapseKey.startsWith(collapseKeyPrefix)) {
                collapseKeys.add(collapseKey);
            }
        });
    }

    return {
        collapseKeys: Array.from(collapseKeys),
        hasPinnedGroup,
        canToggle,
        shouldCollapse: hasExpandedGroup
    };
}
