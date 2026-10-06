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

import { Platform, parseYaml, type App, type CachedMetadata, type FrontMatterCache, type TFile } from 'obsidian';
import { LIMITS } from '../../constants/limits';
import { type ContentProviderType } from '../../interfaces/IContentProvider';
import type { NotebookNavigatorSettings } from '../../settings/types';
import { type PropertyItem, FileData } from '../../storage/IndexedDBStorage';
import { getDBInstance } from '../../storage/fileOperations';
import { areStringArraysEqual } from '../../utils/arrayUtils';
import { arePropertyItemsEqual, extractFrontmatterPropertyValues } from '../../utils/propertyUtils';
import { PreviewTextUtils } from '../../utils/previewTextUtils';
import { createCaseInsensitiveKeyMatcher, type CaseInsensitiveKeyMatcher } from '../../utils/recordUtils';
import {
    getDrawingDirectFeatureImageKey,
    getDrawingSourceProviderIdWithFrontmatter,
    type DrawingFeatureImageProviderId
} from '../../utils/drawingFeatureImages';
import { hasMarkdownFeatureImageConsumer, hasMarkdownPreviewConsumer } from '../../utils/markdownPipelineContentTypes';
import { isGeneratedThumbnailFile } from '../../utils/fileTypeUtils';
import type { ContentProviderProcessResult } from './BaseContentProvider';
import { findFeatureImageReference, hasSvgUrlPathExtension, type FeatureImageReference } from './featureImageReferenceResolver';
import { FeatureImageContentProvider } from './FeatureImageContentProvider';

type MarkdownPipelineContext = {
    file: TFile;
    fileData: FileData | null;
    settings: NotebookNavigatorSettings;
    content: string;
    frontmatter: FrontMatterCache | null;
    bodyStartIndex: number;
    isDrawing: boolean;
    drawingProviderId: DrawingFeatureImageProviderId | null;
    fileModified: boolean;
    hasContent: boolean;
    featureImageReference: FeatureImageReference | null;
    featureImageExcluded: boolean;
};

type MarkdownPipelineUpdate = {
    preview?: string;
    properties?: FileData['properties'];
    featureImageKey?: string | null;
    featureImage?: Blob | null;
};

type MarkdownPipelineProcessorId = 'preview' | 'properties' | 'featureImage';

type MarkdownPipelineProcessor = {
    id: MarkdownPipelineProcessorId;
    needsProcessing: (context: MarkdownPipelineContext) => boolean;
    run: (context: MarkdownPipelineContext) => Promise<MarkdownPipelineUpdate | null>;
};

export type MarkdownPipelineClearFlags = {
    shouldClearPreview: boolean;
    shouldClearProperties: boolean;
    shouldClearFeatureImage: boolean;
};

export function getMarkdownPipelineClearFlags(
    context: { oldSettings: NotebookNavigatorSettings; newSettings: NotebookNavigatorSettings } | undefined,
    app?: App
): MarkdownPipelineClearFlags {
    if (!context) {
        return {
            shouldClearPreview: true,
            shouldClearProperties: true,
            shouldClearFeatureImage: true
        };
    }

    const { oldSettings, newSettings } = context;

    const previewExtractionSettingsChanged =
        oldSettings.skipHeadingsInPreview !== newSettings.skipHeadingsInPreview ||
        oldSettings.skipCodeBlocksInPreview !== newSettings.skipCodeBlocksInPreview ||
        oldSettings.skipCalloutsInPreview !== newSettings.skipCalloutsInPreview ||
        oldSettings.stripHtmlInPreview !== newSettings.stripHtmlInPreview ||
        oldSettings.stripLatexInPreview !== newSettings.stripLatexInPreview ||
        !areStringArraysEqual(oldSettings.previewProperties, newSettings.previewProperties) ||
        oldSettings.previewPropertiesFallback !== newSettings.previewPropertiesFallback;
    const shouldClearPreview =
        previewExtractionSettingsChanged ||
        // Toggling preview clears stale text while the disabled state hides the intermediate empty rows.
        oldSettings.showFilePreview !== newSettings.showFilePreview;

    const featureImagePropertiesChanged = !areStringArraysEqual(oldSettings.featureImageProperties, newSettings.featureImageProperties);
    const featureImageExcludePropertiesChanged = !areStringArraysEqual(
        oldSettings.featureImageExcludeProperties,
        newSettings.featureImageExcludeProperties
    );

    const shouldClearFeatureImage =
        featureImageExcludePropertiesChanged ||
        oldSettings.featureImagePixelSize !== newSettings.featureImagePixelSize ||
        (oldSettings.showFeatureImage && !newSettings.showFeatureImage) ||
        (newSettings.showFeatureImage &&
            (featureImagePropertiesChanged || oldSettings.downloadExternalFeatureImages !== newSettings.downloadExternalFeatureImages));

    return {
        shouldClearPreview,
        // Property visibility no longer changes the vault-wide property cache because every supported
        // frontmatter value is indexed for internal search.
        shouldClearProperties: false,
        shouldClearFeatureImage
    };
}

