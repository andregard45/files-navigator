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
import { describe, it, expect } from 'vitest';
import { resolveNavigationFolderIcon, resolveUXIcon, resolveUXIconForMenu } from '../../src/utils/uxIcons';

describe('resolveUXIcon', () => {
    it('always returns the built-in default icons', () => {
        expect(resolveUXIcon(undefined, 'list-search')).toBe('search');
        expect(resolveUXIcon(undefined, 'nav-tags')).toBe('tags');
        expect(resolveUXIcon(undefined, 'nav-tag')).toBe('tag');
        expect(resolveUXIcon(undefined, 'list-pinned')).toBe('');
    });

    it('ignores legacy custom icon maps passed by older call sites', () => {
        expect(resolveUXIcon({ 'list-search': 'LiStar' }, 'list-search')).toBe('search');
        expect(resolveUXIcon({ 'list-pinned': 'LiPin' }, 'list-pinned')).toBe('');
    });
});

describe('resolveUXIconForMenu', () => {
    it('uses the registered default icon when no explicit fallback is provided', () => {
        expect(resolveUXIconForMenu(undefined, 'list-sort-modified')).toBe('lucide-calendar-clock');
    });

    it('resolves the default icon to a Lucide menu id regardless of legacy overrides', () => {
        expect(resolveUXIconForMenu({ 'list-sort-modified': 'icons/custom.svg' }, 'list-sort-modified', 'lucide-calendar')).toBe(
            'lucide-calendar-clock'
        );
    });
});

describe('resolveNavigationFolderIcon', () => {
    it('returns the per-folder custom icon before navigation defaults', () => {
        expect(
            resolveNavigationFolderIcon({
                interfaceIcons: { 'nav-folder-open': 'LiFolderHeart' },
                customIcon: 'star',
                isRoot: false,
                hasChildren: true,
                isExpanded: true
            })
        ).toBe('star');
    });

    it('resolves open and closed folder defaults', () => {
        expect(
            resolveNavigationFolderIcon({
                isRoot: false,
                hasChildren: true,
                isExpanded: true
            })
        ).toBe('folder-open');
        expect(
            resolveNavigationFolderIcon({
                isRoot: false,
                hasChildren: true,
                isExpanded: false
            })
        ).toBe('folder-closed');
    });

    it('reflects the expansion state for the built-in root icon', () => {
        expect(
            resolveNavigationFolderIcon({
                isRoot: true,
                hasChildren: true,
                isExpanded: true
            })
        ).toBe('open-vault');
        expect(
            resolveNavigationFolderIcon({
                isRoot: true,
                hasChildren: false,
                isExpanded: false
            })
        ).toBe('vault');
    });
});
