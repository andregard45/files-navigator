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

import { afterEach, describe, expect, it, vi } from 'vitest';
import { TFile } from 'obsidian';
import { ItemType, ListPaneItemType } from '../../src/types';
import type { ListPaneItem } from '../../src/types/virtualization';
import { getListPaneMeasurements } from '../../src/utils/listPaneMeasurements';
import type { FileContentChange, IndexedDBStorage } from '../../src/storage/IndexedDBStorage';
import {
    createRemeasureScheduler,
    isPendingFileScrollStale,
    isListRowHeightAffectingContentChange,
    type ListRowHeightAffectingContentChangeConfig,
    resolveListFileRowHeightInputs,
    type ListFileRowSizingConfig
} from '../../src/hooks/useListPaneScroll';
import { createTestTFile } from '../utils/createTestTFile';

function createContentChange(patch: Partial<FileContentChange>): FileContentChange {
    return {
        path: 'Notes/Daily.md',
        changes: {},
        ...patch
    };
}

function createFileItem(file: TFile, overrides: Partial<ListPaneItem> = {}): ListPaneItem {
    return {
        type: ListPaneItemType.FILE,
        data: file,
        key: file.path,
        ...overrides
    };
}

function createRowSizingConfig(overrides: Partial<ListFileRowSizingConfig> = {}): ListFileRowSizingConfig {
    const showSearchExcerpt = overrides.showSearchExcerpt ?? true;

    return {
        heights: getListPaneMeasurements(false),
        titleRows: 1,
        previewRows: 3,
        showDate: true,
        showSearchExcerpt,
        compactPaddingTotal: 18,
        isCompactMode: false,
        frontmatterPropertyRowsPossible: false,
        propertyRowsPossible: false,
        showFileProperties: false,
        showPropertiesOnSeparateRows: false,
        showFilePropertiesInCompactMode: false,
        selectionType: ItemType.FOLDER,
        includeDescendantNotes: false,
        selectedPropertyValueNodeIdToHide: null,
        visiblePropertyKeys: new Set(),
        ...overrides
    };
}

function createDb(record: unknown = null) {
    return {
        getFile: vi.fn(() => record)
    };
}

function installAnimationFrameStub() {
    let nextFrameId = 1;
    const callbacks = new Map<number, FrameRequestCallback>();
    const requestAnimationFrame = vi.fn((callback: FrameRequestCallback): number => {
        const frameId = nextFrameId;
        nextFrameId += 1;
        callbacks.set(frameId, callback);
        return frameId;
    });
    const cancelAnimationFrame = vi.fn((frameId: number): void => {
        callbacks.delete(frameId);
    });

    vi.stubGlobal('window', {
        requestAnimationFrame,
        cancelAnimationFrame
    });

    return {
        requestAnimationFrame,
        cancelAnimationFrame,
        runNextFrame(): boolean {
            const next = callbacks.entries().next();
            if (next.done) {
                return false;
            }

            const [frameId, callback] = next.value;
            callbacks.delete(frameId);
            callback(0);
            return true;
        }
    };
}

describe('isPendingFileScrollStale', () => {
    const revealRequest = { type: 'file' as const, filePath: 'Notes/Folder.md', reason: 'reveal' as const };

    it('retains the current selection request and discards it after selection changes', () => {
        expect(isPendingFileScrollStale(revealRequest, 'Notes/Folder.md')).toBe(false);
        expect(isPendingFileScrollStale(revealRequest, 'Notes/Other.md')).toBe(true);
        expect(isPendingFileScrollStale(revealRequest, null)).toBe(true);
        expect(isPendingFileScrollStale({ type: 'top', reason: 'visibility-change' }, null)).toBe(false);
    });
});

afterEach(() => {
    vi.unstubAllGlobals();
});

