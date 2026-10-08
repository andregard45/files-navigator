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

import {
    resolveFileItemPropertyDecorationColors,
    resolveFileItemTagDecorationColors
} from '../../src/utils/fileItemPillDecoration';

describe('resolveFileItemTagDecorationColors', () => {
    it('passes through custom tag colors', () => {
        const result = resolveFileItemTagDecorationColors({ color: '#ff0000', backgroundColor: '#00ff00' });
        expect(result).toEqual({ color: '#ff0000', backgroundColor: '#00ff00' });
    });

    it('normalizes null/undefined to undefined', () => {
        const result = resolveFileItemTagDecorationColors({ color: null, backgroundColor: undefined });
        expect(result).toEqual({ color: undefined, backgroundColor: undefined });
    });
});

describe('resolveFileItemPropertyDecorationColors', () => {
    it('passes through custom property colors', () => {
        const result = resolveFileItemPropertyDecorationColors({ color: '#123456', backgroundColor: '#654321' });
        expect(result).toEqual({ color: '#123456', backgroundColor: '#654321' });
    });

    it('normalizes null/undefined to undefined', () => {
        const result = resolveFileItemPropertyDecorationColors({ color: undefined, backgroundColor: null });
        expect(result).toEqual({ color: undefined, backgroundColor: undefined });
    });
});
