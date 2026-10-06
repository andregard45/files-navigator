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

import { casefold } from './recordUtils';

export interface FileItemPillOrderModel {
    rootPropertyNavigationOrderMap: ReadonlyMap<string, number>;
}

function compareOrderMapEntries(leftKey: string, rightKey: string, orderMap: ReadonlyMap<string, number>): number {
    if (orderMap.size === 0) {
        return 0;
    }

    const leftOrder = orderMap.get(leftKey);
    const rightOrder = orderMap.get(rightKey);

    if (leftOrder !== undefined && rightOrder !== undefined) {
        return leftOrder - rightOrder;
    }
    if (leftOrder !== undefined) {
        return -1;
    }
    if (rightOrder !== undefined) {
        return 1;
    }

    return 0;
}

export function compareFileItemPropertyKeysByNavigationOrder(
    leftKey: string,
    rightKey: string,
    navigationOrderMap: ReadonlyMap<string, number>,
    visibleNavigationPropertyKeys: ReadonlySet<string>
): number {
    const leftNormalizedKey = casefold(leftKey);
    const rightNormalizedKey = casefold(rightKey);

    if (!leftNormalizedKey || !rightNormalizedKey || leftNormalizedKey === rightNormalizedKey) {
        return 0;
    }

    if (navigationOrderMap.size === 0) {
        return 0;
    }

    const leftOrderKey =
        visibleNavigationPropertyKeys.has(leftNormalizedKey) && navigationOrderMap.has(leftNormalizedKey) ? leftNormalizedKey : '';
    const rightOrderKey =
        visibleNavigationPropertyKeys.has(rightNormalizedKey) && navigationOrderMap.has(rightNormalizedKey) ? rightNormalizedKey : '';

    if (!leftOrderKey || !rightOrderKey) {
        if (leftOrderKey) {
            return -1;
        }
        if (rightOrderKey) {
            return 1;
        }
        return 0;
    }

    return compareOrderMapEntries(leftOrderKey, rightOrderKey, navigationOrderMap);
}
