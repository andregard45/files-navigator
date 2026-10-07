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
 * File item architecture:
 *
 * 1. React.memo keeps row renders scoped to prop changes.
 *
 * 2. Render-path work:
 *    - displayName: Read from the storage-backed display-name cache
 *    - className/style values: Built directly from row state
 *
 * 3. Extracted subsystems:
 *    - useFileItemContentState: Storage hydration + frontmatter property subscriptions
 *    - useFileItemPills: Property search evidence computation (search feature)
 *    - listPaneMeasurements helpers: Shared layout rules with the virtualizer
 */

import React, { useRef, useMemo, useEffect, useState, useCallback, useId } from 'react';
import { TFile, TFolder, setIcon } from 'obsidian';
import { useServices } from '../context/ServicesContext';
import { useMetadataService } from '../context/ServicesContext';
import { useSettingsState } from '../context/SettingsContext';
import type { FolderDecorationModel } from '../utils/folderDecoration';
import { SEARCH_EXCERPT_ROWS, type ListPaneAppearanceSettings } from '../settings/listPaneAppearance';
import { strings } from '../i18n';
import type { SortOption } from '../settings/types';
import { type NavigationItemType } from '../types';
import { runAsyncAction } from '../utils/async';
import { openFileInContext } from '../utils/openFileInContext';
import { FILE_VISIBILITY, getExtensionSuffix, shouldDisplayFile } from '../utils/fileTypeUtils';
import { resolveFolderDecorationColors } from '../utils/folderDecoration';
import { resolveFileDragIconId, resolveFileIconId } from '../utils/fileIconUtils';
import { isInsideNativeTooltipTarget, useTooltip } from '../context/TooltipContext';
import { FileTooltipContent } from './FileTooltipContent';
import { getFoldedSearchHighlightRanges } from '../utils/searchHighlight';
import { getIconService, useIconServiceVersion } from '../services/icons';
import type { AliasSearchMatch, PropertySearchMatch, SearchResultMeta } from '../types/search';
import { mergeRanges, NumericRange } from '../utils/arrayUtils';
import { casefold } from '../utils/recordUtils';
import { openAddTagToFilesModal } from '../utils/tagModalHelpers';
import { resolveUXIcon } from '../utils/uxIcons';
import { getNavigatorPinContext } from '../utils/selectionUtils';
import type { FileNameIconNeedle } from '../utils/fileIconUtils';
import { useFileItemContentState, type FileItemContentDb } from './fileItem/useFileItemContentState';
import { useFileItemPills } from './fileItem/useFileItemPills';
import { renderTextWithHighlightRanges } from './fileItem/searchHighlightRendering';
import { ServiceIcon } from './ServiceIcon';
import { resolveFileRowBackgroundColor } from '../utils/colorUtils';
import type { PropertySearchEvidenceGroup, PropertySearchEvidenceValue } from '../utils/propertyUtils';
import { InlineRenameInput } from './InlineRenameInput';
import { ObsidianIcon } from './ObsidianIcon';

interface FileItemMiddleMouseDownEvent {
    readonly button: number;
    preventDefault: () => void;
}

/**
 * Prepares a file-row middle click without stopping propagation.
 * Returns false for other buttons and leaves the event untouched. Returns true after preventing the
 * browser default so Obsidian's Linux window listener can suppress the corresponding primary-selection paste.
 */
export function prepareFileItemMiddleMouseDown(event: FileItemMiddleMouseDownEvent): boolean {
    if (event.button !== 1) {
        return false;
    }

    event.preventDefault();
    return true;
}

/** Pane-level inputs shared by every file row in a list surface. */
export interface FileItemPaneProps {
    onFileClick: (file: TFile, fileIndex: number | undefined, event: React.MouseEvent) => void;
    selectionType?: NavigationItemType | null;
    sortOption?: SortOption;
    /** Folded name tokens from the active internal filter search for highlighting the file name */
    searchHighlightTerms?: readonly string[];
    /** Icon size for rendering file icons */
    fileIconSize: number;
    appearanceSettings: ListPaneAppearanceSettings;
    fileNameIconNeedles: readonly FileNameIconNeedle[];
    fileItemStorage: FileItemStorageHelpers;
    onToggleNoteShortcut: (file: TFile, shortcutKey: string | undefined) => Promise<void>;
    folderDecorationModel: FolderDecorationModel;
    getSolidBackground: (color?: string | null) => string | undefined;
    disableNativeDrag?: boolean;
}

