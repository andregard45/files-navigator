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

// Rewritten from MarkdownPipelineClearContent.test.ts: the old per-provider clearContent /
// shouldRegenerate / getRelevantSettings methods no longer exist. The equivalent policy now lives
// in the pure functions exported by FrontmatterSyncService (handleSettingsChange plan +
// RELEVANT_SETTINGS_BY_TYPE), and the DB clear itself is performed by the StorageContext caller via
// db.batchClearAllFileContent followed by service.resetAfterClear().

import { App } from 'obsidian';
import { describe, expect, it } from 'vitest';
import {
    FrontmatterSyncService,
    RELEVANT_SETTINGS_BY_TYPE,
    handleSettingsChange
} from '../../src/services/content/frontmatterSyncService';
import { DEFAULT_SETTINGS } from '../../src/settings/defaultSettings';
import type { NotebookNavigatorSettings } from '../../src/settings/types';

function createSettings(overrides: Partial<NotebookNavigatorSettings>): NotebookNavigatorSettings {
    const settings = structuredClone(DEFAULT_SETTINGS);
    Object.assign(settings, overrides);
    // DEFAULT_SETTINGS contains fresh object/array references per clone; normalize them to a
    // canonical frozen snapshot so unrelated reference-typed keys (folderSortOverrides,
    // vaultProfiles, ...) compare identity-equal between two createSettings() results. Without
    // this, handleSettingsChange's `old[key] !== new[key]` policy reports phantom changes for
    // every relevant map/array key even when only an unrelated setting was overridden.
    for (const keys of Object.values(RELEVANT_SETTINGS_BY_TYPE)) {
        for (const key of keys) {
            if (!(key in overrides)) {
                (settings as Record<string, unknown>)[key] = (DEFAULT_SETTINGS as Record<string, unknown>)[key];
            }
        }
    }
    return settings;
}

describe('FrontmatterSyncService settings-change clear policy', () => {
    it('declares every list sort setting used by word count consumers', () => {
        expect(RELEVANT_SETTINGS_BY_TYPE.markdownPipeline).toEqual(
            expect.arrayContaining([
                'defaultFolderSort',
                'propertySortKey',
                'folderSortOverrides',
                'tagSortOverrides',
                'propertySortOverrides'
            ])
        );
    });

    it('marks markdownPipeline affected when a relevant sort setting changes (was clearContent trigger)', () => {
        const oldSettings = createSettings({});
        const newSettings = createSettings({ propertySortKey: 'name' as never });

        const plan = handleSettingsChange(oldSettings, newSettings);

        expect(plan.affectedTypes).toContain('markdownPipeline');
        // Properties are indexed in full regardless of display settings → never a vault-wide clear.
        expect(plan.clearTypes).not.toContain('properties');
    });

    it('never triggers vault-wide regeneration from appearance-only setting changes', () => {
        // calendarTemplateFolder is a pure UI/location setting — not listed in RELEVANT_SETTINGS_BY_TYPE
        // for any content type and not referenced by any shouldRegenerate policy.
        const oldSettings = createSettings({});
        const newSettings = createSettings({ calendarTemplateFolder: 'Templates/Calendar' });

        const plan = handleSettingsChange(oldSettings, newSettings);

        expect(plan.affectedTypes).not.toContain('markdownPipeline');
        expect(plan.affectedTypes).not.toContain('metadata');
        expect(plan.affectedTypes).not.toContain('tags');
        expect(plan.clearTypes).toHaveLength(0);
    });

    it('resets deferral state after a content clear (replacement for provider clearContent bookkeeping)', () => {
        const service = new FrontmatterSyncService(new App());

        // resetAfterClear must be callable on a fresh instance and leave the service usable.
        service.resetAfterClear();
        service.stop();
        service.start();

        expect(service.getDeferredPaths()).toEqual([]);
    });
});
