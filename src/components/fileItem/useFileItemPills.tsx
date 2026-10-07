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

import { useMemo } from 'react';
import type { TFile } from 'obsidian';
import type { PropertyItem } from '../../storage/IndexedDBStorage';
import type { PropertySearchMatch, PropertySearchValueMatch } from '../../types/search';
import { casefold, foldSearchText } from '../../utils/recordUtils';
import { buildPropertySearchEvidence, resolvePropertyDisplayText, type PropertySearchEvidenceGroup } from '../../utils/propertyUtils';

export interface UseFileItemPillsParams {
    file: TFile;
    isCompactMode: boolean;
    properties: PropertyItem[] | null;
    matchedProperties?: readonly PropertySearchMatch[];
}

export interface FileItemPillsState {
    propertySearchEvidenceGroups: readonly PropertySearchEvidenceGroup[];
    propertySearchEvidenceHiddenGroupCount: number;
}

function buildPropertySearchValueIdentity(fieldKey: string, valueKind: PropertyItem['valueKind'], rawValue: string): string {
    return `${casefold(fieldKey.trim())}\u0000${valueKind ?? ''}\u0000${rawValue}`;
}

/**
 * The file-display property pills feature was removed. This hook now only computes
 * property search evidence (matching property values shown next to search results),
 * which remains part of the search feature set.
 */
export function useFileItemPills({ properties, matchedProperties }: UseFileItemPillsParams): FileItemPillsState {
    // The list filter retains only matching clauses for every result. Resolve concrete cached values
    // here so evidence highlights allocate data only for mounted virtual rows.
    const propertySearchValueMatches = useMemo<PropertySearchValueMatch[]>(() => {
        if (!matchedProperties || matchedProperties.length === 0 || !properties || properties.length === 0) {
            return [];
        }

        const matches: PropertySearchValueMatch[] = [];
        const seen = new Set<string>();
        properties.forEach(entry => {
            const normalizedKey = foldSearchText(entry.fieldKey.trim());
            if (!normalizedKey) {
                return;
            }

            let displayValue: string | null = null;
            let foldedDisplayValue: string | null = null;
            matchedProperties.forEach(match => {
                const { clause } = match;
                const keyMatches = clause.value === null ? normalizedKey.startsWith(clause.key) : normalizedKey === clause.key;
                if (!keyMatches) {
                    return;
                }

                displayValue ??= resolvePropertyDisplayText(entry.value);
                if (clause.value !== null) {
                    foldedDisplayValue ??= foldSearchText(displayValue);
                    if (!foldedDisplayValue.includes(clause.value)) {
                        return;
                    }
                }

                const identity = `${clause.key}\u0000${clause.value ?? ''}\u0000${normalizedKey}\u0000${entry.valueKind ?? ''}\u0000${entry.value}`;
                if (seen.has(identity)) {
                    return;
                }
                seen.add(identity);
                matches.push({
                    clause,
                    propertyKey: entry.fieldKey,
                    rawValue: entry.value,
                    valueKind: entry.valueKind,
                    displayValue
                });
            });
        });
        return matches;
    }, [matchedProperties, properties]);

    // Property pills are no longer rendered in file items, so every match becomes visible evidence.
    const propertySearchEvidence = useMemo(() => {
        if (propertySearchValueMatches.length === 0) {
            return { groups: [], hiddenGroupCount: 0 };
        }
        return buildPropertySearchEvidence(propertySearchValueMatches);
    }, [propertySearchValueMatches]);

    return {
        propertySearchEvidenceGroups: propertySearchEvidence.groups,
        propertySearchEvidenceHiddenGroupCount: propertySearchEvidence.hiddenGroupCount
    };
}
