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

import { findFencedCodeBlockRanges, findInlineCodeRanges } from '../codeRangeUtils';
import {
    collapseWhitespace,
    decodeHtmlEntitiesOutsideCode,
    stripHtmlOutsideCode,
    unwrapInlineCodeSegments,
    type CodeRangeContext
} from './codeAwareTransforms';

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
