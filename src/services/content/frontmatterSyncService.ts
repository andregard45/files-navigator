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

import { App, TFile, getAllTags, type CachedMetadata, type FrontMatterCache } from 'obsidian';
import { LIMITS } from '../../constants/limits';
import { DEFAULT_SETTINGS } from '../../settings/defaultSettings';
import { type ContentProviderType, type FileContentType } from '../../types/contentProviders';
import type { NotebookNavigatorSettings } from '../../settings/types';
import { type FileData, type PropertyItem } from '../../storage/IndexedDBStorage';
import { getDBInstance, isShutdownInProgress } from '../../storage/fileOperations';
import { getProviderProcessedMtimeField } from '../../storage/providerMtime';
import { arePropertyItemsEqual, extractFrontmatterPropertyValues } from '../../utils/propertyUtils';
import { extractFileTagsFromRawTags } from '../../utils/tagUtils';
import { extractMetadataFromCache } from '../../utils/metadataExtractor';
import { createFrontmatterPropertyExclusionMatcher, shouldExcludeFileWithMatcher } from '../../utils/fileFilters';
import { getActiveHiddenFileProperties } from '../../utils/vaultProfiles';

/**
 * Synchronous replacement for the former content-provider class hierarchy.
 *
 * All three remaining providers (markdownPipeline/properties, tags, metadata) only read
 * `app.metadataCache.getFileCache()` synchronously — no vault I/O, no markdown parsing. The queue,
 * batch splicing, parallel limit, exponential-backoff retry timers, dirty-file tracking, abort
 * controller, and waitForIdle polling of the base class collapse into:
 *
 * - synchronous per-file extractors (`extractPropertiesSync` / `extractTagsSync` / `extractMetadataSync`),
 *   with the deferral semantics (recent-file window + empty-value retry limits) ported verbatim;
 * - one asynchronous IndexedDB write per pass (`batchUpdateFileContentAndProviderProcessedMtimes`,
 *   guarded by the same CAS `expectedPreviousMtime` contract);
 * - a `deferredPaths` set swept on the next pass, replacing the retry-timer machinery. Paths are
 *   re-resolved through `vault.getAbstractFileByPath()` at process time so renames/deletes never
 *   operate on stale `TFile` references (same normalization rule as the old batch loop).
 *
 * Instances are independent (per-instance retry counters and deferred sets), which lets
 * CalendarRightSidebar create its own properties-only instance without StorageContext.
 */

export type FrontmatterSyncProviderFilter = 'all' | ContentProviderType[];

export interface FrontmatterSyncOptions {
    /**
     * Which content types this instance processes. Defaults to 'all'.
     * CalendarRightSidebar's standalone fallback uses ['markdownPipeline'] (properties only).
     */
    providers?: FrontmatterSyncProviderFilter;
}

export interface IFrontmatterSyncService {
    /** Runs one synchronous extraction pass plus one batched DB write per provider. Resolves when idle. */
    processFiles(files: TFile[], settings: NotebookNavigatorSettings, options?: FrontmatterSyncOptions): Promise<void>;
    /** Deferred paths awaiting a metadata-cache catch-up or an empty-value retry window (diagnostics/testing). */
    getDeferredPaths(): string[];
    /** Drops all pending work and per-path deferral counters (stop/rebuild equivalent). */
    stop(): void;
    /** Restart after stop(); clears the stopped flag so new passes run again. */
    start(): void;
    /** Clears provider retry counters and the deferred set after a full content clear. */
    resetAfterClear(): void;
}

type SyncContentFields = Pick<FileData, 'tags' | 'properties' | 'metadata'>;
type SyncExtractResult = { update: Partial<SyncContentFields> | null; processed: boolean };

// One evaluation slot per file/provider pair inside a pass.
type ProviderSlot = { result: SyncExtractResult; expectedPreviousMtime: number; wroteSomething: boolean };

// Builds the indexed property list from every supported frontmatter value. Visibility is applied later by
// navigation and list consumers, while internal search keeps access to properties hidden from those surfaces.
function resolvePropertyItemsFromFrontmatter(frontmatter: FrontMatterCache | null): PropertyItem[] {
    if (!frontmatter) {
        return [];
    }

    // Property items are persisted without styling metadata.
    // Rendering derives property and property:value colors from `fieldKey` and raw value.
    const entries: PropertyItem[] = [];

    Object.keys(frontmatter).forEach(fieldKey => {
        const values = extractFrontmatterPropertyValues(frontmatter[fieldKey]);
        if (values.length === 0) {
            return;
        }

        values.forEach(value => {
            entries.push({ fieldKey, value: value.value, valueKind: value.valueKind });
        });
    });

    return entries;
}

