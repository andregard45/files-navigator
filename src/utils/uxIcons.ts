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

import { normalizeCanonicalIconId } from './iconizeFormat';

export type UXIconId =
    | 'nav-show-single-pane'
    | 'nav-show-dual-pane'
    | 'nav-profile-chevron'
    | 'nav-shortcuts'
    | 'nav-expand-all'
    | 'nav-collapse-all'
    | 'nav-calendar'
    | 'nav-hidden-items'
    | 'nav-new-folder'
    | 'nav-recent-files'
    | 'nav-tree-expand'
    | 'nav-tree-collapse'
    | 'nav-folder-root'
    | 'nav-folder-open'
    | 'nav-folder-closed'
    | 'nav-tags'
    | 'nav-tag'
    | 'nav-properties'
    | 'nav-property'
    | 'nav-property-value'
    | 'list-search'
    | 'list-reveal-file'
    | 'list-descendants'
    | 'list-expand-all'
    | 'list-collapse-all'
    | 'list-sort-ascending'
    | 'list-sort-descending'
    | 'list-sort-modified'
    | 'list-sort-created'
    | 'list-sort-title'
    | 'list-sort-filename'
    | 'list-sort-property'
    | 'list-new-note'
    | 'list-pinned';

export type UXIconCategory = 'navigationPane' | 'folders' | 'tags' | 'properties' | 'listPane' | 'fileItems' | 'calendar';

export interface UXIconDefinition {
    id: UXIconId;
    category: UXIconCategory;
    defaultIconId: string;
}

export const UX_ICON_DEFINITIONS: UXIconDefinition[] = [
    { id: 'nav-show-single-pane', category: 'navigationPane', defaultIconId: 'panel-left-close' },
    { id: 'nav-show-dual-pane', category: 'navigationPane', defaultIconId: 'panel-left' },
    { id: 'nav-profile-chevron', category: 'navigationPane', defaultIconId: 'chevron-down' },
    { id: 'nav-shortcuts', category: 'navigationPane', defaultIconId: 'star' },
    { id: 'nav-expand-all', category: 'navigationPane', defaultIconId: 'chevrons-up-down' },
    { id: 'nav-collapse-all', category: 'navigationPane', defaultIconId: 'chevrons-down-up' },
    { id: 'nav-hidden-items', category: 'navigationPane', defaultIconId: 'eye' },
    { id: 'nav-new-folder', category: 'navigationPane', defaultIconId: 'folder-plus' },
    { id: 'nav-recent-files', category: 'navigationPane', defaultIconId: 'history' },
    { id: 'nav-tree-expand', category: 'navigationPane', defaultIconId: 'chevron-right' },
    { id: 'nav-tree-collapse', category: 'navigationPane', defaultIconId: 'chevron-down' },
    { id: 'nav-folder-root', category: 'folders', defaultIconId: 'vault' },
    { id: 'nav-folder-open', category: 'folders', defaultIconId: 'folder-open' },
    { id: 'nav-folder-closed', category: 'folders', defaultIconId: 'folder-closed' },
    { id: 'nav-tags', category: 'tags', defaultIconId: 'tags' },
    { id: 'nav-tag', category: 'tags', defaultIconId: 'tag' },
    { id: 'nav-properties', category: 'properties', defaultIconId: 'file-code' },
    { id: 'nav-property', category: 'properties', defaultIconId: 'align-left' },
    { id: 'nav-property-value', category: 'properties', defaultIconId: 'equal' },
    { id: 'list-search', category: 'listPane', defaultIconId: 'search' },
    { id: 'list-reveal-file', category: 'listPane', defaultIconId: 'locate-fixed' },
    { id: 'list-descendants', category: 'listPane', defaultIconId: 'layers' },
    { id: 'list-expand-all', category: 'listPane', defaultIconId: 'list-chevrons-up-down' },
    { id: 'list-collapse-all', category: 'listPane', defaultIconId: 'list-chevrons-down-up' },
    { id: 'list-sort-ascending', category: 'listPane', defaultIconId: 'sort-asc' },
    { id: 'list-sort-descending', category: 'listPane', defaultIconId: 'sort-desc' },
    { id: 'list-sort-modified', category: 'listPane', defaultIconId: 'calendar-clock' },
    { id: 'list-sort-created', category: 'listPane', defaultIconId: 'calendar-plus' },
    { id: 'list-sort-title', category: 'listPane', defaultIconId: 'type' },
    { id: 'list-sort-filename', category: 'listPane', defaultIconId: 'file-text' },
    { id: 'list-sort-property', category: 'listPane', defaultIconId: 'align-left' },
    { id: 'list-new-note', category: 'listPane', defaultIconId: 'pen-box' },
    { id: 'list-pinned', category: 'listPane', defaultIconId: '' },
    { id: 'nav-calendar', category: 'calendar', defaultIconId: 'calendar-days' }
];

