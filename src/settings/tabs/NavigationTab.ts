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

import { ButtonComponent, Platform, Setting } from 'obsidian';
import type { SettingDefinitionItem } from 'obsidian';
import { strings } from '../../i18n';
import { DEFAULT_SETTINGS } from '../defaultSettings';
import type { SettingsTabContext } from './SettingsTabContext';
import { runAsyncAction } from '../../utils/async';
import { supportsKeyboardInteractions } from '../../utils/paneLayout';
import { getActiveVaultProfile } from '../../utils/vaultProfiles';
import { createDropdownDefinition, createGroupDefinition, createRenderDefinition, createToggleDefinition } from '../nativeSettingControls';
import { formatPixelSliderValue, formatSecondsSliderValue, renderSliderSetting } from './SliderSetting';
import { renderToolbarButtonsSetting } from './ToolbarButtonsSetting';

/** Builds native 1.13 setting definitions for navigation pane settings. */
export function createNavigationPaneSettingDefinitions(context: SettingsTabContext): SettingDefinitionItem[] {
    const { plugin } = context;

    return [
        createGroupDefinition(undefined, [
            createRenderDefinition({
                name: strings.settings.items.toolbarButtons.name,
                desc: strings.settings.items.toolbarButtons.desc,
                aliases: [
                    strings.paneHeader.showDualPane,
                    strings.paneHeader.expandAllFolders,
                    strings.paneHeader.showExcludedItems,
                    strings.paneHeader.showCalendar,
                    strings.paneHeader.newFolder
                ],
                render: setting => {
                    renderToolbarButtonsSetting(
                        createSetting => {
                            createSetting(setting);
                            return setting;
                        },
                        plugin,
                        'navigation'
                    );
                }
            }),
            // Auto-select follows keyboard navigation support (desktop and tablets); phones never auto-open
            ...(supportsKeyboardInteractions()
                ? [
                      createToggleDefinition('autoSelectFirstFileOnFocusChange', {
                          name: strings.settings.items.autoSelectFirstNote.name,
                          desc: strings.settings.items.autoSelectFirstNote.desc
                      })
                  ]
                : []),
            createToggleDefinition('autoExpandNavItems', {
                name: strings.settings.items.expandOnSelection.name,
                desc: strings.settings.items.expandOnSelection.desc
            }),
            createToggleDefinition('collapseOtherBranchesOnExpand', {
                name: strings.settings.items.collapseOtherBranchesOnExpand.name,
                desc: strings.settings.items.collapseOtherBranchesOnExpand.desc
            })
        ]),
        createGroupDefinition(strings.settings.pages.navigationPane.groups.collapseItems, [
            createDropdownDefinition('collapseBehavior', {
                name: strings.settings.items.collapseItems.name,
                desc: strings.settings.items.collapseItems.desc,
                aliases: Object.values(strings.settings.items.collapseItems.options),
                options: {
                    all: strings.settings.items.collapseItems.options.all,
                    'folders-only': strings.settings.items.collapseItems.options.foldersOnly,
                    'tags-only': strings.settings.items.collapseItems.options.tagsOnly,
                    'properties-only': strings.settings.items.collapseItems.options.propertiesOnly
                }
            }),
            createToggleDefinition('smartCollapse', {
                name: strings.settings.items.keepSelectedItemExpanded.name,
                desc: strings.settings.items.keepSelectedItemExpanded.desc
            }),
            createToggleDefinition('excludeVaultRootFromCollapse', {
                name: strings.settings.items.excludeVaultRootFromCollapse.name,
                desc: strings.settings.items.excludeVaultRootFromCollapse.desc
            })
        ]),
        ...(Platform.isMobile
            ? []
            : [
                  createGroupDefinition(strings.settings.pages.navigationPane.groups.dragAndDrop, [
                      createToggleDefinition('springLoadedFolders', {
                          name: strings.settings.items.springLoadedFolders.name,
                          desc: strings.settings.items.springLoadedFolders.desc
                      }),
                      createRenderDefinition({
                          name: strings.settings.items.springLoadedFoldersInitialDelay.name,
                          desc: strings.settings.items.springLoadedFoldersInitialDelay.desc,
                          visible: () => plugin.settings.springLoadedFolders,
                          render: setting => renderSpringLoadedFoldersInitialDelaySetting(setting, context)
                      }),
                      createRenderDefinition({
                          name: strings.settings.items.springLoadedFoldersSubsequentDelay.name,
                          desc: strings.settings.items.springLoadedFoldersSubsequentDelay.desc,
                          visible: () => plugin.settings.springLoadedFolders,
                          render: setting => renderSpringLoadedFoldersSubsequentDelaySetting(setting, context)
                      })
                  ])
              ]),
        createGroupDefinition(strings.settings.pages.navigationPane.groups.fileCounts, [
            createToggleDefinition('showNoteCount', {
                name: strings.settings.items.showFileCount.name,
                desc: strings.settings.items.showFileCount.desc
            }),
            createToggleDefinition('separateNoteCounts', {
                name: strings.settings.items.separateFileCounts.name,
                desc: strings.settings.items.separateFileCounts.desc,
                visible: () => plugin.settings.showNoteCount
            })
        ]),
        createGroupDefinition(strings.settings.pages.navigationPane.groups.appearance, [
            createToggleDefinition('showIndentGuides', {
                name: strings.settings.items.showIndentGuides.name,
                desc: strings.settings.items.showIndentGuides.desc
            }),
            createDropdownDefinition('navCountLeaderStyle', {
                name: strings.settings.items.navCountLeaderStyle.name,
                desc: strings.settings.items.navCountLeaderStyle.desc,
                aliases: Object.values(strings.settings.items.navCountLeaderStyle.options),
                options: {
                    none: strings.settings.items.navCountLeaderStyle.options.none,
                    dots: strings.settings.items.navCountLeaderStyle.options.dots,
                    dashes: strings.settings.items.navCountLeaderStyle.options.dashes,
                    line: strings.settings.items.navCountLeaderStyle.options.line
                }
            }),
            createRenderDefinition({
                name: strings.settings.items.rootItemSpacing.name,
                desc: strings.settings.items.rootItemSpacing.desc,
                render: setting => renderRootLevelSpacingSetting(setting, context)
            }),
            createRenderDefinition({
                name: strings.settings.items.treeIndentation.name,
                desc: strings.settings.items.treeIndentation.desc,
                render: setting => renderNavIndentSetting(setting, context)
            }),
            createRenderDefinition({
                name: strings.settings.items.navItemHeight.name,
                desc: strings.settings.items.navItemHeight.desc,
                render: setting => renderNavItemHeightSetting(setting, context)
            }),
            createRenderDefinition({
                name: strings.settings.items.navItemHeightScaleText.name,
                desc: strings.settings.items.navItemHeightScaleText.desc,
                render: setting => renderNavItemHeightScaleTextSetting(setting, context)
            })
        ])
    ];
}

