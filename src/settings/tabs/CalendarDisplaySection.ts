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

import { DropdownComponent } from 'obsidian';
import { strings } from '../../i18n';
import { getMomentApi } from '../../utils/moment';
import type { createSettingGroupFactory } from '../settingGroups';
import { addSettingSyncModeToggle } from '../syncModeToggle';
import {
    isCalendarLeftPlacement,
    isCalendarMonthHeadingFormat,
    isCalendarPlacement,
    type CalendarWeeksToShow
} from '../types';
import type { SettingsTabContext } from './SettingsTabContext';

const CALENDAR_LOCALE_SYSTEM_DEFAULT = 'system-default';

type CreateSettingGroup = ReturnType<typeof createSettingGroupFactory>;

interface CalendarDisplaySectionOptions {
    onCalendarLocaleChange: () => void;
}

interface CalendarDisplaySectionResult {
    calendarLocaleWarningEl: HTMLElement;
}

function parseCalendarWeeksToShow(value: string): CalendarWeeksToShow | null {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isFinite(parsed) || parsed < 1 || parsed > 6) {
        return null;
    }
    return parsed as CalendarWeeksToShow;
}

function formatCalendarWeeksOption(count: number): string {
    return strings.settings.items.calendarLeftSidebarWeeksToShow.options.weeksCount.replace('{count}', count.toString());
}

