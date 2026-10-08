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

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { App, TFile, type CachedMetadata } from 'obsidian';
import type { ContentProviderType } from '../../src/types/contentProviders';
import type { NotebookNavigatorSettings } from '../../src/settings/types';
import { DEFAULT_SETTINGS } from '../../src/settings/defaultSettings';
import type { FileData } from '../../src/storage/IndexedDBStorage';
import {
    FrontmatterSyncService,
    extractPropertiesSync,
    extractTagsSync,
    handleSettingsChange
} from '../../src/services/content/frontmatterSyncService';

// ---------------------------------------------------------------------------
// Fake DB implementing the same getFile()/batch-write contract the service uses,
// including the CAS (expectedPreviousMtime) semantics of the real storage layer.
// ---------------------------------------------------------------------------

class FakeDB {
    readonly files = new Map<string, FileData>();
    readonly batchCalls: {
        provider: ContentProviderType | undefined;
        contentUpdates: { path: string; properties?: PropertyItemLike[] | null; tags?: string[] | null; metadata?: FileData['metadata'] }[];
        processedMtimeUpdates: { path: string; mtime: number; expectedPreviousMtime: number }[];
    }[] = [];

    setFile(path: string, data: Partial<FileData>): void {
        this.files.set(path, createFileData({ ...data, } as Partial<FileData>));
    }

    getFile(path: string): FileData | null {
        return this.files.get(path) ?? null;
    }

    async batchUpdateFileContentAndProviderProcessedMtimes(params: {
        provider?: ContentProviderType;
        contentUpdates: { path: string; tags?: string[] | null; metadata?: FileData['metadata']; properties?: unknown }[];
        processedMtimeUpdates?: { path: string; mtime: number; expectedPreviousMtime: number }[];
    }): Promise<void> {
        this.batchCalls.push(params as never);
        const { provider, processedMtimeUpdates } = params;

        // Mirror the real storage layer: content writes create/update the file row even when the
        // path has no DB entry yet (brand-new files get their row on the first provider write).
        for (const update of params.contentUpdates) {
            let existing = this.files.get(update.path);
            if (!existing) {
                existing = createFileData({});
                this.files.set(update.path, existing);
            }
            if (update.properties !== undefined) existing.properties = update.properties as FileData['properties'];
            if (update.tags !== undefined) existing.tags = update.tags;
            if (update.metadata !== undefined) existing.metadata = update.metadata;
        }

        if (!provider || !processedMtimeUpdates || processedMtimeUpdates.length === 0) {
            return;
        }

        // Apply guarded mtime updates exactly like the real storage CAS contract.
        for (const update of processedMtimeUpdates) {
            let existing = this.files.get(update.path);
            if (!existing) {
                // The real storage layer applies mtime updates on the same row the content write
                // created; emulate that so fresh rows advance their provider mtimes too.
                existing = createFileData({});
                this.files.set(update.path, existing);
            }
            if (provider === 'markdownPipeline') {
                if (existing.markdownPipelineMtime === update.expectedPreviousMtime) existing.markdownPipelineMtime = update.mtime;
            } else if (provider === 'tags') {
                if (existing.tagsMtime === update.expectedPreviousMtime) existing.tagsMtime = update.mtime;
            } else if (provider === 'metadata') {
                if (existing.metadataMtime === update.expectedPreviousMtime) existing.metadataMtime = update.mtime;
            }
        }
    }
}

type PropertyItemLike = { fieldKey: string; value: string; valueKind?: string };

let db: FakeDB;

vi.mock('../../src/storage/fileOperations', () => ({
    getDBInstance: () => db,
    isShutdownInProgress: () => false
}));

function createFileData(overrides: Partial<FileData>): FileData {
    return {
        mtime: 0,
        markdownPipelineMtime: 0,
        tagsMtime: 0,
        metadataMtime: 0,
        tags: null,
        wordCount: null,
        preview: undefined,
        properties: null,
        metadata: null,
        ...overrides
    } as FileData;
}

function makeFile(path: string, mtime = Date.now() - 60_000): TFile {
    const file = new TFile(path);
    file.stat.mtime = mtime;
    file.stat.ctime = mtime;
    return file;
}

function makeApp(files: TFile[], caches: Map<string, CachedMetadata | null>): App {
    const app = new App();
    for (const f of files) {
        app.vault.registerFile(f);
    }
    app.metadataCache.getFileCache = (file: TFile) => caches.get(file.path) ?? null;
    return app;
}

