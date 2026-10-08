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

// Imports
import type { NotebookNavigatorSettings } from '../types';
import type { LocalStorageKeys } from '../../types';
import type { ListPaneAppearance } from '../listPaneAppearance';
import { DEFAULT_SETTINGS } from '../defaultSettings';
import { localStorage } from '../../utils/localStorage';
import { cloneShortcuts, createPropertyKeysFromPropertyFields, DEFAULT_VAULT_PROFILE_ID } from '../../utils/vaultProfiles';
import { ShortcutType, type ShortcutEntry } from '../../types/shortcuts';
import {
    isNarrowSidebarTriggerMode,
    isNavCountLeaderStyle,
    isRecentNotesHideMode,
    isTagSortOrder,
    normalizeNarrowSidebarLayout,
    normalizeAppearanceGroupBy,
    normalizeListNoteGroupingOption
} from '../types';
import { normalizeCalendarCustomRootFolder } from '../../utils/calendarCustomNotePatterns';
import { normalizeFolderNoteNamePattern } from '../../utils/folderNoteName';
import { normalizeOptionalVaultFilePath } from '../../utils/pathUtils';
import { normalizeCommaSeparatedList } from '../../utils/commaSeparatedListUtils';

// Types/Interfaces
export interface LegacyVisibilityMigration {
    hiddenFolders: string[];
    hiddenFileProperties: string[];
    hiddenTags: string[];
    shouldApplyToProfiles: boolean;
}

const SEARCH_SHORTCUT_LEGACY_NEGATION_PATTERN = /(^|\s)!(?=\S)/g;

// Rewrites legacy search negation prefixes from "!" to "-" at token boundaries.
// Returns an empty query when legacy data contains a non-string value.
const migrateLegacySearchShortcutQuery = (query: unknown): string => {
    if (typeof query !== 'string') {
        return '';
    }

    return query.replace(SEARCH_SHORTCUT_LEGACY_NEGATION_PATTERN, '$1-');
};


