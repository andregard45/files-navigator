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

import { DEFAULT_CUSTOM_COLORS } from '../constants/colorPalette';
import { getDefaultKeyboardShortcuts } from '../utils/keyboardShortcuts';
import { FILE_VISIBILITY } from '../utils/fileTypeUtils';
import { LISTPANE_MEASUREMENTS, NAVPANE_MEASUREMENTS, type PinnedNotes } from '../types';
import { DEFAULT_UI_SCALE } from '../utils/uiScale';
import type { ListPaneAppearance } from './listPaneAppearance';
import {
    NARROW_SIDEBAR_CUSTOM_WIDTH_DEFAULT,
    type NotebookNavigatorSettings,
    type FolderTemplateMapping
} from './types';
import { sanitizeRecord } from '../utils/recordUtils';
import {
    DEFAULT_CALENDAR_CUSTOM_FILE_PATTERN,
    DEFAULT_CALENDAR_CUSTOM_MONTH_PATTERN,
    DEFAULT_CALENDAR_CUSTOM_QUARTER_PATTERN,
    DEFAULT_CALENDAR_CUSTOM_WEEK_PATTERN,
    DEFAULT_CALENDAR_CUSTOM_YEAR_PATTERN
} from '../utils/calendarCustomNotePatterns';
import { DEFAULT_FILE_TYPE_ICON_PRESET } from '../utils/fileTypeIconPresets';
import { FOLDER_NOTE_NAME_PATTERN_TOKEN } from '../utils/folderNoteName';

/**
 * Default settings for the plugin
 * Used when plugin is first installed or settings are reset
 */
