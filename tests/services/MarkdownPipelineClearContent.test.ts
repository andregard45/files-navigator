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

import { App } from 'obsidian';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MarkdownPipelineContentProvider } from '../../src/services/content/MarkdownPipelineContentProvider';
import { DEFAULT_SETTINGS } from '../../src/settings/defaultSettings';
import type { NotebookNavigatorSettings } from '../../src/settings/types';

const batchClearAllFileContentMock = vi.fn();

// Replaces storage access with spies so tests can assert clearContent DB calls directly.
vi.mock('../../src/storage/fileOperations', () => ({
    getDBInstance: () => ({
        batchClearAllFileContent: batchClearAllFileContentMock
    })
}));

function createSettings(overrides: Partial<NotebookNavigatorSettings>): NotebookNavigatorSettings {
    const settings = structuredClone(DEFAULT_SETTINGS);
    Object.assign(settings, overrides);
    return settings;
}

describe('MarkdownPipelineContentProvider clearContent', () => {
    beforeEach(() => {
        batchClearAllFileContentMock.mockReset();
    });

    it('declares every list sort setting used by word count consumers', () => {
        const provider = new MarkdownPipelineContentProvider(new App());

        expect(provider.getRelevantSettings()).toEqual(
            expect.arrayContaining([
                'defaultFolderSort',
                'propertySortKey',
                'folderSortOverrides',
                'tagSortOverrides',
                'propertySortOverrides'
            ])
        );
    });

    it('clears the property cache when called without a settings context', async () => {
        const provider = new MarkdownPipelineContentProvider(new App());

        await provider.clearContent();

        expect(batchClearAllFileContentMock).toHaveBeenCalledTimes(1);
        expect(batchClearAllFileContentMock).toHaveBeenCalledWith('properties');
    });

    it('always clears persisted properties regardless of display setting changes', async () => {
        const provider = new MarkdownPipelineContentProvider(new App());
        const oldSettings = createSettings({});
        const newSettings = createSettings({});

        await provider.clearContent({ oldSettings, newSettings });

        expect(batchClearAllFileContentMock).toHaveBeenCalledTimes(1);
        expect(batchClearAllFileContentMock).toHaveBeenCalledWith('properties');
    });

    it('never triggers vault-wide regeneration from appearance-only setting changes', () => {
        const provider = new MarkdownPipelineContentProvider(new App());
        const oldSettings = createSettings({});
        const newSettings = createSettings({ showTooltips: true });

        expect(provider.shouldRegenerate(oldSettings, newSettings)).toBe(false);
    });
});
