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

import { Setting } from 'obsidian';
import { strings } from '../../../i18n';
import { showNotice } from '../../../utils/noticeUtils';
import type { SettingsTabContext } from '../SettingsTabContext';
import { runAsyncAction } from '../../../utils/async';
import { createSettingGroupFactory } from '../../settingGroups';
import { attachColorSwatchSetting } from '../../colorSwatchSetting';
import { createDependentSettingsSection, setElementVisible, wireToggleSettingWithDependentSection } from '../../dependentSettings';
import { DEFAULT_SETTINGS } from '../../defaultSettings';
import {
    normalizeFileNameIconMapKey,
    normalizeFileTypeIconMapKey,
    parseIconMapText,
    serializeIconMapRecord,
    type IconMapParseResult
} from '../../../utils/iconizeFormat';

import { isFileTypeIconPreset } from '../../../utils/fileTypeIconPresets';

function parseFileTypeIconMapText(value: string): IconMapParseResult {
    return parseIconMapText(value, normalizeFileTypeIconMapKey);
}

function parseFileNameIconMapText(value: string): IconMapParseResult {
    return parseIconMapText(value, normalizeFileNameIconMapKey);
}

interface ColorSettingAccess {
    getValue: () => string;
    setValue: (value: string) => void;
    defaultValue: string;
}

interface FileTypeIconPresetOption {
    label: string;
    isInstalled: boolean;
}

function getFileTypeIconPresetOptions(): Record<string, FileTypeIconPresetOption> {
    return {
        none: {
            label: strings.settings.items.fileTypeIconPreset.options.builtIn,
            isInstalled: true
        }
    };
}

