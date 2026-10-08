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

import { Setting, setIcon } from 'obsidian';
import type { SettingDefinitionItem } from 'obsidian';
import { strings } from '../../i18n';
import { showNotice } from '../../utils/noticeUtils';
import type { SettingsTabContext } from './SettingsTabContext';
import { runAsyncAction } from '../../utils/async';
import { addSettingSyncModeToggle } from '../syncModeToggle';
import { attachColorSwatchSetting } from '../colorSwatchSetting';
import { DEFAULT_SETTINGS } from '../defaultSettings';
import { createDropdownDefinition, createGroupDefinition, createRenderDefinition, createToggleDefinition } from '../nativeSettingControls';
import {
    normalizeFileNameIconMapKey,
    normalizeFileTypeIconMapKey,
    parseIconMapText,
    serializeIconMapRecord,
    type IconMapParseResult
} from '../../utils/iconizeFormat';
import { isFileTypeIconPreset } from '../../utils/fileTypeIconPresets';
import { ItemType, PROPERTIES_ROOT_VIRTUAL_FOLDER_ID } from '../../types';

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

/** Builds native 1.13 setting definitions for note appearance and metadata settings. */
export function createNotesSettingDefinitions(context: SettingsTabContext): SettingDefinitionItem[] {
    const { plugin } = context;

    return [
        createGroupDefinition(strings.settings.pages.fileDisplay.groups.icon, [
            createToggleDefinition('showFileIcons', {
                name: strings.settings.items.showFileIcons.name,
                desc: strings.settings.items.showFileIcons.desc
            }),
            createToggleDefinition('useFolderIconForFiles', {
                name: strings.settings.items.useFolderIcon.name,
                desc: strings.settings.items.useFolderIcon.desc,
                visible: () => plugin.settings.showFileIcons
            }),
            createToggleDefinition('showFilenameMatchIcons', {
                name: strings.settings.items.showFileNameIcons.name,
                desc: strings.settings.items.showFileNameIcons.desc,
                visible: () => plugin.settings.showFileIcons
            }),
            createRenderDefinition({
                name: strings.settings.items.fileNameIconMap.name,
                desc: strings.settings.items.fileNameIconMap.desc,
                aliases: [strings.settings.items.fileNameIconMap.placeholder, strings.settings.items.fileNameIconMap.editTooltip],
                visible: () => plugin.settings.showFileIcons && plugin.settings.showFilenameMatchIcons,
                render: setting =>
                    renderIconMapSetting(setting, context, {
                        name: strings.settings.items.fileNameIconMap.name,
                        desc: strings.settings.items.fileNameIconMap.desc,
                        placeholder: strings.settings.items.fileNameIconMap.placeholder,
                        tooltip: strings.settings.items.fileNameIconMap.editTooltip,
                        mode: 'fileName',
                        getMap: () => plugin.settings.fileNameIconMap,
                        setMap: nextMap => {
                            plugin.settings.fileNameIconMap = nextMap;
                        },
                        parse: parseFileNameIconMapText,
                        normalizeKey: normalizeFileNameIconMapKey
                    })
            }),
            createToggleDefinition('showCategoryIcons', {
                name: strings.settings.items.showFileTypeIcons.name,
                desc: strings.settings.items.showFileTypeIcons.desc,
                visible: () => plugin.settings.showFileIcons
            }),
            createRenderDefinition({
                name: strings.settings.items.fileTypeIconPreset.name,
                desc: strings.settings.items.fileTypeIconPreset.desc,
                aliases: Object.values(getFileTypeIconPresetOptions()).map(option => option.label),
                visible: () => plugin.settings.showFileIcons && plugin.settings.showCategoryIcons,
                render: setting => renderFileTypeIconPresetSetting(setting, context)
            }),
            createRenderDefinition({
                name: strings.settings.items.fileTypeIconMap.name,
                desc: strings.settings.items.fileTypeIconMap.desc,
                aliases: [strings.settings.items.fileTypeIconMap.placeholder, strings.settings.items.fileTypeIconMap.editTooltip],
                visible: () => plugin.settings.showFileIcons && plugin.settings.showCategoryIcons,
                render: setting =>
                    renderIconMapSetting(setting, context, {
                        name: strings.settings.items.fileTypeIconMap.name,
                        desc: strings.settings.items.fileTypeIconMap.desc,
                        placeholder: strings.settings.items.fileTypeIconMap.placeholder,
                        tooltip: strings.settings.items.fileTypeIconMap.editTooltip,
                        mode: 'fileType',
                        getMap: () => plugin.settings.fileTypeIconMap,
                        setMap: nextMap => {
                            plugin.settings.fileTypeIconMap = nextMap;
                        },
                        parse: parseFileTypeIconMapText,
                        normalizeKey: normalizeFileTypeIconMapKey
                    })
            })
        ]),
        createGroupDefinition(strings.settings.pages.fileDisplay.groups.title, [
            createToggleDefinition('useFolderColorForTitles', {
                name: strings.settings.items.useFolderColor.name,
                desc: strings.settings.items.useFolderColor.desc
            })
        ])
    ];
}

