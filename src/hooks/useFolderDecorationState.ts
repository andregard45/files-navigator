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

import { useMemo } from 'react';

import { useMetadataService, useServices } from '../context/ServicesContext';
import { useActiveProfile, useSettingsState } from '../context/SettingsContext';
import { useUXPreferences } from '../context/UXPreferencesContext';
import type { NotebookNavigatorSettings } from '../settings/types';
import { useFolderNavigationSourceState, type FolderNavigationSourceState } from './useFolderNavigationSourceState';
import { type FolderDecorationModel } from '../utils/folderDecoration';

interface FolderDecorationState {
    folderNavigationSource: FolderNavigationSourceState;
    folderDecorationModel: FolderDecorationModel;
}

interface UseFolderDecorationResolverParams {
    settings: NotebookNavigatorSettings;
    source: FolderNavigationSourceState;
}

function useFolderDecorationModel({ settings, source }: UseFolderDecorationResolverParams): FolderDecorationModel {
    const isFolderExcluded = source.isFolderExcluded;
    const folderDisplayVersion = source.folderDisplayVersion;
    const isExcludedPath = useMemo(() => {
        const exclusionCache = new Map<string, boolean>();
        return (folderPath: string): boolean => {
            const cached = exclusionCache.get(folderPath);
            if (cached !== undefined) {
                return cached;
            }

            const isExcluded = isFolderExcluded(folderPath);
            exclusionCache.set(folderPath, isExcluded);
            return isExcluded;
        };
    }, [isFolderExcluded]);

    return useMemo(() => {
        void folderDisplayVersion;
        return {
            isExcludedPath,
            showRootFolder: settings.showRootFolder
        };
    }, [isExcludedPath, settings.showRootFolder, folderDisplayVersion]);
}

export function useFolderDecorationState(): FolderDecorationState {
    const { app } = useServices();
    const metadataService = useMetadataService();
    const settings = useSettingsState();
    const activeProfile = useActiveProfile();
    const uxPreferences = useUXPreferences();
    const source = useFolderNavigationSourceState({
        app,
        settings,
        activeProfile,
        metadataService,
        showHiddenItems: uxPreferences.showHiddenItems
    });
    const folderDecorationModel = useFolderDecorationModel({
        settings,
        source
    });

    return useMemo(
        () => ({
            folderNavigationSource: source,
            folderDecorationModel
        }),
        [folderDecorationModel, source]
    );
}
