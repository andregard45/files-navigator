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
import { addSettingSyncModeToggle } from '../../syncModeToggle';
import { attachColorSwatchSetting } from '../../colorSwatchSetting';
import { createDependentSettingsSection, setElementVisible, wireToggleSettingWithDependentSection } from '../../dependentSettings';
import { DEFAULT_SETTINGS } from '../../defaultSettings';
import {
    isFeatureImagePixelSizeSetting,
    isFeatureImageSizeSetting
} from '../../types';
import {
    normalizeFileNameIconMapKey,
    normalizeFileTypeIconMapKey,
    parseIconMapText,
    serializeIconMapRecord,
    type IconMapParseResult
} from '../../../utils/iconizeFormat';
import { formatCommaSeparatedList, parseCommaSeparatedList } from '../../../utils/commaSeparatedListUtils';
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
    const previewTextGroup = createGroup(strings.settings.pages.fileDisplay.groups.previewText);
    const featureImageGroup = createGroup(strings.settings.pages.fileDisplay.groups.featureImage);
    const notePropertyGroup = createGroup(strings.settings.pages.fileDisplay.groups.properties);
    const dateGroup = createGroup(strings.settings.pages.fileDisplay.groups.date);
    const parentFolderGroup = createGroup(strings.settings.pages.fileDisplay.groups.parentFolder);

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

    const showPreviewSetting = previewTextGroup.addSetting(setting => {
        setting.setName(strings.settings.items.showNotePreview.name).setDesc(strings.settings.items.showNotePreview.desc);
    });

    const previewSettingsEl = wireToggleSettingWithDependentSection(
        showPreviewSetting,
        () => plugin.settings.showFilePreview,
        async value => {
            plugin.settings.showFilePreview = value;
            await plugin.saveSettingsAndUpdate();
        }
    );

    new Setting(previewSettingsEl)
        .setName(strings.settings.items.previewRows.name)
        .setDesc(strings.settings.items.previewRows.desc)
        .addDropdown(dropdown =>
            dropdown
                .addOption('1', strings.settings.items.previewRows.options['1'])
                .addOption('2', strings.settings.items.previewRows.options['2'])
                .addOption('3', strings.settings.items.previewRows.options['3'])
                .addOption('4', strings.settings.items.previewRows.options['4'])
                .addOption('5', strings.settings.items.previewRows.options['5'])
                .setValue(plugin.settings.previewRows.toString())
                .onChange(async value => {
                    plugin.settings.previewRows = parseInt(value, 10);
                    await plugin.saveSettingsAndUpdate();
                })
        );

    new Setting(previewSettingsEl)
        .setName(strings.settings.items.skipHeadingsInPreview.name)
        .setDesc(strings.settings.items.skipHeadingsInPreview.desc)
        .addToggle(toggle =>
            toggle.setValue(plugin.settings.skipHeadingsInPreview).onChange(async value => {
                plugin.settings.skipHeadingsInPreview = value;
                await plugin.saveSettingsAndUpdate();
            })
        );

    new Setting(previewSettingsEl)
        .setName(strings.settings.items.skipCodeBlocksInPreview.name)
        .setDesc(strings.settings.items.skipCodeBlocksInPreview.desc)
        .addToggle(toggle =>
            toggle.setValue(plugin.settings.skipCodeBlocksInPreview).onChange(async value => {
                plugin.settings.skipCodeBlocksInPreview = value;
                await plugin.saveSettingsAndUpdate();
            })
        );

    new Setting(previewSettingsEl)
        .setName(strings.settings.items.skipCalloutsInPreview.name)
        .setDesc(strings.settings.items.skipCalloutsInPreview.desc)
        .addToggle(toggle =>
            toggle.setValue(plugin.settings.skipCalloutsInPreview).onChange(async value => {
                plugin.settings.skipCalloutsInPreview = value;
                await plugin.saveSettingsAndUpdate();
            })
        );

    new Setting(previewSettingsEl)
        .setName(strings.settings.items.stripHtmlInPreview.name)
        .setDesc(strings.settings.items.stripHtmlInPreview.desc)
        .addToggle(toggle =>
            toggle.setValue(plugin.settings.stripHtmlInPreview).onChange(async value => {
                plugin.settings.stripHtmlInPreview = value;
                await plugin.saveSettingsAndUpdate();
            })
        );

    new Setting(previewSettingsEl)
        .setName(strings.settings.items.stripLatexInPreview.name)
        .setDesc(strings.settings.items.stripLatexInPreview.desc)
        .addToggle(toggle =>
            toggle.setValue(plugin.settings.stripLatexInPreview).onChange(async value => {
                plugin.settings.stripLatexInPreview = value;
                await plugin.saveSettingsAndUpdate();
            })
        );

    const previewPropertiesSetting = context.createDebouncedTextSetting(
        previewSettingsEl,
        strings.settings.items.previewProperties.name,
        strings.settings.items.previewProperties.desc,
        strings.settings.items.previewProperties.placeholder,
        () => formatCommaSeparatedList(plugin.settings.previewProperties),
        value => {
            plugin.settings.previewProperties = parseCommaSeparatedList(value);
        },
        undefined,
        () => {
            updatePreviewFallbackVisibility();
        }
    );
    previewPropertiesSetting.controlEl.addClass('nn-setting-wide-input');

    const previewFallbackSetting = new Setting(previewSettingsEl)
        .setName(strings.settings.items.fallbackToNoteContent.name)
        .setDesc(strings.settings.items.fallbackToNoteContent.desc)
        .addToggle(toggle =>
            toggle.setValue(plugin.settings.previewPropertiesFallback).onChange(async value => {
                plugin.settings.previewPropertiesFallback = value;
                await plugin.saveSettingsAndUpdate();
            })
        );

    const updatePreviewFallbackVisibility = () => {
        setElementVisible(previewFallbackSetting.settingEl, plugin.settings.previewProperties.length > 0);
    };
    updatePreviewFallbackVisibility();

    const showFeatureImageSetting = featureImageGroup.addSetting(setting => {
        setting.setName(strings.settings.items.showFeatureImage.name).setDesc(strings.settings.items.showFeatureImage.desc);
    });

    const featureImageSettingsEl = wireToggleSettingWithDependentSection(
        showFeatureImageSetting,
        () => plugin.settings.showFeatureImage,
        async value => {
            plugin.settings.showFeatureImage = value;
            await plugin.saveSettingsAndUpdate();
        }
    );

    const featurePropertiesSetting = context.createDebouncedTextSetting(
        featureImageSettingsEl,
        strings.settings.items.featureImageProperties.name,
        strings.settings.items.featureImageProperties.desc,
        strings.settings.items.featureImageProperties.placeholder,
        () => formatCommaSeparatedList(plugin.settings.featureImageProperties),
        value => {
            plugin.settings.featureImageProperties = parseCommaSeparatedList(value);
        }
    );
    featurePropertiesSetting.controlEl.addClass('nn-setting-wide-input');

    const featureExcludePropertiesSetting = context.createDebouncedTextSetting(
        featureImageSettingsEl,
        strings.settings.items.featureImageExcludeProperties.name,
        strings.settings.items.featureImageExcludeProperties.desc,
        strings.settings.items.featureImageExcludeProperties.placeholder,
        () => formatCommaSeparatedList(plugin.settings.featureImageExcludeProperties),
        value => {
            plugin.settings.featureImageExcludeProperties = parseCommaSeparatedList(value);
        }
    );
    featureExcludePropertiesSetting.controlEl.addClass('nn-setting-wide-input');

    const featureImageSizeSetting = new Setting(featureImageSettingsEl)
        .setName(strings.settings.items.featureImageDisplaySize.name)
        .setDesc(strings.settings.items.featureImageDisplaySize.desc)
        .addDropdown(dropdown =>
            dropdown
                .addOption('64', strings.settings.items.featureImageDisplaySize.options['64'])
                .addOption('96', strings.settings.items.featureImageDisplaySize.options['96'])
                .addOption('128', strings.settings.items.featureImageDisplaySize.options['128'])
                .setValue(plugin.settings.featureImageSize)
                .onChange(value => {
                    if (!isFeatureImageSizeSetting(value)) {
                        return;
                    }
                    plugin.setFeatureImageSize(value);
                })
        );
    addSettingSyncModeToggle({ setting: featureImageSizeSetting, plugin, settingId: 'featureImageSize' });

    const featureImagePixelSizeSetting = new Setting(featureImageSettingsEl)
        .setName(strings.settings.items.featureImagePixelSize.name)
        .setDesc(strings.settings.items.featureImagePixelSize.desc)
        .addDropdown(dropdown =>
            dropdown
                .addOption('256', strings.settings.items.featureImagePixelSize.options['256x144'])
                .addOption('384', strings.settings.items.featureImagePixelSize.options['384x216'])
                .addOption('512', strings.settings.items.featureImagePixelSize.options['512x288'])
                .setValue(plugin.settings.featureImagePixelSize)
                .onChange(value => {
                    if (!isFeatureImagePixelSizeSetting(value)) {
                        return;
                    }
                    plugin.setFeatureImagePixelSize(value);
                })
        );
    addSettingSyncModeToggle({ setting: featureImagePixelSizeSetting, plugin, settingId: 'featureImagePixelSize' });

    new Setting(featureImageSettingsEl)
        .setName(strings.settings.items.forceSquareFeatureImage.name)
        .setDesc(strings.settings.items.forceSquareFeatureImage.desc)
        .addToggle(toggle =>
            toggle.setValue(plugin.settings.forceSquareFeatureImage).onChange(async value => {
                plugin.settings.forceSquareFeatureImage = value;
                await plugin.saveSettingsAndUpdate();
            })
        );

    new Setting(featureImageSettingsEl)
        .setName(strings.settings.items.downloadExternalFeatureImages.name)
        .setDesc(strings.settings.items.downloadExternalFeatureImages.desc)
        .addToggle(toggle =>
            toggle.setValue(plugin.settings.downloadExternalFeatureImages).onChange(async value => {
                plugin.settings.downloadExternalFeatureImages = value;
                await plugin.saveSettingsAndUpdate();
            })
        );

    const showFilePropertiesSetting = notePropertyGroup.addSetting(setting => {
        setting.setName(strings.settings.items.showFileProperties.name).setDesc(strings.settings.items.showFileProperties.desc);
    });

    const filePropertiesDependentSettingsEl = wireToggleSettingWithDependentSection(
        showFilePropertiesSetting,
        () => plugin.settings.showFileProperties,
        async value => {
            plugin.settings.showFileProperties = value;
            await plugin.saveSettingsAndUpdate();
        }
    );

    const colorFilePropertiesSetting = new Setting(filePropertiesDependentSettingsEl)
        .setName(strings.settings.items.colorFileProperties.name)
        .setDesc(strings.settings.items.colorFileProperties.desc);

    const colorFilePropertiesDependentSettingsEl = wireToggleSettingWithDependentSection(
        colorFilePropertiesSetting,
        () => plugin.settings.colorFileProperties,
        async value => {
            plugin.settings.colorFileProperties = value;
            await plugin.saveSettingsAndUpdate();
        }
    );

    new Setting(colorFilePropertiesDependentSettingsEl)
        .setName(strings.settings.items.showColoredPropertiesFirst.name)
        .setDesc(strings.settings.items.showColoredPropertiesFirst.desc)
        .addToggle(toggle =>
            toggle.setValue(plugin.settings.prioritizeColoredFileProperties).onChange(async value => {
                plugin.settings.prioritizeColoredFileProperties = value;
                await plugin.saveSettingsAndUpdate();
            })
        );

    new Setting(filePropertiesDependentSettingsEl)
        .setName(strings.settings.items.showFilePropertiesInCompactMode.name)
        .setDesc(strings.settings.items.showFilePropertiesInCompactMode.desc)
        .addToggle(toggle =>
            toggle.setValue(plugin.settings.showFilePropertiesInCompactMode).onChange(async value => {
                plugin.settings.showFilePropertiesInCompactMode = value;
                await plugin.saveSettingsAndUpdate();
            })
        );

    new Setting(filePropertiesDependentSettingsEl)
        .setName(strings.settings.items.showPropertiesOnSeparateRows.name)
        .setDesc(strings.settings.items.showPropertiesOnSeparateRows.desc)
        .addToggle(toggle =>
            toggle.setValue(plugin.settings.showPropertiesOnSeparateRows).onChange(async value => {
                plugin.settings.showPropertiesOnSeparateRows = value;
                await plugin.saveSettingsAndUpdate();
            })
        );

    new Setting(filePropertiesDependentSettingsEl)
        .setName(strings.settings.items.linkPropertyPillsToNotes.name)
        .setDesc(strings.settings.items.linkPropertyPillsToNotes.desc)
        .addToggle(toggle =>
            toggle.setValue(plugin.settings.enablePropertyInternalLinks).onChange(async value => {
                plugin.settings.enablePropertyInternalLinks = value;
                await plugin.saveSettingsAndUpdate();
            })
        );

    new Setting(filePropertiesDependentSettingsEl)
        .setName(strings.settings.items.linkPropertyPillsToUrls.name)
        .setDesc(strings.settings.items.linkPropertyPillsToUrls.desc)
        .addToggle(toggle =>
            toggle.setValue(plugin.settings.enablePropertyExternalLinks).onChange(async value => {
                plugin.settings.enablePropertyExternalLinks = value;
                await plugin.saveSettingsAndUpdate();
            })
        );

    const showFileDateSetting = dateGroup.addSetting(setting => {
        setting.setName(strings.settings.items.showFileDate.name).setDesc(strings.settings.items.showFileDate.desc);
    });

    const fileDateDependentSettingsEl = wireToggleSettingWithDependentSection(
        showFileDateSetting,
        () => plugin.settings.showFileDate,
        async value => {
            plugin.settings.showFileDate = value;
            await plugin.saveSettingsAndUpdate();
        }
    );

    // Dropdown to choose which date to display when sorting alphabetically
    new Setting(fileDateDependentSettingsEl)
        .setName(strings.settings.items.dateWhenSortingByName.name)
        .setDesc(strings.settings.items.dateWhenSortingByName.desc)
        .addDropdown(dropdown =>
            dropdown
                .addOption('created', strings.settings.items.dateWhenSortingByName.options.created)
                .addOption('modified', strings.settings.items.dateWhenSortingByName.options.modified)
                .setValue(plugin.settings.alphabeticalDateMode)
                .onChange(async value => {
                    plugin.settings.alphabeticalDateMode = value === 'modified' ? 'modified' : 'created';
                    await plugin.saveSettingsAndUpdate();
                })
        );

    const showParentFolderSetting = parentFolderGroup.addSetting(setting => {
        setting.setName(strings.settings.items.showParentFolder.name).setDesc(strings.settings.items.showParentFolder.desc);
    });

    const parentFolderSettingsEl = wireToggleSettingWithDependentSection(
        showParentFolderSetting,
        () => plugin.settings.showParentFolder,
        async value => {
            plugin.settings.showParentFolder = value;
            await plugin.saveSettingsAndUpdate();
        }
    );

    new Setting(parentFolderSettingsEl)
        .setName(strings.settings.items.showFolderPath.name)
        .setDesc(strings.settings.items.showFolderPath.desc)
        .addToggle(toggle =>
            toggle.setValue(plugin.settings.showParentFolderFullPath).onChange(async value => {
                plugin.settings.showParentFolderFullPath = value;
                await plugin.saveSettingsAndUpdate();
            })
        );

    new Setting(parentFolderSettingsEl)
        .setName(strings.settings.items.parentFolderClickOpensFolder.name)
        .setDesc(strings.settings.items.parentFolderClickOpensFolder.desc)
        .addToggle(toggle =>
            toggle.setValue(plugin.settings.parentFolderClickRevealsFile).onChange(async value => {
                plugin.settings.parentFolderClickRevealsFile = value;
                await plugin.saveSettingsAndUpdate();
            })
        );

    new Setting(parentFolderSettingsEl)
        .setName(strings.settings.items.showParentFolderColor.name)
        .setDesc(strings.settings.items.showParentFolderColor.desc)
        .addToggle(toggle =>
            toggle.setValue(plugin.settings.showParentFolderColor).onChange(async value => {
                plugin.settings.showParentFolderColor = value;
                await plugin.saveSettingsAndUpdate();
            })
        );

    new Setting(parentFolderSettingsEl)
        .setName(strings.settings.items.showParentFolderIcon.name)
        .setDesc(strings.settings.items.showParentFolderIcon.desc)
        .addToggle(toggle =>
            toggle.setValue(plugin.settings.showParentFolderIcon).onChange(async value => {
                plugin.settings.showParentFolderIcon = value;
                await plugin.saveSettingsAndUpdate();
            })
        );
}