// Check if two tag arrays are equal. Handles null values properly (ported from the former tag provider).
function tagsEqual(tags1: string[] | null, tags2: string[] | null): boolean {
    if (tags1 === tags2) return true; // Both null or same reference
    if (tags1 === null || tags2 === null) return false; // One is null
    if (tags1.length !== tags2.length) return false;
    return tags1.every((tag, i) => tag === tags2[i]);
}

// Check if two metadata objects are equal (ported from the former metadata provider).
// Null means "not generated yet" and must not be treated as equivalent to an empty object.
function metadataEqual(meta1: FileData['metadata'] | null, meta2: FileData['metadata'] | null): boolean {
    if (meta1 === null && meta2 === null) return true;
    if (meta1 === null || meta2 === null) return false;

    const keys1 = Object.keys(meta1);
    const keys2 = Object.keys(meta2);

    if (keys1.length !== keys2.length) return false;

    return keys1.every(key => {
        const k = key as keyof NonNullable<FileData['metadata']>;
        return meta1[k] === meta2[k];
    });
}

/**
 * Properties extraction — ported verbatim from the former markdown-pipeline provider processFile().
 * `emptyRetryCounts` carries the per-path deferral state formerly owned by the provider instance.
 */
export function extractPropertiesSync(
    file: TFile,
    cache: CachedMetadata | null,
    fileData: FileData | null,
    path: string,
    emptyRetryCounts: Map<string, number>
): SyncExtractResult {
    if (file.extension !== 'md') {
        return { update: null, processed: true };
    }

    if (!cache) {
        emptyRetryCounts.delete(path);
        return { update: null, processed: false };
    }

    const frontmatter = cache.frontmatter ?? null;
    const fileModified = fileData !== null && fileData.markdownPipelineMtime !== file.stat.mtime;
    const needsPropertyFrontmatterRetry = fileModified && (fileData?.properties?.length ?? 0) > 0;

    // A null frontmatter cache is the stable state for notes without YAML, so an already-empty property
    // cache proceeds immediately. Existing property values retain the retry window because clearing them
    // before metadata catches up would temporarily remove search results and property-tree membership.
    if (frontmatter === null && needsPropertyFrontmatterRetry) {
        const attempts = emptyRetryCounts.get(path) ?? 0;
        const isRecent = Date.now() - file.stat.mtime <= LIMITS.contentProvider.metadataCache.recentFileWindowMs;
        if (isRecent && attempts < LIMITS.contentProvider.metadataCache.emptyValueRetryLimit) {
            emptyRetryCounts.set(path, attempts + 1);
            return { update: null, processed: false };
        }
    }

    emptyRetryCounts.delete(path);

    const nextProperties = resolvePropertyItemsFromFrontmatter(frontmatter);
    if (!fileData || fileData.properties === null || !arePropertyItemsEqual(fileData.properties, nextProperties)) {
        return { update: { properties: nextProperties }, processed: true };
    }

    return { update: null, processed: true };
}

/**
 * Tags extraction — ported verbatim from the former tag provider processFile() (including the
 * recentFileWindowMs guard that avoids overwriting existing tags with empty results while the
 * metadata cache has not caught up for files modified within the last 15 seconds).
 */
