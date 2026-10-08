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

import { TFile } from 'obsidian';
import type { App } from 'obsidian';

import { RECENT_NOTES_VIRTUAL_FOLDER_ID, SHORTCUTS_VIRTUAL_FOLDER_ID } from '../../../types';
import type { NotebookNavigatorSettings } from '../../../settings/types';
import type { MetadataService } from '../../../services/MetadataService';
import { shouldDisplayFile, FILE_VISIBILITY } from '../../../utils/fileTypeUtils';
import {
    resolveFileIconId,
    type FileIconFallbackMode,
    type FileIconResolutionSettings,
    type FileNameIconNeedle
} from '../../../utils/fileIconUtils';
import { resolveFolderDecorationColors, type FolderDecorationModel } from '../../../utils/folderDecoration';

interface NavigationFileIconContext {
    settings: FileIconResolutionSettings;
    fallbackMode: FileIconFallbackMode;
    fileNameIconNeedles: readonly FileNameIconNeedle[];
    getFileNameForMatch: (file: TFile) => string | undefined;
}

export interface NavigationItemDecorationContext {
    app: App;
    settings: NotebookNavigatorSettings;
    metadataService: MetadataService;
    parsedExcludedFolders: string[];
    getFolderDisplayData: (folderPath: string) => ReturnType<MetadataService['getFolderDisplayData']>;
    folderDecorationModel: FolderDecorationModel;
    fileIcons: NavigationFileIconContext;
}

export function createNavigationItemDecorationContext(params: {
    app: App;
    settings: NotebookNavigatorSettings;
    fileNameIconNeedles: readonly FileNameIconNeedle[];
    getFileDisplayName: (file: TFile) => string;
    metadataService: MetadataService;
    parsedExcludedFolders: string[];
    folderDecorationModel: NavigationItemDecorationContext['folderDecorationModel'];
}): NavigationItemDecorationContext {
    const {
        app,
        settings,
        fileNameIconNeedles,
        getFileDisplayName,
        metadataService,
        parsedExcludedFolders,
        folderDecorationModel
    } = params;

    const folderDisplayDataByPath = new Map<string, ReturnType<MetadataService['getFolderDisplayData']>>();
    const getFolderDisplayData = (folderPath: string): ReturnType<MetadataService['getFolderDisplayData']> => {
        const cachedData = folderDisplayDataByPath.get(folderPath);
        if (cachedData) {
            return cachedData;
        }

        const nextData = metadataService.getFolderDisplayData(folderPath);
        folderDisplayDataByPath.set(folderPath, nextData);
        return nextData;
    };

    const fileIconSettings: FileIconResolutionSettings = {
        showFilenameMatchIcons: settings.showFilenameMatchIcons,
        fileNameIconMap: settings.fileNameIconMap,
        showCategoryIcons: true,
        fileTypeIconMap: settings.fileTypeIconMap,
        fileTypeIconPreset: settings.fileTypeIconPreset
    };
    const fileIconFallbackMode: FileIconFallbackMode = 'file';
    const getFileNameForMatch = (file: TFile): string | undefined => {
        if (!settings.showFilenameMatchIcons) {
            return undefined;
        }
        return getFileDisplayName(file);
    };

    return {
        app,
        settings,
        metadataService,
        parsedExcludedFolders,
        getFolderDisplayData,
        folderDecorationModel,
        fileIcons: {
            settings: fileIconSettings,
            fallbackMode: fileIconFallbackMode,
            fileNameIconNeedles,
            getFileNameForMatch
        }
    };
}

export interface DecorationColors {
    color: string | undefined;
    backgroundColor: string | undefined;
}

export function resolveFolderItemDecorationColors(params: {
    ctx: NavigationItemDecorationContext;
    folderPath: string;
    color: string | undefined;
    backgroundColor: string | undefined;
}): DecorationColors {
    const { ctx, folderPath, color, backgroundColor } = params;
    return resolveFolderDecorationColors({
        model: ctx.folderDecorationModel,
        folderPath,
        color,
        backgroundColor
    });
}