function renderColorSetting(
    setting: Setting,
    context: SettingsTabContext,
    params: { name: string; desc: string; access: ColorSettingAccess; darkAccess?: ColorSettingAccess }
): void {
    attachColorSwatchSetting({
        app: context.app,
        plugin: context.plugin,
        setting,
        name: params.name,
        desc: params.desc,
        access: params.access,
        darkAccess: params.darkAccess,
        showRestoreDefault: true
    });
}

function getFileTypeIconPresetOptions(): Record<string, FileTypeIconPresetOption> {
    return {
        none: {
            label: strings.settings.items.fileTypeIconPreset.options.builtIn,
            isInstalled: true
        }
    };
}

function renderFileTypeIconPresetSetting(setting: Setting, context: SettingsTabContext): void {
    const { plugin } = context;
    const options = getFileTypeIconPresetOptions();

    setting.setName(strings.settings.items.fileTypeIconPreset.name).setDesc(strings.settings.items.fileTypeIconPreset.desc);

    setting.addDropdown(dropdown => {
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
}

function renderIconMapSetting(
    setting: Setting,
    context: SettingsTabContext,
    options: {
        name: string;
        desc: string;
        placeholder: string;
        tooltip: string;
        mode: 'fileName' | 'fileType';
        getMap: () => Record<string, string>;
        setMap: (nextMap: Record<string, string>) => void;
        parse: (value: string) => IconMapParseResult;
        normalizeKey: (input: string) => string;
    }
): void {
    const { app, plugin } = context;

    context.configureDebouncedTextAreaSetting(
        setting,
        options.name,
        options.desc,
        options.placeholder,
        () => serializeIconMapRecord(options.getMap()),
        value => {
            const parsed = options.parse(value);
            options.setMap(parsed.map);
        },
        {
            rows: 3,
            validator: value => options.parse(value).invalidLines.length === 0
        }
    );

    setting.addExtraButton(button =>
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

                    const { FileIconRuleEditorModal } = await import('../../modals/FileIconRuleEditorModal');
                    const modal = new FileIconRuleEditorModal(app, {
                        title: options.name,
                        mode: options.mode,
                        initialMap: options.getMap(),
                        fallbackIconId: 'file',
                        metadataService,
                        normalizeKey: options.normalizeKey,
                        onSave: async nextMap => {
                            options.setMap(nextMap);

                            const textarea = setting.controlEl.querySelector('textarea');
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
    setting.controlEl.addClass('nn-setting-wide-input');
}

function renderCommaSeparatedTextSetting(
    setting: Setting,
    context: SettingsTabContext,
    options: {
        name: string;
        desc: string;
        placeholder: string;
        getValue: () => string;
        setValue: (value: string) => void;
        onAfterUpdate?: () => void;
    }
): void {
    context.configureDebouncedTextSetting(
        setting,
        options.name,
        options.desc,
        options.placeholder,
        options.getValue,
        options.setValue,
        undefined,
        options.onAfterUpdate
    );
    setting.controlEl.addClass('nn-setting-wide-input');
}