export function extractTagsSync(
    file: TFile,
    cache: CachedMetadata | null,
    fileData: FileData | null,
    settings: NotebookNavigatorSettings,
    path: string,
    emptyRetryCounts: Map<string, number>
): SyncExtractResult {
    if (!settings.showTags) {
        return { update: null, processed: true };
    }

    if (file.extension !== 'md') {
        return { update: null, processed: true };
    }

    try {
        if (!cache) {
            emptyRetryCounts.delete(path);
            return { update: null, processed: false };
        }

        const rawTags = getAllTags(cache);
        const tags = extractFileTagsFromRawTags(rawTags);

        const shouldDeferExistingTagClearing =
            fileData !== null && fileData.tagsMtime === 0 && fileData.tags !== null && fileData.tags.length > 0 && tags.length === 0;
        const shouldDeferInitialEmptyTags =
            fileData !== null &&
            fileData.tagsMtime === 0 &&
            fileData.tags === null &&
            tags.length === 0 &&
            Date.now() - file.stat.mtime <= LIMITS.contentProvider.metadataCache.recentFileWindowMs;
        const shouldDeferClearing = shouldDeferExistingTagClearing || shouldDeferInitialEmptyTags;

        if (!shouldDeferClearing) {
            emptyRetryCounts.delete(path);
        }

        if (shouldDeferClearing) {
            const attempts = emptyRetryCounts.get(path) ?? 0;
            if (attempts < LIMITS.contentProvider.metadataCache.emptyValueRetryLimit) {
                emptyRetryCounts.set(path, attempts + 1);
                return { update: null, processed: false };
            }

            emptyRetryCounts.delete(path);
        }

        // Only return update if tags changed
        if (fileData && tagsEqual(fileData.tags, tags)) {
            return { update: null, processed: true };
        }

        return { update: { tags }, processed: true };
    } catch (error) {
        console.error(`Error extracting tags for ${path}:`, error);
        return { update: null, processed: false };
    }
}

/**
 * Metadata extraction — ported verbatim from the former metadata provider processFile().
 * `pendingHiddenStates` replaces the class-field cache shared between needsProcessing and processFile;
 * callers compute hidden states during their staleness check and hand the map to the extractor.
 */
export function extractMetadataSync(
    file: TFile,
    cache: CachedMetadata | null,
    fileData: FileData | null,
    settings: NotebookNavigatorSettings,
    app: App,
    path: string,
    pendingHiddenStates?: Map<string, boolean>
): SyncExtractResult {
    if (file.extension !== 'md') {
        return { update: null, processed: true };
    }

    const hiddenFileProperties = getActiveHiddenFileProperties(settings);
    const shouldExtractMetadata = settings.useFrontmatterMetadata;
    const shouldTrackHidden = hiddenFileProperties.length > 0;
    const hiddenFilePropertyMatcher = shouldTrackHidden ? createFrontmatterPropertyExclusionMatcher(hiddenFileProperties) : null;
    if (!shouldExtractMetadata && !shouldTrackHidden) {
        return { update: null, processed: true };
    }

    try {
        if (!cache && (shouldExtractMetadata || (shouldTrackHidden && file.extension === 'md'))) {
            return { update: null, processed: false };
        }
        const processedMetadata = shouldExtractMetadata ? extractMetadataFromCache(cache, settings) : {};

        const fileMetadata: FileData['metadata'] = {};
        if (shouldExtractMetadata) {
            if (processedMetadata.fn) fileMetadata.name = processedMetadata.fn;
            if (processedMetadata.fc !== undefined) fileMetadata.created = processedMetadata.fc;
            if (processedMetadata.fm !== undefined) fileMetadata.modified = processedMetadata.fm;
            if (processedMetadata.icon) fileMetadata.icon = processedMetadata.icon;
            if (processedMetadata.color) fileMetadata.color = processedMetadata.color;
            if (processedMetadata.background) fileMetadata.background = processedMetadata.background;
        }

        if (shouldTrackHidden && file.extension === 'md') {
            let hiddenValue: boolean;
            const pendingHiddenState = pendingHiddenStates?.get(path);
            if (pendingHiddenState !== undefined) {
                hiddenValue = pendingHiddenState;
                pendingHiddenStates?.delete(path);
            } else {
                hiddenValue = hiddenFilePropertyMatcher ? shouldExcludeFileWithMatcher(file, hiddenFilePropertyMatcher, app) : false;
            }
            fileMetadata.hidden = hiddenValue;
        }

        const newMetadata = Object.keys(fileMetadata).length > 0 ? fileMetadata : {};

        // Only return update if metadata changed
        if (fileData && metadataEqual(fileData.metadata, newMetadata)) {
            return { update: null, processed: true };
        }

        return { update: { metadata: newMetadata }, processed: true };
    } catch (error) {
        console.error(`Error extracting metadata for ${path}:`, error);
        return { update: null, processed: false };
    }
}

/**
 * Staleness predicates — ported verbatim from each provider's needsProcessing(). Callers may use these
 * to skip unchanged files; processFiles() always runs the extractors (which self-compare against DB data).
 */
