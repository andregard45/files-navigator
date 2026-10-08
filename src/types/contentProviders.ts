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

/**
 * Types of content extraction lanes used by FrontmatterSyncService.
 *
 * These values identify content lanes in the service's `providers` include lists
 * (formerly the provider registry include/exclude lists).
 */
export type ContentProviderType = 'metadata' | 'tags' | 'markdownPipeline';

/**
 * Types of file content that can be generated and stored.
 *
 * These values identify content fields in storage (tags, metadata, properties).
 */
export type FileContentType = 'metadata' | 'tags' | 'properties';
