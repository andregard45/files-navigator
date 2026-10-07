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

import { STORE_NAME } from './constants';

const LEGACY_FEATURE_IMAGE_STORE_NAME = 'featureImageBlobs';
const LEGACY_PREVIEW_STORE_NAME = 'filePreviews';

export function handleUpgradeNeeded(event: IDBVersionChangeEvent): void {
    const target = event.target;
    if (!(target instanceof IDBOpenDBRequest)) {
        return;
    }
    const db = target.result;

    if (!db.objectStoreNames.contains(STORE_NAME)) {
        // Use out-of-line keys since we removed path from FileData
        const store = db.createObjectStore(STORE_NAME);

        store.createIndex('mtime', 'mtime', { unique: false });
        store.createIndex('tags', 'tags', { unique: false, multiEntry: true });
    }

    // Schema v4 removes the feature image blob store entirely.
    if (db.objectStoreNames.contains(LEGACY_FEATURE_IMAGE_STORE_NAME)) {
        db.deleteObjectStore(LEGACY_FEATURE_IMAGE_STORE_NAME);
    }

    // Schema v5 removes the preview text store entirely (preview feature deleted).
    if (db.objectStoreNames.contains(LEGACY_PREVIEW_STORE_NAME)) {
        db.deleteObjectStore(LEGACY_PREVIEW_STORE_NAME);
    }

    const transaction = target.transaction;
    if (!transaction) {
        return;
    }

    if (event.oldVersion < 2) {
        // v1 cache payloads are not migrated; clear the store so the cache is rebuilt.

        try {
            if (transaction.objectStoreNames.contains(STORE_NAME)) {
                transaction.objectStore(STORE_NAME).clear();
            }
        } catch (error: unknown) {
            console.error('[IndexedDB] clear failed during upgrade', { store: STORE_NAME, error });
        }
    }
}