export function needsPropertiesProcessing(fileData: FileData | null, file: TFile): boolean {
    if (file.extension !== 'md') return false;
    if (!fileData) return true;
    return fileData.properties === null;
}

export function needsTagsProcessing(fileData: FileData | null, file: TFile, settings: NotebookNavigatorSettings): boolean {
    if (!settings.showTags) return false;
    if (file.extension !== 'md') return false;
    const needsRefresh = fileData !== null && fileData.tagsMtime !== file.stat.mtime;
    return !fileData || fileData.tags === null || needsRefresh;
}

export function needsMetadataProcessing(fileData: FileData | null, file: TFile, settings: NotebookNavigatorSettings, app: App): boolean {
    const hiddenFileProperties = getActiveHiddenFileProperties(settings);
    const requiresMetadata = settings.useFrontmatterMetadata || hiddenFileProperties.length > 0;
    if (!requiresMetadata) return false;
    if (file.extension !== 'md') return false;
    const needsRefresh = fileData !== null && fileData.metadataMtime !== file.stat.mtime;
    if (!fileData || fileData.metadata === null) return true;
    if (needsRefresh) return true;
    if (hiddenFileProperties.length > 0) {
        const matcher = createFrontmatterPropertyExclusionMatcher(hiddenFileProperties);
        const hiddenState = shouldExcludeFileWithMatcher(file, matcher, app);
        const recordedState = fileData.metadata?.hidden;
        if (recordedState !== hiddenState) {
            return true;
        }
    }
    return false;
}

// Settings keys that trigger each content type — ported verbatim from the providers' getRelevantSettings().
export const RELEVANT_SETTINGS_BY_TYPE: Record<ContentProviderType, (keyof NotebookNavigatorSettings)[]> = {
    // defaultFolderSortPropertyKey is intentionally absent (see former markdown-pipeline provider comments):
    // it does not change extracted content. Appearance maps are observed via useStorageSettingsSync.
    markdownPipeline: [
        'noteGrouping',
        'defaultFolderSort',
        'propertySortKey',
        'propertyGroupKey',
        'folderSortOverrides',
        'tagSortOverrides',
        'propertySortOverrides'
    ],
    tags: ['showTags'],
    metadata: [
        'useFrontmatterMetadata',
        'frontmatterNameField',
        'frontmatterIconField',
        'frontmatterColorField',
        'frontmatterBackgroundField',
        'frontmatterCreatedField',
        'frontmatterModifiedField',
        'frontmatterDateFormat',
        'vaultProfile',
        'vaultProfiles'
    ]
};

// Compares two arrays for same members regardless of order (ported from the former metadata provider).
function haveSameMembers(left: string[], right: string[]): boolean {
    if (left === right) return true;
    if (left.length !== right.length) return false;
    const sortedLeft = [...left].sort();
    const sortedRight = [...right].sort();
    return sortedLeft.every((value, index) => value === sortedRight[index]);
}

// shouldRegenerate policies — ported verbatim from the three providers.
const SHOULD_REGENERATE_BY_TYPE: Record<ContentProviderType, (o: NotebookNavigatorSettings, n: NotebookNavigatorSettings) => boolean> = {
    // Property visibility no longer changes the vault-wide property cache because every supported
    // frontmatter value is indexed for internal search.
    markdownPipeline: () => false,
    tags: (oldSettings, newSettings) => (!newSettings.showTags && oldSettings.showTags) || (newSettings.showTags && !oldSettings.showTags),
    metadata: (oldSettings, newSettings) => {
        const excludedFilesChanged = !haveSameMembers(
            getActiveHiddenFileProperties(oldSettings),
            getActiveHiddenFileProperties(newSettings)
        );
        if (excludedFilesChanged) return true;
        if (!newSettings.useFrontmatterMetadata && oldSettings.useFrontmatterMetadata) return true;
        if (newSettings.useFrontmatterMetadata) {
            return (
                oldSettings.useFrontmatterMetadata !== newSettings.useFrontmatterMetadata ||
                oldSettings.frontmatterNameField !== newSettings.frontmatterNameField ||
                oldSettings.frontmatterIconField !== newSettings.frontmatterIconField ||
                oldSettings.frontmatterColorField !== newSettings.frontmatterColorField ||
                oldSettings.frontmatterBackgroundField !== newSettings.frontmatterBackgroundField ||
                oldSettings.frontmatterCreatedField !== newSettings.frontmatterCreatedField ||
                oldSettings.frontmatterModifiedField !== newSettings.frontmatterModifiedField ||
                oldSettings.frontmatterDateFormat !== newSettings.frontmatterDateFormat
            );
        }
        return false;
    }
};

