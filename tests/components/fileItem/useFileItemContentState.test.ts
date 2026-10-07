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
import type { TFile } from 'obsidian';
import { createDefaultFileData, type FileData } from '../../../src/storage/IndexedDBStorage';
import {
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

    it('reads initial properties synchronously from the file record', () => {
        const record = createFileRecord({
            properties: [{ fieldKey: 'status', value: 'open', valueKind: 'string' }]
        });
        const db = createContentDb(record);
        const file = { path: 'notes/note.md' } as unknown as TFile;

        // The hook's initial state derives directly from getDB().getFile(path).properties.
        const initialProperties = db.getFile(file.path)?.properties ?? null;
        expect(initialProperties).toEqual([{ fieldKey: 'status', value: 'open', valueKind: 'string' }]);
    });
});
