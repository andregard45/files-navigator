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

import { Platform } from 'obsidian';
import {
    type LocalStorageKeys,
    type PinnedSectionCollapseKey
} from '../../types';
import { MAX_RECENT_COLORS } from '../../constants/colorPalette';
import { cloneCollapsedPinnedContextsRecord } from '../../utils/recordUtils';
import { localStorage } from '../../utils/localStorage';
import { DEFAULT_UI_SCALE, sanitizeUIScale } from '../../utils/uiScale';
import {
    type NotebookNavigatorSettings
} from '../types';

/**
 * Migrates pinned-section collapse state from synced settings to vault-local storage.
 */
export function migrateCollapsedPinnedContexts(params: {
    settings: NotebookNavigatorSettings;
    storedData: Record<string, unknown> | null;
    keys: LocalStorageKeys;
}): boolean {
    const { settings, storedData, keys } = params;

    const storedRecord = cloneCollapsedPinnedContextsRecord(storedData?.['collapsedPinnedContexts']);
    const localRecord = cloneCollapsedPinnedContextsRecord(localStorage.get<unknown>(keys.collapsedPinnedContextsKey));

    // Seed local storage from the legacy synced record without dropping collapse state already stored locally.
    let changed = false;
    (Object.keys(storedRecord) as PinnedSectionCollapseKey[]).forEach(key => {
        if (localRecord[key] !== true) {
            localRecord[key] = true;
            changed = true;
        }
    });
    if (changed) {
        localStorage.set(keys.collapsedPinnedContextsKey, localRecord);
    }

    delete (settings as unknown as Record<string, unknown>).collapsedPinnedContexts;

    // Signals that synced fields existed and should be cleaned up via getPersistableSettings().
    return Boolean(storedData && 'collapsedPinnedContexts' in storedData);
}

/**
 * Migrates recent colors history from synced settings to vault-local storage.
 */
export function migrateRecentColors(params: {
    settings: NotebookNavigatorSettings;
    storedData: Record<string, unknown> | null;
    keys: LocalStorageKeys;
}): boolean {
    const { settings, storedData, keys } = params;

    const stored = storedData?.['recentColors'];
    const storedColors = Array.isArray(stored)
        ? stored.filter((entry): entry is string => typeof entry === 'string' && entry.trim().length > 0).slice(0, MAX_RECENT_COLORS)
        : [];

    const localStored = localStorage.get<unknown>(keys.recentColorsKey);
    const localColors = Array.isArray(localStored)
        ? localStored.filter((entry): entry is string => typeof entry === 'string' && entry.trim().length > 0)
        : [];

    // Prefer local values, otherwise seed local storage from the legacy synced list.
    const resolvedColors = localColors.length > 0 ? localColors : storedColors;
    if (resolvedColors.length > 0) {
        const capped = resolvedColors.slice(0, MAX_RECENT_COLORS);
        const shouldUpdateLocal = localColors.length !== capped.length || capped.some((color, index) => color !== localColors[index]);
        if (shouldUpdateLocal) {
            localStorage.set(keys.recentColorsKey, capped);
        }
    }

    delete (settings as unknown as Record<string, unknown>).recentColors;

    // Signals that synced fields existed and should be cleaned up via getPersistableSettings().
    return Boolean(storedData && 'recentColors' in storedData);
}

// Resolves UI scale from local storage, migrating from legacy synced values if present.
function resolveUIScaleFromStorage(storageKey: string, storedSetting: unknown): number {
    const parseScale = (value: unknown): number | null => {
        if (typeof value === 'number' && Number.isFinite(value)) {
            return sanitizeUIScale(value);
        }
        if (typeof value === 'string') {
            const parsed = Number(value);
            if (Number.isFinite(parsed)) {
                return sanitizeUIScale(parsed);
            }
        }
        return null;
    };

    const storedLocal = localStorage.get<unknown>(storageKey);
    const localScale = parseScale(storedLocal);
    if (localScale !== null) {
        // Local storage takes precedence for per-device preferences.
        return localScale;
    }

    const settingScale = parseScale(storedSetting);
    if (settingScale !== null) {
        // Migrate legacy synced value into local storage.
        localStorage.set(storageKey, settingScale);
        return settingScale;
    }

    // Seed local storage with a valid default value.
    localStorage.set(storageKey, DEFAULT_UI_SCALE);
    return DEFAULT_UI_SCALE;
}

/**
 * Migrates desktop and mobile UI scales from synced settings to vault-local storage.
 */
export function migrateUIScales(params: {
    settings: NotebookNavigatorSettings;
    storedData: Record<string, unknown> | null;
    keys: LocalStorageKeys;
    shouldPersistDesktopScale: boolean;
    shouldPersistMobileScale: boolean;
}): { migrated: boolean; shouldPersistDesktopScale: boolean; shouldPersistMobileScale: boolean } {
    const { settings, storedData, keys } = params;
    let { shouldPersistDesktopScale, shouldPersistMobileScale } = params;

    const storedDesktopScale = storedData?.['desktopScale'];
    const storedMobileScale = storedData?.['mobileScale'];
    const hadLegacyFields = Boolean(storedData && ('desktopScale' in storedData || 'mobileScale' in storedData));

    // Keeps legacy scale values usable without reintroducing removed fields from other devices
    const sanitizeScale = (value: unknown, fallback: number): number => {
        if (typeof value === 'number' && Number.isFinite(value)) {
            return sanitizeUIScale(value);
        }
        if (typeof value === 'string') {
            const parsed = Number(value);
            if (Number.isFinite(parsed)) {
                return sanitizeUIScale(parsed);
            }
        }
        return sanitizeUIScale(fallback);
    };

    if (Platform.isMobile) {
        // Uses local scale for the current device type and keeps the opposite value as legacy-only.
        const resolvedMobile = resolveUIScaleFromStorage(keys.uiScaleKey, storedMobileScale);
        settings.mobileScale = resolvedMobile;
        settings.desktopScale = sanitizeScale(storedDesktopScale, settings.desktopScale);
        if (shouldPersistMobileScale) {
            shouldPersistMobileScale = false;
        }
    } else {
        // Uses local scale for the current device type and keeps the opposite value as legacy-only.
        const resolvedDesktop = resolveUIScaleFromStorage(keys.uiScaleKey, storedDesktopScale);
        settings.desktopScale = resolvedDesktop;
        settings.mobileScale = sanitizeScale(storedMobileScale, settings.mobileScale);
        if (shouldPersistDesktopScale) {
            shouldPersistDesktopScale = false;
        }
    }

    return { migrated: hadLegacyFields, shouldPersistDesktopScale, shouldPersistMobileScale };
}
