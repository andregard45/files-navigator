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

import type { ContentProviderType } from '../../types/contentProviders';
import { MemoryFileCache } from '../MemoryFileCache';
import { getProviderProcessedMtimeField } from '../providerMtime';
import { STORE_NAME } from './constants';
import {
    createDefaultFileData,
    getChangedPropertyKeys,
    hasMetadataDecorationChanged,
    hasMetadataHiddenChanged,
    hasMetadataNameChanged,
    type FileContentChange,
    type FileData
} from './fileData';
import { rejectWithTransactionError } from './idbErrors';

export interface BatchContentUpdate {
    path: string;
    tags?: string[] | null;
    metadata?: FileData['metadata'];
    properties?: FileData['properties'];
}

export interface ProviderProcessedMtimeUpdate {
    path: string;
    mtime: number;
    expectedPreviousMtime: number;
}

export interface BatchUpdateFileContentAndProviderProcessedMtimesParams {
    contentUpdates: BatchContentUpdate[];
    provider?: ContentProviderType;
    processedMtimeUpdates?: ProviderProcessedMtimeUpdate[];
}

interface BatchContentUpdateOperationDeps {
    db: IDBDatabase;
    cache: MemoryFileCache;
    normalizeFileData: (data: Partial<FileData>) => FileData;
    emitChanges: (changes: FileContentChange[]) => void;
}

