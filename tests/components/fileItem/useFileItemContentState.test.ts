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
import { createDefaultFileData, type FileData } from '../../../src/storage/IndexedDBStorage';
import {
    loadFileItemCacheSnapshot,
    shouldRefreshFileItemMetadataVersionForContentChange,
    type FileItemContentDb
} from '../../../src/components/fileItem/useFileItemContentState';

function createFileRecord(patch?: Partial<FileData>): FileData {
    const base = createDefaultFileData({ mtime: 0, path: 'Notes/Daily.md' });
    return {
        ...base,
        ...(patch ?? {})
    };
}

function createContentDb(fileData: FileData | null): FileItemContentDb {
    return {
        getFile: () => fileData,
        onFileContentChange: () => () => {}
    };
}

describe('useFileItemContentState helpers', () => {
    it('refreshes metadata version only for metadata changes', () => {
        expect(
            shouldRefreshFileItemMetadataVersionForContentChange({
                changes: {
                    properties: [{ fieldKey: 'status', value: 'open', valueKind: 'string' }]
                }
            })
        ).toBe(false);

        expect(
            shouldRefreshFileItemMetadataVersionForContentChange({
                changes: {
                    metadata: { name: 'Daily note' }
                }
            })
        ).toBe(true);
    });

    it('loads cached properties from the file record', () => {
        const record = createFileRecord({
            properties: [{ fieldKey: 'status', value: 'open', valueKind: 'string' }]
        });

        const snapshot = loadFileItemCacheSnapshot({
            app: undefined as never,
            file: { path: 'notes/note.md' } as never,
            db: createContentDb(record),
            loadOptions: { loadTags: false }
        });

        expect(snapshot.properties).toEqual([{ fieldKey: 'status', value: 'open', valueKind: 'string' }]);
    });
});
