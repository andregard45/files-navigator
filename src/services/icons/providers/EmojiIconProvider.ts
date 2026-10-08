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

import { IconProvider, IconDefinition, IconRenderResult } from '../types';
import { resetIconContainer } from './providerUtils';
import { extractFirstEmoji } from '../../../utils/emojiUtils';

/**
 * Icon provider for emoji icons.
 */
export class EmojiIconProvider implements IconProvider {
    id = 'emoji';
    name = 'Emoji';

    /**
     * Emojis have no version information
     * @returns Always null for emoji provider
     */
    getVersion(): string | null {
        return null;
    }

    /**
     * Checks if the emoji provider is available.
     * Always returns true as emojis are universally supported.
     */
    isAvailable(): boolean {
        return true;
    }

    /**
     * Renders an emoji icon into the specified container.
     *
     * @param container - The HTML element to render the emoji into
     * @param emojiId - The emoji character(s) to render
     * @param size - Optional size in pixels for the emoji
     */
    render(container: HTMLElement, emojiId: string, size?: number): IconRenderResult {
        resetIconContainer(container);
        if (!emojiId) {
            return 'not-found';
        }

        container.addClass('nn-emoji-icon');
        container.setText(emojiId);

        if (size) {
            // Using inline styles here because size is dynamic and passed as parameter
            // CSS classes cannot handle arbitrary pixel values
            container.style.fontSize = `${size}px`;
            container.style.width = `${size}px`;
            container.style.height = `${size}px`;
            container.style.lineHeight = `${size}px`;
        } else {
            container.style.removeProperty('font-size');
            container.style.removeProperty('width');
            container.style.removeProperty('height');
            container.style.removeProperty('line-height');
        }

        return 'rendered';
    }

    /**
     * Matches emoji characters typed or pasted directly into the picker.
     *
     * Keyword-based dictionary search was removed intentionally: users can rely on
     * the OS emoji picker (Win+. / Ctrl+Cmd+Space) and paste emojis directly here.
     *
     * @param query - The input text (only leading emoji characters are considered)
     * @returns Array containing the extracted emoji definition, or empty if no emoji found
     */
    search(query: string): IconDefinition[] {
        if (!query || query.trim().length === 0) {
            return [];
        }

        // Only accept direct emoji input (typed or pasted emoji characters)
        const emoji = extractFirstEmoji(query);

        if (emoji) {
            return [
                {
                    id: emoji,
                    displayName: emoji,
                    preview: emoji
                }
            ];
        }

        return [];
    }

    /**
     * Gets all available emoji icons.
     *
     * @returns Empty array - emojis must be typed or pasted directly
     */
    getAll(): IconDefinition[] {
        // Return empty array - we don't provide a full list
        // Users must type or paste emojis directly
        return [];
    }
}