function resolveMarkdownBodyStartIndex(metadata: CachedMetadata, content: string): number {
    const rawOffset = metadata.frontmatterPosition?.end?.offset;
    if (typeof rawOffset !== 'number' || rawOffset <= 0) {
        return 0;
    }

    let index = Math.min(Math.max(0, rawOffset), content.length);

    while (index < content.length) {
        const char = content[index];
        if (char !== '\n' && char !== '\r') {
            break;
        }
        index += 1;
    }

    return index;
}

function extractYamlFrontmatter(content: string): string | null {
    // Parse only the leading YAML block so drawing frontmatter can be recovered from fresh file content.
    const firstLineEnd = content.indexOf('\n');
    const firstLine = firstLineEnd === -1 ? content : content.slice(0, firstLineEnd);
    const normalizedFirstLine = firstLine.charCodeAt(0) === 0xfeff ? firstLine.slice(1) : firstLine;

    if (normalizedFirstLine.trim() !== '---' || firstLineEnd === -1) {
        return null;
    }

    const yamlStart = firstLineEnd + 1;
    let lineStart = yamlStart;
    while (lineStart <= content.length) {
        const nextLineEnd = content.indexOf('\n', lineStart);
        const lineEnd = nextLineEnd === -1 ? content.length : nextLineEnd;
        const line = content.slice(lineStart, lineEnd);
        const trimmed = line.trim();

        if (trimmed === '---' || trimmed === '...') {
            return content.slice(yamlStart, lineStart).trim();
        }

        if (nextLineEnd === -1) {
            break;
        }

        lineStart = lineEnd + 1;
    }

    return null;
}

function detectDrawingProviderFromContent(file: TFile, content: string): DrawingFeatureImageProviderId | null {
    const yamlText = extractYamlFrontmatter(content);
    if (!yamlText) {
        return null;
    }

    try {
        const parsed: unknown = parseYaml(yamlText);
        return getDrawingSourceProviderIdWithFrontmatter(file, parsed);
    } catch {
        return null;
    }
}

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

export class MarkdownPipelineContentProvider extends FeatureImageContentProvider {
    protected readonly PARALLEL_LIMIT: number = LIMITS.contentProvider.parallelLimit;
    private readonly readFailureAttemptsByPath = new Map<string, number>();
    private readonly emptyFrontmatterRetryCounts = new Map<string, number>();
    private featureImageExcludeMatcherKeys: string[] = [];
    private featureImageExcludeMatcher: CaseInsensitiveKeyMatcher | null = null;

    private readonly processors: MarkdownPipelineProcessor[] = [
        {
            id: 'preview',
            needsProcessing: context => {
                return (
                    hasMarkdownPreviewConsumer(context.settings) &&
                    (!context.fileData || context.fileModified || context.fileData.previewStatus === 'unprocessed') &&
                    (context.hasContent || context.isDrawing)
                );
            },
            run: async context => await this.processPreview(context)
        },
        {
            id: 'properties',
            needsProcessing: context => {
                return !context.fileData || context.fileModified || context.fileData.properties === null;
            },
            run: async context => await this.processProperties(context)
        },
        {
            id: 'featureImage',
            needsProcessing: context => {
                if (!hasMarkdownFeatureImageConsumer(context.settings)) {
                    return false;
                }

                if (!context.isDrawing && !context.featureImageReference && !context.hasContent && !context.featureImageExcluded) {
                    return false;
                }

                return (
                    !context.fileData ||
                    context.fileModified ||
                    context.fileData.featureImageKey === null ||
                    context.fileData.featureImageStatus === 'unprocessed' ||
                    (!context.featureImageExcluded &&
                        context.drawingProviderId !== null &&
                        context.fileData.featureImageKey !== getDrawingDirectFeatureImageKey(context.file, context.drawingProviderId))
                );
            },
            run: async context => await this.processFeatureImage(context)
        }
    ];

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
            'showFilePreview',
            'skipHeadingsInPreview',
            'skipCodeBlocksInPreview',
            'skipCalloutsInPreview',
            'stripHtmlInPreview',
            'stripLatexInPreview',
            'previewProperties',
            'previewPropertiesFallback',
            'showFeatureImage',
            'featureImageProperties',
            'featureImageExcludeProperties',
            'featureImagePixelSize',
            'downloadExternalFeatureImages',
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

