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

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';

// Decodes SVG source bytes to text; UTF-16 sources are detected by their byte order mark.
export function decodeSvgSourceText(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    if (bytes.length >= 2) {
        if (bytes[0] === 0xff && bytes[1] === 0xfe) {
            return new TextDecoder('utf-16le').decode(buffer);
        }
        if (bytes[0] === 0xfe && bytes[1] === 0xff) {
            return new TextDecoder('utf-16be').decode(buffer);
        }
    }
    return new TextDecoder().decode(buffer);
}

export function parseSvgLengthAttribute(value: string | null): number | null {
    if (!value) {
        return null;
    }

    const match = /^\+?(\d*\.?\d+(?:e[+-]?\d+)?)(?:px)?$/i.exec(value.trim());
    if (!match) {
        return null;
    }

    const parsed = Number(match[1]);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

// Parses the width and height components of an SVG viewBox attribute.
export function parseSvgViewBoxDimensions(value: string | null): { width: number; height: number } | null {
    if (!value) {
        return null;
    }

    const parts = value.trim().split(/[\s,]+/);
    if (parts.length !== 4) {
        return null;
    }

    const numbers = parts.map(Number);
    if (numbers.some(entry => !Number.isFinite(entry))) {
        return null;
    }

    const width = numbers[2];
    const height = numbers[3];
    return width > 0 && height > 0 ? { width, height } : null;
}

/**
 * Determines whether an SVG source declares intrinsic dimensions.
 *
 * An `img` element derives its aspect ratio from width/height attributes or a viewBox on the
 * SVG root; sources without either render at the browser default object size.
 */
export function svgSourceDefinesDimensions(svgText: string): boolean {
    if (typeof DOMParser === 'undefined') {
        return true;
    }

    const parsed = new DOMParser().parseFromString(svgText, 'image/svg+xml');
    const root = parsed.documentElement;
    if (root.namespaceURI !== SVG_NAMESPACE || root.localName !== 'svg') {
        return false;
    }

    const width = parseSvgLengthAttribute(root.getAttribute('width'));
    const height = parseSvgLengthAttribute(root.getAttribute('height'));
    if (width && height) {
        return true;
    }

    return parseSvgViewBoxDimensions(root.getAttribute('viewBox')) !== null;
}
