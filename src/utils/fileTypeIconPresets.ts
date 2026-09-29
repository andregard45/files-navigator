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

export const DEFAULT_FILE_TYPE_ICON_PRESET = 'none';

export const FILE_TYPE_ICON_PRESET_IDS = [DEFAULT_FILE_TYPE_ICON_PRESET] as const;

export type FileTypeIconPreset = (typeof FILE_TYPE_ICON_PRESET_IDS)[number];

export function isFileTypeIconPreset(value: unknown): value is FileTypeIconPreset {
    return typeof value === 'string' && FILE_TYPE_ICON_PRESET_IDS.includes(value as FileTypeIconPreset);
}

export function getFileTypeIconPresetMap(_preset: FileTypeIconPreset): Readonly<Record<string, string>> | null {
    // Icon pack presets were removed; built-in fallback map is used directly.
    return null;
}