function renderRootLevelSpacingSetting(setting: Setting, context: SettingsTabContext): void {
    const { plugin } = context;

    renderSliderSetting(setting, {
        name: strings.settings.items.rootItemSpacing.name,
        desc: strings.settings.items.rootItemSpacing.desc,
        value: plugin.settings.rootLevelSpacing,
        defaultValue: DEFAULT_SETTINGS.rootLevelSpacing,
        min: 0,
        max: 12,
        step: 1,
        formatValue: formatPixelSliderValue,
        onChange: async value => {
            plugin.settings.rootLevelSpacing = value;
            await plugin.saveSettingsAndUpdate();
        }
    });
}

function renderNavIndentSetting(setting: Setting, context: SettingsTabContext): void {
    const { plugin } = context;

    renderSliderSetting(setting, {
        name: strings.settings.items.treeIndentation.name,
        desc: strings.settings.items.treeIndentation.desc,
        value: plugin.settings.navIndent,
        defaultValue: DEFAULT_SETTINGS.navIndent,
        min: 10,
        max: 24,
        step: 1,
        formatValue: formatPixelSliderValue,
        onChange: value => {
            plugin.setNavIndent(value);
        }
    });

}

function renderNavItemHeightSetting(setting: Setting, context: SettingsTabContext): void {
    const { plugin } = context;

    renderSliderSetting(setting, {
        name: strings.settings.items.navItemHeight.name,
        desc: strings.settings.items.navItemHeight.desc,
        value: plugin.settings.navItemHeight,
        defaultValue: DEFAULT_SETTINGS.navItemHeight,
        min: 20,
        max: 28,
        step: 1,
        formatValue: formatPixelSliderValue,
        onChange: value => {
            plugin.setNavItemHeight(value);
        }
    });

}

function renderSpringLoadedFoldersInitialDelaySetting(setting: Setting, context: SettingsTabContext): void {
    const { plugin } = context;

    renderSliderSetting(setting, {
        name: strings.settings.items.springLoadedFoldersInitialDelay.name,
        desc: strings.settings.items.springLoadedFoldersInitialDelay.desc,
        value: plugin.settings.springLoadedFoldersInitialDelay,
        defaultValue: DEFAULT_SETTINGS.springLoadedFoldersInitialDelay,
        min: 0.1,
        max: 2,
        step: 0.1,
        formatValue: formatSecondsSliderValue,
        normalizeValue: value => Math.round(value * 10) / 10,
        onChange: async value => {
            plugin.settings.springLoadedFoldersInitialDelay = value;
            await plugin.saveSettingsAndUpdate();
        }
    });
}

function renderSpringLoadedFoldersSubsequentDelaySetting(setting: Setting, context: SettingsTabContext): void {
    const { plugin } = context;

    renderSliderSetting(setting, {
        name: strings.settings.items.springLoadedFoldersSubsequentDelay.name,
        desc: strings.settings.items.springLoadedFoldersSubsequentDelay.desc,
        value: plugin.settings.springLoadedFoldersSubsequentDelay,
        defaultValue: DEFAULT_SETTINGS.springLoadedFoldersSubsequentDelay,
        min: 0.1,
        max: 2,
        step: 0.1,
        formatValue: formatSecondsSliderValue,
        normalizeValue: value => Math.round(value * 10) / 10,
        onChange: async value => {
            plugin.settings.springLoadedFoldersSubsequentDelay = value;
            await plugin.saveSettingsAndUpdate();
        }
    });
}

function renderNavItemHeightScaleTextSetting(setting: Setting, context: SettingsTabContext): void {
    const { plugin } = context;

    setting
        .setName(strings.settings.items.navItemHeightScaleText.name)
        .setDesc(strings.settings.items.navItemHeightScaleText.desc)
        .addToggle(toggle =>
            toggle.setValue(plugin.settings.navItemHeightScaleText).onChange(value => {
                plugin.setNavItemHeightScaleText(value);
            })
        );

}
