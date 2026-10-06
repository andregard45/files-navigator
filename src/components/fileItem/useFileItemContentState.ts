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

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { App, TFile } from 'obsidian';
import type { FeatureImageStatus, FileContentChange, IndexedDBStorage, PropertyItem } from '../../storage/IndexedDBStorage';
import { getCachedFileTags } from '../../utils/tagUtils';
import { isRasterImageFile } from '../../utils/fileTypeUtils';
import { arePropertyItemsEqual, clonePropertyItems } from '../../utils/propertyUtils';
import { areStringArraysEqual } from '../../utils/arrayUtils';
import { getVersionedResourcePath } from '../../utils/resourcePath';

const FEATURE_IMAGE_REGEN_THROTTLE_MS = 10000;

export type FileItemContentDb = Pick<IndexedDBStorage, 'getFile' | 'onFileContentChange' | 'getFeatureImageBlob'>;

export interface FileItemCacheSnapshot {
    tags: string[];
    featureImageKey: string | null;
    featureImageStatus: FeatureImageStatus;
    featureImageUrl: string | null;
    properties: PropertyItem[] | null;
}

export interface FileItemContentLoadOptions {
    loadTags?: boolean;
    loadFeatureImage?: boolean;
    loadProperties?: boolean;
}

type ResolvedFileItemContentLoadOptions = Required<FileItemContentLoadOptions>;

export interface UseFileItemContentStateParams {
    app: App;
    file: TFile;
    showImage: boolean;
    skipFeatureImage?: boolean;
    fileStatMtime?: number;
    getDB: () => FileItemContentDb;
    regenerateFeatureImageForFile: (file: TFile) => Promise<void>;
    loadOptions?: FileItemContentLoadOptions;
    refreshMetadataVersionOnFeatureImageChange?: boolean;
}

export interface FileItemContentState {
    tags: string[];
    featureImageKey: string | null;
    featureImageStatus: FeatureImageStatus;
    featureImageUrl: string | null;
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
    changes,
    shouldLoadFeatureImage,
    refreshMetadataVersionOnFeatureImageChange
}: {
    changes: FileContentChange['changes'];
    shouldLoadFeatureImage: boolean;
    refreshMetadataVersionOnFeatureImageChange: boolean;
}): boolean {
    if (changes.metadata !== undefined) {
        return true;
    }

    const hasFeatureImageChange = changes.featureImageKey !== undefined || changes.featureImageStatus !== undefined;
    return hasFeatureImageChange && !shouldLoadFeatureImage && refreshMetadataVersionOnFeatureImageChange;
}

function resolveFileItemContentLoadOptions(loadOptions?: FileItemContentLoadOptions): ResolvedFileItemContentLoadOptions {
    return {
        loadTags: loadOptions?.loadTags ?? true,
        loadFeatureImage: loadOptions?.loadFeatureImage ?? true,
        loadProperties: loadOptions?.loadProperties ?? true
    };
}

export function loadFileItemCacheSnapshot({
    app,
    file,
    showImage,
    skipFeatureImage,
    fileStatMtime = file.stat.mtime,
    db,
    loadOptions
}: {
    app: App;
    file: TFile;
    showImage: boolean;
    skipFeatureImage?: boolean;
    fileStatMtime?: number;
    db: FileItemContentDb;
    loadOptions?: FileItemContentLoadOptions;
}): FileItemCacheSnapshot {
    const {
        loadTags: shouldLoadTags,
        loadFeatureImage: shouldLoadFeatureImage,
        loadProperties: shouldLoadProperties
    } = resolveFileItemContentLoadOptions(loadOptions);
    const shouldReadFileRecord = shouldLoadTags || shouldLoadFeatureImage || shouldLoadProperties;
    const record = shouldReadFileRecord ? db.getFile(file.path) : null;
    const tags = shouldLoadTags ? [...getCachedFileTags({ app, file, db, fileData: record })] : [];
    const isDirectImageFile = shouldLoadFeatureImage && showImage && !skipFeatureImage && isRasterImageFile(file);
    const featureImageKey =
        shouldLoadFeatureImage && record?.featureImageKey
            ? record.featureImageKey
            : isDirectImageFile
              ? `direct-image:${file.path}@${fileStatMtime}`
              : null;
    const featureImageStatus: FeatureImageStatus = shouldLoadFeatureImage ? (record?.featureImageStatus ?? 'unprocessed') : 'unprocessed';
    const properties = shouldLoadProperties ? clonePropertyItems(record?.properties ?? null) : null;

    let featureImageUrl: string | null = null;
    if (isDirectImageFile) {
        try {
            featureImageUrl = getVersionedResourcePath(app, file, fileStatMtime);
        } catch {
            featureImageUrl = null;
        }
    }

    return {
        tags,
        featureImageKey,
        featureImageStatus,
        featureImageUrl,
        properties
    };
}