const UX_ICON_DEFAULT_CANONICAL: Record<UXIconId, string> = (() => {
    const defaults = Object.create(null) as Record<UXIconId, string>;
    UX_ICON_DEFINITIONS.forEach(definition => {
        defaults[definition.id] = normalizeCanonicalIconId(definition.defaultIconId);
    });
    return defaults;
})();

/**
 * Resolves an interface icon id. Custom icon mapping was removed: the UI always
 * renders the built-in Lucide/Obsidian default. The first parameter is accepted
 * for call-site compatibility only and is intentionally ignored.
 */
export function resolveUXIcon(_unusedIconMap: unknown, iconId: UXIconId): string {
    return UX_ICON_DEFAULT_CANONICAL[iconId];
}

export function resolveNavigationFolderIcon(params: {
    interfaceIcons?: Record<string, string> | undefined;
    customIcon?: string | null;
    isRoot: boolean;
    hasChildren: boolean;
    isExpanded: boolean;
}): string {
    const { customIcon, isRoot, hasChildren, isExpanded } = params;
    if (customIcon) {
        return customIcon;
    }

    if (isRoot) {
        // The built-in root icon reflects the expansion state.
        return hasChildren && isExpanded ? 'open-vault' : 'vault';
    }

    return hasChildren && isExpanded
        ? resolveUXIcon(undefined, 'nav-folder-open')
        : resolveUXIcon(undefined, 'nav-folder-closed');
}

function tryResolveLucideMenuIconId(iconId: string): string | null {
    const trimmed = iconId.trim();
    if (!trimmed) {
        return null;
    }

    const colonIndex = trimmed.indexOf(':');
    if (colonIndex !== -1) {
        const provider = trimmed.substring(0, colonIndex);
        if (provider !== 'lucide') {
            return null;
        }

        const identifier = trimmed.substring(colonIndex + 1).trim();
        if (!identifier) {
            return null;
        }

        const slug = identifier.startsWith('lucide-') ? identifier.substring('lucide-'.length) : identifier;
        return slug ? `lucide-${slug}` : null;
    }

    const slug = trimmed.startsWith('lucide-') ? trimmed.substring('lucide-'.length) : trimmed;
    return slug ? `lucide-${slug}` : null;
}

/**
 * Normalizes an icon id into a Lucide menu icon id.
 */
export function resolveIconForMenu(iconId: string | null | undefined): string | null {
    if (typeof iconId !== 'string') {
        return null;
    }

    return tryResolveLucideMenuIconId(iconId);
}

export function resolveUXIconForMenu(
    _unusedIconMap: unknown,
    iconId: UXIconId,
    fallbackLucideMenuIconId?: string
): string {
    const resolved = resolveUXIcon(undefined, iconId);
    return (
        resolveIconForMenu(resolved) ?? fallbackLucideMenuIconId ?? resolveIconForMenu(UX_ICON_DEFAULT_CANONICAL[iconId]) ?? 'lucide-circle'
    );
}