    private recordReadFailure(path: string): { attempts: number; shouldFallback: boolean } {
        const previous = this.readFailureAttemptsByPath.get(path) ?? 0;
        const attempts = previous + 1;
        this.readFailureAttemptsByPath.set(path, attempts);
        return { attempts, shouldFallback: attempts >= LIMITS.contentProvider.retry.maxAttempts };
    }

    private clearReadFailures(path: string): void {
        this.readFailureAttemptsByPath.delete(path);
    }

    private getFeatureImageExcludeMatcher(keys: string[]): CaseInsensitiveKeyMatcher {
        if (!this.featureImageExcludeMatcher || !areStringArraysEqual(this.featureImageExcludeMatcherKeys, keys)) {
            this.featureImageExcludeMatcherKeys = [...keys];
            this.featureImageExcludeMatcher = createCaseInsensitiveKeyMatcher(keys);
        }

        return this.featureImageExcludeMatcher;
    }

    shouldRegenerate(oldSettings: NotebookNavigatorSettings, newSettings: NotebookNavigatorSettings): boolean {
        const { shouldClearPreview, shouldClearProperties, shouldClearFeatureImage } = getMarkdownPipelineClearFlags(
            {
                oldSettings,
                newSettings
            },
            this.app
        );
        return shouldClearPreview || shouldClearProperties || shouldClearFeatureImage;
    }

    async clearContent(context?: { oldSettings: NotebookNavigatorSettings; newSettings: NotebookNavigatorSettings }): Promise<void> {
        const { shouldClearPreview, shouldClearProperties, shouldClearFeatureImage } = getMarkdownPipelineClearFlags(context, this.app);

        if (!shouldClearPreview && !shouldClearProperties && !shouldClearFeatureImage) {
            return;
        }

        const db = getDBInstance();

        if (shouldClearPreview) {
            await db.batchClearAllFileContent('preview');
        }

        if (shouldClearProperties) {
            await db.batchClearAllFileContent('properties');
        }

        if (shouldClearFeatureImage) {
            await db.batchClearFeatureImageContent('markdown');
        }

        this.emptyFrontmatterRetryCounts.clear();
    }

    protected needsProcessing(fileData: FileData | null, file: TFile, settings: NotebookNavigatorSettings): boolean {
        if (file.extension !== 'md') {
            return false;
        }

        const needsRefresh = fileData !== null && fileData.markdownPipelineMtime !== file.stat.mtime;
        if (!fileData) {
            return true;
        }
        if (needsRefresh) {
            return true;
        }

        const needsPreview = hasMarkdownPreviewConsumer(settings) && fileData.previewStatus === 'unprocessed';
        let needsFeatureImage =
            hasMarkdownFeatureImageConsumer(settings) &&
            (fileData.featureImageKey === null || fileData.featureImageStatus === 'unprocessed');
        if (hasMarkdownFeatureImageConsumer(settings) && !needsFeatureImage) {
            const frontmatter = this.app.metadataCache.getFileCache(file)?.frontmatter;
            const featureImageExcluded = this.getFeatureImageExcludeMatcher(settings.featureImageExcludeProperties).matches(frontmatter);
            if (!featureImageExcluded) {
                const drawingProviderId = getDrawingSourceProviderIdWithFrontmatter(file, frontmatter);
                const expectedDrawingFeatureImageKey = drawingProviderId ? getDrawingDirectFeatureImageKey(file, drawingProviderId) : null;
                needsFeatureImage = expectedDrawingFeatureImageKey !== null && fileData.featureImageKey !== expectedDrawingFeatureImageKey;
            }
        }
        const needsProperties = fileData.properties === null;

        return needsPreview || needsFeatureImage || needsProperties;
    }