export function inheritVirtualFolderStyle(params: {
    ctx: NavigationItemDecorationContext;
    enabled: boolean;
    virtualFolderId: string;
    color: string | undefined;
    backgroundColor: string | undefined;
}): { color: string | undefined; backgroundColor: string | undefined } | null {
    const { ctx, enabled, virtualFolderId, color, backgroundColor } = params;
    if (!enabled) {
        return null;
    }

    if (color && backgroundColor) {
        return null;
    }

    const inheritedColor = color ? undefined : ctx.settings.virtualFolderColors[virtualFolderId];
    const inheritedBackgroundColor = backgroundColor ? undefined : ctx.settings.virtualFolderBackgroundColors[virtualFolderId];

    if (!inheritedColor && !inheritedBackgroundColor) {
        return null;
    }

    return {
        color: color ?? inheritedColor,
        backgroundColor: backgroundColor ?? inheritedBackgroundColor
    };
}

function inheritShortcutsRootStyle(
    ctx: NavigationItemDecorationContext,
    color: string | undefined,
    backgroundColor: string | undefined
): { color: string | undefined; backgroundColor: string | undefined } | null {
    return inheritVirtualFolderStyle({
        ctx,
        enabled: true,
        virtualFolderId: SHORTCUTS_VIRTUAL_FOLDER_ID,
        color,
        backgroundColor
    });
}

function inheritRecentRootStyle(
    ctx: NavigationItemDecorationContext,
    color: string | undefined,
    backgroundColor: string | undefined
): { color: string | undefined; backgroundColor: string | undefined } | null {
    return inheritVirtualFolderStyle({
        ctx,
        enabled: true,
        virtualFolderId: RECENT_NOTES_VIRTUAL_FOLDER_ID,
        color,
        backgroundColor
    });
}

export function resolveNavigationFileIconId(
    ctx: NavigationItemDecorationContext,
    file: TFile,
    customIconId: string | undefined
): string | undefined {
    const isExternalFile = !shouldDisplayFile(file, FILE_VISIBILITY.SUPPORTED, ctx.app);
    const resolvedIconId = resolveFileIconId(file, ctx.fileIcons.settings, {
        customIconId,
        metadataCache: ctx.app.metadataCache,
        isExternalFile,
        fallbackMode: ctx.fileIcons.fallbackMode,
        fileNameNeedles: ctx.fileIcons.fileNameIconNeedles,
        fileNameForMatch: ctx.fileIcons.getFileNameForMatch(file)
    });

    return resolvedIconId ?? undefined;
}

export function resolveShortcutDecorationColors(params: {
    ctx: NavigationItemDecorationContext;
    itemKey: string;
    color: string | undefined;
    backgroundColor: string | undefined;
}): DecorationColors {
    const { ctx, color, backgroundColor } = params;

    let nextColor = color;
    let nextBackgroundColor = backgroundColor;

    const inheritedRoot = inheritShortcutsRootStyle(ctx, nextColor, nextBackgroundColor);
    if (inheritedRoot) {
        nextColor = inheritedRoot.color;
        nextBackgroundColor = inheritedRoot.backgroundColor;
    }

    return { color: nextColor, backgroundColor: nextBackgroundColor };
}

export function resolveRecentDecorationColors(params: {
    ctx: NavigationItemDecorationContext;
    itemKey: string;
    color: string | undefined;
    backgroundColor: string | undefined;
}): DecorationColors {
    const { ctx, color, backgroundColor } = params;
    let nextColor = color;
    let nextBackgroundColor = backgroundColor;

    const inheritedRoot = inheritRecentRootStyle(ctx, nextColor, nextBackgroundColor);
    if (inheritedRoot) {
        nextColor = inheritedRoot.color;
        nextBackgroundColor = inheritedRoot.backgroundColor;
    }

    return { color: nextColor, backgroundColor: nextBackgroundColor };
}
