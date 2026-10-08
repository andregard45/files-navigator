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

/**
 * OPTIMIZATIONS:
 *
 * 1. React.memo with forwardRef - Only re-renders on prop changes
 *
 * 2. Virtualization:
 *    - TanStack Virtual for rendering only visible items
 *    - Estimated row heights from fixed measurements and visible row sections
 *    - Direct memory cache lookups in estimateSize function
 *    - Virtualizer refreshes size estimates when row-height inputs change
 *
 * 3. List building optimization:
 *    - useMemo rebuilds list items only when dependencies change
 *    - File filtering happens once during list build
 *    - Sort operations optimized with pre-computed values
 *    - Pinned files handled separately for efficiency
 *
 * 4. Event handling:
 *    - Debounced vault event handlers via forceUpdate
 *    - Selective updates based on file location (folder/tag context)
 *    - Database content changes trigger selective size-estimate refreshes
 *
 * 5. Selection handling:
 *    - Stable file index for onClick handlers
 *    - Multi-selection support without re-render
 *    - Keyboard navigation optimized
 */

import React, { useRef, useEffect, useImperativeHandle, forwardRef, useState, useMemo, useLayoutEffect } from 'react';
import { TFile, TFolder, Platform, type App } from 'obsidian';
import { Virtualizer } from '@tanstack/react-virtual';
import { useSelectionState, useSelectionDispatch } from '../context/SelectionContext';
import { useServices } from '../context/ServicesContext';
import { useSettingsState, useActiveProfile, useSettingsDerived } from '../context/SettingsContext';
import { useUIState } from '../context/UIStateContext';
import { useExpansionDispatch, useExpansionState } from '../context/ExpansionContext';
import { useFileCache } from '../context/StorageContext';
import { useShortcuts } from '../context/ShortcutsContext';
import { useListPaneKeyboard } from '../hooks/useListPaneKeyboard';
import { useListPaneData } from '../hooks/useListPaneData';
import { findCollapsedListGroupRevealTarget, resolveListGroupExpansionToggleState } from '../hooks/listPaneData/listItems';
import { useListPaneScroll } from '../hooks/useListPaneScroll';
import { useListPaneTitle } from '../hooks/useListPaneTitle';
import { useListPaneAppearance } from '../hooks/useListPaneAppearance';
import { useListPaneSearch, type SearchQueryUpdateOptions } from '../hooks/useListPaneSearch';
import { useListPaneSelectionCoordinator } from '../hooks/useListPaneSelectionCoordinator';
import type { EnsureSelectionOptions, EnsureSelectionResult, SelectFileOptions } from '../hooks/useListPaneSelectionCoordinator';
import { useContextMenu } from '../hooks/useContextMenu';
import { IOS_FLOATING_TOOLBAR_HEIGHT_PX, ItemType, ListPaneItemType, type CSSPropertiesWithVars } from '../types';
import { getEffectiveListSort } from '../utils/sortUtils';
import { ListPaneHeader } from './ListPaneHeader';
import { ListToolbar } from './ListToolbar';
import { Calendar } from './calendar';
import { SearchInput } from './SearchInput';
import { ListPaneTitleArea } from './ListPaneTitleArea';
import { ListPaneVirtualContent, getHoveredFilePathAtPointer, type PointerClientPosition } from './listPane/ListPaneVirtualContent';
import type { FileItemStorageHelpers } from './FileItem';
import { type SearchShortcut } from '../types/shortcuts';
import { type SearchNavFilterState } from '../types/search';
import { EMPTY_LIST_MENU_TYPE } from '../utils/contextMenu';
import { useCollapsedPinnedContexts, useUXPreferences } from '../context/UXPreferencesContext';
import { type InclusionOperator } from '../utils/filterSearch';
import type { FolderDecorationModel } from '../utils/folderDecoration';
import { useSurfaceColorVariables } from '../hooks/useSurfaceColorVariables';
import { LIST_PANE_SURFACE_COLOR_MAPPINGS } from '../constants/surfaceColorMappings';
import { getListPaneMeasurements } from '../utils/listPaneMeasurements';
import { usesMobileChrome } from '../utils/paneLayout';
import { DateUtils } from '../utils/dateUtils';
import type { NavigateToFolderOptions, RevealPropertyOptions, RevealTagOptions } from '../hooks/useNavigatorReveal';
import type { FileItemPillDecorationModel } from '../utils/fileItemPillDecoration';
import { getFilesForNavigationSelection, getPinnedSectionCollapseKey } from '../utils/selectionUtils';
import { buildListGroupCollapseKeyPrefix } from '../utils/listGroupCollapse';
import { strings } from '../i18n';
import { resolveEffectiveListGroupingForSort } from '../utils/listGrouping';
import { focusElementPreventScroll } from '../utils/domUtils';

/**
 * Renders the list pane displaying files from the selected folder.
 * Handles file sorting, grouping by date or folder, pinned notes, and auto-selection.
 * Integrates with the app context to manage file selection and navigation.
 *
 * @returns A scrollable list of files grouped by date or folder with empty state handling
 */
interface ExecuteSearchShortcutParams {
    searchShortcut: SearchShortcut;
}

export type { SelectFileOptions };