export interface FileItemInlineRenameHandlers {
    onCommit: (file: TFile, value: string) => Promise<boolean>;
    onCancel: () => void;
    onRestoreFocus: () => void;
}

interface FileItemProps {
    file: TFile;
    paneProps: FileItemPaneProps;
    isSelected: boolean;
    hasSelectedAbove?: boolean;
    hasSelectedBelow?: boolean;
    showQuickActionsPanel: boolean;
    fileIndex?: number;
    groupHeaderLabel?: string | null;
    isPinned?: boolean;
    /** Search metadata from Omnisearch provider */
    searchMeta?: SearchResultMeta;
    /** Aliases that satisfied the active internal filter search */
    matchedAliases?: readonly AliasSearchMatch[];
    /** Positive property clauses satisfied by the active internal filter search */
    matchedProperties?: readonly PropertySearchMatch[];
    /** Whether the file is normally hidden (frontmatter or excluded folder) */
    isHidden?: boolean;
    shortcutKey?: string;
    manualSortDisabled?: boolean;
    inlineRename?: FileItemInlineRenameHandlers;
}

export interface FileItemStorageHelpers {
    getFileDisplayName: (file: TFile) => string;
    getDB: () => FileItemContentDb;
    getFileTimestamps: (file: TFile) => { created: number; modified: number };
}

/**
 * Computes merged highlight ranges for all occurrences of search segments.
 * Overlapping ranges are merged to avoid nested highlights.
 */
function getMergedHighlightRanges(text: string, foldedTerms?: readonly string[], searchMeta?: SearchResultMeta): NumericRange[] {
    if (!text) return [];

    // When Omnisearch metadata is present, highlight strictly from provider tokens.
    // This avoids filter-term fallback highlighting for path/ext-only filters.
    if (searchMeta) {
        const lower = text.toLowerCase();
        const ranges: NumericRange[] = [];
        const seenTokens = new Set<string>();

        const addTokenRanges = (rawToken: string | undefined) => {
            if (!rawToken) return;
            const token = rawToken.toLowerCase();
            if (!token || seenTokens.has(token)) return;
            seenTokens.add(token);

            let idx = lower.indexOf(token);
            while (idx !== -1) {
                ranges.push({ start: idx, end: idx + token.length });
                idx = lower.indexOf(token, idx + token.length);
            }
        };

        searchMeta.matches.forEach(match => addTokenRanges(match.text));
        searchMeta.terms.forEach(term => addTokenRanges(term));

        if (ranges.length === 0) {
            return [];
        }

        return mergeRanges(ranges);
    }

    // Internal filter search passes pre-folded name tokens, so fold-aware range mapping keeps
    // highlights aligned with the source text the same way alias highlighting does.
    if (foldedTerms && foldedTerms.length > 0) {
        return getFoldedSearchHighlightRanges(text, foldedTerms);
    }

    return [];
}

/**
 * Splits text into plain and highlighted parts based on merged ranges.
 */
function renderHighlightedText(text: string, foldedTerms?: readonly string[], searchMeta?: SearchResultMeta): React.ReactNode {
    return renderTextWithHighlightRanges(text, getMergedHighlightRanges(text, foldedTerms, searchMeta));
}

function renderAliasSearchMatch(matchedAlias: AliasSearchMatch): React.ReactNode {
    // Matched aliases are passed only to virtualized search rows, so resolving folded offsets here skips every offscreen result.
    const ranges = getFoldedSearchHighlightRanges(matchedAlias.value, matchedAlias.foldedTerms);
    return renderTextWithHighlightRanges(matchedAlias.value, ranges);
}

function renderPropertySearchEvidenceValue(value: PropertySearchEvidenceValue): React.ReactNode {
    const ranges = getFoldedSearchHighlightRanges(value.displayValue, value.foldedTerms);
    return renderTextWithHighlightRanges(value.displayValue, ranges);
}

function renderPropertySearchEvidenceKey(group: PropertySearchEvidenceGroup): React.ReactNode {
    const ranges = getFoldedSearchHighlightRanges(group.propertyKey, group.foldedKeyTerms);
    return renderTextWithHighlightRanges(group.propertyKey, ranges);
}

/**
 * Memoized FileItem component.
 * Renders an individual file row in the list pane: file name (with optional
 * Omnisearch excerpt line during search) and frontmatter property pills.
 * Handles selection state, quick actions, and drag-and-drop functionality.
 *
 * @param props - The component props
 * @param props.file - The Obsidian TFile to display
 * @param props.isSelected - Whether this file is currently selected
 * @param props.onClick - Handler called when the file is clicked
 * @returns A file row element with title, optional search excerpt, and pills
 */
