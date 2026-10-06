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
import { describe, expect, it, vi } from 'vitest';
import { createDefaultFileData, type FileData } from '../../../src/storage/IndexedDBStorage';
import {
    applyFileItemContentChangeToBox,
    loadFileItemCacheSnapshot,
    shouldRefreshFileItemMetadataVersionForContentChange,
    subscribeToFileItemContentState,
    type FileItemCacheSnapshot,
    type FileItemContentBox,
    type FileItemContentDb
} from '../../../src/components/fileItem/useFileItemContentState';
import { createTestTFile } from '../../utils/createTestTFile';

function createFileRecord(patch?: Partial<FileData>): FileData {
    const base = createDefaultFileData({ mtime: 0, path: 'Notes/Daily.md' });
    return {
        ...base,
        ...(patch ?? {})
    };
}

function createContentDb(fileData: FileData | null): FileItemContentDb {
    return {
        getCachedPreviewText: () => 'Cached preview text',
        getFile: () => fileData,
        onFileContentChange: () => () => {},
        ensurePreviewTextLoaded: async () => {},
        getFeatureImageBlob: async () => null
    };
}

describe('useFileItemContentState helpers', () => {



    it('refreshes metadata version only for metadata or skipped feature-image changes', () => {
        expect(
            shouldRefreshFileItemMetadataVersionForContentChange({
                changes: {
                    properties: [{ fieldKey: 'status', value: 'open', valueKind: 'string' }]
                },
                shouldLoadFeatureImage: false,
                refreshMetadataVersionOnFeatureImageChange: true
            })
        ).toBe(false);

        expect(
            shouldRefreshFileItemMetadataVersionForContentChange({
                changes: {
                    metadata: { name: 'Daily note' }
                },
                shouldLoadFeatureImage: true,
                refreshMetadataVersionOnFeatureImageChange: false
            })
        ).toBe(true);

        expect(
            shouldRefreshFileItemMetadataVersionForContentChange({
                changes: {
                    featureImageKey: 'd:excalidraw:Notes/Drawing.md'
                },
                shouldLoadFeatureImage: false,
                refreshMetadataVersionOnFeatureImageChange: true
            })
        ).toBe(true);

        expect(
            shouldRefreshFileItemMetadataVersionForContentChange({
                changes: {
                    featureImageStatus: 'has'
                },
                shouldLoadFeatureImage: false,
                refreshMetadataVersionOnFeatureImageChange: true
            })
        ).toBe(true);

        expect(
            shouldRefreshFileItemMetadataVersionForContentChange({
                changes: {
                    featureImageKey: 'feature-1'
                },
                shouldLoadFeatureImage: true,
                refreshMetadataVersionOnFeatureImageChange: true
            })
        ).toBe(false);

        expect(
            shouldRefreshFileItemMetadataVersionForContentChange({
                changes: {
                    featureImageKey: 'feature-1'
                },
                shouldLoadFeatureImage: false,
                refreshMetadataVersionOnFeatureImageChange: false
            })
        ).toBe(false);
    });





    it('versions direct image resource URLs by file mtime', () => {
        const app = new App();
        const file = createTestTFile('Assets/Image.png');
        file.stat.mtime = 1234;
        app.vault.getResourcePath = () => 'app://local/Assets/Image.png';

        const snapshot = loadFileItemCacheSnapshot({
            app,
            file,
            showPreview: false,
            showImage: true,
            db: createContentDb(null)
        });

        expect(snapshot.featureImageKey).toBe('direct-image:Assets/Image.png@1234');
        expect(snapshot.featureImageUrl).toBe('app://local/Assets/Image.png?nn-mtime=1234');
    });

    it('does not create direct preview URLs for SVG files', () => {
        const app = new App();
        const file = createTestTFile('Assets/Icon.svg');
        file.stat.mtime = 1234;
        app.vault.getResourcePath = () => 'app://local/Assets/Icon.svg';

        const snapshot = loadFileItemCacheSnapshot({
            app,
            file,
            showPreview: false,
            showImage: true,
            db: createContentDb(null)
        });

        expect(snapshot.featureImageKey).toBeNull();
        expect(snapshot.featureImageUrl).toBeNull();
    });

});