export interface ListPaneHandle {
    getIndexOfPath: (path: string) => number;
    virtualizer: Virtualizer<HTMLDivElement, Element> | null;
    scrollContainerRef: HTMLDivElement | null;
    getOrderedFiles: () => TFile[];
    selectFile: (file: TFile, options?: SelectFileOptions) => void;
    selectAdjacentFile: (direction: 'next' | 'previous') => boolean;
    modifySearchWithTag: (tag: string, operator: InclusionOperator, options?: SearchQueryUpdateOptions) => void;
    modifySearchWithProperty: (key: string, value: string | null, operator: InclusionOperator, options?: SearchQueryUpdateOptions) => void;
    modifySearchWithDateToken: (dateToken: string, options?: SearchQueryUpdateOptions) => void;
    toggleSearch: () => void;
    searchWithDescendants: () => void;
    executeSearchShortcut: (params: ExecuteSearchShortcutParams) => Promise<void>;
    toggleGroupExpansion: () => boolean;
}

interface ListPaneProps {
    /**
     * Reference to the root navigator container (.nn-split-container).
     * This is passed from NotebookNavigatorComponent to ensure keyboard events
     * are captured at the navigator level, not globally. This allows proper
     * keyboard navigation between panes while preventing interference with
     * other Obsidian views.
     */
    rootContainerRef: React.RefObject<HTMLDivElement | null>;
    /**
     * Optional resize handle props for dual-pane mode.
     * When provided, renders a resize handle overlay on the list pane boundary.
     */
    resizeHandleProps?: {
        onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
    };
    /**
     * Callback invoked whenever tag-related search tokens change.
     */
    onSearchTokensChange?: (state: SearchNavFilterState) => void;
    folderDecorationModel: FolderDecorationModel;
    fileItemPillDecorationModel: FileItemPillDecorationModel;
    onNavigateToFolder: (folderPath: string, options?: NavigateToFolderOptions) => void;
    onRevealTag: (tagPath: string, options?: RevealTagOptions) => void;
    onRevealProperty: (propertyNodeId: string, options?: RevealPropertyOptions) => boolean;
}

interface ListPaneTitleChromeProps {
    onHeaderClick?: () => void;
    isSearchActive?: boolean;
    onSearchToggle?: () => void;
    canToggleGroupExpansion: boolean;
    shouldCollapseGroups: boolean;
    onToggleGroupExpansion: () => boolean;
    actionsDisabled?: boolean;
    shouldShowDesktopTitleArea: boolean;
    folderDecorationModel: FolderDecorationModel;
    fileItemPillDecorationModel: FileItemPillDecorationModel;
    children: React.ReactNode;
}

function ListPaneTitleChrome({
    onHeaderClick,
    isSearchActive,
    onSearchToggle,
    canToggleGroupExpansion,
    shouldCollapseGroups,
    onToggleGroupExpansion,
    actionsDisabled,
    shouldShowDesktopTitleArea,
    folderDecorationModel,
    fileItemPillDecorationModel,
    children
}: ListPaneTitleChromeProps) {
    const { desktopTitle, breadcrumbSegments, iconName, showIcon, titleColor } = useListPaneTitle({
        folderDecorationModel,
        fileItemPillDecorationModel
    });
    return (
        <>
            <ListPaneHeader
                onHeaderClick={onHeaderClick}
                isSearchActive={isSearchActive}
                onSearchToggle={onSearchToggle}
                canToggleGroupExpansion={canToggleGroupExpansion}
                shouldCollapseGroups={shouldCollapseGroups}
                onToggleGroupExpansion={onToggleGroupExpansion}
                actionsDisabled={actionsDisabled}
                desktopTitle={desktopTitle}
                breadcrumbSegments={breadcrumbSegments}
                iconName={iconName}
                showIcon={showIcon}
                titleColor={titleColor}
            />
            {children}
            {shouldShowDesktopTitleArea ? <ListPaneTitleArea desktopTitle={desktopTitle} titleColor={titleColor} /> : null}
        </>
    );
}