// Migrates legacy synced settings fields into the current settings schema.
// This runs before local-only settings are resolved from localStorage.
export function migrateLegacySyncedSettings(params: {
    settings: NotebookNavigatorSettings;
    storedData: Record<string, unknown> | null;
    keys: LocalStorageKeys;
    defaultSettings: NotebookNavigatorSettings;
}): void {
    const { settings, storedData, keys, defaultSettings } = params;

    // Remove deprecated fields from settings object
    const mutableSettings = settings as unknown as Record<string, unknown>;
    delete mutableSettings.recentNotes;
    delete mutableSettings.recentIcons;
    delete mutableSettings.searchActive;
    delete mutableSettings.showHiddenItems;
    delete mutableSettings.hiddenTags;
    delete mutableSettings.fileVisibility;
    delete mutableSettings.preventInvalidCharacters;
    delete mutableSettings.mobileBackground;
    delete mutableSettings.optimizeNoteHeight;
    delete mutableSettings.showPinnedIcon;
    delete mutableSettings.showPinnedGroupHeader;

    delete mutableSettings.showFileIconUnfinishedTask;
    delete mutableSettings.unfinishedTaskIcon;
    delete mutableSettings.showFileTaskProgress;
    delete mutableSettings.showFileTaskProgressBar;
    delete mutableSettings.showFileTaskProgressCount;
    delete mutableSettings.hideFileTaskProgressWhenComplete;
    delete mutableSettings.showFileBackgroundUnfinishedTask;
    delete mutableSettings.unfinishedTaskBackgroundColor;
    delete mutableSettings.unfinishedTaskBackgroundColorDark;

    const storedNoteGrouping = storedData ? storedData['noteGrouping'] : undefined;

    // Migrates legacy showIcons boolean to separate icon settings for sections, folders, and tags
    const legacyShowIcons = mutableSettings.showIcons;
    if (typeof legacyShowIcons === 'boolean') {
        if (typeof storedData?.['showSectionIcons'] === 'undefined') {
            settings.showSectionIcons = legacyShowIcons;
        }
        if (typeof storedData?.['showFolderIcons'] === 'undefined') {
            settings.showFolderIcons = legacyShowIcons;
        }
        if (typeof storedData?.['showTagIcons'] === 'undefined') {
            settings.showTagIcons = legacyShowIcons;
        }
    }
    delete mutableSettings.showIcons;

    // Remove legacy parent folder feature flags (feature removed)
    delete mutableSettings['showParentFolderNames'];
    delete mutableSettings['showParentFolderColors'];

    // Migrate legacy groupByDate boolean to noteGrouping dropdown
    const legacyGroupByDate = mutableSettings.groupByDate;
    if (typeof legacyGroupByDate === 'boolean' && typeof storedNoteGrouping === 'undefined') {
        settings.noteGrouping = legacyGroupByDate ? 'date' : 'none';
    }
    delete mutableSettings.groupByDate;

    const legacyAutoExpandNavItems = mutableSettings['autoExpandFoldersTags'];
    if (typeof legacyAutoExpandNavItems === 'boolean' && typeof storedData?.['autoExpandNavItems'] === 'undefined') {
        settings.autoExpandNavItems = legacyAutoExpandNavItems;
    }
    delete mutableSettings['autoExpandFoldersTags'];

    const hasStructuredHomepage =
        typeof mutableSettings['homepage'] === 'object' &&
        mutableSettings['homepage'] !== null &&
        !Array.isArray(mutableSettings['homepage']);
    const legacyHomepage = normalizeOptionalVaultFilePath(
        typeof mutableSettings['homepage'] === 'string' ? mutableSettings['homepage'] : null
    );

    if (!hasStructuredHomepage) {
        settings.homepage = {
            source: legacyHomepage ? 'file' : 'none',
            file: legacyHomepage,
            createMissingPeriodicNote: defaultSettings.homepage.createMissingPeriodicNote
        };
    }
    delete mutableSettings['mobileHomepage'];
    delete mutableSettings['useMobileHomepage'];
    delete mutableSettings['syncModes'];

    // The global default accepts the same property encodings as appearance overrides; whether the
    // encoded key is still configured is reconciled by the settings controller after migration.
    settings.noteGrouping = normalizeListNoteGroupingOption(settings.noteGrouping) ?? defaultSettings.noteGrouping;

    const normalizeAppearanceGrouping = (collection: Record<string, ListPaneAppearance> | undefined): void => {
        if (!collection) {
            return;
        }

        Object.values(collection).forEach(normalizeAppearanceGroupBy);
    };
    normalizeAppearanceGrouping(settings.folderAppearances);
    normalizeAppearanceGrouping(settings.tagAppearances);
    normalizeAppearanceGrouping(settings.propertyAppearances);

    if (typeof settings.showSelectedNavigationPills !== 'boolean') {
        settings.showSelectedNavigationPills = defaultSettings.showSelectedNavigationPills;
    }

    // Validate shortcutBadgeDisplay value and reset to default if invalid
    if (
        settings.shortcutBadgeDisplay !== 'index' &&
        settings.shortcutBadgeDisplay !== 'count' &&
        settings.shortcutBadgeDisplay !== 'none'
    ) {
        settings.shortcutBadgeDisplay = defaultSettings.shortcutBadgeDisplay;
    }

    const legacyHideFolderNotesInRecentNotes = mutableSettings['hideFolderNotesInRecentNotes'];
    if (typeof storedData?.['hideRecentNotes'] === 'undefined' && typeof legacyHideFolderNotesInRecentNotes === 'boolean') {
        settings.hideRecentNotes = legacyHideFolderNotesInRecentNotes ? 'folder-notes' : 'none';
    }
    delete mutableSettings['hideFolderNotesInRecentNotes'];

    if (!isRecentNotesHideMode(settings.hideRecentNotes)) {
        settings.hideRecentNotes = defaultSettings.hideRecentNotes;
    }

    const legacyNotePropertyType =
        typeof storedData?.['notePropertyType'] === 'undefined'
            ? mutableSettings['customPropertyType']
            : mutableSettings['notePropertyType'];
    const migratedNotePropertyType = typeof legacyNotePropertyType === 'string' ? legacyNotePropertyType : null;
    delete mutableSettings['customPropertyType'];
    delete mutableSettings['notePropertyType'];


    const currentPropertyFields = mutableSettings['propertyFields'];
    if (typeof currentPropertyFields !== 'string') {
        delete mutableSettings['propertyFields'];
    } else {
        mutableSettings['propertyFields'] = normalizeCommaSeparatedList(currentPropertyFields);
    }

    const legacyPropertyFields = mutableSettings['customPropertyFields'];
    if (
        typeof mutableSettings['propertyFields'] === 'undefined' &&
        typeof storedData?.['propertyFields'] === 'undefined' &&
        typeof legacyPropertyFields === 'string'
    ) {
        mutableSettings['propertyFields'] = normalizeCommaSeparatedList(legacyPropertyFields);
    }
    delete mutableSettings['customPropertyFields'];

    // File-display property pills feature was removed; drop any persisted keys.
    delete mutableSettings['showCustomPropertiesOnSeparateRows'];
    delete mutableSettings['showNotePropertyInCompactMode'];
    delete mutableSettings['customPropertyColorFields'];
    delete mutableSettings['customPropertyColorMap'];

    // Parent folder feature in file display was removed; drop any persisted keys.
    delete mutableSettings['showParentFolder'];
    delete mutableSettings['showParentFolderFullPath'];
    delete mutableSettings['parentFolderClickRevealsFile'];
    delete mutableSettings['showParentFolderColor'];
    delete mutableSettings['showParentFolderIcon'];

    // The "Use folder color" file-display option was removed; drop any persisted keys.
    delete mutableSettings['useFolderColorForFileTitles'];
    delete mutableSettings['useFolderColorForTitles'];

    if (typeof settings.useFolderIconForFiles !== 'boolean') {
        settings.useFolderIconForFiles = defaultSettings.useFolderIconForFiles;
    }

    // File-display property pills feature was removed; drop any persisted keys.
    delete mutableSettings['showFileProperties'];
    delete mutableSettings['colorFileProperties'];
    delete mutableSettings['prioritizeColoredFileProperties'];
    delete mutableSettings['showFilePropertiesInCompactMode'];
    delete mutableSettings['showPropertiesOnSeparateRows'];
    delete mutableSettings['enablePropertyInternalLinks'];
    delete mutableSettings['enablePropertyExternalLinks'];
    delete mutableSettings['showCustomPropertyInCompactMode'];

    if (typeof settings.showProperties !== 'boolean') {
        settings.showProperties = defaultSettings.showProperties;
    }

    if (typeof settings.showPropertyIcons !== 'boolean') {
        settings.showPropertyIcons = defaultSettings.showPropertyIcons;
    }

    if (typeof settings.inheritPropertyColors !== 'boolean') {
        settings.inheritPropertyColors = defaultSettings.inheritPropertyColors;
    }

    if (typeof settings.showAllPropertiesFolder !== 'boolean') {
        settings.showAllPropertiesFolder = defaultSettings.showAllPropertiesFolder;
    }

    if (typeof settings.scopePropertiesToCurrentContext !== 'boolean') {
        settings.scopePropertiesToCurrentContext = defaultSettings.scopePropertiesToCurrentContext;
    }

    if (!isTagSortOrder(settings.propertySortOrder)) {
        settings.propertySortOrder = defaultSettings.propertySortOrder;
    }

    const migrateLegacyAppearances = (collection: Record<string, ListPaneAppearance> | undefined) => {
        if (!collection) {
            return;
        }

        Object.entries(collection).forEach(([key, appearance]) => {
            const appearanceRecord = appearance as unknown as Record<string, unknown>;
            delete appearanceRecord['notePropertyType'];
            delete appearanceRecord['customPropertyType'];
            // File-display property pills feature was removed; drop the per-folder toggle.
            delete appearanceRecord['showProperties'];
            // Compact is the only list mode; drop stored legacy content toggles and the mode field.
            delete appearanceRecord['showPreview'];
            delete appearanceRecord['showImage'];
            delete appearanceRecord['showDate'];
            delete appearanceRecord['mode'];
            // Title rows are hardcoded to 1; drop the stored per-selection override.
            delete appearanceRecord['titleRows'];
            collection[key] = appearance;
        });
    };

    migrateLegacyAppearances(settings.folderAppearances);
    migrateLegacyAppearances(settings.tagAppearances);
    migrateLegacyAppearances(settings.propertyAppearances);

    // The list-pane Appearance menu was removed: drop its toolbar toggle and the global title-rows setting.
    delete mutableSettings['fileNameRows'];
    const legacyToolbarVisibility = mutableSettings['toolbarVisibility'] as Record<string, unknown> | undefined;
    const legacyListToolbarVisibility = legacyToolbarVisibility?.['list'] as Record<string, unknown> | undefined;
    if (legacyListToolbarVisibility) {
        delete legacyListToolbarVisibility['appearance'];
    }

    delete mutableSettings['applyTagColorsToFileTags'];

    const legacySlimItemHeight = mutableSettings['slimItemHeight'];
    if (typeof legacySlimItemHeight === 'number' && Number.isFinite(legacySlimItemHeight)) {
        const storedLocalCompactItemHeight = localStorage.get<unknown>(keys.compactItemHeightKey);
        if (typeof storedData?.['compactItemHeight'] === 'undefined' && storedLocalCompactItemHeight === null) {
            localStorage.set(keys.compactItemHeightKey, legacySlimItemHeight);
        }
    }
    delete mutableSettings['slimItemHeight'];

    const legacySlimItemHeightScaleText = mutableSettings['slimItemHeightScaleText'];
    if (typeof legacySlimItemHeightScaleText === 'boolean') {
        const storedLocalCompactItemHeightScaleText = localStorage.get<unknown>(keys.compactItemHeightScaleTextKey);
        if (typeof storedData?.['compactItemHeightScaleText'] === 'undefined' && storedLocalCompactItemHeightScaleText === null) {
            localStorage.set(keys.compactItemHeightScaleTextKey, legacySlimItemHeightScaleText);
        }
    }
    delete mutableSettings['slimItemHeightScaleText'];

    delete mutableSettings['showFileTagsInSlimMode'];
}

