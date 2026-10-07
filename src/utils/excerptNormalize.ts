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

// Omnisearch excerpt normalization. Self-contained: previously lived in
// src/utils/previewText/previewPipeline.ts, which was removed together with
// the file-display preview subsystem. Behavior is identical to the old
// normalizeExcerpt implementation.

import { findFencedCodeBlockRanges, findInlineCodeRanges } from './codeRangeUtils';
import type { NumericRange } from './arrayUtils';
import { stripHtmlForPreview } from './htmlParsingUtils';

interface CodeRangeContext {
    inlineCodeRanges: NumericRange[];
    fencedCodeRanges: NumericRange[];
}

const HTML_ENTITY_MAP: Record<string, string> = Object.freeze({
    amp: '&',
    lt: '<',
    gt: '>',
    quot: '"',
    apos: "'",
    nbsp: ' ',
    ndash: '–',
    mdash: '—',
    hellip: '…',
    copy: '©',
    reg: '®',
    trade: '™'
});

function decodeHtmlEntitiesFromChunk(chunk: string): string {
    if (!chunk.includes('&')) {
        return chunk;
    }

    return chunk.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (match, body: string) => {
        if (body.startsWith('#')) {
            const numeric = body.slice(1);
            const isHex = numeric.startsWith('x') || numeric.startsWith('X');
            const digits = isHex ? numeric.slice(1) : numeric;
            const codePoint = Number.parseInt(digits, isHex ? 16 : 10);
            if (!Number.isFinite(codePoint) || codePoint < 0 || codePoint > 0x10ffff) {
                return match;
            }
            try {
                return String.fromCodePoint(codePoint);
            } catch {
                return match;
            }
        }

        const mapped = HTML_ENTITY_MAP[body.toLowerCase()];
        return mapped ?? match;
    });
}

function collapseWhitespace(text: string): string {
    return text.split(/\s+/).filter(Boolean).join(' ').trim();
}

function stripInlineCodeFence(span: string): string {
    let contentStart = 0;
    while (contentStart < span.length && span[contentStart] === '`') {
        contentStart += 1;
    }

    let contentEnd = span.length;
    while (contentEnd > contentStart && span[contentEnd - 1] === '`') {
        contentEnd -= 1;
    }

    return span.slice(contentStart, contentEnd);
}

function unwrapInlineCodeSegments(text: string, inlineRanges: readonly NumericRange[]): string {
    if (inlineRanges.length === 0) {
        return text;
    }

    let cursor = 0;
    let result = '';

    inlineRanges.forEach(range => {
        if (range.start > cursor) {
            result += text.slice(cursor, range.start);
        }
        result += stripInlineCodeFence(text.slice(range.start, range.end));
        cursor = range.end;
    });

    if (cursor < text.length) {
        result += text.slice(cursor);
    }

    return result;
}

function combineCodeRanges(context: CodeRangeContext, includeInline: boolean, includeFenced: boolean) {
    const combined: (NumericRange & { kind: 'inline' | 'fenced' })[] = [];
    if (includeInline) {
        combined.push(...context.inlineCodeRanges.map(range => ({ ...range, kind: 'inline' as const })));
    }
    if (includeFenced) {
        combined.push(...context.fencedCodeRanges.map(range => ({ ...range, kind: 'fenced' as const })));
    }
    combined.sort((first, second) => first.start - second.start || first.end - second.end);
    return combined;
}

function transformOutsideCodeSegments(
    text: string,
    context: CodeRangeContext,
    options: {
        includeInline: boolean;
        includeFenced: boolean;
        transform: (chunk: string) => string;
        contextWhenNoRanges: CodeRangeContext;
    }
): { text: string; context: CodeRangeContext } {
    const combined = combineCodeRanges(context, options.includeInline, options.includeFenced);
    if (combined.length === 0) {
        return {
            text: options.transform(text),
            context: options.contextWhenNoRanges
        };
    }

    let cursor = 0;
    let result = '';
    const mappedInline: NumericRange[] = [];
    const mappedFenced: NumericRange[] = [];

    for (const range of combined) {
        if (range.start > cursor) {
            result += options.transform(text.slice(cursor, range.start));
        }

        const segmentStart = result.length;
        const segment = text.slice(range.start, range.end);
        result += segment;
        const segmentEnd = result.length;

        if (range.kind === 'inline') {
            mappedInline.push({ start: segmentStart, end: segmentEnd });
        } else {
            mappedFenced.push({ start: segmentStart, end: segmentEnd });
        }

        cursor = range.end;
    }

    if (cursor < text.length) {
        result += options.transform(text.slice(cursor));
    }

    return {
        text: result,
        context: {
            inlineCodeRanges: mappedInline,
            fencedCodeRanges: mappedFenced
        }
    };
}

function stripHtmlOutsideCode(
    text: string,
    context: CodeRangeContext,
    options?: { enabled?: boolean }
): { text: string; context: CodeRangeContext } {
    const enabled = options?.enabled ?? true;

    if (!enabled || !text.includes('<')) {
        return { text, context };
    }

    return transformOutsideCodeSegments(text, context, {
        includeInline: true,
        includeFenced: true,
        transform: stripHtmlForPreview,
        contextWhenNoRanges: { inlineCodeRanges: [], fencedCodeRanges: [] }
    });
}

function decodeHtmlEntitiesOutsideCode(
    text: string,
    context: CodeRangeContext
): {
    text: string;
    context: CodeRangeContext;
} {
    if (!text.includes('&')) {
        return { text, context };
    }

    return transformOutsideCodeSegments(text, context, {
        includeInline: true,
        includeFenced: true,
        transform: decodeHtmlEntitiesFromChunk,
        contextWhenNoRanges: context
    });
}

export function normalizeExcerpt(excerpt: string, options?: { stripHtml?: boolean }): string | undefined {
    const shouldStripHtml = options?.stripHtml !== false;
    const containsHtml = shouldStripHtml && excerpt.includes('<');
    if (!containsHtml) {
        const inlineOnlyRanges = findInlineCodeRanges(excerpt);
        const decodedInlineResult = decodeHtmlEntitiesOutsideCode(excerpt, {
            inlineCodeRanges: inlineOnlyRanges,
            fencedCodeRanges: []
        });
        const unwrappedInline = unwrapInlineCodeSegments(decodedInlineResult.text, decodedInlineResult.context.inlineCodeRanges);
        const normalizedInline = collapseWhitespace(unwrappedInline);
        return normalizedInline.length > 0 ? normalizedInline : undefined;
    }

    const fenced = findFencedCodeBlockRanges(excerpt);
    const baseContext: CodeRangeContext = {
        inlineCodeRanges: findInlineCodeRanges(excerpt, fenced),
        fencedCodeRanges: fenced
    };
    const sanitizedResult = shouldStripHtml
        ? stripHtmlOutsideCode(excerpt, baseContext, { enabled: true })
        : { text: excerpt, context: baseContext };
    const decodedResult = decodeHtmlEntitiesOutsideCode(sanitizedResult.text, sanitizedResult.context);
    const unwrapped = unwrapInlineCodeSegments(decodedResult.text, decodedResult.context.inlineCodeRanges);
    const normalized = collapseWhitespace(unwrapped);
    return normalized.length > 0 ? normalized : undefined;
}