const CONTENT_FIELD_BY_TYPE: Record<ContentProviderType, FileContentType> = {
    markdownPipeline: 'properties',
    tags: 'tags',
    metadata: 'metadata'
};

export type SettingsChangePlan = {
    /** Providers whose relevant settings changed or whose content must be cleared (was affectedTypes). */
    affectedTypes: ContentProviderType[];
    /** Providers requiring a full content clear before regeneration (was shouldRegenerate + clearContent). */
    clearTypes: FileContentType[];
};

/**
 * Determines what a settings change implies — pure policy ported from the former registry handleSettingsChange.
 * The caller performs the actual clears (via `db.batchClearAllFileContent`) and then invokes `resetAfterClear()`
 * followed by a full-vault `processFiles()` pass.
 */
export function handleSettingsChange(
    oldSettings: NotebookNavigatorSettings,
    newSettings: NotebookNavigatorSettings,
    include?: ContentProviderType[]
): SettingsChangePlan {
    const affectedTypes: ContentProviderType[] = [];
    const clearTypes: FileContentType[] = [];

    for (const type of ['markdownPipeline', 'tags', 'metadata'] as ContentProviderType[]) {
        if (include && !include.includes(type)) continue;
        const hasRelevantChanges = RELEVANT_SETTINGS_BY_TYPE[type].some(key => oldSettings[key] !== newSettings[key]);
        const shouldClear = SHOULD_REGENERATE_BY_TYPE[type](oldSettings, newSettings);
        if (hasRelevantChanges || shouldClear) {
            affectedTypes.push(type);
        }
        if (shouldClear) {
            clearTypes.push(CONTENT_FIELD_BY_TYPE[type]);
        }
    }

    return { affectedTypes, clearTypes };
}

// Content/mtime update records matching the storage layer's batch-write contract.
type SyncContentUpdate = { path: string; tags?: string[] | null; metadata?: FileData['metadata']; properties?: PropertyItem[] | null };
type SyncMtimeUpdate = { path: string; mtime: number; expectedPreviousMtime: number };

export class FrontmatterSyncService implements IFrontmatterSyncService {
    private readonly emptyRetryCounts = new Map<string, number>();
    private readonly pendingHiddenStates = new Map<string, boolean>();
    private readonly deferredPaths = new Set<string>();
    // Coalescing: while a pass is running, incoming requests merge into a single trailing pass
    // (replaces queue + dirtyFilesDuringProcessing + retry timers).
    private activePass: Promise<void> | null = null;
    private pendingRequest: { files: TFile[]; settings: NotebookNavigatorSettings; providers: FrontmatterSyncProviderFilter } | null = null;
    private lastSettings: NotebookNavigatorSettings = DEFAULT_SETTINGS;
    private stopped = false;

    constructor(private readonly app: App) {}

    getDeferredPaths(): string[] {
        return Array.from(this.deferredPaths);
    }

    stop(): void {
        this.stopped = true;
        this.deferredPaths.clear();
        this.emptyRetryCounts.clear();
        this.pendingHiddenStates.clear();
        this.pendingRequest = null;
    }

    start(): void {
        this.stopped = false;
    }

    resetAfterClear(): void {
        this.emptyRetryCounts.clear();
        this.pendingHiddenStates.clear();
        this.deferredPaths.clear();
    }

    async processFiles(files: TFile[], settings: NotebookNavigatorSettings, options?: FrontmatterSyncOptions): Promise<void> {
        if (this.stopped) return;
        const providers = options?.providers ?? 'all';

        if (this.activePass) {
            // Merge into the trailing pass so concurrent triggers coalesce into one sweep.
            this.mergePendingRequest(files, settings, providers);
            await this.activePass;
            await this.runFollowUpPasses();
            return;
        }

        const pass: Promise<void> = this.runPass(files, settings, providers).then(() => undefined);
        this.activePass = pass;
        try {
            await pass;
        } finally {
            if (this.activePass === pass) {
                this.activePass = null;
            }
        }
        await this.runFollowUpPasses();
    }

