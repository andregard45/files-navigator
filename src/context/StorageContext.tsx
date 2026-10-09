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

/**
 * StorageContext - Central state management for storage system
 *
 * What it does:
 * - Monitors vault changes and syncs with database
 * - Builds and maintains the tag tree structure
 * - Coordinates content generation via FrontmatterSyncService
 * - Provides real-time content updates to UI components
 *
 * Relationships:
 * - Uses: IndexedDBStorage, FrontmatterSyncService, FileOperations, DiffCalculator
 * - Provides: StorageContext to all child components
 * - Integrates with: Obsidian vault and metadata APIs
 *
 * Key responsibilities:
 * - Monitor file system events (create, delete, rename, modify)
 * - Calculate diffs and update database accordingly
 * - Rebuild tag tree when tags change
 * - Queue content generation for new/modified files
 * - Handle settings changes and trigger regeneration
 * - Provide metadata extraction methods with frontmatter fallback
 */

import { createContext, useContext, useState, useRef, ReactNode, useMemo, useCallback, useEffect } from 'react';
import { App, TFile, debounce, EventRef } from 'obsidian';
import { ProcessedMetadata, extractMetadata } from '../utils/metadataExtractor';
import { extractCurrentFrontmatterMetadataFromFileData } from '../utils/frontmatterMetadataCache';
import { FrontmatterSyncService, handleSettingsChange as planFrontmatterSettingsChange } from '../services/content/frontmatterSyncService';
import type { ContentProviderType } from '../types/contentProviders';
import type { NotebookNavigatorSettings } from '../settings/types';
import { getMetadataDependentTypes } from './storage/storageContentTypes';
import { useCacheRebuildNotice } from './storage/useCacheRebuildNotice';
import { useIndexedDBReady } from './storage/useIndexedDBReady';
import { useStorageCacheRebuild } from './storage/useStorageCacheRebuild';
import { useStorageContentQueue } from './storage/useStorageContentQueue';
import { useStorageFileQueries } from './storage/useStorageFileQueries';
import { useTreeRebuildScheduler } from './storage/useTreeRebuildScheduler';
import { useTagTreeSync } from './storage/useTagTreeSync';
import { usePropertyTreeSync } from './storage/usePropertyTreeSync';
import { useStorageVaultSync, type PendingFileFlushBuffer } from './storage/useStorageVaultSync';
import type { PendingRenameFlushBuffer } from './storage/renameFlush';
import { useStorageSettingsSync } from './storage/useStorageSettingsSync';
import { METADATA_SENTINEL, type FileData as DBFileData, type IndexedDBStorage } from '../storage/IndexedDBStorage';
import { getDBInstance, getDBInstanceOrNull } from '../storage/fileOperations';
import type { StorageFileData } from './storage/storageFileData';
import type { PropertyTreeNode, TagTreeNode } from '../types/storage';
import { getFileDisplayName as getDisplayName } from '../utils/fileNameUtils';
import { findTagNode, collectAllTagPaths } from '../utils/tagTree';
import { useServices } from './ServicesContext';
import { useSettingsState, useActiveProfile } from './SettingsContext';
import { useUXPreferences } from './UXPreferencesContext';
import type { NotebookNavigatorAPI } from '../api/NotebookNavigatorAPI';
import { getCacheRebuildProgressTypes } from './storage/storageContentTypes';
import { clearCacheRebuildNoticeState, getCacheRebuildNoticeState, setCacheRebuildNoticeState } from './storage/cacheRebuildNoticeStorage';
import { runAsyncAction } from '../utils/async';
import { logProbePair, recordStartupTimestamp } from '../utils/startupDebugLogger';

/**
 * Context value providing both file data (tag tree) and the file cache
 */
