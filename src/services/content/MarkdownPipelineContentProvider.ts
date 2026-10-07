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

import { type FrontMatterCache, type TFile } from 'obsidian';
import { LIMITS } from '../../constants/limits';
import { type ContentProviderType } from '../../interfaces/IContentProvider';
import type { NotebookNavigatorSettings } from '../../settings/types';
import { type PropertyItem, FileData } from '../../storage/IndexedDBStorage';
import { getDBInstance } from '../../storage/fileOperations';
import { arePropertyItemsEqual, extractFrontmatterPropertyValues } from '../../utils/propertyUtils';
import { BaseContentProvider, type ContentProviderProcessResult } from './BaseContentProvider';

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

export class MarkdownPipelineContentProvider extends BaseContentProvider {
    private readonly emptyFrontmatterRetryCounts = new Map<string, number>();

    getContentType(): ContentProviderType {
        return 'markdownPipeline';
    }

    getRelevantSettings(): (keyof NotebookNavigatorSettings)[] {
        // defaultFolderSortPropertyKey is intentionally absent: which non-manual property performs the
        // default sort does not change extracted content, and every transition that can flip effective
        // custom grouping also changes defaultFolderSort, propertySortKey, or manualSortPropertyKey,
        // which are listed. Listing it would rescan the vault when switching between sort properties.
        // Appearance maps are observed through their effective word/character consumer state in
        // useStorageSettingsSync, so visual-only appearance edits do not restart this provider.
        return [
            'manualSortGroupHeaderProperty',
            'manualSortPropertyKey',
            'noteGrouping',
            'defaultFolderSort',
            'propertySortKey',
            'propertyGroupKey',
            'folderSortOverrides',
            'tagSortOverrides',
            'propertySortOverrides'
        ];
    }

    shouldRegenerate(_oldSettings: NotebookNavigatorSettings, _newSettings: NotebookNavigatorSettings): boolean {
        // Property visibility no longer changes the vault-wide property cache because every supported
        // frontmatter value is indexed for internal search.
        return false;
    }

    async clearContent(_context?: { oldSettings: NotebookNavigatorSettings; newSettings: NotebookNavigatorSettings }): Promise<void> {
        await getDBInstance().batchClearAllFileContent('properties');
        this.emptyFrontmatterRetryCounts.clear();
    }

    protected needsProcessing(fileData: FileData | null, file: TFile, _settings: NotebookNavigatorSettings): boolean {
        if (file.extension !== 'md') {
            return false;
        }

        if (!fileData) {
            return true;
        }

        return fileData.properties === null;
    }

    protected async processFile(
        job: { file: TFile; path: string },
        fileData: FileData | null,
        _settings: NotebookNavigatorSettings
    ): Promise<ContentProviderProcessResult> {
        if (job.file.extension !== 'md') {
            return { update: null, processed: true };
        }

        const cachedMetadata = this.app.metadataCache.getFileCache(job.file);
        if (!cachedMetadata) {
            this.emptyFrontmatterRetryCounts.delete(job.path);
            return { update: null, processed: false };
        }

        const frontmatter = cachedMetadata.frontmatter ?? null;
        const fileModified = fileData !== null && fileData.markdownPipelineMtime !== job.file.stat.mtime;
        const needsPropertyFrontmatterRetry = fileModified && (fileData?.properties?.length ?? 0) > 0;

        // A null frontmatter cache is the stable state for notes without YAML, so an already-empty property
        // cache proceeds immediately. Existing property values retain the retry window because clearing them
        // before metadata catches up would temporarily remove search results and property-tree membership.
        if (frontmatter === null && needsPropertyFrontmatterRetry) {
            const attempts = this.emptyFrontmatterRetryCounts.get(job.path) ?? 0;
            const isRecent = Date.now() - job.file.stat.mtime <= LIMITS.contentProvider.metadataCache.recentFileWindowMs;
            if (isRecent && attempts < LIMITS.contentProvider.metadataCache.emptyValueRetryLimit) {
                this.emptyFrontmatterRetryCounts.set(job.path, attempts + 1);
                return { update: null, processed: false };
            }
        }

        this.emptyFrontmatterRetryCounts.delete(job.path);

        const nextProperties = resolvePropertyItemsFromFrontmatter(frontmatter);
        if (!fileData || fileData.properties === null || !arePropertyItemsEqual(fileData.properties, nextProperties)) {
            return { update: { path: job.path, properties: nextProperties }, processed: true };
        }

        return { update: null, processed: true };
    }
}
