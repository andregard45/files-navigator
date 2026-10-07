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

import { describe, expect, it } from 'vitest';
import { App, TFile } from 'obsidian';
import { createTestTFile } from './createTestTFile';
import {
    findDrawingFileForCompanionImage,
    getDrawingCompanionImagePaths,
    getDrawingSourceProviderIdWithFrontmatter,
    isDrawingCompanionImageFile,
    shouldHideDrawingCompanionImageFile
} from '../../src/utils/drawingFeatureImages';

function createAppWithFiles(files: TFile[], frontmatterByPath: Record<string, Record<string, unknown>> = {}): App {
    const app = new App();
    const filesByPath = new Map(files.map(file => [file.path, file]));
    app.vault.getAbstractFileByPath = (path: string) => filesByPath.get(path) ?? null;
    app.vault.getFiles = () => files;
    app.metadataCache.getFileCache = (file: TFile) => ({ frontmatter: frontmatterByPath[file.path] });
    return app;
}

describe('Drawing companion files', () => {
    it('builds companion PNG paths from the final Excalidraw file extension', () => {
        const file = createTestTFile('Drawings/Sketch.excalidraw.md');

        expect(getDrawingCompanionImagePaths(file, 'excalidraw')).toEqual([
            'Drawings/Sketch.excalidraw.png',
            'Drawings/Sketch.excalidraw.dark.png',
            'Drawings/Sketch.excalidraw.light.png'
        ]);
    });

    it('does not treat unrelated PNGs as hidden companion images', () => {
        const image = createTestTFile('Drawings/Sketch.excalidraw.png');
        const app = createAppWithFiles([image]);

        expect(isDrawingCompanionImageFile(app, image)).toBe(false);
    });

    it('hides companion images only when the drawing file exists and hiding is enabled', () => {
        const drawing = createTestTFile('Drawings/Sketch.excalidraw.md');
        const image = createTestTFile('Drawings/Sketch.excalidraw.png');

        const appWithDrawing = createAppWithFiles([drawing, image]);
        expect(shouldHideDrawingCompanionImageFile(appWithDrawing, image, { hideDrawingPreviewImages: true })).toBe(true);
        expect(shouldHideDrawingCompanionImageFile(appWithDrawing, image, { hideDrawingPreviewImages: false })).toBe(false);

        const appWithoutDrawing = createAppWithFiles([image]);
        expect(shouldHideDrawingCompanionImageFile(appWithoutDrawing, image, { hideDrawingPreviewImages: true })).toBe(false);
    });

    it('finds the drawing file for a companion image', () => {
        const drawing = createTestTFile('Drawings/Sketch.excalidraw.md');
        const image = createTestTFile('Drawings/Sketch.excalidraw.png');
        const app = createAppWithFiles([drawing, image]);

        expect(findDrawingFileForCompanionImage(app, image.path)?.path).toBe(drawing.path);
    });

    it('detects Excalidraw provider id from frontmatter', () => {
        const file = createTestTFile('Drawings/Sketch.excalidraw.md');
        expect(getDrawingSourceProviderIdWithFrontmatter(file, { 'excalidraw-plugin': 'parsed' })).toBe('excalidraw');
        expect(getDrawingSourceProviderIdWithFrontmatter(createTestTFile('Notes/Plain.md'), {})).toBeNull();
    });
});