export const FileItem = React.memo(function FileItem({
    file,
    paneProps,
    isSelected,
    hasSelectedAbove,
    hasSelectedBelow,
    showQuickActionsPanel,
    fileIndex,
    groupHeaderLabel,
    isPinned = false,
    searchMeta,
    matchedAliases,
    matchedProperties,
    isHidden = false,
    shortcutKey,
    manualSortDisabled = false,
    inlineRename
}: FileItemProps) {
    const {
        onFileClick,
        selectionType,
        sortOption,
        searchHighlightTerms,
        fileIconSize,
        appearanceSettings,
        fileNameIconNeedles,
        fileItemStorage,
        onToggleNoteShortcut,
        folderDecorationModel,
        getSolidBackground,
        disableNativeDrag = false
    } = paneProps;
    // === Hooks (all hooks together at the top) ===
    const { app, isMobile, plugin, commandQueue, fileSystemOps, tagOperations } = useServices();
    const settings = useSettingsState();
    const metadataService = useMetadataService();
    const { getFileDisplayName, getDB, getFileTimestamps } = fileItemStorage;
    const isCompactMode = appearanceSettings.mode === 'compact';
    const { properties, metadataVersion } = useFileItemContentState({ file, getDB });

    // === Refs ===
    const fileRef = useRef<HTMLDivElement | null>(null);
    const revealInFolderIconRef = useRef<HTMLDivElement | null>(null);
    const addTagIconRef = useRef<HTMLDivElement | null>(null);
    const addShortcutIconRef = useRef<HTMLDivElement | null>(null);
    const pinNoteIconRef = useRef<HTMLDivElement | null>(null);
    const openInNewTabIconRef = useRef<HTMLDivElement | null>(null);
    const fileIconRef = useRef<HTMLSpanElement | null>(null);
    // Unique ID for linking screen reader description to the file item
    const hiddenDescriptionId = useId();

    // === Derived State & Memoized Values ===

    // Check which quick actions should be shown
    const shouldShowOpenInNewTab = settings.showQuickActions && settings.quickActionOpenInNewTab;
    const shouldShowPinNote = settings.showQuickActions && settings.quickActionPinNote;
    const shouldShowRevealIcon = settings.showQuickActions && settings.quickActionRevealInFolder && file.parent;
    const canAddTagsToFile = file.extension === 'md';
    const shouldShowAddTagAction = settings.showQuickActions && settings.quickActionAddTag && canAddTagsToFile && Boolean(tagOperations);
    const shouldShowShortcutAction = settings.showQuickActions && settings.quickActionAddToShortcuts;
    const hasQuickActions =
        shouldShowOpenInNewTab || shouldShowPinNote || shouldShowRevealIcon || shouldShowAddTagAction || shouldShowShortcutAction;
    const hasShortcut = typeof shortcutKey === 'string';
    const iconServiceVersion = useIconServiceVersion();
    const showFileIcons = settings.showFileIcons;

    // Get display name from RAM cache (handles frontmatter title)
    const displayName = getFileDisplayName(file);

    // Highlight matches in display name when search is active
    const highlightedName = useMemo(
        () => renderHighlightedText(displayName, searchHighlightTerms, searchMeta),
        [displayName, searchHighlightTerms, searchMeta]
    );

    // Decide whether to render an inline extension suffix after the name
    const extensionSuffix = getExtensionSuffix(file);
    const fileIconId = metadataService.getFileIcon(file.path);
    const fileColor = metadataService.getFileColor(file.path);
    const parentFolderSource = file.parent;
    const hasParentFolderSource = parentFolderSource instanceof TFolder;
    const shouldResolveFolderIcon = settings.useFolderIconForFiles && !fileIconId && hasParentFolderSource;
    const shouldResolveFolderColorForFileDecoration =
        !fileColor && hasParentFolderSource && (settings.useFolderColorForTitles || settings.useFolderIconForFiles);
    const shouldResolveFolderColorForTitle =
        !settings.colorIconOnly && settings.useFolderColorForTitles && !fileColor && hasParentFolderSource;
    const shouldResolveFolderColor = shouldResolveFolderColorForFileDecoration || shouldResolveFolderColorForTitle;
    const parentFolderDisplayData =
        hasParentFolderSource && (shouldResolveFolderIcon || shouldResolveFolderColor)
            ? metadataService.getFolderDisplayData(parentFolderSource.path, {
                  includeDisplayName: false,
                  includeColor: shouldResolveFolderColor,
                  includeBackgroundColor: false,
                  includeIcon: shouldResolveFolderIcon,
                  includeInheritedColors: shouldResolveFolderColor
              })
            : null;
    const folderIconId = shouldResolveFolderIcon ? parentFolderDisplayData?.icon : undefined;
    const folderListColor =
        shouldResolveFolderColor && hasParentFolderSource
            ? resolveFolderDecorationColors({
                  model: folderDecorationModel,
                  folderPath: parentFolderSource.path,
                  color: parentFolderDisplayData?.color,
                  backgroundColor: undefined
              }).color
            : undefined;
    const customFileBackgroundColor = metadataService.getFileBackgroundColor(file.path);
    const fileBackgroundColor = resolveFileRowBackgroundColor({
        customBackgroundColor: customFileBackgroundColor,
        getSolidBackground
    });
    const fileExtension = file.extension.toLowerCase();
    // Check if file is not natively supported by Obsidian (e.g., Office files, archives)
    const isExternalFile = !shouldDisplayFile(file, FILE_VISIBILITY.SUPPORTED, app);
    const fileIconColor = fileColor ?? folderListColor;
    const allowCategoryIcons = settings.showCategoryIcons || (settings.colorIconOnly && Boolean(fileIconColor));
    // Determine the actual icon to display, considering custom icon and colorIconOnly setting
    const effectiveFileIconId = useMemo(() => {
        void metadataVersion;

        return resolveFileIconId(
            file,
            {
                showFilenameMatchIcons: settings.showFilenameMatchIcons,
                fileNameIconMap: settings.fileNameIconMap,
                showCategoryIcons: settings.showCategoryIcons,
                fileTypeIconMap: settings.fileTypeIconMap,
                fileTypeIconPreset: settings.fileTypeIconPreset
            },
            {
                customIconId: fileIconId ?? folderIconId,
                metadataCache: app.metadataCache,
                isExternalFile,
                allowCategoryIcons,
                fallbackMode: allowCategoryIcons ? 'file' : 'none',
                fileNameNeedles: fileNameIconNeedles,
                fileNameForMatch: displayName
            }
        );
    }, [
        allowCategoryIcons,
        app.metadataCache,
        displayName,
        fileNameIconNeedles,
        fileIconId,
        folderIconId,
        file,
        isExternalFile,
        metadataVersion,
        settings.fileNameIconMap,
        settings.fileTypeIconPreset,
        settings.fileTypeIconMap,
        settings.showCategoryIcons,
        settings.showFilenameMatchIcons
    ]);
    const fileTitleColor = !settings.colorIconOnly
        ? (fileColor ?? (settings.useFolderColorForTitles ? folderListColor : undefined))
        : undefined;
    const applyColorToName = Boolean(fileTitleColor);
    const dragFallbackIconId = useMemo(() => {
        void metadataVersion;
        return resolveFileDragIconId(
            file,
            settings.fileTypeIconMap,
            app.metadataCache,
            undefined,
            settings.fileTypeIconPreset
        );
    }, [app.metadataCache, file, metadataVersion, settings.fileTypeIconMap, settings.fileTypeIconPreset]);
    // Icon to use when dragging the file
    const dragIconId = effectiveFileIconId || dragFallbackIconId;

    // Determines whether to display the file icon based on icon availability
    const shouldShowFileIcon = showFileIcons && Boolean(effectiveFileIconId);
    const fileIconHasColor = Boolean(fileIconColor);
    const fileIconStyle = fileIconColor ? ({ color: fileIconColor } as React.CSSProperties) : undefined;
    const fileIconClassName = 'nn-file-icon';
    const dragIconColor = fileIconColor ?? undefined;

    const renameInputOptions = useMemo(
        () => (inlineRename ? fileSystemOps.getFileDisplayNameRenameInput(file) : null),
        [file, fileSystemOps, inlineRename]
    );
    const propertySearchEvidenceIconId = resolveUXIcon(settings.interfaceIcons, 'nav-property');
    const { propertySearchEvidenceGroups, propertySearchEvidenceHiddenGroupCount } = useFileItemPills({
        file,
        isCompactMode,
        properties,
        matchedProperties
    });
    const fileTitleElement = (() => {
        if (inlineRename && renameInputOptions) {
            return (
                <div
                    className="nn-file-name nn-file-name--inline-renaming"
                    data-has-color={applyColorToName ? 'true' : 'false'}
                    data-title-rows={appearanceSettings.titleRows}
                    style={
                        {
                            '--filename-rows': appearanceSettings.titleRows,
                            ...(applyColorToName ? { '--nn-file-name-custom-color': fileTitleColor } : {})
                        } as React.CSSProperties
                    }
                >
                    <InlineRenameInput
                        initialValue={renameInputOptions.initialValue}
                        ariaLabel={file.extension === 'md' ? strings.contextMenu.file.renameNote : strings.contextMenu.file.renameFile}
                        onCommit={value => inlineRename.onCommit(file, value)}
                        onCancel={inlineRename.onCancel}
                        onRestoreFocus={inlineRename.onRestoreFocus}
                        inputFilter={renameInputOptions.inputFilter}
                        onInputChange={renameInputOptions.onInputChange}
                        className="nn-file-inline-rename"
                    />
                    {extensionSuffix.length > 0 && <span className="nn-file-ext-suffix">{extensionSuffix}</span>}
                </div>
            );
        }

        return (
            <div
                className="nn-file-name"
                data-has-color={applyColorToName ? 'true' : 'false'}
                data-title-rows={appearanceSettings.titleRows}
                style={
                    {
                        '--filename-rows': appearanceSettings.titleRows,
                        ...(applyColorToName ? { '--nn-file-name-custom-color': fileTitleColor } : {})
                    } as React.CSSProperties
                }
            >
                {/* Keep the label and suffix separate so CSS snippets can lay them out independently. */}
                <span className="nn-file-name-label">
                    {highlightedName}
                    {matchedAliases && matchedAliases.length > 0 ? (
                        <span className="nn-file-alias-match">
                            <ObsidianIcon name="lucide-forward" className="nn-file-alias-match-icon" aria-hidden={true} />
                            <span>
                                {matchedAliases.map((matchedAlias, index) => (
                                    <React.Fragment key={`${matchedAlias.value}-${index}`}>
                                        {index > 0 ? ', ' : null}
                                        {renderAliasSearchMatch(matchedAlias)}
                                    </React.Fragment>
                                ))}
                            </span>
                        </span>
                    ) : null}
                    {propertySearchEvidenceGroups.length > 0 ? (
                        <span className="nn-file-property-search-evidence">
                            <ServiceIcon
                                iconId={propertySearchEvidenceIconId}
                                className="nn-file-property-search-evidence-icon"
                                aria-hidden={true}
                            />
                            {propertySearchEvidenceGroups.map((group, groupIndex) => (
                                <React.Fragment key={casefold(group.propertyKey)}>
                                    {groupIndex > 0 ? '; ' : null}
                                    <span className="nn-file-property-search-evidence-key">{renderPropertySearchEvidenceKey(group)}</span>
                                    {group.values.length > 0 ? ': ' : null}
                                    {group.values.map((value, valueIndex) => (
                                        <React.Fragment key={`${value.displayValue}-${valueIndex}`}>
                                            {valueIndex > 0 ? ', ' : null}
                                            {renderPropertySearchEvidenceValue(value)}
                                        </React.Fragment>
                                    ))}
                                    {group.hiddenValueCount > 0 ? ` +${group.hiddenValueCount}` : null}
                                </React.Fragment>
                            ))}
                            {propertySearchEvidenceHiddenGroupCount > 0 ? `; +${propertySearchEvidenceHiddenGroupCount}` : null}
                        </span>
                    ) : null}
                    {extensionSuffix.length > 0 && <span className="nn-file-ext-suffix">{extensionSuffix}</span>}
                </span>
            </div>
        );
    })();

    // Omnisearch excerpts only: file-display markdown previews were removed.
    const searchExcerpt = typeof searchMeta?.excerpt === 'string' ? searchMeta.excerpt : '';
    const hasSearchExcerptContent = appearanceSettings.showSearchExcerpt === true && searchExcerpt.length > 0;
    const highlightedPreview = useMemo(
        // Only Omnisearch triggers highlighting in the excerpt line, not regular filter
        () => (searchMeta ? renderHighlightedText(searchExcerpt, undefined, searchMeta) : searchExcerpt),
        [searchExcerpt, searchMeta]
    );
    // Pinned rows clamp the excerpt to a single line; search rows use the shared constant.
    const excerptRows = isPinned ? 1 : SEARCH_EXCERPT_ROWS;

    // The excerpt text renders only when this row actually carries an Omnisearch excerpt.
    const shouldShowMultilinePreview = hasSearchExcerptContent;

    const showTooltips = settings.showTooltips;

    const classes = ['nn-file'];
    if (isSelected) classes.push('nn-selected');
    if (isCompactMode) classes.push('nn-compact');
    if (isSelected && hasSelectedAbove) classes.push('nn-has-selected-above');
    if (isSelected && hasSelectedBelow) classes.push('nn-has-selected-below');
    if (fileBackgroundColor) classes.push('nn-has-custom-background');
    // Apply muted style when file is normally hidden but shown via "show hidden items"
    if (isHidden) classes.push('nn-hidden-file');
    if (manualSortDisabled) classes.push('nn-file-manual-sort-disabled');
    const className = classes.join(' ');

    const fileRowStyle = fileBackgroundColor
        ? ({
              '--nn-file-custom-bg-color': fileBackgroundColor
          } as React.CSSProperties)
        : undefined;

    // Screen reader description for files shown via "show hidden items" toggle
    const hiddenDescription = isHidden ? strings.listPane.hiddenItemAriaLabel.replace('{name}', displayName) : undefined;

    // Locals for the mutable TFile fields so the tooltip memo re-runs on rename and on
    // timestamp changes; the TFile identity itself is stable across those mutations.
    const fileName = file.name;
    const fileCreatedTime = file.stat.ctime;
    const fileModifiedTime = file.stat.mtime;

    // Hover tooltip content (desktop only). Null disables the tooltip entirely. The element is
    // recreated when any input changes because the tooltip refreshes on content identity.
    const tooltipContent = useMemo((): React.ReactNode => {
        // The tooltip reads file.name, the stat timestamps, and metadata-derived colors at
        // render time, so those inputs are dependencies even though they are not referenced.
        void metadataVersion;
        void fileName;
        void fileCreatedTime;
        void fileModifiedTime;

        if (isMobile || !showTooltips) {
            return null;
        }

        return (
            <FileTooltipContent
                file={file}
                displayName={displayName}
                extensionSuffix={extensionSuffix}
                settings={{
                    dateFormat: settings.dateFormat,
                    timeFormat: settings.timeFormat,
                    showTooltipPath: settings.showTooltipPath
                }}
                getFileTimestamps={getFileTimestamps}
                sortOption={sortOption}
            />
        );
    }, [
        isMobile,
        file,
        fileCreatedTime,
        fileModifiedTime,
        fileName,
        showTooltips,
        displayName,
        extensionSuffix,
        settings.dateFormat,
        settings.timeFormat,
        settings.showTooltipPath,
        getFileTimestamps,
        sortOption,
        metadataVersion
    ]);

    const tooltip = useTooltip();

    const handleTooltipMouseOver = useCallback(
        (event: React.MouseEvent) => {
            const row = fileRef.current;
            if (!row || tooltipContent === null) {
                return;
            }
            // Descendants with native tooltips (quick actions) own the hover; hiding the row
            // tooltip mirrors how Obsidian shows only the innermost labelled element's tooltip.
            // The mouseover refire when leaving the descendant restores the row tooltip.
            if (isInsideNativeTooltipTarget(row, event.target)) {
                tooltip.hideTooltip(row);
                return;
            }
            tooltip.showTooltip(row, tooltipContent);
        },
        [tooltip, tooltipContent]
    );

    const handleTooltipMouseLeave = useCallback(() => {
        const row = fileRef.current;
        if (row) {
            tooltip.hideTooltip(row);
        }
    }, [tooltip]);

    // Refresh a visible or pending tooltip when lazily loaded content (tags, properties)
    // arrives while the pointer rests on the row.
    useEffect(() => {
        const row = fileRef.current;
        if (!row) {
            return;
        }
        if (tooltipContent === null) {
            tooltip.hideTooltip(row);
            return;
        }
        tooltip.updateTooltip(row, tooltipContent);
    }, [tooltip, tooltipContent]);

    // Hide the tooltip when the row unmounts, otherwise a virtualized scroll can leave a
    // tooltip anchored to a detached element.
    useEffect(() => {
        const row = fileRef.current;
        return () => {
            if (row) {
                tooltip.hideTooltip(row);
            }
        };
    }, [tooltip]);

    // Reveals the file by selecting its folder in navigation pane and showing the file in list pane
    const revealFileInNavigation = () => {
        runAsyncAction(async () => {
            await plugin.activateView();
            await plugin.revealFileInActualFolder(file, { showHiddenFileNotice: true });
        });
    };

    const pinContext = getNavigatorPinContext(selectionType ?? null);
    const isPinnedInCurrentContext = metadataService.isFilePinned(file.path, pinContext);

    // Quick action handlers are used only by local action elements.
    const handleOpenInNewTab = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        runAsyncAction(() => openFileInContext({ app, commandQueue, file, context: 'tab' }));
    };

    // Toggle pin status for the file in the current context
    const handlePinClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        runAsyncAction(async () => {
            if (!file.parent) {
                return;
            }

            await metadataService.togglePin(file.path, pinContext);
        });
    };

    const handleShortcutToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        runAsyncAction(async () => onToggleNoteShortcut(file, shortcutKey));
    };

    // Reveal the file in its actual folder in the navigator
    const handleRevealClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        revealFileInNavigation();
    };

    const handleAddTagClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();

        if (!tagOperations) {
            return;
        }

        openAddTagToFilesModal({
            app,
            plugin,
            tagOperations,
            files: [file]
        });
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        if (!prepareFileItemMiddleMouseDown(e)) {
            return;
        }

        runAsyncAction(() => openFileInContext({ app, commandQueue, file, context: 'tab' }));
    };

    const quickActionItems: { key: string; element: React.ReactNode }[] = [];

    if (showQuickActionsPanel && shouldShowRevealIcon) {
        quickActionItems.push({
            key: 'reveal',
            element: (
                <div
                    ref={revealInFolderIconRef}
                    className="nn-quick-action-item"
                    onClick={handleRevealClick}
                    title={strings.contextMenu.file.revealInFolder}
                />
            )
        });
    }

    if (showQuickActionsPanel && shouldShowAddTagAction) {
        quickActionItems.push({
            key: 'add-tag',
            element: (
                <div
                    ref={addTagIconRef}
                    className="nn-quick-action-item"
                    onClick={handleAddTagClick}
                    title={strings.contextMenu.file.addTag}
                />
            )
        });
    }

    if (showQuickActionsPanel && shouldShowShortcutAction) {
        quickActionItems.push({
            key: 'shortcut',
            element: (
                <div
                    ref={addShortcutIconRef}
                    className="nn-quick-action-item"
                    onClick={handleShortcutToggle}
                    title={hasShortcut ? strings.shortcuts.remove : strings.shortcuts.add}
                />
            )
        });
    }

    if (showQuickActionsPanel && shouldShowPinNote) {
        quickActionItems.push({
            key: 'pin',
            element: (
                <div
                    ref={pinNoteIconRef}
                    className="nn-quick-action-item"
                    onClick={handlePinClick}
                    title={
                        isPinnedInCurrentContext
                            ? file.extension === 'md'
                                ? strings.contextMenu.file.unpinNote
                                : strings.contextMenu.file.unpinFile
                            : file.extension === 'md'
                              ? strings.contextMenu.file.pinNote
                              : strings.contextMenu.file.pinFile
                    }
                />
            )
        });
    }

    if (showQuickActionsPanel && shouldShowOpenInNewTab) {
        quickActionItems.push({
            key: 'new-tab',
            element: (
                <div
                    ref={openInNewTabIconRef}
                    className="nn-quick-action-item"
                    onClick={handleOpenInNewTab}
                    title={strings.contextMenu.file.openInNewTab}
                />
            )
        });
    }

    // === Effects ===

    // Renders the file icon in the DOM using the icon service
    useEffect(() => {
        const iconContainer = fileIconRef.current;
        if (!iconContainer) {
            return;
        }

        iconContainer.innerHTML = '';
        if (!shouldShowFileIcon) {
            return;
        }

        const iconId = effectiveFileIconId;
        if (!iconId) {
            return;
        }
        const iconService = getIconService();
        iconService.renderIcon(iconContainer, iconId, fileIconSize);
    }, [effectiveFileIconId, iconServiceVersion, shouldShowFileIcon, isCompactMode, fileIconSize]);

    // Set up quick action icons after their elements mount.
    useEffect(() => {
        if (isMobile || !showQuickActionsPanel) {
            return;
        }

        if (revealInFolderIconRef.current && shouldShowRevealIcon) {
            setIcon(revealInFolderIconRef.current, 'lucide-folder-search');
        }
        if (addTagIconRef.current && shouldShowAddTagAction) {
            setIcon(addTagIconRef.current, 'lucide-tag');
        }
        if (addShortcutIconRef.current && shouldShowShortcutAction) {
            setIcon(addShortcutIconRef.current, hasShortcut ? 'lucide-star-off' : 'lucide-star');
        }
        if (pinNoteIconRef.current && shouldShowPinNote) {
            setIcon(pinNoteIconRef.current, isPinnedInCurrentContext ? 'lucide-pin-off' : 'lucide-pin');
        }
        if (openInNewTabIconRef.current && shouldShowOpenInNewTab) {
            setIcon(openInNewTabIconRef.current, 'lucide-file-plus');
        }
    }, [
        isMobile,
        shouldShowOpenInNewTab,
        shouldShowPinNote,
        shouldShowRevealIcon,
        shouldShowAddTagAction,
        shouldShowShortcutAction,
        showQuickActionsPanel,
        hasShortcut,
        isPinnedInCurrentContext
    ]);

    // Wrap onFileClick to pass file and fileIndex
    const handleItemClick = useCallback(
        (event: React.MouseEvent) => {
            onFileClick(file, fileIndex, event);
        },
        [file, fileIndex, onFileClick]
    );

    return (
        <div
            ref={fileRef}
            className={className}
            data-path={file.path}
            // Path to use when this file is dragged
            data-drag-path={file.path}
            // Type of item being dragged (folder, file, or tag)
            data-drag-type="file"
            // Marks element as draggable for event delegation
            data-draggable={!isMobile && !disableNativeDrag ? 'true' : undefined}
            // Icon to display in drag preview
            data-drag-icon={dragIconId}
            // Default icon displayed if the custom drag preview icon is unavailable
            data-drag-fallback-icon={dragFallbackIconId}
            // Icon color to display in drag preview
            data-drag-icon-color={dragIconColor}
            onClick={handleItemClick}
            onMouseDown={handleMouseDown}
            onMouseOver={tooltipContent !== null ? handleTooltipMouseOver : undefined}
            onMouseLeave={tooltipContent !== null ? handleTooltipMouseLeave : undefined}
            draggable={!isMobile && !disableNativeDrag}
            role="listitem"
            aria-describedby={hiddenDescription ? hiddenDescriptionId : undefined}
            style={fileRowStyle}
        >
            <div className="nn-file-content">
                {/* Quick actions mount only for the row currently tracked by the list pane hover state. */}
                {!isMobile && hasQuickActions && showQuickActionsPanel && (
                    <div
                        className={`nn-quick-actions-panel ${isCompactMode ? 'nn-compact-mode' : ''}`}
                        data-title-rows={appearanceSettings.titleRows}
                    >
                        {quickActionItems.map((action, index) => (
                            <React.Fragment key={action.key}>
                                {index > 0 && <div className="nn-quick-action-separator" />}
                                {action.element}
                            </React.Fragment>
                        ))}
                    </div>
                )}
                <div className="nn-file-inner-content">
                    {showFileIcons ? (
                        <div className="nn-file-icon-slot">
                            {shouldShowFileIcon ? (
                                <span
                                    ref={fileIconRef}
                                    className={fileIconClassName}
                                    data-has-color={fileIconHasColor ? 'true' : 'false'}
                                    style={fileIconStyle}
                                />
                            ) : null}
                        </div>
                    ) : null}
                    {isCompactMode ? (
                        // ========== COMPACT MODE ==========
                        // Minimal layout: file name only
                        // Used when the current list appearance mode is compact
                        <div className="nn-compact-file-text-content">
                            <div className="nn-compact-file-header">{fileTitleElement}</div>
                        </div>
                    ) : (
                        // ========== NORMAL MODE ==========
                        // Full layout with all enabled elements
                        <>
                            <div className="nn-file-text-content">
                                {fileTitleElement}

                                {/* Search excerpt line (pinned rows clamp it to a single row). */}
                                {shouldShowMultilinePreview && (
                                    <div
                                        className="nn-file-preview"
                                        style={{ '--preview-rows': excerptRows } as React.CSSProperties}
                                    >
                                        {highlightedPreview}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
            {/* Screen reader announcement for hidden files */}
            {hiddenDescription ? (
                <span id={hiddenDescriptionId} className="nn-visually-hidden">
                    {hiddenDescription}
                </span>
            ) : null}
        </div>
    );
});