    protected async processFile(
        job: { file: TFile; path: string },
        fileData: FileData | null,
        settings: NotebookNavigatorSettings
    ): Promise<ContentProviderProcessResult> {
        if (job.file.extension !== 'md') {
            return { update: null, processed: true };
        }

        const previewEnabled = hasMarkdownPreviewConsumer(settings);
        const featureImageEnabled = hasMarkdownFeatureImageConsumer(settings);
        const previewPropertiesEnabled = previewEnabled && settings.previewProperties.length > 0;
        const featureImagePropertiesEnabled = featureImageEnabled && settings.featureImageProperties.length > 0;
        const featureImageExcludePropertiesEnabled = featureImageEnabled && settings.featureImageExcludeProperties.length > 0;

        const cachedMetadata = this.app.metadataCache.getFileCache(job.file);
        if (!cachedMetadata) {
            this.emptyFrontmatterRetryCounts.delete(job.path);
            return { update: null, processed: false };
        }

        const frontmatter = cachedMetadata.frontmatter ?? null;
        let drawingProviderId = getDrawingSourceProviderIdWithFrontmatter(job.file, frontmatter);
        let isDrawing = drawingProviderId !== null;
        const fileModified = fileData !== null && fileData.markdownPipelineMtime !== job.file.stat.mtime;
        const needsPreview = previewEnabled && (!fileData || fileModified || fileData.previewStatus === 'unprocessed');
        const needsPreviewContent = needsPreview && !isDrawing;
        const supportsPreviewProperties = !isDrawing || drawingProviderId === 'excalidraw';
        const needsPreviewPropertyFrontmatter = previewPropertiesEnabled && supportsPreviewProperties && needsPreview;
        const needsPropertyFrontmatterRetry = fileModified && (fileData?.properties?.length ?? 0) > 0;
        const needsFeatureImage =
            featureImageEnabled &&
            (!fileData || fileModified || fileData.featureImageKey === null || fileData.featureImageStatus === 'unprocessed') &&
            !isDrawing;
        const needsFeatureImageFrontmatter = needsFeatureImage && (featureImagePropertiesEnabled || featureImageExcludePropertiesEnabled);
        // A null frontmatter cache is the stable state for notes without YAML, so an already-empty property
        // cache proceeds immediately. Existing property values retain the retry window because clearing them
        // before metadata catches up would temporarily remove search results and property-tree membership.
        if (frontmatter === null && (needsPropertyFrontmatterRetry || needsPreviewPropertyFrontmatter || needsFeatureImageFrontmatter)) {
            const attempts = this.emptyFrontmatterRetryCounts.get(job.path) ?? 0;
            const isRecent = Date.now() - job.file.stat.mtime <= LIMITS.contentProvider.metadataCache.recentFileWindowMs;
            if (isRecent && attempts < LIMITS.contentProvider.metadataCache.emptyValueRetryLimit) {
                this.emptyFrontmatterRetryCounts.set(job.path, attempts + 1);
                return { update: null, processed: false };
            }
        }
        const featureImageExcludeMatcher = this.getFeatureImageExcludeMatcher(settings.featureImageExcludeProperties);
        const featureImageExcluded = featureImageEnabled && frontmatter !== null && featureImageExcludeMatcher.matches(frontmatter);

        const frontmatterFeatureImageReference =
            needsFeatureImage && frontmatter && !featureImageExcluded
                ? findFeatureImageReference({
                      app: this.app,
                      file: job.file,
                      content: '',
                      settings,
                      frontmatter,
                      bodyStartIndex: 0
                  })
                : null;

        const needsContent = needsPreviewContent || (needsFeatureImage && !featureImageExcluded && !frontmatterFeatureImageReference);

        const update: {
            path: string;
            preview?: string;
            featureImage?: Blob | null;
            featureImageKey?: string | null;
            properties?: FileData['properties'];
        } = { path: job.path };

        if (needsContent) {
            const maxMarkdownReadBytes = Platform.isMobile ? LIMITS.markdown.maxReadBytes.mobile : LIMITS.markdown.maxReadBytes.desktop;
            if (job.file.stat.size > maxMarkdownReadBytes) {
                // Large files stay on the metadata-only path, so recent frontmatter-only drawing notes need the same retry window.
                const needsDrawingFrontmatterForFeatureImage =
                    frontmatter === null && !isDrawing && needsFeatureImage && job.file.name.toLowerCase().endsWith('.md');
                if (needsDrawingFrontmatterForFeatureImage) {
                    const attempts = this.emptyFrontmatterRetryCounts.get(job.path) ?? 0;
                    const isRecent = Date.now() - job.file.stat.mtime <= LIMITS.contentProvider.metadataCache.recentFileWindowMs;
                    if (isRecent && attempts < LIMITS.contentProvider.metadataCache.emptyValueRetryLimit) {
                        this.emptyFrontmatterRetryCounts.set(job.path, attempts + 1);
                        return { update: null, processed: false };
                    }
                }

                this.emptyFrontmatterRetryCounts.delete(job.path);

                // Avoid reading full markdown content for large files; only apply updates derived from cached metadata/frontmatter.
                let hasSafeUpdate = false;

                const nextProperties = resolvePropertyItemsFromFrontmatter(frontmatter);
                if (!fileData || fileData.properties === null || !arePropertyItemsEqual(fileData.properties, nextProperties)) {
                    update.properties = nextProperties;
                    hasSafeUpdate = true;
                }

                if (needsPreviewContent) {
                    const shouldClearPreview = !fileData || fileData.previewStatus !== 'none';
                    if (shouldClearPreview) {
                        update.preview = '';
                        hasSafeUpdate = true;
                    }
                }

                if (needsFeatureImage && (frontmatterFeatureImageReference || featureImageExcluded)) {
                    const featureImageUpdate = await this.processMarkdownFeatureImage({
                        file: job.file,
                        fileData,
                        settings,
                        content: '',
                        frontmatter,
                        bodyStartIndex: 0,
                        drawingProviderId,
                        featureImageReference: frontmatterFeatureImageReference,
                        featureImageExcluded
                    });

                    if (featureImageUpdate) {
                        update.featureImageKey = featureImageUpdate.featureImageKey;
                        update.featureImage = featureImageUpdate.featureImage;
                        hasSafeUpdate = true;
                    }
                } else if (needsFeatureImage && !frontmatterFeatureImageReference) {
                    const shouldMarkMissingFeatureImage =
                        !fileData || fileData.featureImageKey === null || fileData.featureImageStatus === 'unprocessed';
                    if (shouldMarkMissingFeatureImage) {
                        update.featureImageKey = fileData?.featureImageKey ?? '';
                        update.featureImage = this.createEmptyBlob();
                        hasSafeUpdate = true;
                    }
                }

                if (hasSafeUpdate) {
                    return { update, processed: true };
                }

                return { update: null, processed: true };
            }
        }

        this.emptyFrontmatterRetryCounts.delete(job.path);

        let content: string;
        let hasContent = false;
        let bodyStartIndex = 0;
        try {
            if (needsContent) {
                content = await this.readFileContent(job.file);
                hasContent = true;
                bodyStartIndex = resolveMarkdownBodyStartIndex(cachedMetadata, content);
                this.clearReadFailures(job.path);
            } else {
                content = '';
            }
        } catch (error) {
            console.error(`Error reading markdown content for ${job.path}:`, error);
            const { shouldFallback } = this.recordReadFailure(job.path);
            let hasSafeUpdate = false;

            const nextProperties = resolvePropertyItemsFromFrontmatter(frontmatter);
            if (!fileData || fileData.properties === null || !arePropertyItemsEqual(fileData.properties, nextProperties)) {
                update.properties = nextProperties;
                hasSafeUpdate = true;
            }

            if (needsPreviewContent && shouldFallback) {
                const shouldClearPreview = !fileData || fileData.previewStatus !== 'none';
                if (shouldClearPreview) {
                    update.preview = '';
                    hasSafeUpdate = true;
                }
            }

            if (needsFeatureImage && frontmatterFeatureImageReference) {
                const featureImageUpdate = await this.processMarkdownFeatureImage({
                    file: job.file,
                    fileData,
                    settings,
                    content: '',
                    frontmatter,
                    bodyStartIndex: 0,
                    drawingProviderId,
                    featureImageReference: frontmatterFeatureImageReference,
                    featureImageExcluded
                });

                if (featureImageUpdate) {
                    update.featureImageKey = featureImageUpdate.featureImageKey;
                    update.featureImage = featureImageUpdate.featureImage;
                    hasSafeUpdate = true;
                }
            } else if (needsFeatureImage && featureImageExcluded) {
                const featureImageUpdate = await this.processMarkdownFeatureImage({
                    file: job.file,
                    fileData,
                    settings,
                    content: '',
                    frontmatter,
                    bodyStartIndex: 0,
                    drawingProviderId,
                    featureImageReference: null,
                    featureImageExcluded
                });

                if (featureImageUpdate) {
                    update.featureImageKey = featureImageUpdate.featureImageKey;
                    update.featureImage = featureImageUpdate.featureImage;
                    hasSafeUpdate = true;
                }
            } else if (needsFeatureImage && !frontmatterFeatureImageReference && shouldFallback) {
                const shouldMarkMissingFeatureImage =
                    !fileData || fileData.featureImageKey === null || fileData.featureImageStatus === 'unprocessed';
                if (shouldMarkMissingFeatureImage) {
                    update.featureImageKey = fileData?.featureImageKey ?? '';
                    update.featureImage = this.createEmptyBlob();
                    hasSafeUpdate = true;
                }
            }

            if (hasSafeUpdate) {
                // After repeated read failures, fall back to safe defaults and mark as processed to avoid endless retries.
                return { update, processed: shouldFallback };
            }

            return { update: null, processed: shouldFallback };
        }

        if (!isDrawing && frontmatter === null) {
            // Metadata cache can lag behind file reads right after save; recover frontmatter-only drawing detection from content.
            drawingProviderId = detectDrawingProviderFromContent(job.file, content);
            isDrawing = drawingProviderId !== null;
        }

        const context: MarkdownPipelineContext = {
            file: job.file,
            fileData,
            settings,
            content,
            frontmatter,
            bodyStartIndex,
            isDrawing,
            drawingProviderId,
            fileModified,
            hasContent,
            featureImageReference: frontmatterFeatureImageReference,
            featureImageExcluded
        };

        for (const processor of this.processors) {
            if (!processor.needsProcessing(context)) {
                continue;
            }

            const processorUpdate = await processor.run(context);
            if (!processorUpdate) {
                continue;
            }

            if (processorUpdate.preview !== undefined) {
                update.preview = processorUpdate.preview;
            }
            if (processorUpdate.properties !== undefined) {
                update.properties = processorUpdate.properties;
            }
            if (processorUpdate.featureImageKey !== undefined) {
                update.featureImageKey = processorUpdate.featureImageKey;
            }
            if (processorUpdate.featureImage !== undefined) {
                update.featureImage = processorUpdate.featureImage;
            }
        }

        const hasContentUpdate =
            update.preview !== undefined ||
            update.properties !== undefined ||
            update.featureImageKey !== undefined;

        if (hasContentUpdate) {
            return { update, processed: true };
        }

        return { update: null, processed: true };
    }