/** Legacy settings renderer used only by Obsidian versions before native 1.13 setting definitions. */
export function renderNotesTab(context: SettingsTabContext): void {
    const { app, containerEl, plugin } = context;

    const createGroup = createSettingGroupFactory(containerEl);
    const iconGroup = createGroup(strings.settings.pages.fileDisplay.groups.icon);
    const titleGroup = createGroup(strings.settings.pages.fileDisplay.groups.title);

    const createColorSetting = (params: {
        containerEl: HTMLElement;
        name: string;
        desc: string;
        access: ColorSettingAccess;
        darkAccess?: ColorSettingAccess;
    }): void => {
        attachColorSwatchSetting({
            app,
            plugin,
            setting: new Setting(params.containerEl),
            name: params.name,
            desc: params.desc,
            access: params.access,
            darkAccess: params.darkAccess,
            showRestoreDefault: true
        });
    };

    const showFileIconsSetting = iconGroup.addSetting(setting => {
        setting.setName(strings.settings.items.showFileIcons.name).setDesc(strings.settings.items.showFileIcons.desc);
    });

    const fileIconDependentSettingsEl = wireToggleSettingWithDependentSection(
        showFileIconsSetting,
        () => plugin.settings.showFileIcons,
        async value => {
            plugin.settings.showFileIcons = value;
            await plugin.saveSettingsAndUpdate();
        }
    );

    let updateFileNameIconMapVisibility: (() => void) | null = null;
    let updateFileTypeIconMapVisibility: (() => void) | null = null;

    /**
     * Adds an edit button to an icon map setting that opens the visual rule editor modal
     */
    const addIconMapEditorButton = (options: {
        setting: Setting;
        tooltip: string;
        title: string;
        mode: 'fileName' | 'fileType';
        getMap: () => Record<string, string>;
        setMap: (nextMap: Record<string, string>) => void;
        normalizeKey: (input: string) => string;
    }): void => {
        options.setting.addExtraButton(button =>
            button
                .setIcon('lucide-pencil')
                .setTooltip(options.tooltip)
                .onClick(() => {
                    runAsyncAction(async () => {
                        const metadataService = plugin.metadataService;
                        if (!metadataService) {
                            showNotice(strings.common.unknownError, { variant: 'warning' });
                            return;
                        }

                        const { FileIconRuleEditorModal } = await import('../../../modals/FileIconRuleEditorModal');
                        const modal = new FileIconRuleEditorModal(app, {
                            title: options.title,
                            mode: options.mode,
                            initialMap: options.getMap(),
                            fallbackIconId: 'file',
                            metadataService,
                            normalizeKey: options.normalizeKey,
                            onSave: async nextMap => {
                                options.setMap(nextMap);

                                const textarea = options.setting.controlEl.querySelector('textarea');
                                if (textarea instanceof HTMLTextAreaElement) {
                                    textarea.value = serializeIconMapRecord(nextMap);
                                }

                                await plugin.saveSettingsAndUpdate();
                            }
                        });
                        modal.open();
                    });
                })
        );
    };

    new Setting(fileIconDependentSettingsEl)
        .setName(strings.settings.items.useFolderIcon.name)
        .setDesc(strings.settings.items.useFolderIcon.desc)
        .addToggle(toggle =>
            toggle.setValue(plugin.settings.useFolderIconForFiles).onChange(async value => {
                plugin.settings.useFolderIconForFiles = value;
                await plugin.saveSettingsAndUpdate();
            })
        );

    const showFilenameMatchIconsSetting = new Setting(fileIconDependentSettingsEl)
        .setName(strings.settings.items.showFileNameIcons.name)
        .setDesc(strings.settings.items.showFileNameIcons.desc)
        .addToggle(toggle =>
            toggle.setValue(plugin.settings.showFilenameMatchIcons).onChange(async value => {
                plugin.settings.showFilenameMatchIcons = value;
                await plugin.saveSettingsAndUpdate();
                updateFileNameIconMapVisibility?.();
            })
        );
    const fileNameIconMapSettingsEl = createDependentSettingsSection(showFilenameMatchIconsSetting);

    const fileNameIconMapSetting = context.createDebouncedTextAreaSetting(
        fileNameIconMapSettingsEl,
        strings.settings.items.fileNameIconMap.name,
        strings.settings.items.fileNameIconMap.desc,
        strings.settings.items.fileNameIconMap.placeholder,
        () => serializeIconMapRecord(plugin.settings.fileNameIconMap),
        value => {
            const parsed = parseFileNameIconMapText(value);
            plugin.settings.fileNameIconMap = parsed.map;
        },
        {
            rows: 3,
            validator: value => parseFileNameIconMapText(value).invalidLines.length === 0
        }
    );

    addIconMapEditorButton({
        setting: fileNameIconMapSetting,
        tooltip: strings.settings.items.fileNameIconMap.editTooltip,
        title: strings.settings.items.fileNameIconMap.name,
        mode: 'fileName',
        getMap: () => plugin.settings.fileNameIconMap,
        setMap: nextMap => {
            plugin.settings.fileNameIconMap = nextMap;
        },
        normalizeKey: normalizeFileNameIconMapKey
    });
    fileNameIconMapSetting.controlEl.addClass('nn-setting-wide-input');
    updateFileNameIconMapVisibility = () => {
        setElementVisible(fileNameIconMapSettingsEl, plugin.settings.showFilenameMatchIcons);
    };
    updateFileNameIconMapVisibility();

    const showCategoryIconsSetting = new Setting(fileIconDependentSettingsEl)
        .setName(strings.settings.items.showFileTypeIcons.name)
        .setDesc(strings.settings.items.showFileTypeIcons.desc)
        .addToggle(toggle =>
            toggle.setValue(plugin.settings.showCategoryIcons).onChange(async value => {
                plugin.settings.showCategoryIcons = value;
                await plugin.saveSettingsAndUpdate();
                updateFileTypeIconMapVisibility?.();
            })
        );
    const fileTypeIconMapSettingsEl = createDependentSettingsSection(showCategoryIconsSetting);

    const fileTypeIconPresetSetting = new Setting(fileTypeIconMapSettingsEl)
        .setName(strings.settings.items.fileTypeIconPreset.name)
        .setDesc(strings.settings.items.fileTypeIconPreset.desc);

    fileTypeIconPresetSetting.addDropdown(dropdown => {
        const options = getFileTypeIconPresetOptions();

        Object.entries(options).forEach(([value, option]) => {
            dropdown.addOption(value, option.label);
        });

        dropdown.setValue(plugin.settings.fileTypeIconPreset).onChange(async value => {
            if (!isFileTypeIconPreset(value)) {
                return;
            }

            plugin.settings.fileTypeIconPreset = value;
            await plugin.saveSettingsAndUpdate();
        });
    });

    const fileTypeIconMapSetting = context.createDebouncedTextAreaSetting(
        fileTypeIconMapSettingsEl,
        strings.settings.items.fileTypeIconMap.name,
        strings.settings.items.fileTypeIconMap.desc,
        strings.settings.items.fileTypeIconMap.placeholder,
        () => serializeIconMapRecord(plugin.settings.fileTypeIconMap),
        value => {
            const parsed = parseFileTypeIconMapText(value);
            plugin.settings.fileTypeIconMap = parsed.map;
        },
        {
            rows: 3,
            validator: value => parseFileTypeIconMapText(value).invalidLines.length === 0
        }
    );

    addIconMapEditorButton({
        setting: fileTypeIconMapSetting,
        tooltip: strings.settings.items.fileTypeIconMap.editTooltip,
        title: strings.settings.items.fileTypeIconMap.name,
        mode: 'fileType',
        getMap: () => plugin.settings.fileTypeIconMap,
        setMap: nextMap => {
            plugin.settings.fileTypeIconMap = nextMap;
        },
        normalizeKey: normalizeFileTypeIconMapKey
    });
    fileTypeIconMapSetting.controlEl.addClass('nn-setting-wide-input');
    updateFileTypeIconMapVisibility = () => {
        setElementVisible(fileTypeIconMapSettingsEl, plugin.settings.showCategoryIcons);
    };
    updateFileTypeIconMapVisibility();

    titleGroup.addSetting(setting => {
        setting
            .setName(strings.settings.items.titleRows.name)
            .setDesc(strings.settings.items.titleRows.desc)
            .addDropdown(dropdown =>
                dropdown
                    .addOption('1', strings.settings.items.titleRows.options['1'])
                    .addOption('2', strings.settings.items.titleRows.options['2'])
                    .addOption('3', strings.settings.items.titleRows.options['3'])
                    .setValue(plugin.settings.fileNameRows.toString())
                    .onChange(async value => {
                        plugin.settings.fileNameRows = parseInt(value, 10);
                        await plugin.saveSettingsAndUpdate();
                    })
            );
    });

    titleGroup.addSetting(setting => {
        setting
            .setName(strings.settings.items.useFolderColor.name)
            .setDesc(strings.settings.items.useFolderColor.desc)
            .addToggle(toggle =>
                toggle.setValue(plugin.settings.useFolderColorForTitles).onChange(async value => {
                    plugin.settings.useFolderColorForTitles = value;
                    await plugin.saveSettingsAndUpdate();
                })
            );
    });
}
