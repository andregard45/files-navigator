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

import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { App, TFile } from 'obsidian';
import type { FileContentChange, IndexedDBStorage, PropertyItem } from '../../storage/IndexedDBStorage';
import { getCachedFileTags } from '../../utils/tagUtils';
import { arePropertyItemsEqual, clonePropertyItems } from '../../utils/propertyUtils';
import { areStringArraysEqual } from '../../utils/arrayUtils';

export type FileItemContentDb = Pick<IndexedDBStorage, 'getFile' | 'onFileContentChange'>;

export interface FileItemCacheSnapshot {
    tags: string[];
    properties: PropertyItem[] | null;
}

export interface FileItemContentLoadOptions {
    loadTags?: boolean;
    loadProperties?: boolean;
}

type ResolvedFileItemContentLoadOptions = Required<FileItemContentLoadOptions>;

export interface UseFileItemContentStateParams {
    app: App;
    file: TFile;
    fileStatMtime?: number;
    getDB: () => FileItemContentDb;
    loadOptions?: FileItemContentLoadOptions;
}

export interface FileItemContentState {
    tags: string[];
    properties: PropertyItem[] | null;
    metadataVersion: number;
}

export function subscribeToFileItemContentState(params: {
    db: FileItemContentDb;
    filePath: string;
    loadSnapshot: () => FileItemCacheSnapshot;
    applySnapshot: (snapshot: FileItemCacheSnapshot) => void;
    onChange: (changes: FileContentChange['changes']) => void;
}): () => void {
    const { db, filePath, loadSnapshot, applySnapshot, onChange } = params;
    const unsubscribe = db.onFileContentChange(filePath, onChange);
    applySnapshot(loadSnapshot());
    return unsubscribe;
}

export function shouldRefreshFileItemMetadataVersionForContentChange({
    changes
}: {
    changes: FileContentChange['changes'];
}): boolean {
    return changes.metadata !== undefined;
}

function resolveFileItemContentLoadOptions(loadOptions?: FileItemContentLoadOptions): ResolvedFileItemContentLoadOptions {
    return {
        loadTags: loadOptions?.loadTags ?? true,
        loadProperties: loadOptions?.loadProperties ?? true
    };
}

export function loadFileItemCacheSnapshot({
    app,
    file,
    db,
    loadOptions
}: {
    app: App;
    file: TFile;
    db: FileItemContentDb;
    loadOptions?: FileItemContentLoadOptions;
}): FileItemCacheSnapshot {
    const { loadTags: shouldLoadTags, loadProperties: shouldLoadProperties } = resolveFileItemContentLoadOptions(loadOptions);
    const shouldReadFileRecord = shouldLoadTags || shouldLoadProperties;
    const record = shouldReadFileRecord ? db.getFile(file.path) : null;
    const tags = shouldLoadTags ? [...getCachedFileTags({ app, file, db, fileData: record })] : [];
    const properties = shouldLoadProperties ? clonePropertyItems(record?.properties ?? null) : null;

    return {
        tags,
        properties
    };
}

/** Cached row content fields stored together with metadata refresh bookkeeping. */
export type FileItemContentBox = FileItemCacheSnapshot & { metadataVersion: number };

function boxFromSnapshot(snapshot: FileItemCacheSnapshot): FileItemContentBox {
    return {
        tags: snapshot.tags,
        properties: snapshot.properties,
        metadataVersion: 0
    };
}

/** Merges a fresh cache snapshot into the previous box, preserving field identity for unchanged values. */
function mergeSnapshotIntoBox(prev: FileItemContentBox, snapshot: FileItemCacheSnapshot): FileItemContentBox {
    const tags = areStringArraysEqual(prev.tags, snapshot.tags) ? prev.tags : snapshot.tags;
    const properties = arePropertyItemsEqual(prev.properties, snapshot.properties) ? prev.properties : snapshot.properties;
    if (tags === prev.tags && properties === prev.properties) {
        return prev;
    }

    return {
        ...boxFromSnapshot(snapshot),
        tags,
        properties,
        metadataVersion: prev.metadataVersion
    };
}

export function applyFileItemContentChangeToBox({
    prev,
    changes,
    shouldLoadTags,
    shouldLoadProperties,
    shouldRefreshMetadataVersion
}: {
    prev: FileItemContentBox;
    changes: FileContentChange['changes'];
    shouldLoadTags: boolean;
    shouldLoadProperties: boolean;
    shouldRefreshMetadataVersion: boolean;
}): FileItemContentBox {
    let next = prev;
    const mutate = (): FileItemContentBox => {
        if (next === prev) {
            next = { ...prev };
        }
        return next;
    };

    if (changes.tags !== undefined && shouldLoadTags) {
        const nextTags = changes.tags ?? [];
        if (!areStringArraysEqual(prev.tags, nextTags)) {
            mutate().tags = [...nextTags];
        }
    }

    if (changes.properties !== undefined && shouldLoadProperties) {
        const nextProperties = changes.properties ?? null;
        if (!arePropertyItemsEqual(prev.properties, nextProperties)) {
            mutate().properties = clonePropertyItems(nextProperties);
        }
    }

    if (shouldRefreshMetadataVersion) {
        mutate().metadataVersion = prev.metadataVersion + 1;
    }

    return next;
}

export function useFileItemContentState({
    app,
    file,
    getDB,
    loadOptions
}: UseFileItemContentStateParams): FileItemContentState {
    const loadTagsOption = loadOptions?.loadTags;
    const loadPropertiesOption = loadOptions?.loadProperties;
    const resolvedLoadOptions = useMemo(
        () =>
            resolveFileItemContentLoadOptions({
                loadTags: loadTagsOption,
                loadProperties: loadPropertiesOption
            }),
        [loadPropertiesOption, loadTagsOption]
    );
    const { loadTags: shouldLoadTags, loadProperties: shouldLoadProperties } = resolvedLoadOptions;
    const loadSnapshot = useCallback(() => {
        return loadFileItemCacheSnapshot({
            app,
            file,
            db: getDB(),
            loadOptions: resolvedLoadOptions
        });
    }, [app, file, getDB, resolvedLoadOptions]);

    const initialDataRef = useRef<FileItemCacheSnapshot | null>(null);
    const initialData = initialDataRef.current ?? loadSnapshot();
    initialDataRef.current = initialData;

    const [box, setBox] = useState<FileItemContentBox>(() => boxFromSnapshot(initialData));

    useLayoutEffect(() => {
        const db = getDB();
        const unsubscribe = subscribeToFileItemContentState({
            db,
            filePath: file.path,
            loadSnapshot,
            applySnapshot: initialSnapshot => {
                setBox(prev => mergeSnapshotIntoBox(prev, initialSnapshot));
            },
            onChange: (changes: FileContentChange['changes']) => {
                const shouldRefreshMetadataVersion = shouldRefreshFileItemMetadataVersionForContentChange({ changes });

                setBox(prev =>
                    applyFileItemContentChangeToBox({
                        prev,
                        changes,
                        shouldLoadTags,
                        shouldLoadProperties,
                        shouldRefreshMetadataVersion
                    })
                );
            }
        });

        return () => {
            unsubscribe();
        };
    }, [file, file.path, getDB, loadSnapshot, shouldLoadProperties, shouldLoadTags]);

    return {
        tags: box.tags,
        properties: box.properties,
        metadataVersion: box.metadataVersion
    };
}
