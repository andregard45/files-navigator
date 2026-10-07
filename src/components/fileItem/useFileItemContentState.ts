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

import { useEffect, useState } from 'react';
import type { TFile } from 'obsidian';
import type { FileContentChange, IndexedDBStorage, PropertyItem } from '../../storage/IndexedDBStorage';
import { clonePropertyItems } from '../../utils/propertyUtils';

export type FileItemContentDb = Pick<IndexedDBStorage, 'getFile' | 'onFileContentChange'>;

export interface UseFileItemContentStateParams {
    file: TFile;
    getDB: () => FileItemContentDb;
}

export interface FileItemContentState {
    properties: PropertyItem[] | null;
    metadataVersion: number;
}

/** Returns true when a content change carries fresh file metadata and consumers should re-derive cached fields. */
export function shouldRefreshFileItemMetadataVersionForContentChange({
    changes
}: {
    changes: FileContentChange['changes'];
}): boolean {
    return changes.metadata !== undefined;
}

/**
 * Subscribes a file row to cached frontmatter properties and metadata-change notifications.
 * Initial values are read synchronously from the IndexedDB record for the file path.
 */
export function useFileItemContentState({ file, getDB }: UseFileItemContentStateParams): FileItemContentState {
    const [properties, setProperties] = useState<PropertyItem[] | null>(
        () => clonePropertyItems(getDB().getFile(file.path)?.properties ?? null)
    );
    const [metadataVersion, setMetadataVersion] = useState(0);

    useEffect(() => {
        const db = getDB();
        const initialRecord = db.getFile(file.path);
        setProperties(clonePropertyItems(initialRecord?.properties ?? null));

        const unsubscribe = db.onFileContentChange(file.path, (changes: FileContentChange['changes']) => {
            if (changes.properties !== undefined) {
                setProperties(clonePropertyItems(changes.properties ?? null));
            }
            if (shouldRefreshFileItemMetadataVersionForContentChange({ changes })) {
                setMetadataVersion(prev => prev + 1);
            }
        });

        return unsubscribe;
    }, [file, file.path, getDB]);

    return { properties, metadataVersion };
}