// Migrates folder note settings and removes fields that no longer persist.
export function migrateFolderNoteSettings(params: {
    settings: NotebookNavigatorSettings;
    storedData: Record<string, unknown> | null;
    defaultSettings: NotebookNavigatorSettings;
}): boolean {
    const { settings, storedData, defaultSettings } = params;
    const settingsRecord = settings as unknown as Record<string, unknown>;
    const templateSetting = settings.folderNoteTemplate;
    const normalizedTemplatePath = normalizeOptionalVaultFilePath(templateSetting);
    settings.folderNoteTemplate = normalizedTemplatePath ?? defaultSettings.folderNoteTemplate;

    // The pattern already overrode the fixed name, so preserving that precedence keeps every
    // existing vault on the same expected folder note filename after the two fields are merged.
    const storedPattern = storedData?.['folderNoteNamePattern'];
    const legacyFixedName = storedData?.['folderNoteName'];
    if (typeof storedPattern === 'string' && storedPattern.length > 0) {
        settings.folderNoteNamePattern = normalizeFolderNoteNamePattern(storedPattern);
    } else if (typeof legacyFixedName === 'string' && legacyFixedName.length > 0) {
        settings.folderNoteNamePattern = legacyFixedName;
    } else {
        settings.folderNoteNamePattern = defaultSettings.folderNoteNamePattern;
    }
    delete settingsRecord['folderNoteName'];

    if (Object.prototype.hasOwnProperty.call(settingsRecord, 'folderNoteProperties')) {
        delete settingsRecord['folderNoteProperties'];
    }

    if (!storedData) {
        return false;
    }

    return (
        Object.prototype.hasOwnProperty.call(storedData, 'folderNoteName') ||
        (Object.prototype.hasOwnProperty.call(storedData, 'folderNoteNamePattern') && storedPattern !== settings.folderNoteNamePattern) ||
        Object.prototype.hasOwnProperty.call(storedData, 'folderNoteProperties')
    );
}

