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

import { isMarkdownPath } from '../../utils/fileTypeUtils';
import { type MemoryFileCache } from '../MemoryFileCache';
import { PREVIEW_STORE_NAME, STORE_NAME } from './constants';
import {
    applyFileMetadataPatch,
    getDefaultPreviewStatusForPath,
    hasMetadataDecorationChanged,
    hasMetadataHiddenChanged,
    hasMetadataNameChanged,
    type FileContentChange,
    type FileData,
    type PreviewStatus
} from './fileData';

interface ContentMutationOperationDeps {
    db: IDBDatabase;
    cache: MemoryFileCache;
    normalizeFileData: (data: Partial<FileData> & { preview?: string | null }) => FileData;
    emitChanges: (changes: FileContentChange[]) => void;
    normalizeIdbError: (error: unknown, fallbackMessage: string) => Error;
    rejectWithTransactionError: (
        reject: (reason?: unknown) => void,
        transaction: IDBTransaction,
        lastRequestError: DOMException | Error | null,
        fallbackMessage: string
    ) => void;
}

export async function runUpdateFileMetadata(
    deps: ContentMutationOperationDeps,
    params: {
        path: string;
        metadata: {
            name?: string;
            created?: number;
            modified?: number;
            icon?: string;
            color?: string;
            background?: string;
        };
    }
): Promise<void> {
    const { path, metadata } = params;
    const transaction = deps.db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    let updated: FileData | null = null;
    let metadataHiddenChanged = false;
    let metadataNameChanged = false;
    let metadataDecorationChanged = false;
    const opMeta = 'updateFileMetadata';
    let lastRequestErrorMeta: DOMException | Error | null = null;

    await new Promise<void>((resolve, reject) => {
        const getReq = store.get(path);
        getReq.onsuccess = () => {
            const existingRaw = (getReq.result as Partial<FileData> | undefined) || null;
            if (!existingRaw) {
                resolve();
                return;
            }
            const existing = deps.normalizeFileData(existingRaw);
            const metadataPatch = applyFileMetadataPatch(existing.metadata, metadata);
            if (!metadataPatch.changed) {
                resolve();
                return;
            }

            const newMeta = metadataPatch.metadata;
            metadataHiddenChanged = hasMetadataHiddenChanged(existing.metadata, newMeta);
            metadataNameChanged = hasMetadataNameChanged(existing.metadata, newMeta);
            metadataDecorationChanged = hasMetadataDecorationChanged(existing.metadata, newMeta);
            updated = { ...existing, metadata: newMeta };
            const putReq = store.put(updated, path);
            putReq.onerror = () => {
                lastRequestErrorMeta = putReq.error || null;
                console.error('[IndexedDB] put failed', {
                    store: STORE_NAME,
                    op: opMeta,
                    path,
                    name: putReq.error?.name,
                    message: putReq.error?.message
                });
            };
        };
        getReq.onerror = () => {
            lastRequestErrorMeta = getReq.error || null;
            console.error('[IndexedDB] get failed', {
                store: STORE_NAME,
                op: opMeta,
                path,
                name: getReq.error?.name,
                message: getReq.error?.message
            });
            try {
                transaction.abort();
            } catch (e) {
                void e;
            }
        };
        transaction.oncomplete = () => resolve();
        transaction.onabort = () => {
            console.error('[IndexedDB] transaction aborted', {
                store: STORE_NAME,
                op: opMeta,
                path,
                txError: transaction.error?.message,
                reqError: lastRequestErrorMeta?.message
            });
            deps.rejectWithTransactionError(reject, transaction, lastRequestErrorMeta, 'Transaction aborted');
        };
        transaction.onerror = () => {
            console.error('[IndexedDB] transaction error', {
                store: STORE_NAME,
                op: opMeta,
                path,
                txError: transaction.error?.message,
                reqError: lastRequestErrorMeta?.message
            });
            deps.rejectWithTransactionError(reject, transaction, lastRequestErrorMeta, 'Transaction error');
        };
    });

    if (updated) {
        const updatedRecord: FileData = updated;
        deps.cache.updateFile(path, updatedRecord);
        deps.emitChanges([
            {
                path,
                changes: { metadata: updatedRecord.metadata },
                changeType: 'metadata',
                metadataHiddenChanged,
                metadataNameChanged,
                metadataDecorationChanged
            }
        ]);
    }
}