    private async processPreview(context: MarkdownPipelineContext): Promise<MarkdownPipelineUpdate | null> {
        try {
            // Excalidraw bodies contain serialized scene data, so only frontmatter properties can contribute preview text.
            let previewText: string;
            if (context.drawingProviderId === 'excalidraw') {
                previewText = PreviewTextUtils.extractPreviewText('', context.settings, context.frontmatter ?? undefined);
            } else if (context.isDrawing) {
                previewText = '';
            } else {
                previewText = PreviewTextUtils.extractPreviewText(context.content, context.settings, context.frontmatter ?? undefined);
            }

            if (!context.fileData) {
                return { preview: previewText };
            }

            if (previewText.length === 0 && context.fileData.previewStatus === 'none') {
                return null;
            }

            if (context.fileData.previewStatus === 'has') {
                const db = getDBInstance();
                const cachedPreview = db.getCachedPreviewText(context.file.path);
                if (cachedPreview.length > 0 && cachedPreview === previewText) {
                    return null;
                }
            }

            return { preview: previewText };
        } catch (error) {
            console.error(`Error generating preview for ${context.file.path}:`, error);
            if (!context.fileData || context.fileData.previewStatus === 'unprocessed') {
                return { preview: '' };
            }
            return null;
        }
    }

    private async processProperties(context: MarkdownPipelineContext): Promise<MarkdownPipelineUpdate | null> {
        try {
            const nextValue = resolvePropertyItemsFromFrontmatter(context.frontmatter);

            if (
                !context.fileData ||
                context.fileData.properties === null ||
                !arePropertyItemsEqual(context.fileData.properties, nextValue)
            ) {
                return { properties: nextValue };
            }

            return null;
        } catch (error) {
            console.error(`Error generating property values for ${context.file.path}:`, error);
            if (!context.fileData || context.fileData.properties === null) {
                return { properties: [] };
            }
            return null;
        }
    }