// Initializes newly added settings with defaults for existing users.
export function applyExistingUserDefaults(params: { settings: NotebookNavigatorSettings }): void {
    const { settings } = params;


    if (!isNavCountLeaderStyle(settings.navCountLeaderStyle)) {
        settings.navCountLeaderStyle = DEFAULT_SETTINGS.navCountLeaderStyle;
    }

    settings.narrowSidebarLayout = normalizeNarrowSidebarLayout(settings.narrowSidebarLayout) ?? DEFAULT_SETTINGS.narrowSidebarLayout;

    if (!isNarrowSidebarTriggerMode(settings.narrowSidebarTriggerMode)) {
        settings.narrowSidebarTriggerMode = DEFAULT_SETTINGS.narrowSidebarTriggerMode;
    }

    if (typeof settings.narrowSidebarCustomWidth !== 'number' || !Number.isFinite(settings.narrowSidebarCustomWidth)) {
        settings.narrowSidebarCustomWidth = DEFAULT_SETTINGS.narrowSidebarCustomWidth;
    }

    if (typeof settings.showFolderGroupPaths !== 'boolean') {
        settings.showFolderGroupPaths = DEFAULT_SETTINGS.showFolderGroupPaths;
    }

    if (typeof settings.showGroupHeaderItemCounts !== 'boolean') {
        settings.showGroupHeaderItemCounts = DEFAULT_SETTINGS.showGroupHeaderItemCounts;
    }

    if (typeof settings.showCurrentFolderFilesAtBottom !== 'boolean') {
        settings.showCurrentFolderFilesAtBottom = DEFAULT_SETTINGS.showCurrentFolderFilesAtBottom;
    }
}