export function renderCalendarDisplaySections(
    context: SettingsTabContext,
    createGroup: CreateSettingGroup,
    options: CalendarDisplaySectionOptions
): CalendarDisplaySectionResult {
    const { plugin } = context;

    const topGroup = createGroup(undefined);

    const calendarPlacementSetting = topGroup.addSetting(setting => {
        setting.setName(strings.settings.items.calendarPlacement.name).setDesc(strings.settings.items.calendarPlacement.desc);
    });

    calendarPlacementSetting.addDropdown((dropdown: DropdownComponent) => {
        dropdown
            .addOption('left-sidebar', strings.settings.items.calendarPlacement.options.leftSidebar)
            .addOption('right-sidebar', strings.settings.items.calendarPlacement.options.rightSidebar)
            .setValue(plugin.settings.calendarPlacement)
            .onChange(value => {
                if (!isCalendarPlacement(value)) {
                    return;
                }

                plugin.setCalendarPlacement(value);
            });
    });

    addSettingSyncModeToggle({ setting: calendarPlacementSetting, plugin, settingId: 'calendarPlacement' });

    const appearanceGroup = createGroup(strings.settings.pages.calendar.groups.appearance);
    const momentApi = getMomentApi();
    const localeOptions = momentApi ? [...momentApi.locales()].sort((a, b) => a.localeCompare(b)) : [];
    const systemLocale = typeof navigator !== 'undefined' ? (navigator.language ?? '').toLowerCase() : '';
    const currentLocale = momentApi?.locale() || systemLocale;

    const calendarLocaleSetting = appearanceGroup.addSetting(setting => {
        setting.setName(strings.settings.items.calendarLocale.name).setDesc(strings.settings.items.calendarLocale.desc);
    });

    calendarLocaleSetting.addDropdown((dropdown: DropdownComponent) => {
        dropdown.addOption(
            CALENDAR_LOCALE_SYSTEM_DEFAULT,
            `${strings.settings.items.calendarLocale.options.systemDefault} (${currentLocale || 'en'})`
        );
        for (const locale of localeOptions) {
            dropdown.addOption(locale, locale);
        }

        dropdown.setValue(plugin.settings.calendarLocale).onChange(async value => {
            plugin.settings.calendarLocale = value;
            options.onCalendarLocaleChange();
            await plugin.saveSettingsAndUpdate();
        });
    });

    const calendarLocaleWarningEl = calendarLocaleSetting.descEl.createDiv({
        cls: 'setting-item-description nn-setting-hidden nn-setting-warning'
    });

    appearanceGroup
        .addSetting(setting => {
            setting
                .setName(strings.settings.items.calendarMonthNameFormat.name)
                .setDesc(strings.settings.items.calendarMonthNameFormat.desc);
        })
        .addDropdown((dropdown: DropdownComponent) => {
            dropdown
                .addOption('full', strings.settings.items.calendarMonthNameFormat.options.full)
                .addOption('short', strings.settings.items.calendarMonthNameFormat.options.short)
                .setValue(plugin.settings.calendarMonthHeadingFormat)
                .onChange(async value => {
                    if (!isCalendarMonthHeadingFormat(value)) {
                        return;
                    }

                    plugin.settings.calendarMonthHeadingFormat = value;
                    await plugin.saveSettingsAndUpdate();
                });
        });

    appearanceGroup
        .addSetting(setting => {
            setting.setName(strings.settings.items.calendarHighlightToday.name).setDesc(strings.settings.items.calendarHighlightToday.desc);
        })
        .addToggle(toggle =>
            toggle.setValue(plugin.settings.calendarHighlightToday).onChange(async value => {
                plugin.settings.calendarHighlightToday = value;
                await plugin.saveSettingsAndUpdate();
            })
        );

    appearanceGroup
        .addSetting(setting => {
            setting
                .setName(strings.settings.items.calendarShowOutsideMonthDays.name)
                .setDesc(strings.settings.items.calendarShowOutsideMonthDays.desc);
        })
        .addToggle(toggle =>
            toggle.setValue(plugin.settings.calendarShowOutsideMonthDays).onChange(async value => {
                plugin.settings.calendarShowOutsideMonthDays = value;
                await plugin.saveSettingsAndUpdate();
            })
        );

    appearanceGroup
        .addSetting(setting => {
            setting.setName(strings.settings.items.calendarShowWeekNumber.name).setDesc(strings.settings.items.calendarShowWeekNumber.desc);
        })
        .addToggle(toggle =>
            toggle.setValue(plugin.settings.calendarShowWeekNumber).onChange(async value => {
                plugin.settings.calendarShowWeekNumber = value;
                await plugin.saveSettingsAndUpdate();
            })
        );

    appearanceGroup
        .addSetting(setting => {
            setting.setName(strings.settings.items.calendarShowQuarter.name).setDesc(strings.settings.items.calendarShowQuarter.desc);
        })
        .addToggle(toggle =>
            toggle.setValue(plugin.settings.calendarShowQuarter).onChange(async value => {
                plugin.settings.calendarShowQuarter = value;
                await plugin.saveSettingsAndUpdate();
            })
        );

    const leftSidebarGroup = createGroup(strings.settings.pages.calendar.groups.leftSidebar);
    const calendarLeftPlacementSetting = leftSidebarGroup.addSetting(setting => {
        setting
            .setName(strings.settings.items.calendarSinglePanePlacement.name)
            .setDesc(strings.settings.items.calendarSinglePanePlacement.desc);
    });

    calendarLeftPlacementSetting.addDropdown((dropdown: DropdownComponent) => {
        dropdown
            .addOption('below', strings.settings.items.calendarSinglePanePlacement.options.belowPanes)
            .addOption('navigation', strings.settings.items.calendarSinglePanePlacement.options.navigationPane)
            .setValue(plugin.settings.calendarLeftPlacement)
            .onChange(value => {
                if (!isCalendarLeftPlacement(value)) {
                    return;
                }

                plugin.setCalendarLeftPlacement(value);
            });
    });

    addSettingSyncModeToggle({ setting: calendarLeftPlacementSetting, plugin, settingId: 'calendarLeftPlacement' });

    const calendarWeeksToShowSetting = leftSidebarGroup.addSetting(setting => {
        setting
            .setName(strings.settings.items.calendarLeftSidebarWeeksToShow.name)
            .setDesc(strings.settings.items.calendarLeftSidebarWeeksToShow.desc);
    });

    calendarWeeksToShowSetting.addDropdown((dropdown: DropdownComponent) => {
        dropdown.addOption('1', strings.settings.items.calendarLeftSidebarWeeksToShow.options.oneWeek);
        for (let count = 2; count <= 5; count++) {
            dropdown.addOption(String(count), formatCalendarWeeksOption(count));
        }
        dropdown.addOption('6', strings.settings.items.calendarLeftSidebarWeeksToShow.options.fullMonth);

        dropdown.setValue(String(plugin.settings.calendarWeeksToShow)).onChange(value => {
            const parsed = parseCalendarWeeksToShow(value);
            if (parsed === null) {
                return;
            }

            plugin.setCalendarWeeksToShow(parsed);
        });
    });

    addSettingSyncModeToggle({ setting: calendarWeeksToShowSetting, plugin, settingId: 'calendarWeeksToShow' });

    const rightSidebarGroup = createGroup(strings.settings.pages.calendar.groups.rightSidebar);

    rightSidebarGroup
        .addSetting(setting => {
            setting
                .setName(strings.settings.items.calendarShowYearCalendar.name)
                .setDesc(strings.settings.items.calendarShowYearCalendar.desc);
        })
        .addToggle(toggle =>
            toggle.setValue(plugin.settings.calendarShowYearCalendar).onChange(async value => {
                plugin.settings.calendarShowYearCalendar = value;
                await plugin.saveSettingsAndUpdate();
            })
        );

    return { calendarLocaleWarningEl };
}