interface StorageContextValue {
    fileData: StorageFileData;
    // Methods to get file metadata with frontmatter extraction
    getFileDisplayName: (file: TFile) => string;
    getFileCreatedTime: (file: TFile) => number;
    getFileModifiedTime: (file: TFile) => number;
    getFileTimestamps: (file: TFile) => { created: number; modified: number };
    getFileMetadata: (file: TFile) => { name: string; created: number; modified: number };
    // IndexedDB storage instance for FileItem to use
    getDB: () => IndexedDBStorage;
    // Synchronous database access methods
    getFile: (path: string) => DBFileData | null;
    // Tag tree access methods
    getTagTree: () => Map<string, TagTreeNode>;
    getPropertyTree: () => Map<string, PropertyTreeNode>;
    findTagInTree: (tagPath: string) => TagTreeNode | null;
    getAllTagPaths: () => string[];
    getTagDisplayPath: (path: string) => string;
    getFiles: (paths: string[]) => Map<string, DBFileData>;
    // Storage initialization state
    isStorageReady: boolean;
    stopAllProcessing: () => void;
    rebuildCache: () => Promise<void>;
}

const StorageContext = createContext<StorageContextValue | null>(null);

type StorageRuntimeActiveListener = (active: boolean) => void;

let activeStorageRuntimeCount = 0;
const storageRuntimeActiveListeners = new Set<StorageRuntimeActiveListener>();

function notifyStorageRuntimeActiveListeners(): void {
    const active = activeStorageRuntimeCount > 0;
    storageRuntimeActiveListeners.forEach(listener => {
        listener(active);
    });
}

function updateActiveStorageRuntimeCount(delta: 1 | -1): void {
    const wasActive = activeStorageRuntimeCount > 0;
    activeStorageRuntimeCount = Math.max(0, activeStorageRuntimeCount + delta);
    if (wasActive !== activeStorageRuntimeCount > 0) {
        notifyStorageRuntimeActiveListeners();
    }
}

export function isStorageRuntimeActive(): boolean {
    return activeStorageRuntimeCount > 0;
}

export function subscribeStorageRuntimeActive(listener: StorageRuntimeActiveListener): () => void {
    storageRuntimeActiveListeners.add(listener);
    listener(isStorageRuntimeActive());
    return () => {
        storageRuntimeActiveListeners.delete(listener);
    };
}

interface StorageProviderProps {
    app: App;
    api: NotebookNavigatorAPI | null;
    children: ReactNode;
}

// Resolves file created/modified timestamps from frontmatter metadata or file stats
const computeFileTimestamps = (file: TFile, extractedMetadata: ProcessedMetadata | null): { created: number; modified: number } => {
    return {
        created:
            extractedMetadata?.fc !== undefined &&
            extractedMetadata.fc !== METADATA_SENTINEL.FIELD_NOT_CONFIGURED &&
            extractedMetadata.fc !== METADATA_SENTINEL.PARSE_FAILED
                ? extractedMetadata.fc
                : file.stat.ctime,
        modified:
            extractedMetadata?.fm !== undefined &&
            extractedMetadata.fm !== METADATA_SENTINEL.FIELD_NOT_CONFIGURED &&
            extractedMetadata.fm !== METADATA_SENTINEL.PARSE_FAILED
                ? extractedMetadata.fm
                : file.stat.mtime
    };
};

