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

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Menu, TFolder, type App, type TFile } from 'obsidian';
import type { PropertyTreeService } from '../services/PropertyTreeService';

import { useSelectionState, useSelectionDispatch } from '../context/SelectionContext';
import { useServices, useFileSystemOps, useMetadataService } from '../context/ServicesContext';
import { useSettingsState, useSettingsUpdate } from '../context/SettingsContext';
import { useUXPreferenceActions, useUXPreferences } from '../context/UXPreferencesContext';
import { strings } from '../i18n';
import { createPropertyGroupingOption, getPropertyGroupingKey, getPropertyGroupingOrder } from '../settings/types';
import type { ListNoteGroupingOption, ListSortOverrideValue, NotebookNavigatorSettings, PropertyGroupingOrder } from '../settings/types';
import { ItemType, PROPERTIES_ROOT_VIRTUAL_FOLDER_ID, TAGGED_TAG_ID, UNTAGGED_TAG_ID } from '../types';
import {
    areListSortOverridesEqual,
    buildSortOption,
    cloneListSortOverride,
    createListSortOverride,
    getAvailablePropertySortKeys,
    getListSortFieldIconId,
    getListSortToolbarIconId,
    getListSortOverrideForSelection,
    getSortDirection,
    getSortDirectionForFieldChange,
    getSortField,
    getSortIcon as getSortIconName,
    isDateSortOption,
    resolveListSort,
    resolveListSortOverrideForDefault,
    type SortDirection,
    type SortField
} from '../utils/sortUtils';
import { getStoredListPaneAppearanceFields, mergeListPaneAppearanceAndGrouping } from '../settings/listPaneAppearance';
import { getFilesForFolder } from '../utils/fileFinder';
import { runAsyncAction } from '../utils/async';
import { FILE_VISIBILITY } from '../utils/fileTypeUtils';
import { ConfirmModal } from '../modals/ConfirmModal';
import { resolveIconForMenu, resolveUXIcon, resolveUXIconForMenu } from '../utils/uxIcons';
import { doesFolderContainPath } from '../utils/pathUtils';
import { buildPropertyKeyNodeId, parsePropertyNodeId } from '../utils/propertyTree';
import { getFilesForNavigationSelection } from '../utils/selectionUtils';
import { findVaultProfileById } from '../utils/vaultProfiles';
import { casefold, ensureRecord, sanitizeRecord } from '../utils/recordUtils';
import {
    areListGroupingOptionsEqual,
    areListGroupingOptionsSameKind,
    getAvailablePropertyGroupKeys,
    resolveEffectiveListGroupingForSort,
    resolveListGrouping,
    resolveListGroupingOverrideForDefault
} from '../utils/listGrouping';
import { registerActiveFileWorkspaceListeners } from '../utils/workspaceActiveFileEvents';

type SelectionSortTarget =
    | { type: typeof ItemType.FOLDER; key: string }
    | { type: typeof ItemType.TAG; key: string }
    | { type: typeof ItemType.PROPERTY; key: string };

type DescendantApplyStats = {
    descendantCount: number;
    savedDescendantCount: number;
    matchingSavedDescendantCount: number;
    changedSavedDescendantCount: number;
    missingSavedDescendantCount: number;
    affectedCount: number;
    disabled: boolean;
};

function buildDescendantApplyStats(params: {
    descendantCount: number;
    descendantEntries: readonly (readonly [string, unknown])[];
    hasCurrentOverride: boolean;
    matchesCurrentOverride: (entry: readonly [string, unknown]) => boolean;
}): DescendantApplyStats {
    const savedDescendantCount = params.descendantEntries.length;
    const matchingSavedDescendantCount = params.hasCurrentOverride
        ? params.descendantEntries.filter(entry => params.matchesCurrentOverride(entry)).length
        : 0;
    const changedSavedDescendantCount = savedDescendantCount - matchingSavedDescendantCount;
    const missingSavedDescendantCount = params.hasCurrentOverride
        ? Math.max(params.descendantCount - savedDescendantCount, 0)
        : 0;
    const affectedCount = changedSavedDescendantCount + missingSavedDescendantCount;
    return {
        descendantCount: params.descendantCount,
        savedDescendantCount,
        matchingSavedDescendantCount,
        changedSavedDescendantCount,
        missingSavedDescendantCount,
        affectedCount,
        disabled: params.descendantCount === 0 || affectedCount === 0
    };
}

function samePropertySortKey(left: string | undefined, right: string | undefined): boolean {
    if (left === undefined || right === undefined) {
        return left === right;
    }
    return casefold(left) === casefold(right);
}

function isFolderDescendantSettingKey(folderPath: string, candidateKey: string): boolean {
    return doesFolderContainPath(folderPath, candidateKey);
}

function isTagDescendantSettingKey(tagPath: string, candidateKey: string): boolean {
    return candidateKey === tagPath || candidateKey.startsWith(`${tagPath}/`);
}

function isPropertyDescendantSettingKey(nodeId: string, candidateKey: string): boolean {
    return candidateKey === nodeId || candidateKey.startsWith(`${nodeId}/`);
}

function collectFolderDescendantPaths(folder: TFolder): string[] {
    const descendants: string[] = [];
    const visit = (current: TFolder): void => {
        for (const child of current.children ?? []) {
            if (child instanceof TFolder) {
                descendants.push(child.path);
                visit(child);
            }
        }
    };
    visit(folder);
    return descendants;
}

function countFolderDescendants(folder: TFolder): number {
    return collectFolderDescendantPaths(folder).length;
}

function collectAllPropertyNodeIds(propertyTreeService: PropertyTreeService): string[] {
    const ids: string[] = [];
    for (const keyNode of propertyTreeService.getPropertyTree().values()) {
        ids.push(keyNode.id);
        for (const id of propertyTreeService.collectDescendantNodeIds(keyNode.id)) {
            ids.push(id);
        }
    }
    return ids;
}