    // Follow-up loop replacing the base class retry-timer machinery: after each pass we pick up
    // (a) merged trailing requests from concurrent triggers and (b) deferred paths whose metadata
    // cache has caught up since the previous pass. A path whose cache stays null is NOT swept again
    // — it waits for the next external trigger, exactly like the former base provider dropping retry
    // entries when `getAbstractFileByPath`/cache resolution found nothing to do. This keeps the loop
    // bounded: every iteration either writes DB updates or strictly shrinks the deferred set, so a
    // metadata cache that never catches up cannot spin forever.
    private async runFollowUpPasses(): Promise<void> {
        let lastPassHadWrites = true;
        while (!this.stopped && (lastPassHadWrites || this.pendingRequest)) {
            if (this.pendingRequest) {
                const request = this.pendingRequest;
                this.pendingRequest = null;
                lastPassHadWrites = await this.runPass(request.files, request.settings, request.providers);
                continue;
            }

            const resolvable: TFile[] = [];
            for (const path of Array.from(this.deferredPaths)) {
                const abstract = this.app.vault.getAbstractFileByPath(path);
                if (!(abstract instanceof TFile)) {
                    // Path disappeared while deferred (delete/rename race) → drop all stale state.
                    this.forgetPath(path);
                    continue;
                }
                if (this.app.metadataCache.getFileCache(abstract)) {
                    // Cache caught up → eligible for the next sweep. Paths still missing their cache
                    // stay untouched in the set until an external trigger retries them.
                    this.deferredPaths.delete(path);
                    resolvable.push(abstract);
                }
            }
            if (resolvable.length === 0) {
                break;
            }
            lastPassHadWrites = await this.runPass(resolvable, this.lastSettings, this.lastProviders);
        }
    }

    private mergePendingRequest(files: TFile[], settings: NotebookNavigatorSettings, providers: FrontmatterSyncProviderFilter): void {
        if (!this.pendingRequest) {
            this.pendingRequest = { files: [...files], settings, providers };
            return;
        }
        const seen = new Set(this.pendingRequest.files.map(f => f.path));
        for (const file of files) {
            if (!seen.has(file.path)) {
                this.pendingRequest.files.push(file);
                seen.add(file.path);
            }
        }
        this.pendingRequest.settings = settings;
        this.pendingRequest.providers = providers;
    }

    private lastProviders: FrontmatterSyncProviderFilter = 'all';

