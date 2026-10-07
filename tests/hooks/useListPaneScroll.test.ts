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
import { ListPaneItemType } from '../../src/types';
import type { ListPaneItem } from '../../src/types/virtualization';
import { getListPaneMeasurements } from '../../src/utils/listPaneMeasurements';
import {
    createRemeasureScheduler,
    isPendingFileScrollStale,
    resolveListFileRowHeightInputs,
    type ListFileRowSizingConfig
} from '../../src/hooks/useListPaneScroll';
import { createTestTFile } from '../utils/createTestTFile';

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
        showSearchExcerpt,
        compactPaddingTotal: 18,
        selectionType: 'folder' as never,
        includeDescendantNotes: false,
        selectedPropertyValueNodeIdToHide: null,
        ...overrides
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

describe('resolveListFileRowHeightInputs', () => {
    it('reports search excerpt content only when the feature is enabled', () => {
        const file = createTestTFile('Notes/Daily.md');
        const item = createFileItem(file, { searchMeta: { excerpt: 'Some excerpt' } as never });

        const inputs = resolveListFileRowHeightInputs({
            item,
            config: createRowSizingConfig({ showSearchExcerpt: true })
        });
        expect(inputs.hasSearchExcerptContent).toBe(true);

        const disabled = resolveListFileRowHeightInputs({
            item,
            config: createRowSizingConfig({ showSearchExcerpt: false })
        });
        expect(disabled.hasSearchExcerptContent).toBe(false);
    });

    it('does not report excerpt content for items without an excerpt', () => {
        const file = createTestTFile('Notes/Daily.md');

        const inputs = resolveListFileRowHeightInputs({
            item: createFileItem(file),
            config: createRowSizingConfig({ showSearchExcerpt: true })
        });

        expect(inputs.hasSearchExcerptContent).toBeFalsy();
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