function isPropertyRootSelection(selectedProperty: string | null | undefined): boolean {
    return selectedProperty === PROPERTIES_ROOT_VIRTUAL_FOLDER_ID;
}

interface UseListActionsOptions {
    trackRevealFileAvailability?: boolean;
}

const BIDI_ISOLATE_START = '\u2068'; // First Strong Isolate
const BIDI_ISOLATE_END = '\u2069'; // Pop Directional Isolate

function isolateBidiText(value: string): string {
    // Keeps user-authored LTR property keys from reordering quotes and punctuation inside RTL labels.
    return `${BIDI_ISOLATE_START}${value}${BIDI_ISOLATE_END}`;
}

function getGroupingIcon(option: ListNoteGroupingOption): string {
    if (option === 'none') {
        return 'lucide-x';
    }
    if (option === 'date') {
        return 'lucide-calendar';
    }
    if (option === 'folder') {
        return 'lucide-folder';
    }
    return 'lucide-heading';
}

export function useListActions({
    trackRevealFileAvailability = false
}: UseListActionsOptions = {}) {
    const { app, plugin, tagTreeService, propertyTreeService } = useServices();
    const settings = useSettingsState();
    const vaultProfileId = settings.vaultProfile;
    const vaultProfiles = settings.vaultProfiles;
    const uxPreferences = useUXPreferences();
    const includeDescendantNotes = uxPreferences.includeDescendantNotes;
    const showHiddenItems = uxPreferences.showHiddenItems;
    const { setIncludeDescendantNotes } = useUXPreferenceActions();
    const updateSettings = useSettingsUpdate();
    const selectionState = useSelectionState();
    const selectionDispatch = useSelectionDispatch();
    const fileSystemOps = useFileSystemOps();
    const metadataService = useMetadataService();
    const hasFolderSelection = selectionState.selectionType === ItemType.FOLDER && Boolean(selectionState.selectedFolder);
    const hasTagSelection = selectionState.selectionType === ItemType.TAG && Boolean(selectionState.selectedTag);
    const hasCreatableTagSelection =
        hasTagSelection && selectionState.selectedTag !== TAGGED_TAG_ID && selectionState.selectedTag !== UNTAGGED_TAG_ID;
    const hasPropertySelection = selectionState.selectionType === ItemType.PROPERTY && Boolean(selectionState.selectedProperty);
    const hasCreatablePropertySelection = hasPropertySelection && selectionState.selectedProperty !== PROPERTIES_ROOT_VIRTUAL_FOLDER_ID;
    const hasAppearanceOrSortSelection = hasFolderSelection || hasTagSelection || hasPropertySelection;

    const openDefaultListSettings = useCallback(() => {
        plugin.openSettings();
    }, [plugin]);

    const canCreateNewFile = Boolean(selectionState.selectedFolder) || hasCreatableTagSelection || hasCreatablePropertySelection;
    const getRevealableActiveFile = useCallback((): TFile | null => {
        const activeFile = app.workspace.getActiveFile();
        return activeFile?.parent ? activeFile : null;
    }, [app.workspace]);
    const [canRevealFile, setCanRevealFile] = useState(() => (trackRevealFileAvailability ? Boolean(getRevealableActiveFile()) : false));

    const getSelectionSortTarget = useCallback((): SelectionSortTarget | null => {
        if (selectionState.selectionType === ItemType.FOLDER && selectionState.selectedFolder) {
            return { type: ItemType.FOLDER, key: selectionState.selectedFolder.path };
        }
        if (selectionState.selectionType === ItemType.TAG && selectionState.selectedTag) {
            return { type: ItemType.TAG, key: selectionState.selectedTag };
        }
        if (selectionState.selectionType === ItemType.PROPERTY && selectionState.selectedProperty) {
            return { type: ItemType.PROPERTY, key: selectionState.selectedProperty };
        }
        return null;
    }, [selectionState.selectionType, selectionState.selectedFolder, selectionState.selectedTag, selectionState.selectedProperty]);

    const handleNewFile = useCallback(async () => {
        try {
            if (selectionState.selectedFolder) {
                await fileSystemOps.createNewFile(selectionState.selectedFolder, settings.createNewNotesInNewTab);
                return;
            }

            if (hasCreatableTagSelection && selectionState.selectedTag) {
                const sourcePath = selectionState.selectedFile?.path ?? app.workspace.getActiveFile()?.path ?? '';
                await fileSystemOps.createNewFileForTag(
                    selectionState.selectedTag,
                    sourcePath,
                    settings.createNewNotesInNewTab
                );
                return;
            }

            if (hasCreatablePropertySelection && selectionState.selectedProperty) {
                const sourcePath = selectionState.selectedFile?.path ?? app.workspace.getActiveFile()?.path ?? '';
                await fileSystemOps.createNewFileForProperty(
                    selectionState.selectedProperty,
                    sourcePath,
                    settings.createNewNotesInNewTab
                );
            }
        } catch {
            // Error is handled by FileSystemOperations with user notification
        }
    }, [
        selectionState.selectedFolder,
        selectionState.selectedTag,
        selectionState.selectedProperty,
        selectionState.selectedFile,
        hasCreatableTagSelection,
        hasCreatablePropertySelection,
        settings.createNewNotesInNewTab,
        fileSystemOps,
        app
    ]);

    const handleRevealFile = useCallback(async () => {
        const activeFile = getRevealableActiveFile();
        if (!activeFile) {
            return;
        }

        await plugin.revealFileInActualFolder(activeFile, { showHiddenFileNotice: true });
    }, [getRevealableActiveFile, plugin]);

    const getSelectionSortOverride = useCallback((): ListSortOverrideValue | undefined => {
        return getListSortOverrideForSelection(
            settings,
            selectionState.selectionType,
            selectionState.selectedFolder,
            selectionState.selectedTag,
            selectionState.selectedProperty
        );
    }, [
        selectionState.selectionType,
        selectionState.selectedFolder,
        selectionState.selectedTag,
        selectionState.selectedProperty,
        settings
    ]);

    const getSelectionDescendantKeys = useCallback((): string[] => {
        // Bulk apply should use the live tree when the user confirms the action so
        // descendants without stored settings still receive the propagated override.
        if (selectionState.selectionType === ItemType.FOLDER && selectionState.selectedFolder) {
            return collectFolderDescendantPaths(selectionState.selectedFolder);
        }

        if (selectionState.selectionType === ItemType.TAG && selectionState.selectedTag) {
            if (selectionState.selectedTag === TAGGED_TAG_ID) {
                return Array.from(tagTreeService?.getAllTagPaths() ?? []);
            }
            return Array.from(tagTreeService?.collectDescendantTagPaths(selectionState.selectedTag) ?? []);
        }

        if (selectionState.selectionType === ItemType.PROPERTY && selectionState.selectedProperty && propertyTreeService) {
            if (selectionState.selectedProperty === PROPERTIES_ROOT_VIRTUAL_FOLDER_ID) {
                return collectAllPropertyNodeIds(propertyTreeService);
            }
            return Array.from(propertyTreeService.collectDescendantNodeIds(selectionState.selectedProperty));
        }

        return [];
    }, [
        propertyTreeService,
        selectionState.selectionType,
        selectionState.selectedFolder,
        selectionState.selectedTag,
        selectionState.selectedProperty,
        tagTreeService
    ]);

    const isSelectionDescendantSettingKey = useCallback(
        (candidateKey: string): boolean => {
            if (selectionState.selectionType === ItemType.FOLDER && selectionState.selectedFolder) {
                return isFolderDescendantSettingKey(selectionState.selectedFolder.path, candidateKey);
            }

            if (selectionState.selectionType === ItemType.TAG && selectionState.selectedTag) {
                return isTagDescendantSettingKey(selectionState.selectedTag, candidateKey);
            }

            if (selectionState.selectionType === ItemType.PROPERTY && selectionState.selectedProperty) {
                return isPropertyDescendantSettingKey(selectionState.selectedProperty, candidateKey);
            }

            return false;
        },
        [selectionState.selectionType, selectionState.selectedFolder, selectionState.selectedTag, selectionState.selectedProperty]
    );

    const getSelectionDescendantLabel = useCallback((): string => {
        if (selectionState.selectionType === ItemType.FOLDER) {
            return strings.paneHeader.subfolders;
        }
        if (selectionState.selectionType === ItemType.TAG) {
            return strings.paneHeader.subtags;
        }
        if (selectionState.selectionType === ItemType.PROPERTY) {
            if (selectionState.selectedProperty === PROPERTIES_ROOT_VIRTUAL_FOLDER_ID) {
                return strings.paneHeader.descendants;
            }
            return strings.paneHeader.childValues;
        }
        return strings.paneHeader.descendants;
    }, [selectionState.selectedProperty, selectionState.selectionType]);

    const selectionSortTarget = useMemo(() => getSelectionSortTarget(), [getSelectionSortTarget]);
    const selectionSortOverride = useMemo(() => getSelectionSortOverride(), [getSelectionSortOverride]);
    const selectionSortSpec = useMemo(() => resolveListSort(settings, selectionSortOverride), [settings, selectionSortOverride]);
    const resolvePropertySortIcon = useCallback(
        (propertyKey: string): string | null => {
            const normalizedPropertyKey = casefold(propertyKey);
            if (!normalizedPropertyKey) {
                return null;
            }

            return metadataService.getPropertyIcon(buildPropertyKeyNodeId(normalizedPropertyKey)) ?? null;
        },
        [metadataService]
    );
    const getSortIcon = useCallback(() => {
        const sortIconId = getListSortToolbarIconId(settings, selectionSortOverride);
        if (sortIconId === 'list-sort-property') {
            const propertyIcon = resolvePropertySortIcon(selectionSortSpec.propertyKey);
            if (propertyIcon) {
                return propertyIcon;
            }
        }

        return resolveUXIcon(settings.interfaceIcons, sortIconId);
    }, [resolvePropertySortIcon, selectionSortOverride, selectionSortSpec.propertyKey, settings]);
    const groupingInfo = useMemo(
        () =>
            resolveListGrouping({
                settings,
                selectionType: selectionState.selectionType,
                folderPath: selectionState.selectedFolder ? selectionState.selectedFolder.path : null,
                tag: selectionState.selectedTag ?? null,
                propertyNodeId: selectionState.selectedProperty ?? null
            }),
        [settings, selectionState.selectedFolder, selectionState.selectedProperty, selectionState.selectedTag, selectionState.selectionType]
    );
    const selectionGroupOverride = groupingInfo.normalizedOverride;
    const hasSelectionGroupOverride = groupingInfo.hasCustomOverride;
    const effectiveSelectionGroupOverride = selectionGroupOverride === undefined
        ? undefined
        : resolveEffectiveListGroupingForSort({
              groupBy: selectionGroupOverride,
              sortOption: selectionSortSpec.option,
              selectionType: selectionState.selectionType
          });
    const selectionDescendantLabel = useMemo(() => getSelectionDescendantLabel(), [getSelectionDescendantLabel]);
    const [folderTreeVersion, setFolderTreeVersion] = useState(0);
    const [tagTreeVersion, setTagTreeVersion] = useState(0);
    const [propertyTreeVersion, setPropertyTreeVersion] = useState(0);

    useEffect(() => {
        const bumpFolderTreeVersion = (file: unknown) => {
            if (file instanceof TFolder) {
                setFolderTreeVersion(current => current + 1);
            }
        };

        const createRef = app.vault.on('create', bumpFolderTreeVersion);
        const deleteRef = app.vault.on('delete', bumpFolderTreeVersion);
        const renameRef = app.vault.on('rename', file => {
            bumpFolderTreeVersion(file);
        });

        return () => {
            app.vault.offref(createRef);
            app.vault.offref(deleteRef);
            app.vault.offref(renameRef);
        };
    }, [app.vault]);

    useEffect(() => {
        if (!tagTreeService) {
            return;
        }

        return tagTreeService.addTreeUpdateListener(() => {
            setTagTreeVersion(current => current + 1);
        });
    }, [tagTreeService]);

    useEffect(() => {
        if (!propertyTreeService) {
            return;
        }

        return propertyTreeService.addTreeUpdateListener(() => {
            setPropertyTreeVersion(current => current + 1);
        });
    }, [propertyTreeService]);

    useEffect(() => {
        if (!trackRevealFileAvailability) {
            setCanRevealFile(false);
            return;
        }

        const updateCanRevealFile = () => {
            setCanRevealFile(Boolean(getRevealableActiveFile()));
        };

        updateCanRevealFile();

        return registerActiveFileWorkspaceListeners({
            workspace: app.workspace,
            onChange: updateCanRevealFile
        });
    }, [app.workspace, getRevealableActiveFile, trackRevealFileAvailability]);

    // The descendant action follows a strict two-phase contract.
    // Phase 1 is menu construction: decide enabled/disabled from descendantCount plus
    // the saved settings record only. The menu must be disabled only when clicking it
    // would be a guaranteed no-op:
    // - there are no descendants
    // - the selected node is default and there are no saved descendant overrides
    // - the selected node has a saved override and every descendant already has that
    //   same saved override
    // Phase 2 uses the live tree to write or clear settings for every real descendant.
    // Sort and group confirms only when existing overrides change. Appearance always
    // confirms because creating new overrides can visibly change many descendants.
    const selectionDescendantCount = useMemo(() => {
        // These version counters exist only to invalidate the cached descendantCount
        // when folder/tag/property tree structure changes without changing the current selection id.
        void folderTreeVersion;
        void tagTreeVersion;
        void propertyTreeVersion;

        if (selectionState.selectionType === ItemType.FOLDER && selectionState.selectedFolder) {
            return countFolderDescendants(selectionState.selectedFolder);
        }

        if (selectionState.selectionType === ItemType.TAG && selectionState.selectedTag) {
            if (selectionState.selectedTag === TAGGED_TAG_ID) {
                return tagTreeService?.getAllTagPaths().length ?? 0;
            }

            return tagTreeService?.collectDescendantTagPaths(selectionState.selectedTag).size ?? 0;
        }

        if (selectionState.selectionType === ItemType.PROPERTY && selectionState.selectedProperty && propertyTreeService) {
            if (selectionState.selectedProperty === PROPERTIES_ROOT_VIRTUAL_FOLDER_ID) {
                return collectAllPropertyNodeIds(propertyTreeService).length;
            }

            return propertyTreeService.collectDescendantNodeIds(selectionState.selectedProperty).size;
        }

        return 0;
    }, [
        folderTreeVersion,
        propertyTreeService,
        propertyTreeVersion,
        selectionState.selectedFolder,
        selectionState.selectedProperty,
        selectionState.selectedTag,
        selectionState.selectionType,
        tagTreeService,
        tagTreeVersion
    ]);
    // Keep the action available for selections that conceptually own descendants.
    // The actual disabled state is derived later from descendantCount plus saved settings.
    const canApplyToDescendants =
        hasFolderSelection || (hasTagSelection && selectionState.selectedTag !== UNTAGGED_TAG_ID) || hasPropertySelection;

    const removeSelectionSortOverride = useCallback(async () => {
        const target = getSelectionSortTarget();
        if (!target) {
            return;
        }
        if (target.type === ItemType.FOLDER) {
            await metadataService.removeFolderSortOverride(target.key);
            return;
        }
        if (target.type === ItemType.TAG) {
            await metadataService.removeTagSortOverride(target.key);
            return;
        }
        await metadataService.removePropertySortOverride(target.key);
    }, [getSelectionSortTarget, metadataService]);

    const setSelectionSortOverride = useCallback(
        async (sortOverride: ListSortOverrideValue) => {
            const target = getSelectionSortTarget();
            if (!target) {
                return;
            }
            if (target.type === ItemType.FOLDER) {
                await metadataService.setFolderSortOverride(target.key, sortOverride);
                return;
            }
            if (target.type === ItemType.TAG) {
                await metadataService.setTagSortOverride(target.key, sortOverride);
                return;
            }
            await metadataService.setPropertySortOverride(target.key, sortOverride);
        },
        [getSelectionSortTarget, metadataService]
    );

    const setSelectionGroupOverride = useCallback(
        async (groupBy: ListNoteGroupingOption | undefined) => {
            const target = getSelectionSortTarget();
            if (!target) {
                return;
            }

            await updateSettings(current => {
                const next =
                    target.type === ItemType.FOLDER
                        ? sanitizeRecord(ensureRecord(current.folderAppearances))
                        : target.type === ItemType.TAG
                          ? sanitizeRecord(ensureRecord(current.tagAppearances))
                          : sanitizeRecord(ensureRecord(current.propertyAppearances));
                const normalizedAppearance = mergeListPaneAppearanceAndGrouping(getStoredListPaneAppearanceFields(), groupBy);

                if (normalizedAppearance) {
                    next[target.key] = normalizedAppearance;
                } else {
                    delete next[target.key];
                }

                if (target.type === ItemType.FOLDER) {
                    current.folderAppearances = next;
                    return;
                }
                if (target.type === ItemType.TAG) {
                    current.tagAppearances = next;
                    return;
                }
                current.propertyAppearances = next;
            });
        },
        [getSelectionSortTarget, updateSettings]
    );

    const getDescendantSortAndGroupChangeStats = useCallback((): DescendantApplyStats => {
        const target = selectionSortTarget;
        if (!target) {
            return buildDescendantApplyStats({
                descendantCount: 0,
                descendantEntries: [],
                hasCurrentOverride: false,
                matchesCurrentOverride: () => false
            });
        }

        const sortOverrides =
            target.type === ItemType.FOLDER
                ? settings.folderSortOverrides
                : target.type === ItemType.TAG
                  ? settings.tagSortOverrides
                  : settings.propertySortOverrides;
        const appearances =
            target.type === ItemType.FOLDER
                ? settings.folderAppearances
                : target.type === ItemType.TAG
                  ? settings.tagAppearances
                  : settings.propertyAppearances;

        const sortEntries = Object.entries(sortOverrides ?? {}).filter(([key]) => isSelectionDescendantSettingKey(key));
        const groupEntries = Object.entries(appearances ?? {}).filter(
            ([key, descendantAppearance]) => isSelectionDescendantSettingKey(key) && descendantAppearance.groupBy !== undefined
        );
        const sortByKey = new Map(sortEntries);
        const groupByKey = new Map(groupEntries.map(([key, appearance]) => [key, appearance.groupBy]));
        const savedKeys = new Set([...sortByKey.keys(), ...groupByKey.keys()]);
        // One descendant can have both sort and group changes; confirmation counts each key once.
        const changedSavedKeys = new Set<string>();
        const missingRequiredKeys = new Set<string>();
        const matchingSavedKeys = new Set<string>();
        const hasCurrentSortOverride = selectionSortOverride !== undefined;
        const hasCurrentGroupOverride = effectiveSelectionGroupOverride !== undefined;

        savedKeys.forEach(key => {
            let changed = false;
            let missingRequired = false;

            if (hasCurrentSortOverride) {
                if (!sortByKey.has(key)) {
                    missingRequired = true;
                } else if (!areListSortOverridesEqual(sortByKey.get(key), selectionSortOverride)) {
                    changed = true;
                }
            } else if (sortByKey.has(key)) {
                changed = true;
            }

            if (effectiveSelectionGroupOverride !== undefined) {
                const savedGroupBy = groupByKey.get(key);
                if (savedGroupBy === undefined) {
                    missingRequired = true;
                } else if (!areListGroupingOptionsEqual(savedGroupBy, effectiveSelectionGroupOverride)) {
                    changed = true;
                }
            } else if (groupByKey.has(key)) {
                changed = true;
            }

            if (changed) {
                changedSavedKeys.add(key);
            }
            if (missingRequired) {
                missingRequiredKeys.add(key);
            }
            if (!changed && !missingRequired) {
                matchingSavedKeys.add(key);
            }
        });

        const missingUnsavedDescendantCount =
            hasCurrentSortOverride || hasCurrentGroupOverride ? Math.max(selectionDescendantCount - savedKeys.size, 0) : 0;
        const missingSavedDescendantCount = missingRequiredKeys.size + missingUnsavedDescendantCount;
        const affectedSavedKeys = new Set([...changedSavedKeys, ...missingRequiredKeys]);
        const affectedCount = affectedSavedKeys.size + missingUnsavedDescendantCount;

        return {
            descendantCount: selectionDescendantCount,
            savedDescendantCount: savedKeys.size,
            matchingSavedDescendantCount: matchingSavedKeys.size,
            changedSavedDescendantCount: changedSavedKeys.size,
            missingSavedDescendantCount,
            affectedCount,
            disabled: selectionDescendantCount === 0 || affectedCount === 0
        };
    }, [
        isSelectionDescendantSettingKey,
        selectionDescendantCount,
        effectiveSelectionGroupOverride,
        selectionSortOverride,
        selectionSortTarget,
        settings.folderAppearances,
        settings.folderSortOverrides,
        settings.propertyAppearances,
        settings.propertySortOverrides,
        settings.tagAppearances,
        settings.tagSortOverrides
    ]);

    const applySortAndGroupToDescendants = useCallback(async () => {
        const target = selectionSortTarget;
        if (!target) {
            return;
        }

        const selectionDescendantKeys = getSelectionDescendantKeys();
        if (selectionDescendantKeys.length === 0) {
            return;
        }

        await updateSettings(current => {
            const sortOverrides =
                target.type === ItemType.FOLDER
                    ? sanitizeRecord(ensureRecord(current.folderSortOverrides))
                    : target.type === ItemType.TAG
                      ? sanitizeRecord(ensureRecord(current.tagSortOverrides))
                      : sanitizeRecord(ensureRecord(current.propertySortOverrides));
            selectionDescendantKeys.forEach(key => {
                if (selectionSortOverride !== undefined) {
                    sortOverrides[key] = cloneListSortOverride(selectionSortOverride);
                    return;
                }
                delete sortOverrides[key];
            });

            if (target.type === ItemType.FOLDER) {
                current.folderSortOverrides = sortOverrides;
            } else if (target.type === ItemType.TAG) {
                current.tagSortOverrides = sortOverrides;
            } else {
                current.propertySortOverrides = sortOverrides;
            }

            const appearances =
                target.type === ItemType.FOLDER
                    ? sanitizeRecord(ensureRecord(current.folderAppearances))
                    : target.type === ItemType.TAG
                      ? sanitizeRecord(ensureRecord(current.tagAppearances))
                      : sanitizeRecord(ensureRecord(current.propertyAppearances));
            selectionDescendantKeys.forEach(key => {
                const normalizedAppearance = mergeListPaneAppearanceAndGrouping(
                    getStoredListPaneAppearanceFields(),
                    effectiveSelectionGroupOverride
                );
                if (normalizedAppearance) {
                    appearances[key] = normalizedAppearance;
                    return;
                }
                delete appearances[key];
            });

            if (target.type === ItemType.FOLDER) {
                current.folderAppearances = appearances;
                return;
            }
            if (target.type === ItemType.TAG) {
                current.tagAppearances = appearances;
                return;
            }
            current.propertyAppearances = appearances;
        });
        app.workspace.requestSaveLayout();
    }, [app, effectiveSelectionGroupOverride, getSelectionDescendantKeys, selectionSortOverride, selectionSortTarget, updateSettings]);

    const promptApplySortAndGroupToDescendants = useCallback(() => {
        const target = selectionSortTarget;
        if (!target) {
            return;
        }

        // Keep the prompt path on the same fast path as the menu: cached descendantCount
        // plus saved settings only. The only live tree walk happens inside applySortAndGroupToDescendants.
        const stats = getDescendantSortAndGroupChangeStats();

        if (stats.disabled) {
            return;
        }

        if (stats.changedSavedDescendantCount === 0) {
            // Only new descendant overrides will be created here. There is nothing to
            // overwrite or delete, so skip the confirmation modal and apply directly.
            runAsyncAction(async () => {
                await applySortAndGroupToDescendants();
            });
            return;
        }

        const title = strings.modals.bulkApply.applySortAndGroupTitle(selectionDescendantLabel);
        // The modal count reports only existing descendant overrides that will be
        // deleted or overwritten. Missing descendants that receive new overrides
        // are intentionally excluded from this number.
        const message = strings.modals.bulkApply.affectedCountMessage(stats.changedSavedDescendantCount);

        new ConfirmModal(
            app,
            title,
            message,
            async () => {
                await applySortAndGroupToDescendants();
            },
            strings.modals.bulkApply.applyButton,
            { confirmButtonClass: 'mod-cta' }
        ).open();
    }, [app, applySortAndGroupToDescendants, getDescendantSortAndGroupChangeStats, selectionDescendantLabel, selectionSortTarget]);


    const handleSortMenu = useCallback(
        (event: React.MouseEvent) => {
            if (!hasAppearanceOrSortSelection) {
                return;
            }

            const menu = new Menu();
            const currentSortSpec = resolveListSort(settings, selectionSortOverride);
            const defaultSortSpec = resolveListSort(settings);
            const currentSort = currentSortSpec.option;
            const currentDirection = getSortDirection(currentSort);
            const currentField = getSortField(currentSort);
            const defaultDirection = getSortDirection(defaultSortSpec.option);
            const defaultField = getSortField(defaultSortSpec.option);
            const propertySortKeys = getAvailablePropertySortKeys(settings);
            const sortFieldLabels: Record<SortField, string> = {
                modified: strings.settings.items.defaultSortOrder.fields.dateEdited,
                created: strings.settings.items.defaultSortOrder.fields.dateCreated,
                title: strings.settings.items.defaultSortOrder.fields.title,
                filename: strings.settings.items.defaultSortOrder.fields.fileName,
                property: strings.settings.items.defaultSortOrder.fields.property
            };
            const sortDirectionLabels: Record<SortDirection, string> = {
                asc: strings.settings.items.defaultSortOrder.directions.asc,
                desc: strings.settings.items.defaultSortOrder.directions.desc
            };
            const getSortFieldLabel = (field: SortField, propertyKey?: string): string => {
                if (field === 'property') {
                    const trimmedPropertyKey = propertyKey?.trim();
                    return trimmedPropertyKey
                        ? `${sortFieldLabels.property} \u2018${isolateBidiText(trimmedPropertyKey)}\u2019`
                        : sortFieldLabels.property;
                }

                return sortFieldLabels[field];
            };
            const withDefaultSuffix = (label: string, isDefault: boolean): string =>
                isDefault ? `${label} ${strings.folderAppearance.defaultSuffix}` : label;
            const getSortFieldMenuIcon = (field: SortField, propertyKey?: string): string => {
                if (field === 'property') {
                    const propertyMenuIcon = resolveIconForMenu(resolvePropertySortIcon(propertyKey ?? ''));
                    if (propertyMenuIcon) {
                        return propertyMenuIcon;
                    }
                }

                return resolveUXIconForMenu(settings.interfaceIcons, getListSortFieldIconId(field));
            };
            const defaultSortOverride = createListSortOverride(defaultSortSpec.option, defaultSortSpec.propertyKey);
            // Field and direction share one persisted value, so an override is removed only when
            // the complete selection matches the default. Comparing either component alone would
            // also reset the other component when its default-marked entry is clicked.
            const applySort = (field: SortField, direction: SortDirection, propertyKey?: string) => {
                const option = buildSortOption(field, direction);
                const selectedSort = createListSortOverride(option, propertyKey);
                const nextOverride = resolveListSortOverrideForDefault(selectedSort, defaultSortOverride);
                runAsyncAction(async () => {
                    if (nextOverride === undefined) {
                        await removeSelectionSortOverride();
                    } else {
                        await setSelectionSortOverride(nextOverride);
                    }
                    app.workspace.requestSaveLayout();
                });
            };
            // Field changes start dates with newest first and text/property fields in ascending
            // order. The direction entries below remain available as explicit overrides.
            const applySortField = (field: SortField, propertyKey?: string) => {
                applySort(field, getSortDirectionForFieldChange(field), propertyKey);
            };
            const hasSelectionSortOverride = selectionSortOverride !== undefined;
            const isViewUsingDefaults = !hasSelectionSortOverride && !hasSelectionGroupOverride;

            menu.addItem(item => {
                item.setTitle(strings.folderAppearance.sortBy).setIcon('lucide-arrow-up-down').setDisabled(true);
            });

            (['modified', 'created', 'title', 'filename'] as const).forEach(field => {
                const isDefaultField = defaultField === field;
                const isCurrentField = currentField === field;
                menu.addItem(item => {
                    item.setTitle(withDefaultSuffix(getSortFieldLabel(field), isDefaultField))
                        .setIcon(getSortFieldMenuIcon(field))
                        .setChecked(isCurrentField)
                        .onClick(() => {
                            if (isCurrentField) {
                                return;
                            }
                            applySortField(field);
                        });
                });
            });

            propertySortKeys.forEach(propertyKey => {
                const isDefaultField = defaultField === 'property' && samePropertySortKey(defaultSortSpec.propertyKey, propertyKey);
                const isCurrentField = currentField === 'property' && samePropertySortKey(currentSortSpec.propertyKey, propertyKey);
                menu.addItem(item => {
                    item.setTitle(withDefaultSuffix(getSortFieldLabel('property', propertyKey), isDefaultField))
                        .setIcon(getSortFieldMenuIcon('property', propertyKey))
                        .setChecked(isCurrentField)
                        .onClick(() => {
                            if (isCurrentField) {
                                return;
                            }
                            applySortField('property', propertyKey);
                        });
                });
            });

            // Without configured property keys the property sort entries above render nothing, so a
            // disabled placeholder keeps the feature visible.
            if (propertySortKeys.length === 0) {
                menu.addItem(item => {
                    item.setTitle(getSortFieldLabel('property')).setIcon(getSortFieldMenuIcon('property')).setDisabled(true);
                });
            }

            menu.addSeparator();

            (['asc', 'desc'] as const).forEach(direction => {
                const isDefaultDirection = defaultDirection === direction;
                menu.addItem(item => {
                    const option = buildSortOption(currentField, direction);
                    item.setTitle(withDefaultSuffix(sortDirectionLabels[direction], isDefaultDirection))
                        .setIcon(getSortIconName(option))
                        .setChecked(currentDirection === direction)
                        .onClick(() => {
                            applySort(currentField, direction, currentField === 'property' ? currentSortSpec.propertyKey : undefined);
                        });
                });
            });

            menu.addSeparator();

            menu.addItem(item => {
                item.setTitle(strings.folderAppearance.groupBy).setIcon('lucide-layers').setDisabled(true);
            });

            const effectiveCurrentGroup = resolveEffectiveListGroupingForSort({
                groupBy: groupingInfo.effectiveGrouping,
                sortOption: currentSort,
                selectionType: selectionState.selectionType
            });
            const isGroupOptionDisabled = (option: ListNoteGroupingOption): boolean =>
                option === 'date' && !isDateSortOption(currentSort);
            // Group property and order share one persisted value, matching the composite handling
            // above for sort field and direction.
            const applyGrouping = (option: ListNoteGroupingOption) => {
                const nextOverride = resolveListGroupingOverrideForDefault(option, groupingInfo.defaultGrouping);
                runAsyncAction(async () => {
                    await setSelectionGroupOverride(nextOverride);
                    app.workspace.requestSaveLayout();
                });
            };
            const addGroupOptionItem = (option: ListNoteGroupingOption, title: string, icon: string, isDisabled: boolean): void => {
                // Same-kind comparison marks the default property entry even when only the current
                // order differs; persistence still compares the complete grouping value.
                const isDefaultGroupKind = areListGroupingOptionsSameKind(option, groupingInfo.defaultGrouping);
                menu.addItem(item => {
                    // Same-kind comparison keeps a property entry checked when only its group order direction differs.
                    item.setTitle(`    ${withDefaultSuffix(title, isDefaultGroupKind)}`)
                        .setIcon(icon)
                        .setDisabled(isDisabled)
                        .setChecked(areListGroupingOptionsSameKind(effectiveCurrentGroup, option))
                        .onClick(() => {
                            if (isDisabled) {
                                return;
                            }
                            applyGrouping(option);
                        });
                });
            };

            // None keeps the sorted list flat, while Date annotates it with headers.
            (['none', 'date'] as const).forEach(option => {
                addGroupOptionItem(
                    option,
                    strings.settings.items.defaultGrouping.options[option],
                    getGroupingIcon(option),
                    isGroupOptionDisabled(option)
                );
            });

            if (hasFolderSelection) {
                addGroupOptionItem(
                    'folder',
                    strings.settings.items.defaultGrouping.options.folder,
                    getGroupingIcon('folder'),
                    isGroupOptionDisabled('folder')
                );
            }

            // The configured grouping properties provide the grouping choices, mirroring the sort field list above.
            // Switching the grouping property keeps the current group order, matching Obsidian Bases.
            const effectiveGroupPropertyKey = getPropertyGroupingKey(effectiveCurrentGroup);
            const effectiveGroupOrder = getPropertyGroupingOrder(effectiveCurrentGroup) ?? 'follow';
            const propertyGroupKeys = getAvailablePropertyGroupKeys(settings);
            propertyGroupKeys.forEach(propertyKey => {
                addGroupOptionItem(
                    createPropertyGroupingOption(propertyKey, effectiveGroupOrder),
                    getSortFieldLabel('property', propertyKey),
                    getSortFieldMenuIcon('property', propertyKey),
                    false
                );
            });

            // Without configured property keys the property grouping entries above render nothing, so a
            // disabled placeholder keeps the feature visible, matching the disabled manual sort entry.
            if (propertyGroupKeys.length === 0) {
                menu.addItem(item => {
                    item.setTitle(`    ${getSortFieldLabel('property')}`)
                        .setIcon(getSortFieldMenuIcon('property'))
                        .setDisabled(true);
                });
            }

            // Group order applies only to property grouping; date and folder groups keep their fixed order.
            if (effectiveGroupPropertyKey !== null) {
                menu.addSeparator();
                // The default marker follows the default grouping's order independent of its
                // property key, matching how the sort menu marks its default direction.
                const defaultGroupOrder = getPropertyGroupingOrder(groupingInfo.defaultGrouping);
                const groupOrderLabels: Record<PropertyGroupingOrder, string> = {
                    follow: strings.settings.items.defaultGroupingDirection.options.follow,
                    asc: sortDirectionLabels.asc,
                    desc: sortDirectionLabels.desc
                };
                const groupOrderIcons: Record<PropertyGroupingOrder, string> = {
                    follow: 'lucide-arrow-up-down',
                    asc: 'lucide-sort-asc',
                    desc: 'lucide-sort-desc'
                };
                (['follow', 'asc', 'desc'] as const).forEach(order => {
                    const orderOption = createPropertyGroupingOption(effectiveGroupPropertyKey, order);
                    const isDefaultOrder = defaultGroupOrder === order;
                    menu.addItem(item => {
                        item.setTitle(`    ${withDefaultSuffix(groupOrderLabels[order], isDefaultOrder)}`)
                            .setIcon(groupOrderIcons[order])
                            .setChecked(effectiveGroupOrder === order)
                            .onClick(() => {
                                // Re-clicking the checked order keeps the current grouping property and order unchanged.
                                if (effectiveGroupOrder === order) {
                                    return;
                                }
                                applyGrouping(orderOption);
                            });
                    });
                });
            }

            if (canApplyToDescendants) {
                menu.addSeparator();
                menu.addItem(item => {
                    const descendantStats = getDescendantSortAndGroupChangeStats();
                    item.setTitle(strings.paneHeader.applySortAndGroupToDescendants(selectionDescendantLabel))
                        .setIcon('lucide-squares-unite')
                        .setDisabled(descendantStats.disabled)
                        .onClick(() => {
                            promptApplySortAndGroupToDescendants();
                        });
                });
            }

            menu.addSeparator();
            menu.addItem(item => {
                item.setTitle(strings.paneHeader.resetViewToDefaults)
                    .setIcon('lucide-rotate-ccw')
                    .setDisabled(isViewUsingDefaults)
                    .onClick(() => {
                        if (isViewUsingDefaults) {
                            return;
                        }

                        runAsyncAction(async () => {
                            if (hasSelectionSortOverride) {
                                await removeSelectionSortOverride();
                            }
                            if (hasSelectionGroupOverride) {
                                await setSelectionGroupOverride(undefined);
                            }
                            app.workspace.requestSaveLayout();
                        });
                    });
            });
            menu.addSeparator();
            menu.addItem(item => {
                item.setTitle(strings.settings.changeDefaultSettings)
                    .setIcon('lucide-settings')
                    .onClick(() => {
                        openDefaultListSettings();
                    });
            });

            menu.showAtMouseEvent(event.nativeEvent);
        },
        [
            canApplyToDescendants,
            hasAppearanceOrSortSelection,
            hasFolderSelection,
            hasSelectionGroupOverride,
            app,
            getDescendantSortAndGroupChangeStats,
            groupingInfo.defaultGrouping,
            groupingInfo.effectiveGrouping,
            openDefaultListSettings,
            promptApplySortAndGroupToDescendants,
            removeSelectionSortOverride,
            resolvePropertySortIcon,
            selectionDescendantLabel,
            selectionSortTarget,
            selectionSortOverride,
            selectionState.selectionType,
            setSelectionGroupOverride,
            setSelectionSortOverride,
            settings,
        ]
    );

    /**
     * Toggles the display of notes from descendants.
     * When enabling descendants, automatically selects the active file if it's within the current folder/tag hierarchy.
     */
    const handleToggleDescendants = useCallback(() => {
        const wasShowingDescendants = includeDescendantNotes;
        const activeFile = app.workspace.getActiveFile();

        // Toggle descendant notes preference using UX action
        setIncludeDescendantNotes(!wasShowingDescendants);

        // Special case: When enabling descendants, auto-select the active file if it's in the folder
        if (!wasShowingDescendants && selectionState.selectedFolder && !selectionState.selectedFile) {
            if (activeFile) {
                // Check if the active file would be visible with descendants enabled
                const filesInFolder = getFilesForFolder(
                    selectionState.selectedFolder,
                    settings,
                    { includeDescendantNotes: true, showHiddenItems },
                    app
                );

                if (filesInFolder.some(f => f.path === activeFile.path)) {
                    selectionDispatch({ type: 'SET_SELECTED_FILE', file: activeFile });
                }
            }
        }
    }, [
        setIncludeDescendantNotes,
        includeDescendantNotes,
        showHiddenItems,
        selectionState.selectedFolder,
        selectionState.selectedFile,
        app,
        selectionDispatch,
        settings
    ]);

    const hasCustomSortOrGroup = selectionSortOverride !== undefined || hasSelectionGroupOverride;

    const activeFileVisibility = useMemo(() => {
        return findVaultProfileById(vaultProfiles, vaultProfileId).fileVisibility;
    }, [vaultProfileId, vaultProfiles]);

    const descendantsTooltip = useMemo(() => {
        const showNotes = activeFileVisibility === FILE_VISIBILITY.DOCUMENTS;

        if (selectionState.selectionType === ItemType.TAG) {
            return showNotes ? strings.paneHeader.showNotesFromDescendants : strings.paneHeader.showFilesFromDescendants;
        }

        if (selectionState.selectionType === ItemType.PROPERTY) {
            return showNotes ? strings.paneHeader.showNotesFromDescendants : strings.paneHeader.showFilesFromDescendants;
        }

        if (selectionState.selectionType === ItemType.FOLDER) {
            return showNotes ? strings.paneHeader.showNotesFromSubfolders : strings.paneHeader.showFilesFromSubfolders;
        }

        return showNotes ? strings.paneHeader.showNotesFromSubfolders : strings.paneHeader.showFilesFromSubfolders;
    }, [activeFileVisibility, selectionState.selectionType]);

    return {
        handleNewFile,
        canCreateNewFile,
        handleRevealFile,
        canRevealFile,
        handleSortMenu,
        handleToggleDescendants,
        getSortIcon,
        hasAppearanceOrSortSelection,
        hasCustomSortOrGroup,
        descendantsTooltip
    };
}