export const ListPane = React.memo(
    forwardRef<ListPaneHandle, ListPaneProps>(function ListPane(props, ref) {
        const { app, isMobile, plugin, fileSystemOps, tagTreeService, propertyTreeService } = useServices();
        const {
            onNavigateToFolder,
            onRevealTag,
            onRevealProperty,
            folderDecorationModel,
            fileItemPillDecorationModel
        } = props;
        const selectionState = useSelectionState();
        const selectionDispatch = useSelectionDispatch();
        const settings = useSettingsState();
        const activeProfile = useActiveProfile();
        const { fileNameIconNeedles } = useSettingsDerived();
        const expansionState = useExpansionState();
        const expansionDispatch = useExpansionDispatch();
        const uxPreferences = useUXPreferences();
        const includeDescendantNotes = uxPreferences.includeDescendantNotes;
        const showHiddenItems = uxPreferences.showHiddenItems;
        const showCalendar = uxPreferences.showCalendar;
        const appearanceSettings = useListPaneAppearance();
        const { getFileDisplayName, getDB, getFileTimestamps } = useFileCache();
        const { noteShortcutKeysByPath, addNoteShortcut, removeShortcut } = useShortcuts();
        const uiState = useUIState();
        const isVerticalDualPane = !uiState.singlePane && uiState.effectiveDualPaneOrientation === 'vertical';
        const calendarPlacement = settings.calendarPlacement;
        const shouldRenderCalendarOverlay = calendarPlacement === 'left-sidebar' && showCalendar && isVerticalDualPane;
        const listPaneRef = useRef<HTMLDivElement | null>(null);
        const hoverPointerClientPositionRef = useRef<PointerClientPosition | null>(null);
        // Android uses toolbar at top, iOS at bottom
        const isAndroid = Platform.isAndroidApp;
        /** Maps semi-transparent theme color variables to computed opaque equivalents (see constants/surfaceColorMappings). */
        const { getSolidBackground } = useSurfaceColorVariables(listPaneRef, {
            app,
            rootContainerRef: props.rootContainerRef,
            variables: LIST_PANE_SURFACE_COLOR_MAPPINGS
        });
        const [calendarWeekCount, setCalendarWeekCount] = useState<number>(() => settings.calendarWeeksToShow);
        const [isListScrolling, setIsListScrolling] = useState(false);
        const [hoveredFilePath, setHoveredFilePath] = useState<string | null>(null);
        const [inlineRenameFilePath, setInlineRenameFilePath] = useState<string | null>(null);
        const [forceSearchDescendants, setForceSearchDescendants] = useState(false);
        const hoverSyncFrameRef = useRef<number | null>(null);
        const addNoteShortcutRef = useRef(addNoteShortcut);
        const removeShortcutRef = useRef(removeShortcut);
        const listPaneTitle = settings.listPaneTitle ?? 'header';
        // Mobile chrome (simplified header, mobile toolbars) applies to phones only. Tablets
        // render the desktop header and title area in both pane layouts so the toolbars stay
        // at the top when switching between single and dual pane.
        const useMobileChrome = usesMobileChrome();
        const shouldShowDesktopTitleArea = !useMobileChrome && listPaneTitle === 'list';
        const listMeasurements = getListPaneMeasurements(isMobile);
        const topSpacerHeight = shouldShowDesktopTitleArea ? 0 : listMeasurements.topSpacer;
        const iconColumnStyle = useMemo(() => {
            if (settings.showFileIcons) {
                return undefined;
            }
            return {
                '--nn-file-icon-slot-width': '0px',
                '--nn-file-icon-slot-width-mobile': '0px',
                '--nn-file-icon-slot-gap': '0px'
            } as React.CSSProperties;
        }, [settings.showFileIcons]);
        const listPaneStyle = useMemo<CSSPropertiesWithVars>(() => {
            return {
                ...(iconColumnStyle ?? {}),
                '--nn-calendar-week-count': calendarWeekCount
            };
        }, [calendarWeekCount, iconColumnStyle]);

        useEffect(() => {
            if (settings.calendarWeeksToShow !== 6) {
                setCalendarWeekCount(settings.calendarWeeksToShow);
            }
        }, [settings.calendarWeeksToShow]);

        const shouldUseFloatingToolbars = useMobileChrome && Platform.isIosApp && settings.useFloatingToolbars;
        const scrollPaddingEnd = useMemo(() => {
            if (!shouldUseFloatingToolbars) {
                return 0;
            }

            // Keep in sync with `--nn-ios-pane-bottom-overlay-height` in `src/styles/sections/platform-ios.css`.
            // The calendar overlay is outside the scroller, so it is intentionally not included here.
            return IOS_FLOATING_TOOLBAR_HEIGHT_PX;
        }, [shouldUseFloatingToolbars]);
        const ensureSelectionForCurrentFilterRef = useRef<((options?: EnsureSelectionOptions) => EnsureSelectionResult) | null>(null);
        const {
            isSearchActive,
            searchProvider,
            searchQuery,
            debouncedSearchQuery,
            debouncedSearchTokens,
            searchHighlightTerms,
            shouldFocusSearch,
            activeSearchShortcut,
            isSavingSearchShortcut,
            suppressSearchTopScrollRef,
            setSearchQuery,
            handleSearchToggle,
            closeSearch,
            focusSearchComplete,
            handleSaveSearchShortcut,
            handleRemoveSearchShortcut,
            modifySearchWithTag,
            modifySearchWithProperty,
            modifySearchWithDateToken,
            toggleSearch,
            executeSearchShortcut
        } = useListPaneSearch({
            rootContainerRef: props.rootContainerRef,
            onSearchTokensChange: props.onSearchTokensChange,
            onNavigateToFolder,
            onRevealTag,
            onRevealProperty,
            ensureSelectionForCurrentFilterRef
        });

        const { selectionType, selectedFolder, selectedTag, selectedProperty, selectedFile } = selectionState;
        const selectedFolderPath = selectionType === ItemType.FOLDER ? (selectedFolder?.path ?? null) : null;
        const shouldForceSearchDescendants =
            forceSearchDescendants && isSearchActive && selectionType === ItemType.FOLDER && selectedFolderPath === '/';
        const effectiveIncludeDescendantNotes = includeDescendantNotes || shouldForceSearchDescendants;
        const effectiveSortSpec = getEffectiveListSort(settings, selectionType, selectedFolder, selectedTag, selectedProperty);
        const effectiveSortOption = effectiveSortSpec.option;
        const pinnedCollapseKey = getPinnedSectionCollapseKey({ selectionType, selectedFolder, selectedTag, selectedProperty });
        const collapsedPinnedContexts = useCollapsedPinnedContexts();
        const pinnedGroupExpanded = collapsedPinnedContexts[pinnedCollapseKey] !== true;
        const handlePinnedGroupHeaderToggle = React.useCallback(() => {
            plugin.togglePinnedGroupCollapsed(pinnedCollapseKey);
        }, [pinnedCollapseKey, plugin]);
        const collapsedListGroups = expansionState.collapsedListGroups;
        const groupCollapseStateSignature = useMemo(() => {
            const collapsedGroupKeys = Array.from(collapsedListGroups);
            collapsedGroupKeys.sort();
            return `${pinnedGroupExpanded ? 'expanded' : 'collapsed'}:${collapsedGroupKeys.join('\u0001')}`;
        }, [collapsedListGroups, pinnedGroupExpanded]);
        const handleListGroupHeaderToggle = React.useCallback(
            (collapseKey: string) => {
                expansionDispatch({ type: 'TOGGLE_LIST_GROUP_COLLAPSED', collapseKey });
            },
            [expansionDispatch]
        );

        useEffect(() => {
            if (!forceSearchDescendants) {
                return;
            }

            if (isSearchActive && selectionType === ItemType.FOLDER && selectedFolderPath === '/') {
                return;
            }

            setForceSearchDescendants(false);
        }, [forceSearchDescendants, isSearchActive, selectedFolderPath, selectionType]);

        const effectiveGroupBy = resolveEffectiveListGroupingForSort({
            groupBy: appearanceSettings.groupBy,
            sortOption: effectiveSortOption,
            selectionType
        });
        const effectiveAppearanceSettings = useMemo(
            () =>
                effectiveGroupBy === appearanceSettings.groupBy ? appearanceSettings : { ...appearanceSettings, groupBy: effectiveGroupBy },
            [appearanceSettings, effectiveGroupBy]
        );
        // Determine if list pane is visible early to optimize
        const isVisible = !uiState.singlePane || uiState.currentSinglePaneView === 'files';

        // Use the new data hook
        const { listItems, orderedFiles, orderedFileIndexMap, filePathToIndex, files } = useListPaneData({
            selectionType,
            selectedFolder,
            selectedTag,
            selectedProperty,
            settings,
            activeProfile,
            groupBy: effectiveAppearanceSettings.groupBy,
            pinnedGroupExpanded,
            collapsedListGroups,
            searchProvider,
            // Use debounced value for filtering
            searchQuery: isSearchActive ? debouncedSearchQuery : undefined,
            searchTokens: isSearchActive ? debouncedSearchTokens : undefined,
            visibility: { includeDescendantNotes: effectiveIncludeDescendantNotes, showHiddenItems }
        });
        const listGroupCollapseKeyPrefix = useMemo(
            () =>
                buildListGroupCollapseKeyPrefix({
                    selectionType,
                    selectedFolderPath,
                    selectedTag,
                    selectedProperty,
                    groupingMode: effectiveAppearanceSettings.groupBy
                }),
            [effectiveAppearanceSettings.groupBy, selectedFolderPath, selectedProperty, selectedTag, selectionType]
        );
        const listGroupExpansionToggleState = useMemo(
            () => resolveListGroupExpansionToggleState(listItems, pinnedGroupExpanded, collapsedListGroups, listGroupCollapseKeyPrefix),
            [collapsedListGroups, listGroupCollapseKeyPrefix, listItems, pinnedGroupExpanded]
        );
        const toggleGroupExpansion = React.useCallback((): boolean => {
            if (!listGroupExpansionToggleState.canToggle) {
                return false;
            }

            const collapsed = listGroupExpansionToggleState.shouldCollapse;
            expansionDispatch({
                type: 'SET_LIST_GROUPS_COLLAPSED',
                collapseKeys: listGroupExpansionToggleState.collapseKeys,
                collapsed
            });

            const pinnedGroupCollapsed = !pinnedGroupExpanded;
            if (listGroupExpansionToggleState.hasPinnedGroup && pinnedGroupCollapsed !== collapsed) {
                // The pinned header persists per navigation context, separately from the other list-group collapse keys.
                plugin.togglePinnedGroupCollapsed(pinnedCollapseKey);
            }

            return true;
        }, [expansionDispatch, listGroupExpansionToggleState, pinnedCollapseKey, pinnedGroupExpanded, plugin]);
        const listStartsWithGroupHeader =
            listItems[0]?.type === ListPaneItemType.TOP_SPACER && listItems[1]?.type === ListPaneItemType.HEADER;
        const effectiveTopSpacerHeight = settings.stickyGroupHeaders && listStartsWithGroupHeader ? 0 : topSpacerHeight;

        // Determine the target folder path for drag-and-drop of external files
        const activeFolderDropPath = useMemo(() => {
            if (selectionType !== 'folder' || !selectedFolder) {
                return null;
            }
            return selectedFolder.path;
        }, [selectionType, selectedFolder]);
        const fileItemStorage = useMemo<FileItemStorageHelpers>(
            () => ({
                getFileDisplayName,
                getDB,
                getFileTimestamps
            }),
            [getFileDisplayName, getDB, getFileTimestamps]
        );
        const syncHoveredFilePathToPointer = React.useCallback((scrollElement: HTMLDivElement | null) => {
            const nextHoveredFilePath = getHoveredFilePathAtPointer(scrollElement, hoverPointerClientPositionRef.current);
            setHoveredFilePath(previous => (previous === nextHoveredFilePath ? previous : nextHoveredFilePath));
        }, []);
        const syncHoveredFilePathToPointerAfterPaint = React.useCallback(
            (scrollElement: HTMLDivElement | null) => {
                if (typeof window === 'undefined' || typeof window.requestAnimationFrame !== 'function') {
                    syncHoveredFilePathToPointer(scrollElement);
                    return;
                }

                if (hoverSyncFrameRef.current !== null) {
                    window.cancelAnimationFrame(hoverSyncFrameRef.current);
                }

                hoverSyncFrameRef.current = window.requestAnimationFrame(() => {
                    hoverSyncFrameRef.current = null;
                    syncHoveredFilePathToPointer(scrollElement);
                });
            },
            [syncHoveredFilePathToPointer]
        );
        const handleVirtualizerScrollingChange = React.useCallback(
            (isScrolling: boolean, scrollElement: HTMLDivElement | null) => {
                if (isScrolling) {
                    setIsListScrolling(previous => (previous ? previous : true));
                    setHoveredFilePath(previous => (previous === null ? previous : null));
                    return;
                }

                syncHoveredFilePathToPointer(scrollElement);
                setIsListScrolling(false);
            },
            [syncHoveredFilePathToPointer]
        );
        const handleScrollContainerVisibilityChange = React.useCallback(
            (isContainerVisible: boolean, scrollElement: HTMLDivElement | null) => {
                setIsListScrolling(false);

                if (!isContainerVisible) {
                    if (hoverSyncFrameRef.current !== null) {
                        window.cancelAnimationFrame(hoverSyncFrameRef.current);
                        hoverSyncFrameRef.current = null;
                    }
                    setHoveredFilePath(previous => (previous === null ? previous : null));
                    return;
                }

                syncHoveredFilePathToPointer(scrollElement);
                syncHoveredFilePathToPointerAfterPaint(scrollElement);
            },
            [syncHoveredFilePathToPointer, syncHoveredFilePathToPointerAfterPaint]
        );
        useEffect(() => {
            if (
                !selectionState.isRevealOperation ||
                selectionState.revealSource !== 'manual' ||
                !selectedFile ||
                filePathToIndex.has(selectedFile.path)
            ) {
                return;
            }

            const revealTarget = findCollapsedListGroupRevealTarget(listItems, selectedFile.path, pinnedGroupExpanded);
            if (!revealTarget) {
                return;
            }

            if (revealTarget.type === 'pinned') {
                // The toggle updates the record synchronously, so the effect re-runs with the expanded state and needs no re-entry guard.
                plugin.togglePinnedGroupCollapsed(pinnedCollapseKey);
                return;
            }

            expansionDispatch({ type: 'EXPAND_LIST_GROUP', collapseKey: revealTarget.collapseKey });
        }, [
            expansionDispatch,
            filePathToIndex,
            listItems,
            pinnedCollapseKey,
            pinnedGroupExpanded,
            plugin,
            selectedFile,
            selectionState.isRevealOperation,
            selectionState.revealSource
        ]);

        // Use the new scroll hook
        const { rowVirtualizer, scrollContainerRef, scrollContainerRefCallback, handleScrollToTop, scrollToIndexSafely } =
            useListPaneScroll({
                enabled: true,
                listItems,
                filePathToIndex,
                selectedFile,
                selectedFolder,
                selectedTag,
                selectedProperty,
                settings,
                folderSettings: effectiveAppearanceSettings,
                isVisible,
                selectionState,
                selectionDispatch,
                // Use debounced value for scroll orchestration to align with filtering
                searchQuery: isSearchActive ? debouncedSearchQuery : undefined,
                suppressSearchTopScrollRef,
                topSpacerHeight: effectiveTopSpacerHeight,
                includeDescendantNotes: effectiveIncludeDescendantNotes,
                groupCollapseStateSignature,
                scrollMargin: 0,
                scrollPaddingEnd,
                onVirtualizerScrollingChange: handleVirtualizerScrollingChange,
                onScrollContainerVisibilityChange: handleScrollContainerVisibilityChange
            });

        const restoreListPaneFocus = React.useCallback(() => {
            const restore = () => {
                const target = scrollContainerRef.current ?? props.rootContainerRef.current;
                if (target) {
                    focusElementPreventScroll(target);
                }
            };

            if (typeof window.requestAnimationFrame === 'function') {
                window.requestAnimationFrame(restore);
                return;
            }

            window.setTimeout(restore, 0);
        }, [props.rootContainerRef, scrollContainerRef]);

        const handleStartFileInlineRenameForFile = React.useCallback(
            (file: TFile): boolean => {
                const index = filePathToIndex.get(file.path);
                if (index === undefined) {
                    return false;
                }

                setInlineRenameFilePath(file.path);
                scrollToIndexSafely(index, 'auto');
                return true;
            },
            [filePathToIndex, scrollToIndexSafely]
        );

        const prevCalendarOverlayVisibleRef = useRef<boolean>(shouldRenderCalendarOverlay);
        const prevCalendarWeekCountRef = useRef<number>(calendarWeekCount);

        useEffect(() => {
            const wasVisible = prevCalendarOverlayVisibleRef.current;
            const prevWeekCount = prevCalendarWeekCountRef.current;

            const becameVisible = shouldRenderCalendarOverlay && !wasVisible;
            const weekCountChanged = shouldRenderCalendarOverlay && calendarWeekCount !== prevWeekCount;

            prevCalendarOverlayVisibleRef.current = shouldRenderCalendarOverlay;
            prevCalendarWeekCountRef.current = calendarWeekCount;

            if (!becameVisible && !weekCountChanged) {
                return;
            }

            if (!selectedFile) {
                return;
            }

            const index = filePathToIndex.get(selectedFile.path);
            if (index === undefined) {
                return;
            }

            const scheduleScroll = () => scrollToIndexSafely(index, 'auto');

            if (typeof requestAnimationFrame !== 'undefined') {
                window.requestAnimationFrame(() => {
                    window.requestAnimationFrame(scheduleScroll);
                });
                return;
            }

            window.setTimeout(scheduleScroll, 0);
        }, [calendarWeekCount, filePathToIndex, scrollToIndexSafely, selectedFile, shouldRenderCalendarOverlay]);

        const handleHoveredFilePathChange = React.useCallback(
            (path: string | null, pointerClientPosition: PointerClientPosition | null) => {
                hoverPointerClientPositionRef.current = pointerClientPosition;
                setHoveredFilePath(previous => (previous === path ? previous : path));
            },
            []
        );

        useEffect(() => {
            if (isMobile) {
                return;
            }

            const handleWindowMouseMove = (event: MouseEvent) => {
                hoverPointerClientPositionRef.current = {
                    clientX: event.clientX,
                    clientY: event.clientY
                };
            };
            const handleWindowMouseOut = (event: MouseEvent) => {
                if (!event.relatedTarget) {
                    hoverPointerClientPositionRef.current = null;
                }
            };

            window.addEventListener('mousemove', handleWindowMouseMove, { passive: true });
            window.addEventListener('mouseout', handleWindowMouseOut);
            return () => {
                window.removeEventListener('mousemove', handleWindowMouseMove);
                window.removeEventListener('mouseout', handleWindowMouseOut);
            };
        }, [isMobile]);

        useEffect(() => {
            return () => {
                if (hoverSyncFrameRef.current !== null) {
                    window.cancelAnimationFrame(hoverSyncFrameRef.current);
                    hoverSyncFrameRef.current = null;
                }
            };
        }, []);

        useLayoutEffect(() => {
            if (isListScrolling) {
                return;
            }

            syncHoveredFilePathToPointer(scrollContainerRef.current);
        }, [isListScrolling, listItems, scrollContainerRef, syncHoveredFilePathToPointer]);

        useEffect(() => {
            addNoteShortcutRef.current = addNoteShortcut;
            removeShortcutRef.current = removeShortcut;
        }, [addNoteShortcut, removeShortcut]);

        // Attach context menu to empty areas in the list pane for file creation
        useContextMenu(scrollContainerRef, {
            type: EMPTY_LIST_MENU_TYPE,
            item: selectedFolder ?? null,
            options: {
                orderedFiles,
                onStartInlineRename: handleStartFileInlineRenameForFile
            }
        });

        const {
            selectFileFromList,
            selectAdjacentFile,
            ensureSelectionForCurrentFilter,
            handleFileItemClick,
            lastSelectedFilePath,
            isFileSelected,
            scheduleKeyboardSelectionOpen,
            scheduleKeyboardSelectionOpenForFile,
            commitPendingKeyboardSelectionOpen
        } = useListPaneSelectionCoordinator({
            rootContainerRef: props.rootContainerRef,
            orderedFiles,
            filePathToIndex,
            scrollToIndexSafely
        });
        ensureSelectionForCurrentFilterRef.current = ensureSelectionForCurrentFilter;
        const toggleNoteShortcut = React.useCallback(async (file: TFile, shortcutKey: string | undefined) => {
            if (shortcutKey) {
                await removeShortcutRef.current(shortcutKey);
                return;
            }

            await addNoteShortcutRef.current(file.path);
        }, []);

        const handleSearchToggleWithDefaultScope = React.useCallback(() => {
            setForceSearchDescendants(false);
            handleSearchToggle();
        }, [handleSearchToggle]);

        const closeSearchWithDefaultScope = React.useCallback(() => {
            setForceSearchDescendants(false);
            closeSearch();
        }, [closeSearch]);

        const toggleSearchWithDefaultScope = React.useCallback(() => {
            setForceSearchDescendants(false);
            toggleSearch();
        }, [toggleSearch]);

        const searchWithDescendants = React.useCallback(() => {
            setForceSearchDescendants(true);
            toggleSearch();
        }, [toggleSearch]);

        const handleEmptySearchExit = React.useCallback(() => {
            setForceSearchDescendants(false);
        }, []);

        const modifySearchWithTagWithDefaultScope = React.useCallback(
            (tag: string, operator: InclusionOperator, options?: SearchQueryUpdateOptions) => {
                setForceSearchDescendants(false);
                modifySearchWithTag(tag, operator, options);
            },
            [modifySearchWithTag]
        );

        const modifySearchWithPropertyWithDefaultScope = React.useCallback(
            (key: string, value: string | null, operator: InclusionOperator, options?: SearchQueryUpdateOptions) => {
                setForceSearchDescendants(false);
                modifySearchWithProperty(key, value, operator, options);
            },
            [modifySearchWithProperty]
        );

        const modifySearchWithDateTokenWithDefaultScope = React.useCallback(
            (dateToken: string, options?: SearchQueryUpdateOptions) => {
                setForceSearchDescendants(false);
                modifySearchWithDateToken(dateToken, options);
            },
            [modifySearchWithDateToken]
        );

        const executeSearchShortcutWithDefaultScope = React.useCallback(
            async (params: ExecuteSearchShortcutParams) => {
                setForceSearchDescendants(false);
                await executeSearchShortcut(params);
            },
            [executeSearchShortcut]
        );

        const listToolbar = useMemo(() => {
            return (
                <ListToolbar
                    isSearchActive={isSearchActive}
                    onSearchToggle={handleSearchToggleWithDefaultScope}
                    canToggleGroupExpansion={listGroupExpansionToggleState.canToggle}
                    shouldCollapseGroups={listGroupExpansionToggleState.shouldCollapse}
                    onToggleGroupExpansion={toggleGroupExpansion}
                    useFloatingLayout={shouldUseFloatingToolbars}
                />
            );
        }, [
            handleSearchToggleWithDefaultScope,
            isSearchActive,
            listGroupExpansionToggleState.canToggle,
            listGroupExpansionToggleState.shouldCollapse,
            shouldUseFloatingToolbars,
            toggleGroupExpansion
        ]);

        useEffect(() => {
            if (!inlineRenameFilePath || filePathToIndex.has(inlineRenameFilePath)) {
                return;
            }

            setInlineRenameFilePath(null);
        }, [filePathToIndex, inlineRenameFilePath]);

        const handleStartFileInlineRename = React.useCallback((): boolean => {
            if (!selectedFile) {
                return false;
            }

            return handleStartFileInlineRenameForFile(selectedFile);
        }, [handleStartFileInlineRenameForFile, selectedFile]);

        const handleFileRenameCommit = React.useCallback(
            async (file: TFile, value: string): Promise<boolean> => {
                const shouldClose = await fileSystemOps.renameFileDisplayName(file, value);
                if (shouldClose) {
                    setInlineRenameFilePath(null);
                }
                return shouldClose;
            },
            [fileSystemOps]
        );

        const handleFileRenameCancel = React.useCallback(() => {
            setInlineRenameFilePath(null);
        }, []);

        // Expose the virtualizer instance and file lookup method via the ref
        useImperativeHandle(
            ref,
            () => ({
                getIndexOfPath: (path: string) => filePathToIndex.get(path) ?? -1,
                virtualizer: rowVirtualizer,
                scrollContainerRef: scrollContainerRef.current,
                getOrderedFiles: () => orderedFiles,
                // Allow parent components to trigger file selection programmatically
                selectFile: selectFileFromList,
                // Provide imperative adjacent navigation for command handlers
                selectAdjacentFile,
                // Toggle or modify search query to include/exclude a tag with AND/OR operator
                modifySearchWithTag: modifySearchWithTagWithDefaultScope,
                // Toggle or modify search query to include/exclude a property with AND/OR operator
                modifySearchWithProperty: modifySearchWithPropertyWithDefaultScope,
                // Replace the active search query with a date token
                modifySearchWithDateToken: modifySearchWithDateTokenWithDefaultScope,
                // Toggle search mode on/off or focus existing search
                toggleSearch: toggleSearchWithDefaultScope,
                searchWithDescendants,
                executeSearchShortcut: executeSearchShortcutWithDefaultScope,
                toggleGroupExpansion
            }),
            [
                filePathToIndex,
                orderedFiles,
                rowVirtualizer,
                scrollContainerRef,
                toggleSearchWithDefaultScope,
                searchWithDescendants,
                executeSearchShortcutWithDefaultScope,
                selectFileFromList,
                selectAdjacentFile,
                modifySearchWithTagWithDefaultScope,
                modifySearchWithPropertyWithDefaultScope,
                modifySearchWithDateTokenWithDefaultScope,
                toggleGroupExpansion
            ]
        );

        // Add keyboard navigation
        // Note: We pass the root container ref, not the scroll container ref.
        // This ensures keyboard events work across the entire navigator, allowing
        // users to navigate between panes (navigation <-> files) with Tab/Arrow keys.
        useListPaneKeyboard({
            enabled: true,
            items: listItems,
            virtualizer: rowVirtualizer,
            containerRef: props.rootContainerRef,
            pathToIndex: filePathToIndex,
            orderedFiles,
            orderedFileIndexMap,
            scrollToIndexSafely,
            onSelectFile: (file, options) =>
                selectFileFromList(file, {
                    markKeyboardNavigation: true,
                    suppressOpen: settings.enterToOpenFiles || options?.suppressOpen,
                    debounceOpen: options?.debounceOpen
                }),
            onScheduleKeyboardOpen: scheduleKeyboardSelectionOpen,
            onScheduleKeyboardOpenForFile: scheduleKeyboardSelectionOpenForFile,
            onCommitKeyboardOpen: commitPendingKeyboardSelectionOpen,
            onStartRename: handleStartFileInlineRename
        });

        // Determine if we're showing empty state
        const isEmptySelection = !selectedFolder && !selectedTag && !selectedProperty;
        const hasNoFiles = files.length === 0;

        const shouldRenderBottomToolbar = useMobileChrome && !isAndroid;
        const shouldRenderBottomToolbarInsidePanel = shouldRenderBottomToolbar && shouldUseFloatingToolbars;
        const shouldRenderBottomToolbarOutsidePanel = shouldRenderBottomToolbar && !shouldUseFloatingToolbars;

        // Single return with conditional content
        return (
            <div
                ref={listPaneRef}
                className={`nn-list-pane ${isSearchActive ? 'nn-search-active' : ''}`}
                style={listPaneStyle}
                data-calendar={shouldRenderCalendarOverlay ? 'true' : undefined}
            >
                {props.resizeHandleProps && <div className="nn-resize-handle" {...props.resizeHandleProps} />}
                <div className="nn-list-pane-chrome">
                    <ListPaneTitleChrome
                        onHeaderClick={handleScrollToTop}
                        isSearchActive={isSearchActive}
                        onSearchToggle={handleSearchToggleWithDefaultScope}
                        canToggleGroupExpansion={listGroupExpansionToggleState.canToggle}
                        shouldCollapseGroups={listGroupExpansionToggleState.shouldCollapse}
                        onToggleGroupExpansion={toggleGroupExpansion}
                        shouldShowDesktopTitleArea={shouldShowDesktopTitleArea}
                        folderDecorationModel={folderDecorationModel}
                        fileItemPillDecorationModel={fileItemPillDecorationModel}
                    >
                        {/* Android - toolbar at top */}
                        {useMobileChrome && isAndroid ? listToolbar : null}
                        {/* Search bar - collapsible */}
                        <div className={`nn-search-bar-container ${isSearchActive ? 'nn-search-bar-visible' : ''}`}>
                            {isSearchActive && (
                                <SearchInput
                                    searchQuery={searchQuery}
                                    onSearchQueryChange={setSearchQuery}
                                    shouldFocus={shouldFocusSearch}
                                    onFocusComplete={focusSearchComplete}
                                    onEmptySearchExit={handleEmptySearchExit}
                                    isWholeVaultSearch={shouldForceSearchDescendants}
                                    onClose={closeSearchWithDefaultScope}
                                    onFocusFiles={() => {
                                        // Ensure selection exists when focusing list from search (no editor open)
                                        ensureSelectionForCurrentFilter({ openInEditor: false });
                                    }}
                                    containerRef={props.rootContainerRef}
                                    onSaveShortcut={!activeSearchShortcut ? handleSaveSearchShortcut : undefined}
                                    onRemoveShortcut={activeSearchShortcut ? handleRemoveSearchShortcut : undefined}
                                    isShortcutSaved={Boolean(activeSearchShortcut)}
                                    isShortcutDisabled={isSavingSearchShortcut}
                                    searchProvider={searchProvider}
                                />
                            )}
                        </div>
                    </ListPaneTitleChrome>
                </div>
                <div className="nn-list-pane-panel">
                    <ListPaneVirtualContent
                        listItems={listItems}
                        rowVirtualizer={rowVirtualizer}
                        scrollContainerRefCallback={scrollContainerRefCallback}
                        activeFolderDropPath={activeFolderDropPath}
                        isEmptySelection={isEmptySelection}
                        hasNoFiles={hasNoFiles}
                        topSpacerHeight={effectiveTopSpacerHeight}
                        settings={settings}
                        pinnedGroupExpanded={pinnedGroupExpanded}
                        onPinnedGroupHeaderToggle={handlePinnedGroupHeaderToggle}
                        onListGroupHeaderToggle={handleListGroupHeaderToggle}
                        selectionType={selectionType}
                        selectedFolderPath={selectedFolderPath}
                        sortOption={effectiveSortOption}
                        searchHighlightTerms={searchHighlightTerms}
                        isFolderNavigation={selectionState.isFolderNavigation}
                        lastSelectedFilePath={lastSelectedFilePath}
                        isFileSelected={isFileSelected}
                        hoveredFilePath={hoveredFilePath}
                        suppressRowHover={isListScrolling}
                        onHoveredFilePathChange={handleHoveredFilePathChange}
                        onFileClick={handleFileItemClick}
                        fileIconSize={listMeasurements.fileIconSize}
                        appearanceSettings={effectiveAppearanceSettings}
                        fileNameIconNeedles={fileNameIconNeedles}
                        fileItemStorage={fileItemStorage}
                        noteShortcutKeysByPath={noteShortcutKeysByPath}
                        onToggleNoteShortcut={toggleNoteShortcut}
                        inlineRenameFilePath={inlineRenameFilePath}
                        onFileRenameCommit={handleFileRenameCommit}
                        onFileRenameCancel={handleFileRenameCancel}
                        onFileRenameRestoreFocus={restoreListPaneFocus}
                        onNavigateToFolder={onNavigateToFolder}
                        folderDecorationModel={folderDecorationModel}
                        getSolidBackground={getSolidBackground}
                    />

                    {/* iOS: keep the floating toolbar inside the panel */}
                    {shouldRenderBottomToolbarInsidePanel ? (
                        <div className="nn-pane-bottom-toolbar">{listToolbar}</div>
                    ) : null}
                </div>
                {shouldRenderCalendarOverlay ? (
                    <div className="nn-navigation-calendar-overlay">
                        <Calendar onWeekCountChange={setCalendarWeekCount} onAddDateFilter={modifySearchWithDateTokenWithDefaultScope} />
                    </div>
                ) : null}
                {shouldRenderBottomToolbarOutsidePanel ? (
                    <div className="nn-pane-bottom-toolbar">{listToolbar}</div>
                ) : null}
            </div>
        );
    })
);
