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

import type { CSSProperties } from 'react';
import type { ManualSortGroupHeaderData } from '../../utils/manualSort';
import { ServiceIcon } from '../ServiceIcon';

type ManualSortGroupHeaderStyle = CSSProperties & {
    '--nn-manual-sort-group-header-accent'?: string;
};

interface ManualSortGroupHeaderContentProps {
    header: ManualSortGroupHeaderData;
}

function getManualSortGroupHeaderStyle(header: ManualSortGroupHeaderData): ManualSortGroupHeaderStyle {
    const style: ManualSortGroupHeaderStyle = {};

    if (header.color) {
        style['--nn-manual-sort-group-header-accent'] = header.color;
    }

    return style;
}

export function ManualSortGroupHeaderContent({ header }: ManualSortGroupHeaderContentProps) {
    const style = getManualSortGroupHeaderStyle(header);
    const contentClasses = ['nn-manual-sort-group-header-content'];
    if (header.color) {
        contentClasses.push('nn-manual-sort-group-header-content--accent-all');
        contentClasses.push('nn-manual-sort-group-header-content--accent-icon');
    }

    return (
        <div className={contentClasses.join(' ')} style={style}>
            {header.iconId ? (
                <ServiceIcon iconId={header.iconId} className="nn-manual-sort-group-header-custom-icon" aria-hidden={true} />
            ) : null}
            <span className="nn-manual-sort-group-header-title">{header.title}</span>
        </div>
    );
}
