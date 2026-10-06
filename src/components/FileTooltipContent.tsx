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

import React from 'react';
import type { TFile } from 'obsidian';
import type { NotebookNavigatorSettings } from '../settings/types';
import { buildFileTooltipDateLines } from '../utils/navigationTooltipUtils';

interface FileTooltipContentProps {
    file: TFile;
    /** Shown as the first line unless the file carries an extension suffix, in which case the full file name is shown */
    displayName: string;
    extensionSuffix: string;
    settings: Pick<NotebookNavigatorSettings, 'dateFormat' | 'timeFormat' | 'showTooltipPath'>;
    getFileTimestamps: (file: TFile) => { created: number; modified: number };
    sortOption?: string | null;
}

/**
 * Structured hover tooltip for a file. It renders inside the tooltip portal, so the lines are
 * computed only while the tooltip is visible. Callers must create a new element whenever an
 * input changes, including mutable TFile fields, because the tooltip refreshes on content
 * identity rather than by observing the file.
 */
export function FileTooltipContent({
    file,
    displayName,
    extensionSuffix,
    settings,
    getFileTimestamps,
    sortOption
}: FileTooltipContentProps) {
    const topLine = extensionSuffix.length > 0 ? file.name : displayName;
    const parentPath = settings.showTooltipPath ? (file.parent?.path ?? '/') : null;
    const dateLines = buildFileTooltipDateLines({ file, settings, getFileTimestamps, sortOption });

    return (
        <>
            <div>{topLine}</div>
            {parentPath !== null ? <div className="nn-tooltip-muted">{parentPath}</div> : null}
            <div className="nn-tooltip-dates nn-tooltip-muted">
                <div>{dateLines[0]}</div>
                <div>{dateLines[1]}</div>
            </div>
        </>
    );
}
