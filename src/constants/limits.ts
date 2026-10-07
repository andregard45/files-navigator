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
 * Centralized, non-user-configurable limits used to keep background processing predictable.
 *
 * Design goals:
 * - Prevent UI freezes and out-of-memory crashes (especially on mobile).
 * - Bound worst-case work per scan (bytes read, pixels decoded, concurrency).
 * - Keep derived caches (IndexedDB + in-memory LRUs) within reasonable sizes.
 *
 * Notes:
 * - These are "safety rails", not accuracy guarantees (e.g. huge markdown files may fall back to conservative defaults).
 * - Values are intentionally conservative on mobile where memory and CPU budgets are smaller and OS OOM-kills are common.
 * - When changing a limit, consider both: (1) peak memory usage and (2) total work during initial vault scans.
 */
export const LIMITS = {
    markdown: {
        /**
         * Maximum markdown file size (bytes on disk) that we will read into a JS string via `vault.cachedRead()`.
         *
         * Used by:
         * - `MarkdownPipelineContentProvider` when generating preview text and/or word count.
         *
         * Why this exists:
         * - Reading large markdown files allocates a large JS string (often ~2 bytes per code unit), and preview/word-count
         *   extraction can create additional transient allocations. On mobile this can cause jank or OOM.
         *
         * Behavior when exceeded:
         * - The provider skips reading the file body and only applies "safe" updates that can be derived from metadata/frontmatter.
         * - Word count/preview may be set to conservative defaults to avoid repeated reprocessing loops.
         */
        maxReadBytes: {
            // Mobile: keep well below typical memory pressure thresholds; avoids freezing/OS kill during full-vault scans.
            mobile: 2_000_000,
            // Desktop: larger budget is usually safe, but still bounded to avoid pathological files dominating scan time.
            desktop: 8_000_000
        }
    },
    storage: {
        /**
         * Default in-memory cache sizes (LRU-like structures).
         *
         * Rationale:
         * - These are performance optimizations; too small increases churn, too large increases memory usage.
         * - Values are defaults that can still be overridden by constructor options where supported.
         */
        /**
         * Maximum number of preview text entries cached in memory.
         * Previews are small strings; 10k keeps scrolling snappy in large vaults without being too memory heavy.
         */
        previewTextCacheMaxEntriesDefault: 10_000,
        /**
         * Maximum number of formatted date/time strings cached in memory.
         * Keys include the format, timestamp, timezone offset, and UI language.
         */
        dateFormatCacheMaxEntries: 8192,
        /**
         * Maximum number of previews loaded in a single batch when warming the preview cache.
         * Keeps IndexedDB transactions short and avoids long main-thread stalls.
         */
        previewLoadMaxBatchDefault: 50
    },
    contentProvider: {
        /**
         * BaseContentProvider batch and retry controls.
         *
         * Rationale:
         * - Keeps background work responsive: process in chunks, parallelize moderately, and backoff on failures.
         */
        queueBatchSize: 100,
        parallelLimit: 10,
        retry: {
            /**
             * Exponential backoff for retry-later semantics (e.g. waiting for metadata cache).
             */
            initialDelayMs: 1000,
            maxDelayMs: 30_000,
            maxAttempts: 5
        },
        metadataCache: {
            /**
             * Controls for metadata-cache reads that can temporarily return empty results for recently created files.
             * Providers can defer persisting empty values and allow BaseContentProvider retries.
             */
            emptyValueRetryLimit: 2,
            recentFileWindowMs: 15_000
        }
    },
    operations: {
        /**
         * Number of files processed before yielding to the event loop during
         * tag/property rename and delete workflows.
         */
        metadataMutationYieldBatchSize: 100
    }
} as const;