    // Runs one extraction pass plus batched DB writes. Returns true when the pass queued any DB
    // update (used by the bounded follow-up loop to decide whether another sweep is worthwhile).
    private async runPass(files: TFile[], settings: NotebookNavigatorSettings, providers: FrontmatterSyncProviderFilter): Promise<boolean> {
        this.lastSettings = settings;
        this.lastProviders = providers;
        const db = getDBInstance();
        const includes = (type: ContentProviderType) => providers === 'all' || providers.includes(type);

        // Per-provider update lists keep CAS mtime semantics identical to the per-provider registry writes.
        const contentUpdatesByProvider = new Map<ContentProviderType, SyncContentUpdate[]>();
        const mtimeUpdatesByProvider = new Map<ContentProviderType, SyncMtimeUpdate[]>();

        for (const requested of files) {
            if (this.stopped) return false;

            // Re-resolve each path to pick up deletes/renames and avoid holding stale TFile references.
            const abstract = this.app.vault.getAbstractFileByPath(requested.path);
            if (!(abstract instanceof TFile)) {
                this.forgetPath(requested.path);
                continue;
            }
            // Use the current canonical path from the vault in case the file moved between enqueue and processing.
            const file = abstract;
            const path = file.path;
            if (file.extension !== 'md') continue;

            const fileData = db.getFile(path);
            const cache = this.app.metadataCache.getFileCache(file);
            if (!cache) {
                this.deferredPaths.add(path);
                continue;
            }

            const fileMtimeAtStart = file.stat.mtime;
            let anyDeferred = false;
            // Providers disabled by settings are skipped entirely (needsProcessing returned false in
            // the old hierarchy) — they must never queue CAS mtime writes for their provider type.
            const runMarkdownPipeline = includes('markdownPipeline');
            const runTags = includes('tags') && settings.showTags;
            const runMetadata =
                includes('metadata') && (settings.useFrontmatterMetadata || getActiveHiddenFileProperties(settings).length > 0);

            if (runMarkdownPipeline) {
                const result = extractPropertiesSync(file, cache, fileData, path, this.emptyRetryCounts);
                anyDeferred = anyDeferred || !result.processed;
                this.recordResult('markdownPipeline', path, fileMtimeAtStart, result, fileData, contentUpdatesByProvider, mtimeUpdatesByProvider);
            }

            if (runTags) {
                const result = extractTagsSync(file, cache, fileData, settings, path, this.emptyRetryCounts);
                anyDeferred = anyDeferred || !result.processed;
                this.recordResult('tags', path, fileMtimeAtStart, result, fileData, contentUpdatesByProvider, mtimeUpdatesByProvider);
            }

            if (runMetadata) {
                const result = extractMetadataSync(file, cache, fileData, settings, this.app, path, this.pendingHiddenStates);
                anyDeferred = anyDeferred || !result.processed;
                this.recordResult('metadata', path, fileMtimeAtStart, result, fileData, contentUpdatesByProvider, mtimeUpdatesByProvider);
            }

            // Deferral membership tracks the providers' `processed:false` signal exactly (the old
            // base class re-queued such files via retry timers). Fully processed files leave the set
            // even when nothing was recorded — an up-to-date file must not linger as "deferred".
            if (anyDeferred) {
                this.deferredPaths.add(path);
            } else {
                this.deferredPaths.delete(path);
            }
        }

        if (this.stopped) return false;

        let hadWrites = false;
        // Writes are skipped during plugin shutdown to avoid benign transaction errors (base-class behavior).
        if (!isShutdownInProgress()) {
            for (const type of ['markdownPipeline', 'tags', 'metadata'] as ContentProviderType[]) {
                const contentUpdates = contentUpdatesByProvider.get(type);
                const processedMtimeUpdates = mtimeUpdatesByProvider.get(type);
                if (!contentUpdates?.length && !processedMtimeUpdates?.length) continue;
                hadWrites = true;
                await db.batchUpdateFileContentAndProviderProcessedMtimes({
                    provider: type,
                    contentUpdates: contentUpdates ?? [],
                    processedMtimeUpdates: processedMtimeUpdates ?? []
                });
            }
        }
        return hadWrites;
    }

    // Mirrors the former base provider's post-processFile bookkeeping: retry scheduling becomes the deferred
    // set, guarded provider-mtime writes keep the CAS contract, and update paths stay canonical.
    // Returns true when anything was recorded for the DB write.
    private recordResult(
        provider: ContentProviderType,
        path: string,
        fileMtime: number,
        result: SyncExtractResult,
        fileData: FileData | null,
        contentUpdatesByProvider: Map<ContentProviderType, SyncContentUpdate[]>,
        mtimeUpdatesByProvider: Map<ContentProviderType, SyncMtimeUpdate[]>
    ): boolean {
        const expectedPreviousMtime = fileData ? fileData[getProviderProcessedMtimeField(provider)] : 0;

        // Avoids writing provider mtime when the stored value already matches this batch snapshot.
        if (result.processed && fileMtime !== expectedPreviousMtime) {
            const list = mtimeUpdatesByProvider.get(provider) ?? [];
            list.push({ path, mtime: fileMtime, expectedPreviousMtime });
            mtimeUpdatesByProvider.set(provider, list);
        }

        if (result.update) {
            // Normalize update path to the current file path before persisting (already canonical here).
            const list = contentUpdatesByProvider.get(provider) ?? [];
            const update: SyncContentUpdate = { path };
            if (result.update.tags !== undefined) update.tags = result.update.tags;
            if (result.update.properties !== undefined) update.properties = result.update.properties;
            if (result.update.metadata !== undefined) update.metadata = result.update.metadata;
            list.push(update);
            contentUpdatesByProvider.set(provider, list);
            return true;
        }

        return result.processed && fileMtime !== expectedPreviousMtime;
    }

    private forgetPath(path: string): void {
        this.deferredPaths.delete(path);
        this.emptyRetryCounts.delete(path);
        this.pendingHiddenStates.delete(path);
    }
}