export const DEFAULT_SETTINGS: NotebookNavigatorSettings = {
    // General tab - Filtering
    vaultProfiles: [
        {
            id: 'default',
            name: '',
            fileVisibility: FILE_VISIBILITY.SUPPORTED,
            propertyKeys: [],
            hiddenFolders: [],
            descendantExcludedFolders: [],
            hiddenTags: [],
            hiddenFileNames: [],
            hiddenFileTags: [],
            hiddenFileProperties: [],
            periodicNotesFolder: '',
            shortcuts: []
        }
    ],
    vaultProfile: 'default',
    vaultTitle: 'navigation',

    // General tab - Behavior
    createNewNotesInNewTab: false,
    autoRevealActiveFile: true,
    autoRevealShortestPath: true,
    autoRevealIgnoreRightSidebar: true,
    autoRevealIgnoreOtherWindows: true,
    paneTransitionDuration: 150,

    // General tab - Keyboard navigation
    multiSelectModifier: 'cmdCtrl',
    enterToOpenFiles: false,
    shiftEnterOpenContext: 'tab',
    cmdCtrlEnterOpenContext: 'split',

    // General tab - Mouse buttons
    mouseBackForwardAction: 'history',

    // General tab - View
    startView: 'files',
    showInfoButtons: true,

    // General tab - Desktop appearance
    dualPane: true,
    dualPaneOrientation: 'horizontal',
    narrowSidebarLayout: 'singlePane',
    narrowSidebarTriggerMode: 'fitPanes',
    narrowSidebarCustomWidth: NARROW_SIDEBAR_CUSTOM_WIDTH_DEFAULT,
    showTooltips: false,
    showTooltipPath: true,
    showTooltipTags: false,
    desktopBackground: 'separate',
    desktopScale: DEFAULT_UI_SCALE,

    mobileScale: DEFAULT_UI_SCALE,

    // General tab - Mobile appearance
    useFloatingToolbars: true,

    // General tab - Toolbar buttons
    toolbarVisibility: {
        navigation: {
            toggleDualPane: true,
            expandCollapse: true,
            calendar: true,
            hiddenItems: true,
            newFolder: true
        },
        list: {
            back: true,
            search: true,
            reveal: false,
            descendants: true,
            groupExpansion: false,
            sort: true,
            newNote: true
        }
    },

    // General tab - Icons
    colorIconOnly: false,

    // General tab - Formatting
    dateFormat: 'MMM D, YYYY',
    timeFormat: 'h:mm a',
    calendarTemplateFolder: '',
    templateEngine: 'automatic',
    folderTemplates: sanitizeRecord<FolderTemplateMapping>(undefined),
    showFolderTemplateIcons: true,
    templateCommands: [],

    // Files tab
    confirmBeforeDelete: true,
    deleteAttachments: 'ask',
    moveFileConflicts: 'ask',

    // Navigation pane tab - Appearance
    showNoteCount: true,
    separateNoteCounts: true,
    showIndentGuides: false,
    navCountLeaderStyle: 'none',
    rootLevelSpacing: 0,
    navIndent: NAVPANE_MEASUREMENTS.defaultIndent,
    navItemHeight: NAVPANE_MEASUREMENTS.defaultItemHeight,
    navItemHeightScaleText: true,

    // Navigation pane tab - Behavior
    collapseBehavior: 'all',
    smartCollapse: true,
    excludeVaultRootFromCollapse: false,
    collapseOtherBranchesOnExpand: false,
    autoSelectFirstFileOnFocusChange: false,
    autoExpandNavItems: false,
    springLoadedFolders: true,
    springLoadedFoldersInitialDelay: 0.5,
    springLoadedFoldersSubsequentDelay: 0.5,

    // Shortcuts tab
    showSectionIcons: true,
    showShortcuts: true,
    shortcutBadgeDisplay: 'index',
    skipAutoScroll: false,
    showRecentNotes: true,
    hideRecentNotes: 'none',
    pinRecentNotesWithShortcuts: false,
    recentNotesCount: 5,

    // Folders tab
    showFolderIcons: true,
    showRootFolder: true,
    inheritFolderColors: true,
    folderSortOrder: 'alpha-asc',
    enableFolderNotes: false,
    folderNoteType: 'markdown',
    folderNoteNamePattern: FOLDER_NOTE_NAME_PATTERN_TOKEN,
    folderNoteTemplate: null,
    enableFolderNoteLinks: true,
    hideFolderNoteInList: true,
    pinCreatedFolderNote: false,
    folderNoteOpenLocation: 'current-tab',
    showNearestFolderNoteInSidebar: true,

    // Tags tab
    showTags: true,
    showTagIcons: true,
    showAllTagsFolder: true,
    showUntagged: true,
    scopeTagsToCurrentContext: false,
    tagSortOrder: 'alpha-asc',
    inheritTagColors: true,
    keepEmptyTagsProperty: false,

    // Properties tab
    showProperties: true,
    showPropertyIcons: true,
    inheritPropertyColors: true,
    propertySortOrder: 'alpha-asc',
    showAllPropertiesFolder: true,
    scopePropertiesToCurrentContext: false,

    // List pane tab
    includeDescendantNotes: false,
    defaultFolderSort: 'modified-desc',
    defaultFolderSortPropertyKey: '',
    propertySortKey: '',
    propertyGroupKey: '',
    propertySortSecondary: 'title',
    revealFileOnListChanges: true,
    listPaneTitle: 'header',
    colorListPaneTitle: false,
    noteGrouping: 'date',
    showSelectedNavigationPills: false,
    stickyGroupHeaders: true,
    showFolderGroupPaths: true,
    showGroupHeaderItemCounts: false,
    showCurrentFolderFilesAtBottom: false,
    filterPinnedByFolder: false,
    compactItemHeight: LISTPANE_MEASUREMENTS.defaultCompactItemHeight,
    compactItemHeightScaleText: true,
    showQuickActions: true,
    quickActionRevealInFolder: false,
    quickActionAddTag: true,
    quickActionAddToShortcuts: true,
    quickActionPinNote: true,
    quickActionOpenInNewTab: false,

    // Frontmatter tab
    useFrontmatterMetadata: false,
    frontmatterIconField: 'icon',
    frontmatterColorField: 'color',
    frontmatterBackgroundField: 'background',
    frontmatterNameField: '',
    frontmatterCreatedField: '',
    frontmatterModifiedField: '',
    frontmatterDateFormat: '',

    // Notes tab
    showFileIcons: true,
    useFolderIconForFiles: false,
    showFilenameMatchIcons: false,
    fileNameIconMap: sanitizeRecord<string>(undefined),
    showCategoryIcons: false,
    fileTypeIconMap: sanitizeRecord<string>(undefined),
    fileTypeIconPreset: DEFAULT_FILE_TYPE_ICON_PRESET,

    // Calendar tab - Calendar (always enabled)
    calendarPlacement: 'left-sidebar',
    calendarLocale: 'system-default',
    calendarMonthHeadingFormat: 'full',
    calendarHighlightToday: true,
    calendarMonthHighlights: sanitizeRecord<string>(undefined),
    calendarShowWeekNumber: false,
    calendarShowQuarter: false,
    calendarShowOutsideMonthDays: true,
    calendarShowYearCalendar: true,
    calendarLeftPlacement: 'navigation',
    calendarWeeksToShow: 1,

    // Calendar tab - Calendar integration
    calendarIntegrationMode: 'notebook-navigator',
    calendarPeriodicNotesLocaleSource: 'calendar',
    calendarCustomFilePattern: DEFAULT_CALENDAR_CUSTOM_FILE_PATTERN,
    calendarCustomWeekPattern: DEFAULT_CALENDAR_CUSTOM_WEEK_PATTERN,
    calendarCustomMonthPattern: DEFAULT_CALENDAR_CUSTOM_MONTH_PATTERN,
    calendarCustomQuarterPattern: DEFAULT_CALENDAR_CUSTOM_QUARTER_PATTERN,
    calendarCustomYearPattern: DEFAULT_CALENDAR_CUSTOM_YEAR_PATTERN,
    calendarCustomFileTemplate: null,
    calendarCustomWeekTemplate: null,
    calendarCustomMonthTemplate: null,
    calendarCustomQuarterTemplate: null,
    calendarCustomYearTemplate: null,

    // Search settings and hotkeys
    searchProvider: 'internal',
    keyboardShortcuts: getDefaultKeyboardShortcuts(),

    // Advanced tab - Diagnostics (device-local, never persisted to data.json)
    startupDebugLogging: false,

    // Runtime state and cached data
    customVaultName: '',
    pinnedNotes: sanitizeRecord<PinnedNotes[string]>(undefined),
    fileIcons: sanitizeRecord<string>(undefined),
    fileColors: sanitizeRecord<string>(undefined),
    fileBackgroundColors: sanitizeRecord<string>(undefined),
    folderIcons: sanitizeRecord<string>(undefined),
    folderColors: sanitizeRecord<string>(undefined),
    folderBackgroundColors: sanitizeRecord<string>(undefined),
    folderSortOverrides: sanitizeRecord<NotebookNavigatorSettings['folderSortOverrides'][string]>(undefined),
    folderTreeSortOverrides: sanitizeRecord<NotebookNavigatorSettings['folderTreeSortOverrides'][string]>(undefined),
    folderAppearances: sanitizeRecord<ListPaneAppearance>(undefined),
    tagIcons: sanitizeRecord<string>(undefined),
    tagColors: sanitizeRecord<string>(undefined),
    tagBackgroundColors: sanitizeRecord<string>(undefined),
    tagSortOverrides: sanitizeRecord<NotebookNavigatorSettings['tagSortOverrides'][string]>(undefined),
    tagTreeSortOverrides: sanitizeRecord<NotebookNavigatorSettings['tagTreeSortOverrides'][string]>(undefined),
    tagAppearances: sanitizeRecord<ListPaneAppearance>(undefined),
    propertyIcons: sanitizeRecord<string>(undefined),
    propertyColors: sanitizeRecord<string>(undefined),
    propertyBackgroundColors: sanitizeRecord<string>(undefined),
    propertySortOverrides: sanitizeRecord<NotebookNavigatorSettings['propertySortOverrides'][string]>(undefined),
    propertyTreeSortOverrides: sanitizeRecord<NotebookNavigatorSettings['propertyTreeSortOverrides'][string]>(undefined),
    propertyAppearances: sanitizeRecord<ListPaneAppearance>(undefined),
    virtualFolderColors: sanitizeRecord<string>(undefined),
    virtualFolderBackgroundColors: sanitizeRecord<string>(undefined),
    navigationSeparators: sanitizeRecord<boolean>(undefined),
    userColors: [...DEFAULT_CUSTOM_COLORS],
    rootFolderOrder: [],
    rootTagOrder: [],
    rootPropertyOrder: []
};
