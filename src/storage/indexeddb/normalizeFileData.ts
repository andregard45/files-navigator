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

import { type FileData, isPropertyData } from './fileData';

type MutableFileData = Partial<FileData> & { customProperty?: unknown };

export function normalizeFileDataInPlace(data: MutableFileData): FileData {
    data.mtime = typeof data.mtime === 'number' ? data.mtime : 0;
    // Default provider processed mtimes to the stored mtime for existing databases.
    // New files explicitly initialize these to 0 so providers run at least once.
    data.markdownPipelineMtime = typeof data.markdownPipelineMtime === 'number' ? data.markdownPipelineMtime : data.mtime;
    data.tagsMtime = typeof data.tagsMtime === 'number' ? data.tagsMtime : data.mtime;
    data.metadataMtime = typeof data.metadataMtime === 'number' ? data.metadataMtime : data.mtime;
    data.tags = Array.isArray(data.tags) ? data.tags : null;
    const rawProperties = data.properties ?? data.customProperty;
    data.properties = isPropertyData(rawProperties) ? rawProperties : null;
    if ('customProperty' in data) {
        delete data.customProperty;
    }
    // The MemoryFileCache is used for synchronous rendering and should not hold blob payloads.
    data.metadata = data.metadata && typeof data.metadata === 'object' ? data.metadata : null;

    return data as FileData;
}

export function normalizeFileData(data: Partial<FileData>): FileData {
    const copy: MutableFileData = { ...data };
    return normalizeFileDataInPlace(copy);
}