    private async processFeatureImage(context: MarkdownPipelineContext): Promise<MarkdownPipelineUpdate | null> {
        const featureImageUpdate = await this.processMarkdownFeatureImage({
            file: context.file,
            fileData: context.fileData,
            settings: context.settings,
            content: context.content,
            frontmatter: context.frontmatter,
            bodyStartIndex: context.bodyStartIndex,
            drawingProviderId: context.drawingProviderId,
            featureImageReference: context.featureImageReference,
            featureImageExcluded: context.featureImageExcluded
        });

        if (!featureImageUpdate) {
            return null;
        }

        return {
            featureImageKey: featureImageUpdate.featureImageKey,
            featureImage: featureImageUpdate.featureImage
        };
    }

    private async processMarkdownFeatureImage(params: {
        file: TFile;
        fileData: FileData | null;
        settings: NotebookNavigatorSettings;
        content: string;
        frontmatter: FrontMatterCache | null;
        bodyStartIndex: number;
        drawingProviderId: DrawingFeatureImageProviderId | null;
        featureImageReference: FeatureImageReference | null;
        featureImageExcluded: boolean;
    }): Promise<{ featureImageKey: string; featureImage: Blob } | null> {
        if (params.featureImageExcluded) {
            const featureImageKey = '';
            const isUpToDate = params.fileData?.featureImageKey === featureImageKey && params.fileData.featureImageStatus === 'none';
            if (isUpToDate) {
                return null;
            }

            return {
                featureImageKey,
                featureImage: this.createEmptyBlob()
            };
        }

        if (params.drawingProviderId) {
            const featureImageKey = getDrawingDirectFeatureImageKey(params.file, params.drawingProviderId);
            const isUpToDate = params.fileData?.featureImageKey === featureImageKey && params.fileData.featureImageStatus === 'none';
            if (isUpToDate) {
                return null;
            }

            return {
                featureImageKey,
                featureImage: this.createEmptyBlob()
            };
        }

        const reference =
            params.featureImageReference ??
            findFeatureImageReference({
                app: this.app,
                file: params.file,
                content: params.content,
                settings: params.settings,
                frontmatter: params.frontmatter,
                bodyStartIndex: params.bodyStartIndex
            });

        if (!reference) {
            const featureImageKey = '';
            if (params.fileData && params.fileData.featureImageKey === featureImageKey) {
                return null;
            }
            return {
                featureImageKey,
                featureImage: this.createEmptyBlob()
            };
        }

        const featureImageKey = this.getFeatureImageKey(reference);
        const hasStableThumbnail = params.fileData?.featureImageKey === featureImageKey && params.fileData.featureImageStatus === 'has';

        if (hasStableThumbnail) {
            return null;
        }

        // Local keys include the source mtime and external keys include the URL, so a rejected
        // generated thumbnail (PDF cover, rasterized SVG) is not re-attempted on every note edit.
        const isGeneratedThumbnailSource =
            (reference.kind === 'local' && isGeneratedThumbnailFile(reference.file)) ||
            (reference.kind === 'external' && hasSvgUrlPathExtension(reference.url));
        const hasRejectedThumbnailMarker =
            isGeneratedThumbnailSource &&
            params.fileData?.featureImageKey === featureImageKey &&
            params.fileData.featureImageStatus === 'none';

        if (hasRejectedThumbnailMarker) {
            return null;
        }

        try {
            const thumbnail = await this.createThumbnailBlob(reference, params.settings);
            return {
                featureImageKey,
                featureImage: thumbnail ?? this.createEmptyBlob()
            };
        } catch (error) {
            console.error(`Error generating feature image for ${params.file.path}:`, error);
            // Return an empty blob as a durable "attempted" marker so the file doesn't stay `unprocessed` forever.
            return {
                featureImageKey,
                featureImage: this.createEmptyBlob()
            };
        }
    }
}
