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

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { App, TFile } from 'obsidian';
import type { CachedMetadata } from 'obsidian';
import { DEFAULT_SETTINGS } from '../../src/settings/defaultSettings';
import type { ContentProviderType } from '../../src/interfaces/IContentProvider';
import type { NotebookNavigatorSettings } from '../../src/settings/types';
import type { FileData } from '../../src/storage/IndexedDBStorage';
import { filterFilesRequiringMetadataSources } from '../../src/context/storageQueueFilters';

class FakeDB {
    private readonly files = new Map<string, FileData>();

    setFile(path: string, data: FileData): void {
        this.files.set(path, data);
    }

    getFiles(paths: string[]): Map<string, FileData> {
        const result = new Map<string, FileData>();
        for (const path of paths) {
            const record = this.files.get(path);
            if (record) {
                result.set(path, record);
            }
        }
        return result;
    }
}

let db: FakeDB;

vi.mock('../../src/storage/fileOperations', () => ({
    getDBInstance: () => db
}));

function createFileData(overrides: Partial<FileData>): FileData {
    return {
        mtime: 0,
        markdownPipelineMtime: 0,
        tagsMtime: 0,
        metadataMtime: 0,
        tags: null,
        wordCount: null,
        properties: null,
        previewStatus: 'unprocessed',
        metadata: null,
        ...overrides
    };
}

describe('Storage queue filters', () => {
    let settings: NotebookNavigatorSettings;

    beforeEach(() => {
        db = new FakeDB();
        settings = { ...DEFAULT_SETTINGS };
    });

    it('includes markdown files when tagsMtime is reset even if tags already exist', () => {
        const file = new TFile();
        file.path = 'notes/note.md';
        file.extension = 'md';
        file.stat.mtime = 123;

        db.setFile(
            file.path,
            createFileData({
                mtime: file.stat.mtime,
                tags: ['tag'],
                tagsMtime: 0
            })
        );

        const types: ContentProviderType[] = ['tags'];
        const result = filterFilesRequiringMetadataSources([file], types, settings);

        expect(result).toEqual([file]);
    });

    it('includes markdown files conservatively for metadata when hidden rules are active', () => {
        const file = new TFile();
        file.path = 'notes/note.md';
        file.extension = 'md';
        file.stat.mtime = 1111;

        db.setFile(
            file.path,
            createFileData({
                mtime: file.stat.mtime,
                metadataMtime: file.stat.mtime,
                metadata: { hidden: false }
            })
        );

        settings = {
            ...settings,
            vaultProfiles: [
                {
                    ...settings.vaultProfiles[0],
                    hiddenFileProperties: ['hide']
                }
            ]
        };

        const app = new App();
        app.metadataCache.getFileCache = () => ({ frontmatter: { title: 'Note' } });

        const types: ContentProviderType[] = ['metadata'];
        const strictResult = filterFilesRequiringMetadataSources([file], types, settings);
        expect(strictResult).toEqual([]);

        const conservativeReadyResult = filterFilesRequiringMetadataSources([file], types, settings, {
            conservativeMetadata: true,
            app
        });
        expect(conservativeReadyResult).toEqual([]);

        app.metadataCache.getFileCache = () => ({ frontmatter: { hide: true } });

        const conservativeChangedResult = filterFilesRequiringMetadataSources([file], types, settings, {
            conservativeMetadata: true,
            app
        });
        expect(conservativeChangedResult).toEqual([file]);

        app.metadataCache.getFileCache = () => null;

        const conservativeMissingResult = filterFilesRequiringMetadataSources([file], types, settings, {
            conservativeMetadata: true,
            app
        });
        expect(conservativeMissingResult).toEqual([file]);
    });

