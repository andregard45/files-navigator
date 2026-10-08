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

import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS } from '../../src/settings/defaultSettings';
import {
    applyExistingUserDefaults,
    applyLegacyPropertyFieldsMigration,
    extractLegacyPropertyFields,
    migrateLegacySyncedSettings
} from '../../src/settings/migrations/syncedSettings';
import type { NotebookNavigatorSettings } from '../../src/settings/types';
import { STORAGE_KEYS } from '../../src/types';

function createSettings(): NotebookNavigatorSettings {
    return structuredClone(DEFAULT_SETTINGS);
}

describe('applyExistingUserDefaults', () => {
    it('hides group header item counts when the setting is missing', () => {
        const settings = createSettings();
        const settingsRecord = settings as unknown as Record<string, unknown>;
        delete settingsRecord['showGroupHeaderItemCounts'];

        applyExistingUserDefaults({ settings });

        expect(settings.showGroupHeaderItemCounts).toBe(false);
    });
});

describe('migrateLegacySyncedSettings defaults', () => {
    it('drops persisted parent folder file-display settings (feature removed)', () => {
        const settings = createSettings();
        const settingsRecord = settings as unknown as Record<string, unknown>;

        settingsRecord['showParentFolder'] = true;
        settingsRecord['showParentFolderFullPath'] = true;
        settingsRecord['parentFolderClickRevealsFile'] = true;
        settingsRecord['showParentFolderColor'] = true;
        settingsRecord['showParentFolderIcon'] = true;
        settingsRecord['showParentFolderNames'] = true;
        settingsRecord['showParentFolderColors'] = true;

        migrateLegacySyncedSettings({
            settings,
            storedData: null,
            keys: STORAGE_KEYS,
            defaultSettings: DEFAULT_SETTINGS
        });

        for (const key of [
            'showParentFolder',
            'showParentFolderFullPath',
            'parentFolderClickRevealsFile',
            'showParentFolderColor',
            'showParentFolderIcon',
            'showParentFolderNames',
            'showParentFolderColors'
        ]) {
            expect(Object.prototype.hasOwnProperty.call(settingsRecord, key)).toBe(false);
        }
    });
});

describe('migrateLegacySyncedSettings property key migration', () => {
    it('migrates legacy customProperty settings keys', () => {
        const settings = createSettings();
        const settingsRecord = settings as unknown as Record<string, unknown>;

        delete settingsRecord['notePropertyType'];
        delete settingsRecord['propertyFields'];
        delete settingsRecord['showFilePropertiesInCompactMode'];
        delete settingsRecord['showPropertiesOnSeparateRows'];

        settingsRecord['customPropertyType'] = 'wordCount';
        settingsRecord['customPropertyFields'] = 'status, type';
        settingsRecord['showCustomPropertyInCompactMode'] = true;
        settingsRecord['showCustomPropertiesOnSeparateRows'] = false;

        migrateLegacySyncedSettings({
            settings,
            storedData: null,
            keys: STORAGE_KEYS,
            defaultSettings: DEFAULT_SETTINGS
        });
        const legacyPropertyFields = extractLegacyPropertyFields({ settings, storedData: null });
        applyLegacyPropertyFieldsMigration({ settings, legacyPropertyFields });

        expect(settings.textCountDisplay).toBe('words');
        expect(settings.textCountPlacement).toBe('title');
        expect(Object.prototype.hasOwnProperty.call(settingsRecord, 'notePropertyType')).toBe(false);
        expect(settings.vaultProfiles[0]?.propertyKeys).toEqual([
            { key: 'status', showInNavigation: true, showInList: true, showInFileMenu: false },
            { key: 'type', showInNavigation: true, showInList: true, showInFileMenu: false }
        ]);
        expect(Object.prototype.hasOwnProperty.call(settingsRecord, 'propertyFields')).toBe(false);
        expect(Object.prototype.hasOwnProperty.call(settingsRecord, 'customPropertyType')).toBe(false);
        expect(Object.prototype.hasOwnProperty.call(settingsRecord, 'customPropertyFields')).toBe(false);
        expect(Object.prototype.hasOwnProperty.call(settingsRecord, 'showCustomPropertyInCompactMode')).toBe(false);
        expect(Object.prototype.hasOwnProperty.call(settingsRecord, 'showCustomPropertiesOnSeparateRows')).toBe(false);
    });

    it('drops persisted file-display property pill settings (feature removed)', () => {
        const settings = createSettings();
        const settingsRecord = settings as unknown as Record<string, unknown>;

        settingsRecord['showFileProperties'] = true;
        settingsRecord['colorFileProperties'] = true;
        settingsRecord['prioritizeColoredFileProperties'] = true;
        settingsRecord['showFilePropertiesInCompactMode'] = true;
        settingsRecord['showPropertiesOnSeparateRows'] = true;
        settingsRecord['enablePropertyInternalLinks'] = true;
        settingsRecord['enablePropertyExternalLinks'] = true;

        migrateLegacySyncedSettings({
            settings,
            storedData: null,
            keys: STORAGE_KEYS,
            defaultSettings: DEFAULT_SETTINGS
        });

        for (const key of [
            'showFileProperties',
            'colorFileProperties',
            'prioritizeColoredFileProperties',
            'showFilePropertiesInCompactMode',
            'showPropertiesOnSeparateRows',
            'enablePropertyInternalLinks',
            'enablePropertyExternalLinks'
        ]) {
            expect(Object.prototype.hasOwnProperty.call(settingsRecord, key)).toBe(false);
        }

        // Navigation-panel property settings must be preserved.
        expect(typeof settings.showProperties).toBe('boolean');
        expect(typeof settings.showPropertyIcons).toBe('boolean');
    });

    it('migrates old note property word count setting to the word count title setting', () => {
        const settings = createSettings();
        const settingsRecord = settings as unknown as Record<string, unknown>;
        settingsRecord['notePropertyType'] = 'wordCount';

        migrateLegacySyncedSettings({
            settings,
            storedData: { notePropertyType: 'wordCount' },
            keys: STORAGE_KEYS,
            defaultSettings: DEFAULT_SETTINGS
        });

        expect(settings.textCountDisplay).toBe('words');
        expect(settings.textCountPlacement).toBe('title');
        expect(Object.prototype.hasOwnProperty.call(settingsRecord, 'notePropertyType')).toBe(false);
    });

    it('migrates legacy word count display settings to text count settings', () => {
        const settings = createSettings();
        const settingsRecord = settings as unknown as Record<string, unknown>;
        settingsRecord['showWordCount'] = true;
        settingsRecord['wordCountPlacement'] = 'property';

        migrateLegacySyncedSettings({
            settings,
            storedData: { showWordCount: true, wordCountPlacement: 'property' },
            keys: STORAGE_KEYS,
            defaultSettings: DEFAULT_SETTINGS
        });

        expect(settings.textCountDisplay).toBe('words');
        expect(settings.textCountPlacement).toBe('property');
        expect(Object.prototype.hasOwnProperty.call(settingsRecord, 'showWordCount')).toBe(false);
        expect(Object.prototype.hasOwnProperty.call(settingsRecord, 'wordCountPlacement')).toBe(false);
    });

});