export async function runBatchClearAllFileContent(
    deps: ContentMutationOperationDeps,
    params: { type: 'preview' | 'metadata' | 'tags' | 'properties' | 'all' }
): Promise<void> {
    const { type } = params;
    const transaction = deps.db.transaction([STORE_NAME, PREVIEW_STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const previewStore = transaction.objectStore(PREVIEW_STORE_NAME);
    const changeNotifications: FileContentChange[] = [];
    const cacheUpdates: { path: string; data: FileData }[] = [];
    const op = 'batchClearAllFileContent';
    let lastRequestError: DOMException | Error | null = null;

    await new Promise<void>((resolve, reject) => {
        if (type === 'preview' || type === 'all') {
            const clearReq = previewStore.clear();
            clearReq.onerror = () => {
                lastRequestError = clearReq.error || null;
                console.error('[IndexedDB] clear failed', {
                    store: PREVIEW_STORE_NAME,
                    op,
                    name: clearReq.error?.name,
                    message: clearReq.error?.message
                });
            };
        }
        const request = store.openCursor();

        request.onsuccess = () => {
            const cursor = request.result;
            if (cursor) {
                const current = deps.normalizeFileData(cursor.value as Partial<FileData>);
                const updated: FileData = { ...current };
                const changes: FileContentChange['changes'] = {};
                let metadataHiddenChanged = false;
                let metadataNameChanged = false;
                let metadataDecorationChanged = false;
                let hasChanges = false;

                const path = cursor.key;
                if (typeof path !== 'string') {
                    cursor.continue();
                    return;
                }
                const isMarkdown = isMarkdownPath(path);

                if (type === 'preview' || type === 'all') {
                    const nextPreviewStatus = isMarkdown ? 'unprocessed' : 'none';
                    if (updated.previewStatus !== nextPreviewStatus) {
                        updated.previewStatus = nextPreviewStatus;
                        changes.preview = null;
                        changes.previewStatus = nextPreviewStatus;
                        hasChanges = true;
                    }
                }
                if (type === 'metadata' || type === 'all') {
                    if (isMarkdown) {
                        if (updated.metadata !== null) {
                            metadataHiddenChanged = hasMetadataHiddenChanged(current.metadata, null);
                            metadataNameChanged = hasMetadataNameChanged(current.metadata, null);
                            metadataDecorationChanged = hasMetadataDecorationChanged(current.metadata, null);
                            updated.metadata = null;
                            changes.metadata = null;
                            hasChanges = true;
                        }
                    } else if (updated.metadata === null) {
                        metadataHiddenChanged = hasMetadataHiddenChanged(current.metadata, {});
                        metadataNameChanged = hasMetadataNameChanged(current.metadata, {});
                        metadataDecorationChanged = hasMetadataDecorationChanged(current.metadata, {});
                        updated.metadata = {};
                        changes.metadata = {};
                        hasChanges = true;
                    }
                }
                if (type === 'tags' || type === 'all') {
                    if (isMarkdown) {
                        if (updated.tags !== null) {
                            updated.tags = null;
                            changes.tags = null;
                            hasChanges = true;
                        }
                    } else if (updated.tags === null) {
                        updated.tags = [];
                        changes.tags = [];
                        hasChanges = true;
                    }
                }
                if ((type === 'properties' || type === 'all') && updated.properties !== null) {
                    updated.properties = null;
                    changes.properties = null;
                    hasChanges = true;
                }

                if (hasChanges) {
                    const updateReq = cursor.update(updated);
                    updateReq.onerror = () => {
                        lastRequestError = updateReq.error || null;
                        console.error('[IndexedDB] cursor.update failed', {
                            store: STORE_NAME,
                            op,
                            path,
                            name: updateReq.error?.name,
                            message: updateReq.error?.message
                        });
                        try {
                            transaction.abort();
                        } catch (e) {
                            void e;
                        }
                    };
                    cacheUpdates.push({ path, data: updated });
                    const hasContentCleared =
                        changes.preview === null ||
                        changes.previewStatus !== undefined ||
                        changes.properties === null;
                    const hasMetadataCleared = changes.metadata === null || changes.tags !== undefined;
                    const clearType = hasContentCleared && hasMetadataCleared ? 'both' : hasContentCleared ? 'content' : 'metadata';
                    const contentChange: FileContentChange = { path, changes, changeType: clearType };
                    if (changes.metadata !== undefined) {
                        contentChange.metadataHiddenChanged = metadataHiddenChanged;
                        contentChange.metadataNameChanged = metadataNameChanged;
                        contentChange.metadataDecorationChanged = metadataDecorationChanged;
                    }
                    changeNotifications.push(contentChange);
                }

                cursor.continue();
            }
        };

        request.onerror = () => {
            const requestError = request.error;
            lastRequestError = requestError || null;
            console.error('[IndexedDB] openCursor failed', {
                store: STORE_NAME,
                op,
                name: requestError?.name,
                message: requestError?.message
            });
            reject(deps.normalizeIdbError(requestError, 'Cursor request failed'));
        };

        transaction.oncomplete = () => {
            if (cacheUpdates.length > 0) {
                deps.cache.batchUpdate(cacheUpdates);
                deps.emitChanges(changeNotifications);
            }
            resolve();
        };
        transaction.onabort = () => {
            console.error('[IndexedDB] transaction aborted', {
                store: STORE_NAME,
                op,
                txError: transaction.error?.message,
                reqError: lastRequestError?.message
            });
            deps.rejectWithTransactionError(reject, transaction, lastRequestError, 'Transaction aborted');
        };
        transaction.onerror = () => {
            console.error('[IndexedDB] transaction error', {
                store: STORE_NAME,
                op,
                txError: transaction.error?.message,
                reqError: lastRequestError?.message
            });
            deps.rejectWithTransactionError(reject, transaction, lastRequestError, 'Transaction error');
        };
    });
}

export async function runBatchClearFileContent(
    deps: ContentMutationOperationDeps,
    params: { paths: string[]; type: 'preview' | 'metadata' | 'tags' | 'properties' | 'all' }
): Promise<void> {
    const { paths, type } = params;
    const transaction = deps.db.transaction([STORE_NAME, PREVIEW_STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const previewStore = transaction.objectStore(PREVIEW_STORE_NAME);
    const updates: { path: string; data: FileData }[] = [];
    const changeNotifications: FileContentChange[] = [];
    const op = 'batchClearFileContent';
    let lastRequestError: DOMException | Error | null = null;

    await new Promise<void>((resolve, reject) => {
        if (paths.length === 0) {
            resolve();
            return;
        }

        paths.forEach(path => {
            const getReq = store.get(path);
            getReq.onsuccess = () => {
                const existingRaw = (getReq.result as Partial<FileData> | undefined) || null;
                if (!existingRaw) {
                    return;
                }
                const file = { ...deps.normalizeFileData(existingRaw) };
                const changes: FileContentChange['changes'] = {};
                let metadataHiddenChanged = false;
                let metadataNameChanged = false;
                let metadataDecorationChanged = false;
                let hasChanges = false;
                if (type === 'preview' || type === 'all') {
                    const nextPreviewStatus = getDefaultPreviewStatusForPath(path);
                    if (file.previewStatus !== nextPreviewStatus) {
                        file.previewStatus = nextPreviewStatus;
                        changes.preview = null;
                        changes.previewStatus = nextPreviewStatus;
                        hasChanges = true;
                    }
                    const deleteReq = previewStore.delete(path);
                    deleteReq.onerror = () => {
                        lastRequestError = deleteReq.error || null;
                        console.error('[IndexedDB] delete failed', {
                            store: PREVIEW_STORE_NAME,
                            op,
                            path,
                            name: deleteReq.error?.name,
                            message: deleteReq.error?.message
                        });
                    };
                }
                if ((type === 'metadata' || type === 'all') && file.metadata !== null) {
                    metadataHiddenChanged = hasMetadataHiddenChanged(file.metadata, null);
                    metadataNameChanged = hasMetadataNameChanged(file.metadata, null);
                    metadataDecorationChanged = hasMetadataDecorationChanged(file.metadata, null);
                    file.metadata = null;
                    changes.metadata = null;
                    hasChanges = true;
                }
                if ((type === 'tags' || type === 'all') && file.tags !== null) {
                    file.tags = null;
                    changes.tags = null;
                    hasChanges = true;
                }
                if ((type === 'properties' || type === 'all') && file.properties !== null) {
                    file.properties = null;
                    changes.properties = null;
                    hasChanges = true;
                }
                if (hasChanges) {
                    const putReq = store.put(file, path);
                    putReq.onerror = () => {
                        lastRequestError = putReq.error || null;
                        console.error('[IndexedDB] put failed', {
                            store: STORE_NAME,
                            op,
                            path,
                            name: putReq.error?.name,
                            message: putReq.error?.message
                        });
                    };
                    updates.push({ path, data: file });
                    const hasContentCleared =
                        changes.preview === null ||
                        changes.previewStatus !== undefined ||
                        changes.properties === null;
                    const hasMetadataCleared = changes.metadata === null || changes.tags !== undefined;
                    const clearType = hasContentCleared && hasMetadataCleared ? 'both' : hasContentCleared ? 'content' : 'metadata';
                    const contentChange: FileContentChange = { path, changes, changeType: clearType };
                    if (changes.metadata !== undefined) {
                        contentChange.metadataHiddenChanged = metadataHiddenChanged;
                        contentChange.metadataNameChanged = metadataNameChanged;
                        contentChange.metadataDecorationChanged = metadataDecorationChanged;
                    }
                    changeNotifications.push(contentChange);
                }
                // noop
            };
            getReq.onerror = () => {
                lastRequestError = getReq.error || null;
                console.error('[IndexedDB] get failed', {
                    store: STORE_NAME,
                    op,
                    path,
                    name: getReq.error?.name,
                    message: getReq.error?.message
                });
                try {
                    transaction.abort();
                } catch (e) {
                    void e;
                }
            };
        });

        transaction.oncomplete = () => resolve();
        transaction.onabort = () => {
            console.error('[IndexedDB] transaction aborted', {
                store: STORE_NAME,
                op,
                txError: transaction.error?.message,
                reqError: lastRequestError?.message
            });
            deps.rejectWithTransactionError(reject, transaction, lastRequestError, 'Transaction aborted');
        };
        transaction.onerror = () => {
            console.error('[IndexedDB] transaction error', {
                store: STORE_NAME,
                op,
                txError: transaction.error?.message,
                reqError: lastRequestError?.message
            });
            deps.rejectWithTransactionError(reject, transaction, lastRequestError, 'Transaction error');
        };
    });

    if (updates.length > 0) {
        deps.cache.batchUpdate(updates);
        deps.emitChanges(changeNotifications);
    }
}