export function StorageProvider({ app, api, children }: StorageProviderProps) {
    const settings = useSettingsState();
    const { hiddenFolders, hiddenFileProperties, hiddenFileNames, hiddenTags, hiddenFileTags, fileVisibility, profile } =
        useActiveProfile();
    const uxPreferences = useUXPreferences();
    const showHiddenItems = uxPreferences.showHiddenItems;
    const { tagTreeService, propertyTreeService } = useServices();
    const [fileData, setFileData] = useState<StorageFileData>({
        tagTree: new Map(),
        propertyTree: new Map(),
        tagged: 0,
        untagged: 0,
        hiddenRootTags: new Map()
    });

    // Service generating derived file content (properties, tags, metadata) synchronously from the metadata cache.
    const contentService = useRef<FrontmatterSyncService | null>(null);
    if (!contentService.current) {
        // Startup debug probe (black hole #2): FrontmatterSyncService is constructed at first React mount of the
        // storage provider; this completes the frontmatterSync.init window opened in main.ts onload().
        recordStartupTimestamp('frontmatterSync.init.complete');
        contentService.current = new FrontmatterSyncService(app);
    }
    const isFirstLoad = useRef(true);
    // ID of any scheduled timeout for deferred processing, used for cancellation on unmount
    const pendingSyncTimeoutId = useRef<number | null>(null);
    // Flag indicating whether all processing should be stopped (plugin disabled or view closed)
    const stoppedRef = useRef<boolean>(false);
    const metadataWaitDisposersRef = useRef<Set<() => void>>(new Set());
    // Map: file path -> pending metadata-dependent wait mask (used by `useMetadataCacheQueue`).
    const pendingMetadataWaitPathsRef = useRef<Map<string, number>>(new Map());
    const pendingRenameDataRef = useRef<Map<string, DBFileData>>(new Map());
    // Buffered vault `modify` events awaiting a debounced flush. Owned here so buffered entries survive
    // remounts of the vault-sync effect (it re-runs on settings changes).
    const modifyFlushBufferRef = useRef<PendingFileFlushBuffer>({ files: new Map(), timerId: null, isProcessing: false });
    // Buffered `metadataCache.changed` events awaiting a debounced flush. This flush is the only content
    // trigger for markdown saves, so buffered entries must survive effect remounts.
    const metadataChangeFlushBufferRef = useRef<PendingFileFlushBuffer>({ files: new Map(), timerId: null, isProcessing: false });
    // Buffered vault rename events awaiting the zero-delay batched flush. Owned here so buffered
    // entries survive remounts of the vault-sync effect.
    const renameFlushBufferRef = useRef<PendingRenameFlushBuffer>({ moves: [], timerId: null });
    const latestSettingsRef = useRef(settings);
    latestSettingsRef.current = settings;
    const activeVaultEventRefs = useRef<EventRef[] | null>(null);
    const activeMetadataEventRef = useRef<EventRef | null>(null);
    const rebuildFileCacheRef = useRef<ReturnType<typeof debounce> | null>(null);
    const buildFileCacheFnRef = useRef<((isInitialLoad?: boolean) => Promise<void>) | null>(null);

    // State tracking whether storage system is fully initialized
    const [isStorageReady, setIsStorageReady] = useState(false);
    const isIndexedDBReady = useIndexedDBReady();

    // Mirrors isStorageReady for callbacks that may run after renders.
    const isStorageReadyRef = useRef(false);
    isStorageReadyRef.current = isStorageReady;

    // Flag preventing duplicate initial cache building during startup
    const hasBuiltInitialCache = useRef(false);
    const { clearCacheRebuildNotice, startCacheRebuildNotice } = useCacheRebuildNotice({
        app,
        stoppedRef,
        onRebuildComplete: clearCacheRebuildNoticeState
    });
    // Run rebuild notice restoration once after storage initialization completes.
    const hasRestoredCacheRebuildNoticeRef = useRef(false);

    useEffect(() => {
        updateActiveStorageRuntimeCount(1);
        return () => {
            updateActiveStorageRuntimeCount(-1);
        };
    }, []);

    const { getVisibleMarkdownFiles, getIndexableFiles } = useStorageFileQueries({ app, latestSettingsRef, showHiddenItems });

    // Shared debounced scheduler that runs tag and property tree rebuilds from one visible-file scan.
    const { tagTreeRebuildFnRef, propertyTreeRebuildFnRef, scheduleTreeRebuild, cancelTreeRebuildDebouncer } = useTreeRebuildScheduler({
        isStorageReadyRef,
        stoppedRef,
        getVisibleMarkdownFiles
    });

    const { rebuildTagTree, scheduleTagTreeRebuild } = useTagTreeSync({
        app,
        settings,
        showHiddenItems,
        hiddenFolders,
        hiddenTags,
        hiddenFileProperties,
        hiddenFileTags,
        fileVisibility,
        profileId: profile.id,
        isStorageReady,
        isStorageReadyRef,
        latestSettingsRef,
        stoppedRef,
        setFileData,
        getVisibleMarkdownFiles,
        tagTreeService: tagTreeService ?? null,
        scheduleTreeRebuild,
        tagTreeRebuildFnRef
    });

    const { rebuildPropertyTree, schedulePropertyTreeRebuild } = usePropertyTreeSync({
        app,
        settings,
        showHiddenItems,
        hiddenFolders,
        hiddenFileProperties,
        hiddenFileNames,
        hiddenFileTags,
        fileVisibility,
        profileId: profile.id,
        isStorageReady,
        isStorageReadyRef,
        latestSettingsRef,
        stoppedRef,
        setFileData,
        getVisibleMarkdownFiles,
        propertyTreeService: propertyTreeService ?? null,
        scheduleTreeRebuild,
        propertyTreeRebuildFnRef
    });

    /**
     * Metadata-cache readiness gate for content processing (replaces the old `useMetadataCacheQueue` hook).
     *
     * The service itself defers files whose metadata cache entry is missing and sweeps them on follow-up
     * passes. This wrapper additionally registers one-shot `metadataCache.changed` listeners per file so a
     * cache catch-up immediately triggers a retry pass even when no vault event follows, mirroring the
     * wait-disposer semantics of the removed queue.
     */
    const disposeMetadataWaitDisposers = useCallback(() => {
        for (const disposer of metadataWaitDisposersRef.current) {
            try {
                disposer();
            } catch {
                // ignore
            }
        }
        metadataWaitDisposersRef.current.clear();
        pendingMetadataWaitPathsRef.current.clear();
    }, []);

    const queueMetadataContentWhenReady = useCallback(
        (files: TFile[], includeTypes?: ContentProviderType[], settingsOverride?: NotebookNavigatorSettings) => {
            const service = contentService.current;
            if (!service || stoppedRef.current || files.length === 0) {
                return;
            }

            const liveSettings = settingsOverride ?? latestSettingsRef.current;
            // Only process provider types that are currently enabled in settings.
            const providers = includeTypes ? getMetadataDependentTypes(liveSettings).filter(type => includeTypes.includes(type)) : undefined;
            if (providers && providers.length === 0) {
                return;
            }
            const options = providers ? { providers } : undefined;

            // Startup debug probe (black hole #2): bracket the content-provider queue handoff. processFiles is
            // async, so the complete timestamp marks when the batch was accepted into the service pipeline.
            recordStartupTimestamp('contentProvider.queue.start');
            runAsyncAction(async () => {
                await service.processFiles(files, liveSettings, options);
                recordStartupTimestamp('contentProvider.queue.complete');
                logProbePair(
                    'contentProvider.queue',
                    'contentProvider.queue.start',
                    'contentProvider.queue.complete',
                    { count: files.length }
                );
            });

            if (typeof window === 'undefined') {
                return;
            }

            // Watch for metadata-cache entries appearing for files whose cache is still missing; reprocess each once.
            for (const file of files) {
                const path = file.path;
                if (app.metadataCache.getFileCache(file)) {
                    continue;
                }
                if (pendingMetadataWaitPathsRef.current.has(path)) {
                    // A listener for this path is already registered; keep it.
                    continue;
                }
                pendingMetadataWaitPathsRef.current.set(path, 1);
                let disposed = false;
                const ref = app.metadataCache.on('changed', (changedFile, _data, cache) => {
                    if (disposed || changedFile.path !== path || !cache) {
                        return;
                    }
                    dispose();
                    if (stoppedRef.current) {
                        return;
                    }
                    const current = app.vault.getAbstractFileByPath(path);
                    if (current instanceof TFile) {
                        runAsyncAction(async () => {
                            await service.processFiles([current], latestSettingsRef.current, options);
                        });
                    }
                });
                const dispose = (): void => {
                    if (disposed) {
                        return;
                    }
                    disposed = true;
                    app.metadataCache.offref(ref);
                    pendingMetadataWaitPathsRef.current.delete(path);
                    metadataWaitDisposersRef.current.delete(dispose);
                };
                metadataWaitDisposersRef.current.add(dispose);
            }
        },
        [app, contentService]
    );

    useEffect(() => {
        return () => {
            disposeMetadataWaitDisposers();
            contentService.current?.stop();
        };
    }, [disposeMetadataWaitDisposers]);

    const { queueIndexableFilesForContentGeneration, queueIndexableFilesNeedingContentGeneration } = useStorageContentQueue({
        app,
        contentServiceRef: contentService,
        queueMetadataContentWhenReady
    });

    // Coalesce activation events because a second clear could erase counts being written by the first queued pass.

    const { rebuildCache } = useStorageCacheRebuild({
        app,
        contentServiceRef: contentService,
        pendingSyncTimeoutIdRef: pendingSyncTimeoutId,
        rebuildFileCacheRef,
        cancelTreeRebuildDebouncer,
        disposeMetadataWaitDisposers,
        pendingMetadataWaitPathsRef,
        setFileData,
        tagTreeService: tagTreeService ?? null,
        propertyTreeService: propertyTreeService ?? null,
        setIsStorageReady,
        isStorageReadyRef,
        hasBuiltInitialCacheRef: hasBuiltInitialCache,
        buildFileCacheFnRef,
        latestSettingsRef,
        stoppedRef,
        clearCacheRebuildNotice,
        startCacheRebuildNotice,
        getIndexableFiles
    });

    useEffect(() => {
        if (!isStorageReady || hasRestoredCacheRebuildNoticeRef.current) {
            return;
        }

        hasRestoredCacheRebuildNoticeRef.current = true;
        // Restore rebuild progress notice if a rebuild was in progress during the previous session.
        const state = getCacheRebuildNoticeState();
        if (!state) {
            return;
        }

        const enabledTypes = getCacheRebuildProgressTypes(latestSettingsRef.current);
        if (enabledTypes.length === 0) {
            clearCacheRebuildNoticeState();
            return;
        }

        const pending = getDBInstance().getFilesNeedingAnyContent(enabledTypes).size;
        if (pending <= 0) {
            clearCacheRebuildNoticeState();
            return;
        }

        const total = Math.max(state.total, pending);
        if (total !== state.total) {
            setCacheRebuildNoticeState({ ...state, total });
        }

        startCacheRebuildNotice(total, enabledTypes);
    }, [app, isStorageReady, startCacheRebuildNotice]);

    const getFrontmatterMetadata = useCallback(
        (file: TFile): ProcessedMetadata | null => {
            if (!settings.useFrontmatterMetadata || file.extension !== 'md') {
                return null;
            }

            const db = getDBInstanceOrNull();
            return (
                extractCurrentFrontmatterMetadataFromFileData(file, db?.getFile(file.path) ?? null, settings) ??
                extractMetadata(app, file, settings)
            );
        },
        [app, settings]
    );

    const getFileDisplayName = useCallback(
        (file: TFile): string => {
            const metadata = getFrontmatterMetadata(file);
            if (metadata?.fn) {
                return metadata.fn;
            }
            return getDisplayName(file, undefined, settings);
        },
        [getFrontmatterMetadata, settings]
    );

    const getFileTimestamps = useCallback(
        (file: TFile): { created: number; modified: number } => {
            return computeFileTimestamps(file, getFrontmatterMetadata(file));
        },
        [getFrontmatterMetadata]
    );

    const getFileCreatedTime = useCallback((file: TFile): number => getFileTimestamps(file).created, [getFileTimestamps]);

    const getFileModifiedTime = useCallback((file: TFile): number => getFileTimestamps(file).modified, [getFileTimestamps]);

    const getFileMetadata = useCallback(
        (file: TFile): { name: string; created: number; modified: number } => {
            const extractedMetadata = getFrontmatterMetadata(file);
            const timestamps = computeFileTimestamps(file, extractedMetadata);

            return {
                name: extractedMetadata?.fn || getDisplayName(file, undefined, settings),
                created: timestamps.created,
                modified: timestamps.modified
            };
        },
        [getFrontmatterMetadata, settings]
    );


    /**
     * Memoized context value to prevent unnecessary re-renders
     *
     * This memo creates the context value object that will be provided to all child
     * components. It includes:
     * - Helper methods for getting file metadata with frontmatter support
     * - Direct database access methods
     * - Tag tree navigation methods
     * - Storage state information
     *
     * The value is memoized to only recreate when its dependencies change,
     * preventing child components from re-rendering unnecessarily.
     */
    const contextValue = useMemo(() => {
        // Direct accessors for tag tree data structures
        const getTagTree = () => fileData.tagTree;
        const getPropertyTree = () => fileData.propertyTree;

        // Finds a tag node by path in the main tag tree
        const findTagInTree = (tagPath: string) => {
            return findTagNode(fileData.tagTree, tagPath);
        };

        // Collects all tag paths from the tree
        const getAllTagPaths = () => {
            const allPaths: string[] = [];
            for (const rootNode of fileData.tagTree.values()) {
                const paths = collectAllTagPaths(rootNode);
                allPaths.push(...paths);
            }
            return allPaths;
        };

        // Gets the display path for a tag (may differ from actual path due to display settings)
        const getTagDisplayPath = (path: string): string => {
            const tagNode = findTagNode(fileData.tagTree, path);
            return tagNode?.displayPath ?? path;
        };

        return {
            fileData,
            getFileDisplayName,
            getFileCreatedTime,
            getFileModifiedTime,
            getFileTimestamps,
            getFileMetadata,
            getDB: getDBInstance,
            getFile: (path: string) => getDBInstance().getFile(path),
            getFiles: (paths: string[]) => getDBInstance().getFiles(paths),
            isStorageReady,
            getTagTree,
            getPropertyTree,
            findTagInTree,
            getAllTagPaths,
            getTagDisplayPath,
            rebuildCache
        };
    }, [
        fileData,
        getFileDisplayName,
        getFileCreatedTime,
        getFileModifiedTime,
        getFileTimestamps,
        getFileMetadata,
        isStorageReady,
        rebuildCache
    ]);

    // The service instance is created eagerly above (during render) so settings-sync hooks can
    // schedule work immediately — no separate initialization hook is needed anymore.

    const { resetPendingSettingsChanges } = useStorageSettingsSync({
        app,
        settings,
        stoppedRef,
        contentServiceRef: contentService,
        handleProviderSettingsChange: async (oldSettings, newSettings) => {
            // Pure policy ported from the former provider registry: which provider types
            // are affected and which content fields must be cleared before regeneration.
            const plan = planFrontmatterSettingsChange(oldSettings, newSettings);
            if (plan.clearTypes.length > 0) {
                const db = getDBInstance();
                for (const clearType of plan.clearTypes) {
                    await db.batchClearAllFileContent(clearType);
                }
                contentService.current?.resetAfterClear();
            }
            return plan.affectedTypes;
        },
        hiddenFolders,
        hiddenFileProperties,
        hiddenFileNames,
        hiddenFileTags,
        scheduleTagTreeRebuild,
        schedulePropertyTreeRebuild,
        getIndexableFiles,
        pendingRenameDataRef,
        queueMetadataContentWhenReady,
        queueIndexableFilesForContentGeneration,
        queueIndexableFilesNeedingContentGeneration,
        startCacheRebuildNotice,
        clearCacheRebuildNotice
    });

    // ==================== Effects ====================

    useStorageVaultSync({
        app,
        api,
        settings,
        latestSettingsRef,
        stoppedRef,
        isFirstLoadRef: isFirstLoad,
        isIndexedDBReady,
        hasBuiltInitialCacheRef: hasBuiltInitialCache,
        setIsStorageReady,
        isStorageReadyRef,
        contentServiceRef: contentService,
        pendingSyncTimeoutIdRef: pendingSyncTimeoutId,
        pendingRenameDataRef,
        modifyFlushBufferRef,
        metadataChangeFlushBufferRef,
        renameFlushBufferRef,
        buildFileCacheFnRef,
        rebuildFileCacheRef,
        activeVaultEventRefsRef: activeVaultEventRefs,
        activeMetadataEventRefRef: activeMetadataEventRef,
        rebuildTagTree,
        rebuildPropertyTree,
        scheduleTagTreeRebuild,
        schedulePropertyTreeRebuild,
        cancelTreeRebuildDebouncer,
        startCacheRebuildNotice,
        getIndexableFiles,
        getVisibleMarkdownFiles,
        queueMetadataContentWhenReady,
        queueIndexableFilesForContentGeneration,
        queueIndexableFilesNeedingContentGeneration,
        disposeMetadataWaitDisposers
    });

    /**
     * Augment context with control methods
     *
     * Adds the stopAllProcessing method to the context value.
     * Called during plugin shutdown (main.ts stopNavigatorContentProcessing via the view's
     * stopContentProcessing handle). Not called on plain view close; cache rebuilds run their
     * own stop sequence in useStorageCacheRebuild.
     *
     * It ensures clean shutdown by:
     * - Stopping all content providers
     * - Cancelling pending operations and buffered flushes
     * - Detaching event listeners
     * - Preventing any new operations from starting
     */
    const contextWithControls = useMemo(() => {
        return {
            ...contextValue,
            stopAllProcessing: () => {
                // Mark stopped to gate any subsequent event handlers
                stoppedRef.current = true;
                resetPendingSettingsChanges();
                // Stop content processing and drop all pending/deferred work in the service.
                if (contentService.current) {
                    contentService.current.stop();
                }
                // Cancel any pending scheduled work initiated by StorageContext
                if (pendingSyncTimeoutId.current !== null) {
                    if (typeof window !== 'undefined') {
                        window.clearTimeout(pendingSyncTimeoutId.current);
                    }
                    pendingSyncTimeoutId.current = null;
                }
                // Drop buffered modify/metadata flushes and their timers
                for (const buffer of [modifyFlushBufferRef.current, metadataChangeFlushBufferRef.current]) {
                    if (buffer.timerId !== null) {
                        if (typeof window !== 'undefined') {
                            window.clearTimeout(buffer.timerId);
                        }
                        buffer.timerId = null;
                    }
                    buffer.files.clear();
                }
                // Drop buffered renames and their flush timer; the next session's full diff reconciles them
                const renameBuffer = renameFlushBufferRef.current;
                if (renameBuffer.timerId !== null) {
                    if (typeof window !== 'undefined') {
                        window.clearTimeout(renameBuffer.timerId);
                    }
                    renameBuffer.timerId = null;
                }
                renameBuffer.moves = [];
                // Optionally detach event subscriptions and cancel debouncers
                try {
                    if (activeVaultEventRefs.current) {
                        activeVaultEventRefs.current.forEach(ref => app.vault.offref(ref));
                        activeVaultEventRefs.current = null;
                    }
                    if (activeMetadataEventRef.current) {
                        app.metadataCache.offref(activeMetadataEventRef.current);
                        activeMetadataEventRef.current = null;
                    }
                } catch {
                    // ignore
                }
                try {
                    rebuildFileCacheRef.current?.cancel();
                } catch {
                    // ignore
                }
                rebuildFileCacheRef.current = null;
                // Clears any pending rebuild scheduled by UI or database events.
                cancelTreeRebuildDebouncer({ reset: true });
                // Clean up all tracked metadata wait disposers on shutdown
                disposeMetadataWaitDisposers();
                pendingMetadataWaitPathsRef.current.clear();
            }
        };
    }, [cancelTreeRebuildDebouncer, resetPendingSettingsChanges, contextValue, disposeMetadataWaitDisposers, app.vault, app.metadataCache]);

    return <StorageContext.Provider value={contextWithControls}>{children}</StorageContext.Provider>;
}

/**
 * Hook to access file cache and file data
 *
 * Returns:
 * - fileData: Contains the tag tree and untagged file count
 * - Methods to get file metadata from frontmatter
 */
export function useFileCache() {
    const context = useContext(StorageContext);
    if (!context) {
        throw new Error('useFileCache must be used within StorageProvider');
    }
    return context;
}

export function useFileCacheOptional() {
    return useContext(StorageContext);
}