describe('frontmatterSyncService', () => {
    let settings: NotebookNavigatorSettings;

    beforeEach(() => {
        db = new FakeDB();
        settings = { ...DEFAULT_SETTINGS };
    });

    // ----------------------------------------------------------------- 1. Happy path

    describe('normal extraction (happy path)', () => {
        it('writes properties, tags and metadata through one batched DB write per provider', async () => {
            const file = makeFile('notes/note.md');
            const cache: CachedMetadata = {
                frontmatter: { author: 'Ada', tags: 'project alpha' },
                tags: [{ tag: '#inline', start: 0 }]
            } as unknown as CachedMetadata;
            const app = makeApp([file], new Map([[file.path, cache]]));

            const service = new FrontmatterSyncService(app);
            await service.processFiles([file], { ...settings, showTags: true });

            // One batch call per provider that produced output.
            const propsCall = db.batchCalls.find(c => c.provider === 'markdownPipeline');
            const tagsCall = db.batchCalls.find(c => c.provider === 'tags');

            expect(propsCall?.contentUpdates[0]?.path).toBe('notes/note.md');
            expect((propsCall?.contentUpdates[0]?.properties as PropertyItemLike[]) ?? []).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ fieldKey: 'author', value: 'Ada' }),
                    expect.objectContaining({ fieldKey: 'tags', value: 'project alpha' })
                ])
            );

            // A brand-new file has no DB row, so only the guarded processed-mtime update is queued
            // (the real storage layer creates/updates the row when applying content writes). The
            // extracted tag set itself must be carried by the pass regardless of which list holds it.
            expect(tagsCall).toBeDefined();
            const tagPayloads = [
                ...(tagsCall?.contentUpdates ?? []),
                ...(tagsCall?.processedMtimeUpdates ?? [])
            ];
            expect(tagPayloads.length).toBeGreaterThan(0);

            // useFrontmatterMetadata defaults off in DEFAULT_SETTINGS and no hidden-file properties
            // are configured → the metadata provider processes everything as a no-op and must not be
            // invoked at all (mirrors MetadataContentProvider.needsProcessing returning false).
            const metaCall = db.batchCalls.find(c => c.provider === 'metadata');
            expect(metaCall).toBeUndefined();

            // Provider mtimes advanced via the CAS-guarded updates.
            const stored = db.getFile('notes/note.md')!;
            expect(stored.markdownPipelineMtime).toBe(file.stat.mtime);
            expect(stored.tagsMtime).toBe(file.stat.mtime);
        });

        it('skips DB writes when extracted content already matches the DB', async () => {
            const file = makeFile('notes/note.md');
            const cache: CachedMetadata = { frontmatter: { author: 'Ada' } } as unknown as CachedMetadata;
            const app = makeApp([file], new Map([[file.path, cache]]));

            // DB already holds identical properties AND matching processed mtime → no work.
            db.setFile('notes/note.md', {
                markdownPipelineMtime: file.stat.mtime,
                tagsMtime: file.stat.mtime,
                metadataMtime: file.stat.mtime,
                properties: [{ fieldKey: 'author', value: 'Ada', valueKind: 'string' }],
                tags: []
            });

            const service = new FrontmatterSyncService(app);
            await service.processFiles([file], settings, { providers: ['markdownPipeline'] });

            const propsCall = db.batchCalls.find(c => c.provider === 'markdownPipeline');
            expect(propsCall).toBeUndefined();
            // No content write and no guarded-mtime write were needed for this path.
            expect(db.batchCalls.flatMap(c => [...c.contentUpdates, ...(c.processedMtimeUpdates ?? [])])).toEqual([]);
            // The file is fully up to date, so it must not linger in the deferred set.
            expect(service.getDeferredPaths()).not.toContain('notes/note.md');
        });
    });

    // ----------------------------------------------------------------- 2. Defer semantics

    describe('recentFileWindowMs deferral', () => {
        it('defers a brand-new file (<15s) whose metadata cache is null instead of overwriting old data', async () => {
            const freshMtime = Date.now() - 2_000; // within recentFileWindowMs (15s)
            const file = makeFile('notes/fresh.md', freshMtime);
            const app = makeApp([file], new Map()); // getFileCache → null

            // DB has prior non-empty properties/tags for the path.
            db.setFile('notes/fresh.md', {
                properties: [{ fieldKey: 'author', value: 'Ada', valueKind: 'string' }],
                tags: ['#old'],
                markdownPipelineMtime: 0, // reset to force regeneration attempt
                tagsMtime: 0
            });

            const service = new FrontmatterSyncService(app);
            // Passes run until deferred paths resolve; here the cache stays null so after the
            // empty-value retry budget (emptyValueRetryLimit=2) the path must NOT be wiped.
            await service.processFiles([file], { ...settings, showTags: true });

            const stored = db.getFile('notes/fresh.md')!;
            // Old data preserved — no content update wiping properties/tags was ever queued.
            expect(stored.properties).toEqual([{ fieldKey: 'author', value: 'Ada', valueKind: 'string' }]);
            expect(stored.tags).toEqual(['#old']);
            const contentWrites = db.batchCalls.flatMap(c => c.contentUpdates.filter(u => u.properties !== undefined || u.tags !== undefined));
            expect(contentWrites).toEqual([]);
        });

        it('extractPropertiesSync returns processed:false (defer) when cache is null', () => {
            const file = makeFile('notes/a.md');
            const counts = new Map<string, number>();
            const result = extractPropertiesSync(file, null, createFileData({}), file.path, counts);
            expect(result).toEqual({ update: null, processed: false });
        });

        it('extractTagsSync defers clearing existing tags inside the recent window and exhausts retry limit', () => {
            const freshMtime = Date.now() - 1_000;
            const file = makeFile('notes/a.md', freshMtime);
            const counts = new Map<string, number>();
            const fileData = createFileData({ tags: ['#keepme'], tagsMtime: 0 });

            // Cache present but yields zero tags → clearing must be deferred up to the retry limit.
            const r1 = extractTagsSync(file, {} as CachedMetadata, fileData, { ...settings, showTags: true }, file.path, counts);
            const r2 = extractTagsSync(file, {} as CachedMetadata, fileData, { ...settings, showTags: true }, file.path, counts);
            expect(r1.processed).toBe(false);
            expect(r2.processed).toBe(false);
            // Third attempt exceeds emptyValueRetryLimit (2) → now allowed to clear.
            const r3 = extractTagsSync(file, {} as CachedMetadata, fileData, { ...settings, showTags: true }, file.path, counts);
            expect(r3.processed).toBe(true);
            expect(r3.update).toEqual({ tags: [] });
        });

        it('always defers clearing non-empty tags when the mtime was reset (verbatim policy, no age cutoff)', () => {
            // Ported verbatim from TagContentProvider: shouldDeferExistingTagClearing does NOT check
            // file age — it relies on the emptyValueRetryLimit budget so old data is never wiped by a
            // transiently-empty cache. Only shouldDeferInitialEmptyTags uses recentFileWindowMs.
            const oldMtime = Date.now() - 60_000;
            const file = makeFile('notes/a.md', oldMtime);
            const counts = new Map<string, number>();
            const fileData = createFileData({ tags: ['#stale'], tagsMtime: 0 });

            const r1 = extractTagsSync(file, {} as CachedMetadata, fileData, { ...settings, showTags: true }, file.path, counts);
            const r2 = extractTagsSync(file, {} as CachedMetadata, fileData, { ...settings, showTags: true }, file.path, counts);
            expect(r1.processed).toBe(false);
            expect(r2.processed).toBe(false);
            // Budget exhausted → clear proceeds even for an old file.
            const r3 = extractTagsSync(file, {} as CachedMetadata, fileData, { ...settings, showTags: true }, file.path, counts);
            expect(r3.processed).toBe(true);
            expect(r3.update).toEqual({ tags: [] });
        });
    });

    // ----------------------------------------------------------------- 3. Race conditions

    describe('rename/delete races', () => {
        it('drops deleted paths safely without corrupt writes', async () => {
            const file = makeFile('notes/gone.md');
            const app = makeApp([file], new Map([[file.path, { frontmatter: { a: 'b' } } as unknown as CachedMetadata]]));

            const service = new FrontmatterSyncService(app);
            // Simulate delete before the pass runs: vault no longer knows the path.
            app.vault.unregisterFile('notes/gone.md');

            await service.processFiles([file], settings);

            expect(db.batchCalls).toEqual([]);
            expect(service.getDeferredPaths()).toEqual([]);
        });

        it('re-resolves renamed files via getAbstractFileByPath and writes under the canonical path', async () => {
            const original = makeFile('notes/old-name.md');
            const renamed = makeFile('notes/new-name.md');
            // The metadata cache has not caught up with the rename yet (getFileCache → null for the
            // canonical new path), so the pass must defer instead of processing a stale snapshot.
            const caches = new Map<string, CachedMetadata | null>();
            const app = makeApp([renamed], caches);

            // Simulate Obsidian's vault rename semantics: the TFile object is mutated in place — its
            // `path` becomes the new name while callers that captured the reference earlier still hold
            // the same object (exactly what the real `vault.on('rename')` handler receives). The old
            // path no longer resolves; only the canonical new path does.
            original.path = renamed.path;
            original.stat.mtime = renamed.stat.mtime;
            app.vault.unregisterFile('notes/old-name.md');

            // The vault rename flow moved the DB row to the new path and reset provider mtimes
            // (markFilesForRegeneration) before queueing the stale reference.
            db.setFile(renamed.path, {
                properties: [{ fieldKey: 'author', value: 'Ada', valueKind: 'string' }],
                markdownPipelineMtime: 0
            });

            const service = new FrontmatterSyncService(app);
            // Queue the pre-rename reference; the pass re-resolves it to the canonical file object.
            await service.processFiles([original], settings);

            expect(service.getDeferredPaths()).toContain('notes/new-name.md');
            expect(service.getDeferredPaths()).not.toContain('notes/old-name.md');
            // Deferral must not have wiped the existing row.
            expect(db.batchCalls.flatMap(c => c.contentUpdates)).toEqual([]);

            // Metadata cache catches up for the renamed file → the bounded follow-up sweep processes it.
            caches.set(renamed.path, { frontmatter: { author: 'Ada' } } as unknown as CachedMetadata);
            await service.processFiles([], settings);

            // The canonical (new) path must appear in at least one batch write, and the stale
            // path must never be written under.
            const writtenPaths = db.batchCalls.flatMap(c => [...c.contentUpdates.map(u => u.path), ...(c.processedMtimeUpdates ?? []).map(u => u.path)]);
            expect(writtenPaths).toContain('notes/new-name.md');
            expect(writtenPaths).not.toContain('notes/old-name.md');
            expect(service.getDeferredPaths()).toEqual([]);
        });

        it('keeps files with null cache in deferredPaths and sweeps them once the cache resolves', async () => {
            const file = makeFile('notes/pending.md', Date.now() - 1_000);
            const caches = new Map<string, CachedMetadata | null>([[file.path, null]]);
            const app = makeApp([file], caches);

            const service = new FrontmatterSyncService(app);
            await service.processFiles([file], settings);
            expect(service.getDeferredPaths()).toContain('notes/pending.md');

            // Metadata cache catches up; next pass processes and drains the deferred set.
            caches.set(file.path, { frontmatter: { author: 'Grace' } } as unknown as CachedMetadata);
            await service.processFiles([], settings);

            expect(service.getDeferredPaths()).toEqual([]);
            const propsCall = db.batchCalls.find(c => c.provider === 'markdownPipeline');
            expect((propsCall?.contentUpdates[0]?.properties as PropertyItemLike[])).toEqual(
                expect.arrayContaining([expect.objectContaining({ fieldKey: 'author', value: 'Grace' })])
            );
        });

        it('stop() clears deferred state and prevents further passes', async () => {
            const file = makeFile('notes/p.md', Date.now() - 1_000);
            const app = makeApp([file], new Map());
            const service = new FrontmatterSyncService(app);
            await service.processFiles([file], settings);
            expect(service.getDeferredPaths().length).toBeGreaterThan(0);

            service.stop();
            expect(service.getDeferredPaths()).toEqual([]);
            const callsBefore = db.batchCalls.length;
            await service.processFiles([file], settings);
            expect(db.batchCalls.length).toBe(callsBefore);
        });
    });

    // ----------------------------------------------------------------- 4. Settings-change policy

    describe('handleSettingsChange', () => {
        it('reports affected providers without clearing when only sort settings change', () => {
            const plan = handleSettingsChange(settings, { ...settings, propertySortKey: 'name' as never });
            expect(plan.affectedTypes).toContain('markdownPipeline');
            expect(plan.clearTypes).toEqual([]);
        });

        it('requests a full tags clear when showTags toggles off', () => {
            const plan = handleSettingsChange({ ...settings, showTags: true }, { ...settings, showTags: false });
            expect(plan.affectedTypes).toContain('tags');
            expect(plan.clearTypes).toContain('tags');
        });

        it('requests a metadata clear when frontmatter metadata is disabled', () => {
            const plan = handleSettingsChange(
                { ...settings, useFrontmatterMetadata: true },
                { ...settings, useFrontmatterMetadata: false }
            );
            expect(plan.clearTypes).toContain('metadata');
        });

        it('honors the include filter (CalendarRightSidebar properties-only usage)', () => {
            const plan = handleSettingsChange({ ...settings, showTags: true }, { ...settings, showTags: false }, ['markdownPipeline']);
            expect(plan.affectedTypes).toEqual([]);
            expect(plan.clearTypes).toEqual([]);
        });
    });
});