export async function runBatchUpdateFileContentAndProviderProcessedMtimes(
    deps: BatchContentUpdateOperationDeps,
    params: BatchUpdateFileContentAndProviderProcessedMtimesParams
): Promise<void> {
    const contentUpdates = params.contentUpdates;
    const processedMtimeUpdates = params.processedMtimeUpdates ?? [];
    const provider = params.provider;

    if (processedMtimeUpdates.length > 0 && !provider) {
        throw new Error('Provider type required when updating processed mtimes');
    }

    if (contentUpdates.length === 0 && processedMtimeUpdates.length === 0) {
        return;
    }

    const contentUpdatesByPath = new Map<string, (typeof contentUpdates)[number]>();
    for (const update of contentUpdates) {
        contentUpdatesByPath.set(update.path, update);
    }

    const processedMtimeUpdatesByPath = new Map<string, (typeof processedMtimeUpdates)[number]>();
    for (const update of processedMtimeUpdates) {
        processedMtimeUpdatesByPath.set(update.path, update);
    }

    const pathsToUpdate = new Set<string>();
    contentUpdatesByPath.forEach((_value, path) => pathsToUpdate.add(path));
    processedMtimeUpdatesByPath.forEach((_value, path) => pathsToUpdate.add(path));

    if (pathsToUpdate.size === 0) {
        return;
    }

    const transaction = deps.db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const filesToUpdate: { path: string; data: FileData }[] = [];
    const changeNotifications: FileContentChange[] = [];
    let createdRecordWithoutKnownMtime = 0;
    const createdRecordWithoutKnownMtimeExamples: string[] = [];

    await new Promise<void>((resolve, reject) => {
        const op = 'batchUpdateFileContentAndProviderProcessedMtimes';
        let lastRequestError: DOMException | Error | null = null;
        pathsToUpdate.forEach(path => {
            const update = contentUpdatesByPath.get(path);
            const processedMtimeUpdate = processedMtimeUpdatesByPath.get(path);

            const getReq = store.get(path);
            getReq.onsuccess = () => {
                const existingRaw = (getReq.result as Partial<FileData> | undefined) || null;
                const fallbackMtime = processedMtimeUpdate?.mtime ?? 0;
                const existing = existingRaw
                    ? deps.normalizeFileData(existingRaw)
                    : deps.normalizeFileData(createDefaultFileData({ mtime: fallbackMtime, path }));
                if (!existingRaw && fallbackMtime === 0 && update) {
                    createdRecordWithoutKnownMtime += 1;
                    if (createdRecordWithoutKnownMtimeExamples.length < 5) {
                        createdRecordWithoutKnownMtimeExamples.push(path);
                    }
                }
                const newData: FileData = { ...existing };
                const changes: FileContentChange['changes'] = {};
                let metadataHiddenChanged = false;
                let metadataNameChanged = false;
                let metadataDecorationChanged = false;
                let changedPropertyKeys: string[] | undefined;
                let hasContentChanges = false;
                const providerField = provider ? getProviderProcessedMtimeField(provider) : null;
                const shouldApplyProviderContent =
                    !provider ||
                    !processedMtimeUpdate ||
                    !providerField ||
                    newData[providerField] === processedMtimeUpdate.expectedPreviousMtime;
                const guardedUpdate = shouldApplyProviderContent ? update : null;

                if (guardedUpdate) {
                    if (guardedUpdate.tags !== undefined) {
                        newData.tags = guardedUpdate.tags;
                        changes.tags = guardedUpdate.tags;
                        hasContentChanges = true;
                    }
                    if (guardedUpdate.properties !== undefined) {
                        changedPropertyKeys = getChangedPropertyKeys(existing.properties, guardedUpdate.properties);
                        newData.properties = guardedUpdate.properties;
                        changes.properties = guardedUpdate.properties;
                        hasContentChanges = true;
                    }

                    if (guardedUpdate.metadata !== undefined) {
                        metadataHiddenChanged = hasMetadataHiddenChanged(existing.metadata, guardedUpdate.metadata);
                        metadataNameChanged = hasMetadataNameChanged(existing.metadata, guardedUpdate.metadata);
                        metadataDecorationChanged = hasMetadataDecorationChanged(existing.metadata, guardedUpdate.metadata);
                        newData.metadata = guardedUpdate.metadata;
                        changes.metadata = guardedUpdate.metadata;
                        hasContentChanges = true;
                    }
                }

                let hasProviderMtimeChanges = false;
                if (processedMtimeUpdate && provider) {
                    const { mtime, expectedPreviousMtime } = processedMtimeUpdate;
                    const field = getProviderProcessedMtimeField(provider);
                    if (newData[field] === expectedPreviousMtime && newData[field] !== mtime) {
                        newData[field] = mtime;
                        hasProviderMtimeChanges = true;
                    }
                }

                const hasAnyChanges = hasContentChanges || hasProviderMtimeChanges;
                if (hasAnyChanges) {
                    const putReq = store.put(newData, path);
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

                    filesToUpdate.push({ path, data: newData });

                    if (hasContentChanges) {
                        const hasContentUpdates = changes.properties !== undefined;
                        const hasMetadataUpdates = changes.metadata !== undefined || changes.tags !== undefined;
                        const updateType = hasContentUpdates && hasMetadataUpdates ? 'both' : hasContentUpdates ? 'content' : 'metadata';
                        const contentChange: FileContentChange = { path, changes, changeType: updateType };
                        if (changes.properties !== undefined) {
                            contentChange.changedPropertyKeys = changedPropertyKeys;
                        }
                        if (changes.metadata !== undefined) {
                            contentChange.metadataHiddenChanged = metadataHiddenChanged;
                            contentChange.metadataNameChanged = metadataNameChanged;
                            contentChange.metadataDecorationChanged = metadataDecorationChanged;
                        }
                        changeNotifications.push(contentChange);
                    }
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
            rejectWithTransactionError(reject, transaction, lastRequestError, 'Transaction aborted');
        };
        transaction.onerror = () => {
            console.error('[IndexedDB] transaction error', {
                store: STORE_NAME,
                op,
                txError: transaction.error?.message,
                reqError: lastRequestError?.message
            });
            rejectWithTransactionError(reject, transaction, lastRequestError, 'Transaction error');
        };
    });

    if (filesToUpdate.length > 0) {
        deps.cache.batchUpdate(filesToUpdate);
        if (changeNotifications.length > 0) {
            deps.emitChanges(changeNotifications);
        }
    }
    if (createdRecordWithoutKnownMtime > 0) {
        console.error('[IndexedDB] Created file record without known mtime during content update', {
            count: createdRecordWithoutKnownMtime,
            examples: createdRecordWithoutKnownMtimeExamples
        });
    }
}