/** Cached row content fields stored together with metadata refresh bookkeeping. */
export type FileItemContentBox = Omit<FileItemContentState, 'featureImageUrl'>;

function boxFromSnapshot(snapshot: FileItemCacheSnapshot): FileItemContentBox {
    return {
        tags: snapshot.tags,
        featureImageKey: snapshot.featureImageKey,
        featureImageStatus: snapshot.featureImageStatus,
        properties: snapshot.properties,
        metadataVersion: 0
    };
}

/** Merges a fresh cache snapshot into the previous box, preserving field identity for unchanged values. */
function mergeSnapshotIntoBox(prev: FileItemContentBox, snapshot: FileItemCacheSnapshot): FileItemContentBox {
    const tags = areStringArraysEqual(prev.tags, snapshot.tags) ? prev.tags : snapshot.tags;
    const properties = arePropertyItemsEqual(prev.properties, snapshot.properties) ? prev.properties : snapshot.properties;
    if (
        tags === prev.tags &&
        prev.featureImageKey === snapshot.featureImageKey &&
        prev.featureImageStatus === snapshot.featureImageStatus &&
        properties === prev.properties
    ) {
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
    shouldLoadFeatureImage,
    shouldLoadProperties,
    shouldRefreshMetadataVersion
}: {
    prev: FileItemContentBox;
    changes: FileContentChange['changes'];
    shouldLoadTags: boolean;
    shouldLoadFeatureImage: boolean;
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

    if (changes.featureImageKey !== undefined && shouldLoadFeatureImage) {
        const nextKey = changes.featureImageKey ?? null;
        if (prev.featureImageKey !== nextKey) {
            mutate().featureImageKey = nextKey;
        }
    }

    if (changes.featureImageStatus !== undefined && shouldLoadFeatureImage) {
        if (prev.featureImageStatus !== changes.featureImageStatus) {
            mutate().featureImageStatus = changes.featureImageStatus;
        }
    }

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
    showImage,
    skipFeatureImage = false,
    fileStatMtime = file.stat.mtime,
    getDB,
    regenerateFeatureImageForFile,
    loadOptions,
    refreshMetadataVersionOnFeatureImageChange = false
}: UseFileItemContentStateParams): FileItemContentState {
    const loadTagsOption = loadOptions?.loadTags;
    const loadFeatureImageOption = loadOptions?.loadFeatureImage;
    const loadPropertiesOption = loadOptions?.loadProperties;
    const resolvedLoadOptions = useMemo(
        () =>
            resolveFileItemContentLoadOptions({
                loadTags: loadTagsOption,
                loadFeatureImage: loadFeatureImageOption,
                loadProperties: loadPropertiesOption
            }),
        [loadFeatureImageOption, loadPropertiesOption, loadTagsOption]
    );
    const {
        loadTags: shouldLoadTags,
        loadFeatureImage: shouldLoadFeatureImage,
        loadProperties: shouldLoadProperties
    } = resolvedLoadOptions;
    const loadSnapshot = useCallback(() => {
        return loadFileItemCacheSnapshot({
            app,
            file,
            showImage,
            skipFeatureImage,
            fileStatMtime,
            db: getDB(),
            loadOptions: resolvedLoadOptions
        });
    }, [app, file, fileStatMtime, getDB, resolvedLoadOptions, showImage, skipFeatureImage]);

    const initialDataRef = useRef<FileItemCacheSnapshot | null>(null);
    const initialData = initialDataRef.current ?? loadSnapshot();
    initialDataRef.current = initialData;

    const [box, setBox] = useState<FileItemContentBox>(() => boxFromSnapshot(initialData));
    const [featureImageUrl, setFeatureImageUrl] = useState<string | null>(initialData.featureImageUrl);

    const featureImageObjectUrlRef = useRef<string | null>(null);
    const lastFeatureImageRegenRef = useRef<{ key: string; at: number } | null>(null);
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
                const shouldRefreshMetadataVersion = shouldRefreshFileItemMetadataVersionForContentChange({
                    changes,
                    shouldLoadFeatureImage,
                    refreshMetadataVersionOnFeatureImageChange
                });

                setBox(prev =>
                    applyFileItemContentChangeToBox({
                        prev,
                        changes,
                        shouldLoadTags,
                        shouldLoadFeatureImage,
                        shouldLoadProperties,
                        shouldRefreshMetadataVersion
                    })
                );
            }
        });

        return () => {
            unsubscribe();
        };
    }, [
        file,
        file.path,
        getDB,
        loadSnapshot,
        shouldLoadFeatureImage,
        shouldLoadProperties,
        shouldLoadTags,
        refreshMetadataVersionOnFeatureImageChange
    ]);

    useEffect(() => {
        return () => {
            if (featureImageObjectUrlRef.current) {
                URL.revokeObjectURL(featureImageObjectUrlRef.current);
                featureImageObjectUrlRef.current = null;
            }
        };
    }, []);

    useEffect(() => {
        let isActive = true;

        if (featureImageObjectUrlRef.current) {
            URL.revokeObjectURL(featureImageObjectUrlRef.current);
            featureImageObjectUrlRef.current = null;
        }

        if (!shouldLoadFeatureImage || !showImage || skipFeatureImage) {
            setFeatureImageUrl(null);
            return () => {
                isActive = false;
            };
        }

        if (isRasterImageFile(file)) {
            try {
                setFeatureImageUrl(getVersionedResourcePath(app, file, fileStatMtime));
            } catch {
                setFeatureImageUrl(null);
            }

            return () => {
                isActive = false;
            };
        }

        if (box.featureImageStatus !== 'has' || !box.featureImageKey) {
            setFeatureImageUrl(null);
            return () => {
                isActive = false;
            };
        }

        const db = getDB();
        const expectedKey = box.featureImageKey;
        void db.getFeatureImageBlob(file.path, expectedKey).then(blob => {
            if (!isActive) {
                return;
            }

            if (!blob) {
                setFeatureImageUrl(null);
                const now = Date.now();
                const last = lastFeatureImageRegenRef.current;
                const shouldTrigger = !last || last.key !== expectedKey || now - last.at >= FEATURE_IMAGE_REGEN_THROTTLE_MS;
                if (shouldTrigger) {
                    lastFeatureImageRegenRef.current = { key: expectedKey, at: now };
                    void regenerateFeatureImageForFile(file);
                }
                return;
            }

            const nextUrl = URL.createObjectURL(blob);
            featureImageObjectUrlRef.current = nextUrl;
            setFeatureImageUrl(nextUrl);
        });

        return () => {
            isActive = false;
        };
    }, [
        app,
        box.featureImageKey,
        box.featureImageStatus,
        file,
        fileStatMtime,
        getDB,
        regenerateFeatureImageForFile,
        shouldLoadFeatureImage,
        showImage,
        skipFeatureImage
    ]);

    return {
        tags: box.tags,
        featureImageKey: box.featureImageKey,
        featureImageStatus: box.featureImageStatus,
        featureImageUrl,
        properties: box.properties,
        metadataVersion: box.metadataVersion
    };
}