describe('isListRowHeightAffectingContentChange', () => {
    function createHeightChangeConfig(
        overrides: Partial<ListRowHeightAffectingContentChangeConfig> = {}
    ): ListRowHeightAffectingContentChangeConfig {
        return {
            showSearchExcerpt: true,
            frontmatterPropertyRowsPossible: true,
            ...overrides
        };
    }

    it('detects content fields that can change estimated list row height', () => {
        const config = createHeightChangeConfig();

        expect(isListRowHeightAffectingContentChange(createContentChange({ changes: { properties: [] } }), config)).toBe(true);
    });

    it('ignores content fields disabled by the active row sizing config', () => {
        const config = createHeightChangeConfig({
            showSearchExcerpt: false,
            frontmatterPropertyRowsPossible: false
        });

        expect(isListRowHeightAffectingContentChange(createContentChange({ changes: { previewStatus: 'has' } }), config)).toBe(false);
        expect(isListRowHeightAffectingContentChange(createContentChange({ changes: { properties: [] } }), config)).toBe(false);
    });

    it('ignores property changes when only text-count property rows can be shown', () => {
        const config = createHeightChangeConfig({
            frontmatterPropertyRowsPossible: false
        });

        expect(isListRowHeightAffectingContentChange(createContentChange({ changes: { properties: [] } }), config)).toBe(false);
    });


    it('ignores content fields that do not change estimated row height', () => {
        const config = createHeightChangeConfig();

        expect(isListRowHeightAffectingContentChange(createContentChange({ changes: { preview: 'Preview' } }), config)).toBe(false);
        expect(isListRowHeightAffectingContentChange(createContentChange({ changes: { preview: null } }), config)).toBe(false);
        expect(
            isListRowHeightAffectingContentChange(
                createContentChange({
                    changes: { metadata: { name: 'Daily note', icon: 'lucide-star', color: '#ff0000', hidden: true } },
                    metadataHiddenChanged: true,
                    metadataNameChanged: true
                }),
                config
            )
        ).toBe(false);
    });

});

describe('resolveListFileRowHeightInputs', () => {
    it('skips db reads when row features are disabled', () => {
        const file = createTestTFile('Notes/Daily.md');
        const db = createDb();
        const inputs = resolveListFileRowHeightInputs({
            db: db as unknown as IndexedDBStorage,
            item: createFileItem(file),
            file,
            config: createRowSizingConfig({
                showSearchExcerpt: false,
                propertyRowsPossible: false
            })
        });

        expect(inputs.visiblePillRowCount).toBe(0);
        expect(db.getFile).not.toHaveBeenCalled();
    });

    it('skips db reads when frontmatter properties are enabled without visible list property keys', () => {
        const file = createTestTFile('Notes/Daily.md');
        const db = createDb({
            properties: [{ fieldKey: 'status', value: 'active', valueKind: 'text' }]
        });

        const inputs = resolveListFileRowHeightInputs({
            db: db as unknown as IndexedDBStorage,
            item: createFileItem(file),
            file,
            config: createRowSizingConfig({
                showSearchExcerpt: false,
                showFileProperties: true,
                visiblePropertyKeys: new Set(),
                propertyRowsPossible: false
            })
        });

        expect(inputs.visiblePillRowCount).toBe(0);
        expect(db.getFile).not.toHaveBeenCalled();
    });

    it('reads the file record when visible property rows can affect height', () => {
        const file = createTestTFile('Notes/Daily.md');
        const db = createDb({
            properties: [{ fieldKey: 'status', value: 'active', valueKind: 'text' }]
        });

        const inputs = resolveListFileRowHeightInputs({
            db: db as unknown as IndexedDBStorage,
            item: createFileItem(file),
            file,
            config: createRowSizingConfig({
                showSearchExcerpt: false,
                propertyRowsPossible: true,
                showFileProperties: true,
                visiblePropertyKeys: new Set(['status'])
            })
        });

        expect(inputs.visiblePillRowCount).toBe(1);
        expect(db.getFile).toHaveBeenCalledWith(file.path);
    });

});

describe('createRemeasureScheduler', () => {
    it('coalesces multiple schedule calls into one animation frame measure', () => {
        const animationFrameStub = installAnimationFrameStub();
        const measure = vi.fn();
        const scheduler = createRemeasureScheduler(measure);

        scheduler.schedule();
        scheduler.schedule();
        scheduler.schedule();

        expect(animationFrameStub.requestAnimationFrame).toHaveBeenCalledTimes(1);
        expect(measure).not.toHaveBeenCalled();

        expect(animationFrameStub.runNextFrame()).toBe(true);

        expect(measure).toHaveBeenCalledTimes(1);
        expect(animationFrameStub.runNextFrame()).toBe(false);
    });

    it('schedules a new measure after the pending frame runs', () => {
        const animationFrameStub = installAnimationFrameStub();
        const measure = vi.fn();
        const scheduler = createRemeasureScheduler(measure);

        scheduler.schedule();
        animationFrameStub.runNextFrame();
        scheduler.schedule();
        animationFrameStub.runNextFrame();

        expect(animationFrameStub.requestAnimationFrame).toHaveBeenCalledTimes(2);
        expect(measure).toHaveBeenCalledTimes(2);
    });

    it('cancels a pending measure before the animation frame runs', () => {
        const animationFrameStub = installAnimationFrameStub();
        const measure = vi.fn();
        const scheduler = createRemeasureScheduler(measure);

        scheduler.schedule();
        scheduler.cancel();

        expect(animationFrameStub.cancelAnimationFrame).toHaveBeenCalledWith(1);
        expect(animationFrameStub.runNextFrame()).toBe(false);
        expect(measure).not.toHaveBeenCalled();
    });
});