// Extracts legacy top-level propertyFields for migration into vault profiles.
export function extractLegacyPropertyFields(params: {
    settings: NotebookNavigatorSettings;
    storedData: Record<string, unknown> | null;
}): string | null {
    const { settings, storedData } = params;
    const settingsRecord = settings as unknown as Record<string, unknown>;
    const settingsValue = typeof settingsRecord['propertyFields'] === 'string' ? settingsRecord['propertyFields'] : null;
    const storedValue = typeof storedData?.['propertyFields'] === 'string' ? storedData['propertyFields'] : null;
    if (Object.prototype.hasOwnProperty.call(settingsRecord, 'propertyFields')) {
        delete settingsRecord['propertyFields'];
    }

    const resolved = settingsValue ?? storedValue;
    if (resolved === null) {
        return null;
    }

    return normalizeCommaSeparatedList(resolved);
}

// Migrates legacy property field list to vault profile property key settings.
export function applyLegacyPropertyFieldsMigration(params: {
    settings: NotebookNavigatorSettings;
    legacyPropertyFields: string | null;
}): void {
    const { settings, legacyPropertyFields } = params;

    const settingsRecord = settings as unknown as Record<string, unknown>;
    if (Object.prototype.hasOwnProperty.call(settingsRecord, 'propertyFields')) {
        delete settingsRecord['propertyFields'];
    }

    if (!legacyPropertyFields || legacyPropertyFields.length === 0) {
        return;
    }

    const propertyKeys = createPropertyKeysFromPropertyFields(legacyPropertyFields);
    if (propertyKeys.length === 0) {
        return;
    }

    settings.vaultProfiles.forEach(profile => {
        if (Array.isArray(profile.propertyKeys) && profile.propertyKeys.length > 0) {
            return;
        }
        profile.propertyKeys = propertyKeys.map(entry => ({ ...entry }));
    });
}

// Extracts legacy shortcuts from old settings format for migration to vault profiles
export function extractLegacyShortcuts(params: { storedData: Record<string, unknown> | null }): ShortcutEntry[] | null {
    const { storedData } = params;
    if (!storedData) {
        return null;
    }

    const raw = storedData['shortcuts'];
    if (!Array.isArray(raw)) {
        return null;
    }

    const entries: ShortcutEntry[] = [];
    raw.forEach(value => {
        if (!value || typeof value !== 'object') {
            return;
        }
        const typed = value as ShortcutEntry;
        const shortcutType = (typed as { type?: unknown }).type;
        // Validates that shortcut type is one of the recognized types
        if (
            shortcutType !== ShortcutType.FOLDER &&
            shortcutType !== ShortcutType.NOTE &&
            shortcutType !== ShortcutType.TAG &&
            shortcutType !== ShortcutType.PROPERTY &&
            shortcutType !== ShortcutType.SEARCH
        ) {
            return;
        }
        entries.push({ ...typed });
    });

    if (entries.length === 0) {
        return [];
    }

    return entries;
}

// Migrates legacy shortcuts to vault profile system
export function applyLegacyShortcutsMigration(params: {
    settings: NotebookNavigatorSettings;
    legacyShortcuts: ShortcutEntry[] | null;
}): void {
    const { settings, legacyShortcuts } = params;

    // Removes legacy shortcuts property from settings object
    const settingsRecord = settings as unknown as Record<string, unknown>;
    if (Object.prototype.hasOwnProperty.call(settingsRecord, 'shortcuts')) {
        delete settingsRecord['shortcuts'];
    }

    if (!legacyShortcuts || legacyShortcuts.length === 0) {
        return;
    }

    // Copies legacy shortcuts to all vault profiles that don't have shortcuts yet
    const template = cloneShortcuts(legacyShortcuts);
    settings.vaultProfiles.forEach(profile => {
        if (Array.isArray(profile.shortcuts) && profile.shortcuts.length > 0) {
            return;
        }
        profile.shortcuts = cloneShortcuts(template);
    });
}

// Migrates saved search shortcut queries from legacy "!" negation prefixes to "-" prefixes.
export function migrateSearchShortcutNegationSyntax(params: { settings: NotebookNavigatorSettings }): boolean {
    const { settings } = params;
    if (!Array.isArray(settings.vaultProfiles) || settings.vaultProfiles.length === 0) {
        return false;
    }

    let migrated = false;

    settings.vaultProfiles.forEach(profile => {
        if (!Array.isArray(profile.shortcuts) || profile.shortcuts.length === 0) {
            return;
        }

        let profileChanged = false;
        const nextShortcuts = profile.shortcuts.map(shortcut => {
            if (shortcut.type !== ShortcutType.SEARCH) {
                return shortcut;
            }

            const nextQuery = migrateLegacySearchShortcutQuery(shortcut.query);
            if (nextQuery === shortcut.query) {
                return shortcut;
            }

            profileChanged = true;
            return {
                ...shortcut,
                query: nextQuery
            };
        });

        if (!profileChanged) {
            return;
        }

        profile.shortcuts = nextShortcuts;
        migrated = true;
    });

    return migrated;
}

// Extracts legacy exclusion settings from old format and prepares them for migration to vault profiles
export function extractLegacyVisibilitySettings(params: {
    settings: NotebookNavigatorSettings;
    storedData: Record<string, unknown> | null;
}): LegacyVisibilityMigration {
    const { settings, storedData } = params;

    // Converts unknown value to a deduplicated list of non-empty strings
    const toUniqueStringList = (value: unknown): string[] => {
        if (!Array.isArray(value)) {
            return [];
        }
        const sanitized = value.map(entry => (typeof entry === 'string' ? entry.trim() : '')).filter(entry => entry.length > 0);
        return Array.from(new Set(sanitized));
    };

    const mutableSettings = settings as unknown as Record<string, unknown>;
    const legacyHiddenFolders = toUniqueStringList(mutableSettings['excludedFolders']);
    const legacyHiddenFileProperties = toUniqueStringList(mutableSettings['excludedFiles']);
    delete mutableSettings['excludedFolders'];
    delete mutableSettings['excludedFiles'];

    const storedHiddenTags = toUniqueStringList(storedData?.['hiddenTags']);
    // Legacy hidden tags are captured for migration but not applied to top-level settings

    // Legacy banner keys are removed outright (feature retired).
    delete mutableSettings['navigationBanner'];
    delete mutableSettings['navigationBannerPath'];

    return {
        hiddenFolders: legacyHiddenFolders,
        hiddenFileProperties: legacyHiddenFileProperties,
        hiddenTags: storedHiddenTags,
        shouldApplyToProfiles: !Array.isArray(storedData?.['vaultProfiles'])
    };
}

// Applies legacy hidden folder, file, and tag settings to the active vault profile
export function applyLegacyVisibilityMigration(params: {
    settings: NotebookNavigatorSettings;
    migration: LegacyVisibilityMigration;
}): void {
    const { settings, migration } = params;

    if (
        !migration.shouldApplyToProfiles ||
        (migration.hiddenFolders.length === 0 &&
            migration.hiddenFileProperties.length === 0 &&
            migration.hiddenTags.length === 0)
    ) {
        return;
    }

    const targetProfile =
        settings.vaultProfiles.find(profile => profile.id === settings.vaultProfile) ??
        settings.vaultProfiles.find(profile => profile.id === DEFAULT_VAULT_PROFILE_ID) ??
        settings.vaultProfiles[0];

    if (!targetProfile) {
        return;
    }

    if (migration.hiddenFolders.length > 0) {
        targetProfile.hiddenFolders = [...migration.hiddenFolders];
    }

    if (migration.hiddenFileProperties.length > 0) {
        targetProfile.hiddenFileProperties = [...migration.hiddenFileProperties];
    }

    if (migration.hiddenTags.length > 0) {
        targetProfile.hiddenTags = [...migration.hiddenTags];
    }
}

export function extractLegacyPeriodicNotesFolder(params: { settings: NotebookNavigatorSettings }): string | null {
    const { settings } = params;
    const settingsRecord = settings as unknown as Record<string, unknown>;
    const rawCalendarCustomRootFolder = settingsRecord['calendarCustomRootFolder'];
    if (Object.prototype.hasOwnProperty.call(settingsRecord, 'calendarCustomRootFolder')) {
        delete settingsRecord['calendarCustomRootFolder'];
    }

    if (typeof rawCalendarCustomRootFolder !== 'string') {
        return null;
    }

    const normalized = normalizeCalendarCustomRootFolder(rawCalendarCustomRootFolder);
    return normalized.length > 0 ? normalized : null;
}

export function applyLegacyPeriodicNotesFolderMigration(params: {
    settings: NotebookNavigatorSettings;
    legacyPeriodicNotesFolder: string | null;
}): void {
    const { settings, legacyPeriodicNotesFolder } = params;
    if (!legacyPeriodicNotesFolder) {
        return;
    }

    if (!Array.isArray(settings.vaultProfiles) || settings.vaultProfiles.length === 0) {
        return;
    }

    settings.vaultProfiles.forEach(profile => {
        if (typeof profile.periodicNotesFolder === 'string' && profile.periodicNotesFolder.length > 0) {
            return;
        }
        profile.periodicNotesFolder = legacyPeriodicNotesFolder;
    });
}
