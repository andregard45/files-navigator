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

/**
 * English language strings for Notebook Navigator
 * Organized by feature/component for easy maintenance
 */
export const STRINGS_ZH_CN = {
    language: {
        downloading: '正在下载语言…',
        continueInEnglish: '继续使用英语',
        downloadFailed: '语言下载失败。Notebook Navigator 正在使用英语。'
    },
    // Common UI elements
    common: {
        cancel: '取消', // Button text for canceling dialogs and operations (English: Cancel)
        delete: '删除', // Button text for delete operations in dialogs (English: Delete)
        clear: '清除', // Button text for clearing values (English: Clear)
        remove: '移除', // Button text for remove operations in dialogs (English: Remove)
        restoreDefault: '恢复默认', // Button text for restoring values to defaults (English: Restore default)
        submit: '提交', // Button text for submitting forms and dialogs (English: Submit)
        save: '保存', // Button text for saving settings and dialogs (English: Save)
        lightMode: '浅色模式', // Label for light theme mode (English: Light mode)
        darkMode: '深色模式', // Label for dark theme mode (English: Dark mode)
        noSelection: '未选择', // Placeholder text when no folder or tag is selected (English: No selection)
        untagged: '无标签', // Label for notes without any tags (English: Untagged)
        unknownError: '未知错误', // Generic fallback when an error has no message (English: Unknown error)
        clipboardWriteError: '无法写入剪贴板',
        previous: '上一个', // Generic aria label for previous navigation (English: Previous)
        next: '下一个' // Generic aria label for next navigation (English: Next)
    },

    // List pane
    listPane: {
        emptyStateNoSelection: '选择文件夹或标签以查看笔记', // Message shown when no folder or tag is selected (English: Select a folder or tag to view notes)
        emptyStateNoNotes: '无笔记', // Message shown when a folder/tag has no notes (English: No notes)
        pinnedSection: '已固定', // Header for the pinned notes section at the top of file list (English: Pinned)
        notesSection: '笔记', // Header shown between pinned and regular items when showing documents only (English: Notes)
        filesSection: '文件', // Header shown between pinned and regular items when showing supported or all files (English: Files)
        hiddenItemAriaLabel: '{name}（已隐藏）', // Accessibility label applied to list items that are normally hidden
        collapseGroup: '折叠分组',
        expandGroup: '展开分组',
        propertyGroupNoValue: '无'
    },

    // Tag list
    tagList: {
        untaggedLabel: '无标签', // Label for the special item showing notes without tags (English: Untagged)
        tags: '标签' // Label for the tags virtual folder (English: Tags)
    },

    navigationPane: {
        shortcutsHeader: '快捷方式',
        recentFilesHeader: '最近文件', // Header label for recent files section in navigation pane (English: Recent files)
        properties: '属性',
        vaultRootLabel: '仓库',
        pinShortcuts: '固定快捷方式',
        pinShortcutsAndRecentFiles: '固定快捷方式和最近文件',
        unpinShortcuts: '取消固定快捷方式',
        unpinShortcutsAndRecentFiles: '取消固定快捷方式和最近文件',
        resizePinnedShortcuts: '调整固定快捷方式的大小',
        profileMenuAria: '更改仓库配置文件'
    },

    navigationCalendar: {
        ariaLabel: '导航日历',
        dailyNotesNotEnabled: '未启用日记核心插件。',
        noteHiddenByProfile: '日历笔记已被当前仓库配置文件隐藏。',
        helpModal: {
            title: '日历快捷键',
            items: [
                '点击任意日期以打开或创建日记。周、月、季度和年份的操作方式相同。',
                '日期下方的实心圆点表示有笔记。空心圆点表示有未完成的任务。',
                '如果笔记有特色图片，它会显示为该日期的背景。'
            ],
            dateFilterCmdCtrl: '`Cmd/Ctrl`+点击日期，按该日期筛选文件列表。',
            dateFilterOptionAlt: '`Option/Alt`+点击日期，按该日期筛选文件列表。'
        }
    },

    dailyNotes: {
        createFailed: '创建日记失败。'
    },

    templates: {
        invalidTokens: '模板“{name}”包含无效的占位符：{tokens}',
        invalidFileNameTokens: '“{name}”的文件名格式包含无效的占位符：{tokens}',
        readFailed: '无法读取模板“{name}”。笔记已在没有模板的情况下创建。',
        folderNotSet: '从模板新建笔记前，请先在文件操作与模板 > 模板中设置模板文件夹。',
        templateNotFound: '未找到模板“{name}”。',
        folderNotFound: '未找到文件夹“{name}”。',
        templaterMissing: '未安装 Templater 插件。请在文件操作与模板 > 模板中更改模板引擎。'
    },

    shortcuts: {
        folderExists: '文件夹已在快捷方式中',
        noteExists: '笔记已在快捷方式中',
        tagExists: '标签已在快捷方式中',
        propertyExists: '属性已在快捷方式中',
        invalidProperty: '无效的属性快捷方式',
        searchExists: '搜索快捷方式已存在',
        emptySearchQuery: '保存前请输入搜索查询',
        emptySearchName: '保存搜索前请输入名称',
        add: '添加到快捷方式',
        addNotesCount: '添加 {count} 个笔记到快捷方式',
        addFilesCount: '添加 {count} 个文件到快捷方式',
        rename: '重命名快捷方式',
        remove: '从快捷方式移除',
        removeAll: '移除所有快捷方式',
        removeAllConfirm: '移除所有快捷方式？',
        folderNotesPinned: '已固定 {count} 个文件夹笔记'
    },

    // Pane header
    paneHeader: {
        collapseAllFolders: '折叠项目', // Tooltip for button that collapses expanded items (English: Collapse items)
        expandAllFolders: '展开所有项目', // Tooltip for button that expands all items (English: Expand all items)
        collapseAllListGroups: '折叠所有列表分组',
        expandAllListGroups: '展开所有列表分组',
        showCalendar: '显示日历',
        hideCalendar: '隐藏日历',
        newFolder: '新建文件夹', // Tooltip for create new folder button (English: New folder)
        newNote: '新建笔记', // Tooltip for create new note button (English: New note)
        mobileBackToNavigation: '返回导航', // Mobile-only back button text to return to navigation pane (English: Back to navigation)
        changeChildSortOrder: '更改排序方式',
        changeSortAndGroup: '更改排序和分组',
        resetViewToDefaults: '将视图重置为默认值',
        descendants: '子项',
        subfolders: '子文件夹',
        subtags: '子标签',
        childValues: '子值',
        applySortAndGroupToDescendants: (target: string) => `将排序和分组应用到${target}`,
        showFolders: '显示导航', // Tooltip for button to show the navigation pane (English: Show navigation)
        showExcludedItems: '显示隐藏的文件夹、标签和笔记', // Tooltip for button to show hidden items (English: Show hidden items)
        hideExcludedItems: '隐藏隐藏的文件夹、标签和笔记', // Tooltip for button to hide hidden items (English: Hide hidden items)
        showDualPane: '显示双窗格', // Tooltip for button to show dual-pane layout (English: Show dual panes)
        showSinglePane: '显示单窗格', // Tooltip for button to show single-pane layout (English: Show single pane)
        dualPaneAutoFallbackNotice:
            '侧边栏过窄时无法使用双窗格。若要更改此行为，请在设置 > 外观与行为中将“侧边栏过窄时”设为“不执行任何操作”。',
        showNotesFromSubfolders: '显示子文件夹的笔记',
        showFilesFromSubfolders: '显示子文件夹的文件',
        showNotesFromDescendants: '显示后代的笔记',
        showFilesFromDescendants: '显示后代的文件',
        search: '搜索' // Tooltip for search button (English: Search)
    },
    // Search input
    searchInput: {
        placeholder: '搜索...', // Placeholder text for search input (English: Search...)
        placeholderVault: '搜索仓库...',
        placeholderOmnisearch: 'Omnisearch...', // Placeholder text when Omnisearch provider is active (English: Omnisearch...)
        clearSearch: '清除搜索', // Tooltip for clear search button (English: Clear search)
        switchToFilterSearch: '切换到筛选搜索',
        switchToOmnisearch: '切换到 Omnisearch',
        saveSearchShortcut: '将搜索保存到快捷方式',
        removeSearchShortcut: '从快捷方式移除搜索',
        shortcutModalTitle: '保存搜索快捷方式',
        shortcutNamePlaceholder: '输入快捷方式名称',
        shortcutStartIn: '始终从此处开始：{path}',
        searchHelp: '搜索语法',
        searchHelpTitle: '搜索语法',
        searchHelpModal: {
            intro: '过滤搜索通过显示名称、别名、属性、标签、日期和过滤器查找笔记，可在一个查询中组合使用（例如：`meeting .status=active #work @thisweek`）。点击星形图标可将搜索保存到快捷方式。',
            introInstallOmnisearch: '全文搜索笔记内容需要 Omnisearch 插件。',
            introSwitching: '使用上/下箭头键或点击搜索图标在过滤搜索和 Omnisearch 之间切换。',
            activeFilterSearch: '过滤搜索已启用。',
            activeOmnisearch: 'Omnisearch 已启用。',
            omnisearchIntro: 'Omnisearch 对整个仓库的笔记内容执行全文搜索。Notebook Navigator 显示属于当前文件夹、标签或所选内容的匹配项。',
            sections: {
                fileNames: {
                    title: '文件名和别名',
                    items: [
                        '`word` 查找显示名称或别名中含有 "word" 的笔记。',
                        '`word1 word2` 每个词都必须在显示名称或别名中匹配。',
                        '`-word` 排除显示名称或别名中含有 "word" 的笔记。',
                        '`"text"` 按字面匹配文本；以双引号开头的搜索词不会被解释为标签、属性、日期或过滤器（例如：`".F"`）。',
                        '`-"text"` 排除显示名称或别名中含有该字面文本的笔记。'
                    ]
                },
                tags: {
                    title: '标签',
                    items: [
                        '`#tag` 包含带有标签的笔记（也匹配嵌套标签如 `#tag/subtag`）。',
                        '`#` 仅包含有标签的笔记。',
                        '`-#tag` 排除带有标签的笔记。',
                        '`-#` 仅包含无标签的笔记。',
                        '`#tag1 #tag2` 匹配两个标签（隐式 AND）。',
                        '`#tag1 AND #tag2` 匹配两个标签（显式 AND）。',
                        '`#tag1 OR #tag2` 匹配任一标签。',
                        '`#a OR #b AND #c` AND 优先级更高：匹配 `#a`，或同时匹配 `#b` 和 `#c`。',
                        'Cmd/Ctrl+点击标签以 AND 方式添加。Cmd/Ctrl+Shift+点击以 OR 方式添加。'
                    ]
                },
                properties: {
                    title: '属性',
                    items: [
                        '`.key` 包含属性键以 `key` 开头的笔记。',
                        '`.key=value` 包含属性值含有 `value` 的笔记。',
                        '`."Reading Status"` 包含属性键包含空格的笔记。',
                        '`."Reading Status"="In Progress"` 包含空格的键和值必须用双引号括起来。',
                        '`-.key` 排除属性键以 `key` 开头的笔记。',
                        '`-.key=value` 排除属性值含有 `value` 的笔记。',
                        'Cmd/Ctrl+点击属性以 AND 方式添加。Cmd/Ctrl+Shift+点击以 OR 方式添加。'
                    ]
                },
                tasks: {
                    title: '过滤器',
                    items: [
                        '`folder:meetings` 包含文件夹名称含有 `meetings` 的笔记。',
                        '`folder:/work/meetings` 仅包含 `work/meetings` 中的笔记（不含子文件夹）。',
                        '`folder:/` 仅包含仓库根目录中的笔记。',
                        '`-folder:archive` 排除文件夹名称含有 `archive` 的笔记。',
                        '`-folder:/archive` 仅排除 `archive` 中的笔记（不含子文件夹）。',
                        '`ext:md` 包含扩展名为 `md` 的笔记（也支持 `ext:.md`）。',
                        '`-ext:pdf` 排除扩展名为 `pdf` 的笔记。',
                        '与标签、名称和日期组合使用（例如：`folder:/work/meetings ext:md @thisweek`）。'
                    ]
                },
                connectors: {
                    title: 'AND/OR 行为',
                    items: [
                        '`AND` 和 `OR` 仅在纯标签/属性查询中作为运算符。',
                        '纯标签/属性查询仅包含标签和属性过滤器：`#tag`、`-#tag`、`#`、`-#`、`.key`、`-.key`、`.key=value`、`-.key=value`。',
                        '如果查询包含名称、日期（`@...`）、文件夹过滤器（`folder:...`）或扩展名过滤器（`ext:...`），`AND` 和 `OR` 将作为词语进行匹配。',
                        '运算符查询示例：`#work OR .status=started`。',
                        '混合查询示例：`#work OR ext:md`（`OR` 在文件名中进行匹配）。'
                    ]
                },
                dates: {
                    title: '日期',
                    items: [
                        '`@today` 使用默认日期字段查找今天的笔记。',
                        '`@yesterday`、`@last7d`、`@last30d`、`@thisweek`、`@thismonth` 相对日期范围。',
                        '`@2026-02-07` 查找特定日期（也支持 `@20260207`）。',
                        '`@2026` 查找日历年。',
                        '`@2026-02` 或 `@202602` 查找日历月。',
                        '`@2026-W05` 或 `@2026W05` 查找 ISO 周。',
                        '`@2026-Q2` 或 `@2026Q2` 查找日历季度。',
                        '`@13/02/2026` 带分隔符的数字格式（`@07022026` 在歧义时遵循您的区域设置）。',
                        '`@2026-02-01..2026-02-07` 查找包含性日期范围（支持开放端点）。',
                        '`@c:...` 或 `@m:...` 指定创建或修改日期。',
                        '`-@...` 排除日期匹配。'
                    ]
                },
                omnisearch: {
                    title: 'Omnisearch',
                    items: [
                        '查询会发送给 Omnisearch 插件并遵循 Omnisearch 查询语法。`#tag`、`.property` 和 `@date` 等过滤搜索标记没有特殊含义。',
                        '选择文件夹后，查询会附加 `path:"<folder>/"`，使 Omnisearch 在该文件夹及其子文件夹内匹配。已包含 `path:` 的查询将原样发送。',
                        'Omnisearch 按相关性排序最多返回 50 条结果。当匹配项超过该数量时，排名较低的笔记不会显示。',
                        '限定包含非 ASCII 字符的文件夹路径需要 Omnisearch 1.30.0 或更高版本。旧版本会搜索整个仓库，然后按文件夹筛选结果。',
                        '在大型仓库中，少于3个字符的查询可能会较慢。'
                    ]
                }
            }
        }
    },

    // Context menus
    contextMenu: {
        file: {
            openInNewTab: '在新标签页中打开',
            openToRight: '在右侧打开',
            openInNewWindow: '在新窗口中打开',
            openMultipleInNewTabs: '在新标签页中打开 {count} 个笔记',
            openMultipleToRight: '在右侧打开 {count} 个笔记',
            openMultipleInNewWindows: '在新窗口中打开 {count} 个笔记',
            pinNote: '固定笔记',
            unpinNote: '取消固定笔记',
            pinMultipleNotes: '固定 {count} 个笔记',
            unpinMultipleNotes: '取消固定 {count} 个笔记',
            duplicateNote: '复制笔记',
            duplicateMultipleNotes: '复制 {count} 个笔记',
            openVersionHistory: '打开版本历史',
            revealInFolder: '在文件夹中定位',
            revealInFinder: '在访达中显示',
            showInExplorer: '在资源管理器中显示',
            openInDefaultApp: '在默认应用中打开',
            renameNote: '重命名笔记',
            deleteNote: '删除笔记',
            deleteMultipleNotes: '删除 {count} 个笔记',
            moveNoteToFolder: '移动笔记到...',
            moveFileToFolder: '移动文件到...',
            moveMultipleNotesToFolder: '将 {count} 个笔记移动到...',
            moveMultipleFilesToFolder: '将 {count} 个文件移动到...',
            mergeNotes: '合并 {count} 个笔记...',
            mergeNotesInGroup: '合并组中的笔记...',
            addTag: '添加标签',
            addPropertyKey: '设置属性',
            removeTag: '移除标签',
            removeAllTags: '移除所有标签',
            changeIcon: '更改图标',
            changeColor: '更改颜色',
            // File-specific context menu items (non-markdown files)
            openMultipleFilesInNewTabs: '在新标签页中打开 {count} 个文件',
            openMultipleFilesToRight: '在右侧打开 {count} 个文件',
            openMultipleFilesInNewWindows: '在新窗口中打开 {count} 个文件',
            pinFile: '固定文件',
            unpinFile: '取消固定文件',
            pinMultipleFiles: '固定 {count} 个文件',
            unpinMultipleFiles: '取消固定 {count} 个文件',
            duplicateFile: '复制文件',
            duplicateMultipleFiles: '复制 {count} 个文件',
            renameFile: '重命名文件',
            deleteFile: '删除文件',
            deleteMultipleFiles: '删除 {count} 个文件'
        },
        folder: {
            newNote: '新建笔记',
            newNoteFromTemplate: '从模板新建笔记',
            newFolder: '新建文件夹',
            newCanvas: '新建画布',
            newBase: '新建数据库',
            newDrawing: '新建绘图',
            newExcalidrawDrawing: '新建 Excalidraw 绘图',
            newTldrawDrawing: '新建 Tldraw 绘图',
            duplicateFolder: '复制文件夹',
            searchInFolder: '在文件夹中搜索',
            createFolderNote: '创建文件夹笔记',
            setFolderTemplate: '设置文件夹模板...',
            changeFolderTemplate: '更改文件夹模板...',
            removeFolderTemplate: '移除文件夹模板',
            detachFolderNote: '解除文件夹笔记关联',
            deleteFolderNote: '删除文件夹笔记',
            changeIcon: '更改图标',
            changeColor: '更改颜色',
            changeBackground: '更改背景',
            excludeFolder: '隐藏文件夹',
            unhideFolder: '显示文件夹',
            hideRootFolder: '隐藏根文件夹',
            showRootFolder: '显示根文件夹',
            excludeFromDescendants: '在父文件夹中隐藏',
            includeInDescendants: '在父文件夹中显示',
            hiddenFromParentsIndicator: '已从父文件夹列表中隐藏',
            moveFolder: '移动文件夹到...',
            renameFolder: '重命名文件夹',
            deleteFolder: '删除文件夹'
        },
        tag: {
            changeIcon: '更改图标',
            changeColor: '更改颜色',
            changeBackground: '更改背景',
            showTag: '显示标签',
            hideTag: '隐藏标签'
        },
        property: {
            addKey: '配置属性键',
            renameKey: '重命名属性',
            deleteKey: '删除属性'
        },
        navigation: {
            addSeparator: '添加分隔符',
            removeSeparator: '移除分隔符'
        },
        copy: {
            title: '复制',
            noteLink: '笔记链接',
            fileLink: '文件链接',
            noteLinkAsFootnote: '脚注形式的笔记链接',
            fileLinkAsFootnote: '脚注形式的文件链接',
            noteEmbed: '笔记嵌入',
            fileEmbed: '文件嵌入',
            obsidianUrl: 'Obsidian URL',
            pathFromVaultFolder: '自仓库文件夹的路径',
            pathFromSystemRoot: '自系统根目录的路径'
        },
        style: {
            title: '样式',
            copy: '复制样式',
            paste: '粘贴样式',
            removeIcon: '移除图标',
            removeColor: '移除颜色',
            removeBackground: '移除背景',
            clear: '清除样式'
        }
    },

    // Folder appearance menu
    folderAppearance: {
        sortBy: '排序方式',
        defaultSuffix: '（默认）',
        defaultLabel: '默认',
        groupBy: '分组依据'
    },

    // Modal dialogs
    modals: {
        bulkApply: {
            applyButton: '应用',
            applySortAndGroupTitle: (target: string) => `将排序和分组应用到${target}？`,
            affectedCountMessage: (count: number) => `将更改的现有覆盖：${count}。`
        },
        mergeNotes: {
            title: '合并笔记',
            summary: '从 {folder} 中的 {count} 个笔记创建一个笔记。',
            frontmatterRule: '保留第一个笔记的 frontmatter。移除其他笔记的 frontmatter。',
            crossFolderWarning: '源笔记位于不同文件夹。相对链接和嵌入在合并后的笔记中可能会停止工作。',
            outputName: '输出名称',
            outputNameDesc: '合并后的笔记会创建在上方显示的文件夹中。',
            outputNamePlaceholder: '合并的笔记',
            separator: '分隔符',
            separatorDesc: '插入到笔记之间。',
            separatorOptions: {
                none: '无',
                blankLine: '空行',
                horizontalRule: '分隔线',
                heading: '带笔记标题的标题'
            },
            moveSourcesToTrash: '合并后将源笔记移至回收站',
            mergeButton: '合并'
        },
        iconPicker: {
            searchPlaceholder: '搜索图标...',
            recentlyUsedHeader: '最近使用',
            emptyStateSearch: '开始输入以搜索图标',
            emptyStateNoResults: '未找到图标',
            showingResultsInfo: '显示 {count} 个结果中的 50 个。输入更多内容以缩小范围。',
            emojiInstructions: '输入或粘贴任何表情符号作为图标使用',
            removeIcon: '移除图标',
            removeFromRecents: '从最近使用中移除',
            allTabLabel: '全部'
        },
        fileIconRuleEditor: {
            addRuleAria: '添加规则'
        },
        colorPicker: {
            currentColor: '当前',
            newColor: '新颜色',
            paletteDefault: '默认',
            paletteCustom: '自定义',
            copyColors: '复制颜色',
            colorsCopied: '颜色已复制到剪贴板',
            pasteColors: '粘贴颜色',
            pasteClipboardError: '无法读取剪贴板',
            pasteInvalidFormat: '需要十六进制颜色值',
            colorsPasted: '颜色粘贴成功',
            resetUserColors: '清除自定义颜色',
            clearCustomColorsConfirm: '删除所有自定义颜色？',
            userColorSlot: '颜色 {slot}',
            recentColors: '最近使用的颜色',
            clearRecentColors: '清除最近使用的颜色',
            removeRecentColor: '移除颜色',
            apply: '应用',
            pickerLabel: '拾色器',
            hexLabel: 'HEX',
            hexInputLabel: '十六进制颜色值',
            saturationValueArea: '饱和度和亮度',
            hueSlider: '色相',
            alphaSlider: '透明度'
        },
        appearance: {
            tabIcon: '图标',
            tabColor: '颜色',
            tabBackground: '背景',
            resetIcon: '移除图标',
            resetColor: '移除颜色',
            resetBackground: '移除背景',
            clear: '清除样式',
            apply: '应用'
        },
        selectVaultProfile: {
            title: '选择仓库配置文件',
            currentBadge: '使用中',
            emptyState: '没有可用的仓库配置文件。'
        },
        tagOperation: {
            renameTitle: '重命名标签 {tag}',
            deleteTitle: '删除标签 {tag}',
            newTagPrompt: '新标签名称',
            newTagPlaceholder: '输入新标签名称',
            renameWarning: '重命名标签 {oldTag} 将修改 {count} 个{files}。',
            deleteWarning: '删除标签 {tag} 将修改 {count} 个{files}。',
            modificationWarning: '这将更新文件的修改日期。',
            affectedFiles: '受影响的文件：',
            andMore: '……以及其他 {count} 项',
            confirmRename: '重命名标签',
            renameUnchanged: '{tag} 未更改',
            renameNoChanges: '{oldTag} → {newTag} ({countLabel})',
            renameBatchNotFinalized: '已重命名 {renamed}/{total}。未更新：{notUpdated}。元数据和快捷方式未更新。',
            invalidTagName: '请输入有效的标签名称。',
            descendantRenameError: '无法将标签移动到自身或其子标签中。',
            confirmDelete: '删除标签',
            deleteBatchNotFinalized: '已从 {removed}/{total} 中删除。未更新：{notUpdated}。元数据和快捷方式未更新。',
            checkConsoleForDetails: '查看控制台了解详情。',
            file: '文件',
            files: '文件',
            inlineParsingWarning: {
                title: '内联标签兼容性',
                message: '{tag} 包含 Obsidian 无法在内联标签中解析的字符。Frontmatter 标签不受影响。',
                confirm: '仍然使用'
            }
        },
        propertyOperation: {
            renameTitle: '重命名属性 {property}',
            deleteTitle: '删除属性 {property}',
            newKeyPrompt: '新属性名称',
            newKeyPlaceholder: '输入新属性名称',
            renameWarning: '重命名属性 {property} 将修改 {count} 个{files}。',
            renameConflictWarning: '属性 {newKey} 已存在于 {count} 个{files}中。重命名 {oldKey} 将替换现有的 {newKey} 值。',
            deleteWarning: '删除属性 {property} 将修改 {count} 个{files}。',
            confirmRename: '重命名属性',
            confirmDelete: '删除属性',
            renameNoChanges: '{oldKey} → {newKey}（无更改）',
            renameSettingsUpdateFailed: '已重命名属性 {oldKey} → {newKey}。更新设置失败。',
            deleteSingleSuccess: '已从 1 篇笔记中删除属性 {property}',
            deleteMultipleSuccess: '已从 {count} 篇笔记中删除属性 {property}',
            deleteSettingsUpdateFailed: '已删除属性 {property}。更新设置失败。',
            invalidKeyName: '请输入有效的属性名称。'
        },
        fileSystem: {
            newFolderTitle: '新建文件夹',
            renameFolderTitle: '重命名文件夹',
            renameFileTitle: '重命名文件',
            deleteFolderTitle: "删除 '{name}'？",
            deleteFileTitle: "删除 '{name}'？",
            deleteFileAttachmentsTitle: '删除文件附件？',
            moveFileConflictTitle: '移动冲突',
            folderNamePrompt: '输入文件夹名称：',
            hideInOtherVaultProfiles: '在其他仓库配置文件中隐藏',
            renamePrompt: '输入新名称：',
            renameVaultTitle: '更改仓库显示名称',
            renameVaultPrompt: '输入自定义显示名称（留空使用默认值）：',
            deleteFolderConfirm: '您确定要删除此文件夹及其所有内容吗？',
            deleteFileConfirm: '您确定要删除此文件吗？',
            deleteFileAttachmentsDescriptionSingle: '此附件不再被任何笔记使用。是否要删除？',
            deleteFileAttachmentsDescriptionMultiple: '这些附件不再被任何笔记使用。是否要删除？',
            deleteFileAttachmentsViewFileTreeAriaLabel: '文件树',
            deleteFileAttachmentsViewGalleryAriaLabel: '图库',
            moveFileConflictDescriptionSingle: '在“{folder}”中发现文件冲突。',
            moveFileConflictDescriptionMultiple: '在“{folder}”中发现 {count} 个文件冲突。',
            moveFileConflictAffectedFiles: '受影响的文件',
            moveFileConflictItem: '"{name}" -> "{suggested}"{renameOnly}',
            moveFileConflictRenameOnly: '（仅重命名）',
            moveFileConflictRename: '重命名',
            moveFileConflictOverwrite: '覆盖',
            removeAllTagsTitle: '移除所有标签',
            removeAllTagsFromNote: '您确定要从这个笔记中移除所有标签吗？',
            removeAllTagsFromNotes: '您确定要从 {count} 个笔记中移除所有标签吗？'
        },
        folderNoteType: {
            title: '选择文件夹笔记类型',
            folderLabel: '文件夹：{name}'
        },
        folderSuggest: {
            placeholder: (name: string) => `将 ${name} 移动到文件夹...`,
            multipleFilesLabel: (count: number) => `${count} 个文件`,
            navigatePlaceholder: '导航到文件夹...',
            instructions: {
                navigate: '导航',
                move: '移动',
                select: '选择',
                dismiss: '取消'
            }
        },
        templateCommand: {
            titleAdd: '添加命令',
            titleEdit: '编辑命令',
            name: '命令名称',
            namePlaceholder: '新建会议笔记',
            template: '模板',
            templateDesc: '可选。未设置模板时，若目标文件夹有文件夹模板则使用它。',
            templatePlaceholder: 'Templates/Meeting.md',
            fileNameFormat: '文件名格式',
            fileNameFormatDesc:
                '{{date:YYYYMMDD}}、{{prompt:Title}} 等占位符会在运行命令时被替换。每个提示都会询问一个值，模板中相同的标签会获得相同的值。{{number}} 比文件夹中名称模式相同的笔记所用的最大编号大 1，{{number:00}} 会用零补齐位数。模板中也可以使用 {{number}}，{{title}} 会插入生成的文件名。',
            fileNameFormatPlaceholder: '{{date:YYYYMMDD}} {{prompt:Title}}',
            location: '位置',
            folder: '文件夹',
            folderPlaceholder: 'Meetings',
            icon: '图标',
            placement: '按钮',
            placementNone: '无',
            placementRibbon: '功能区',
            placementTabBar: '标签栏'
        },
        templateFile: {
            placeholder: '搜索模板...',
            instructions: {
                navigate: '导航',
                select: '选择模板',
                dismiss: '取消'
            }
        },
        tagSuggest: {
            navigatePlaceholder: '导航到标签...',
            addPlaceholder: '搜索要添加的标签...',
            removePlaceholder: '选择要移除的标签...',
            createNewTag: '创建新标签：#{tag}',
            instructions: {
                navigate: '导航',
                select: '选择',
                dismiss: '取消',
                add: '添加标签',
                remove: '移除标签'
            }
        },
        propertySuggest: {
            placeholder: '选择属性键...',
            navigatePlaceholder: '导航到属性...',
            instructions: {
                navigate: '导航',
                select: '添加属性',
                dismiss: '取消'
            }
        },
        propertyKeyVisibility: {
            title: '属性键可见性',
            description: '控制属性值的显示位置。各列分别对应导航窗格、列表窗格和文件上下文菜单。使用底部行切换某列中的所有行。',
            searchPlaceholder: '搜索属性键...',
            propertyColumnLabel: '属性',
            showInNavigation: '在导航中显示',
            showInList: '在列表中显示',
            showInFileMenu: '在文件菜单中显示',
            toggleAllInNavigation: '切换导航中的全部',
            toggleAllInList: '切换列表中的全部',
            toggleAllInFileMenu: '切换文件菜单中的全部',
            applyButton: '应用',
            emptyState: '未找到属性键。'
        }
    },

    // File system operations
    fileSystem: {
        errors: {
            createFolder: '创建文件夹失败：{error}',
            createFile: '创建文件失败：{error}',
            renameFolder: '重命名文件夹失败：{error}',
            renameFolderNoteConflict: '无法重命名：“{name}”已在此文件夹中存在',
            renameFile: '重命名文件失败：{error}',
            deleteFolder: '删除文件夹失败：{error}',
            deleteFile: '删除文件失败：{error}',
            deleteAttachments: '删除附件失败：{error}',
            mergeNotes: '合并笔记失败：{error}',
            mergeNotesOpenOutput: '合并后的笔记已创建为 {name}，但无法打开：{error}。源笔记未被更改。',
            mergeNotesOpenSkipped: '另一个文件打开请求已优先执行。',
            mergeNotesTrashSources: '合并后的笔记已创建。无法将 {count} 个源笔记移至回收站。',
            duplicateNote: '复制笔记失败：{error}',
            duplicateFolder: '复制文件夹失败：{error}',
            openVersionHistory: '打开版本历史失败：{error}',
            versionHistoryNotFound: '未找到版本历史命令。请确保已启用 Obsidian 同步。',
            revealInExplorer: '在系统资源管理器中定位文件失败：{error}',
            openInDefaultApp: '在默认应用中打开失败：{error}',
            openInDefaultAppNotAvailable: '此平台不支持在默认应用中打开',
            folderNoteAlreadyExists: '文件夹笔记已存在',
            folderAlreadyExists: '文件夹“{name}”已存在',
            folderNotesDisabled: '请在设置中启用文件夹笔记以转换文件',
            folderNoteAlreadyLinked: '此文件已作为文件夹笔记',
            folderNoteNotFound: '所选文件夹中没有文件夹笔记',
            folderNoteUnsupportedExtension: '不支持的文件扩展名：{extension}',
            folderNoteMoveFailed: '转换过程中移动文件失败：{error}',
            folderNoteRenameConflict: '文件夹中已存在名为“{name}”的文件',
            folderNoteConversionFailed: '转换为文件夹笔记失败',
            folderNoteConversionFailedWithReason: '转换为文件夹笔记失败：{error}',
            folderNoteOpenFailed: '文件已转换但打开文件夹笔记失败：{error}',
            failedToDeleteFile: '删除 {name} 失败：{error}',
            failedToDeleteMultipleFiles: '删除{count}个文件失败',
            versionHistoryNotAvailable: '版本历史服务不可用',
            drawingAlreadyExists: '同名绘图已存在',
            failedToCreateDrawing: '创建绘图失败',
            noFolderSelected: 'Notebook Navigator 中未选择文件夹',
            noFileSelected: '未选择文件'
        },
        warnings: {
            linkBreakingNameCharacters: '该名称包含会破坏 Obsidian 链接的字符：#, |, ^, %%, [[, ]]。',
            forbiddenNameCharactersAllPlatforms: '名称不能以 . 开头，也不能包含 : 或 /。',
            forbiddenNameCharactersWindows: 'Windows 保留字符不允许使用：<, >, ", \\, |, ?, *。'
        },
        notices: {
            folderExcludedFromDescendants: '已从父文件夹列表中隐藏：{name}',
            folderIncludedInDescendants: '已在父文件夹列表中显示：{name}',
            mergeNotes: '已将 {count} 个笔记合并到 {name}'
        },
        notifications: {
            deletedMultipleFiles: '已删除 {count} 个文件',
            movedMultipleFiles: '已将{count}个文件移动到{folder}',
            folderNoteConversionSuccess: '已在“{name}”中将文件转换为文件夹笔记',
            folderMoved: '已移动文件夹“{name}”',
            deepLinkCopied: 'Obsidian URL 已复制到剪贴板',
            pathCopied: '路径已复制到剪贴板',
            relativePathCopied: '相对路径已复制到剪贴板',
            linkCopied: '链接已复制到剪贴板',
            footnoteLinkCopied: '脚注链接已复制到剪贴板',
            embedLinkCopied: '嵌入链接已复制到剪贴板',
            tagAddedToNote: '已将标签添加到 1 个笔记',
            tagAddedToNotes: '已将标签添加到 {count} 个笔记',
            tagRemovedFromNote: '已从 1 个笔记中移除标签',
            tagRemovedFromNotes: '已从 {count} 个笔记中移除标签',
            tagsClearedFromNote: '已从 1 个笔记中清除所有标签',
            tagsClearedFromNotes: '已从 {count} 个笔记中清除所有标签',
            noTagsToRemove: '没有可移除的标签',
            noFilesSelected: '未选择文件',
            mergeNotesRequireMultipleMarkdown: '请选择至少两个 Markdown 笔记进行合并',
            tagOperationsNotAvailable: '标签操作不可用',
            propertyOperationsNotAvailable: '属性操作不可用',
            tagsRequireMarkdown: '标签仅在 Markdown 笔记中受支持',
            propertiesRequireMarkdown: '属性仅在 Markdown 笔记中受支持',
            propertySetOnNote: '已在 1 篇笔记中更新属性',
            propertySetOnNotes: '已在 {count} 篇笔记中更新属性',
            hiddenFileReveal: '文件已隐藏。启用“显示隐藏项目”以显示它'
        },
        confirmations: {
            deleteMultipleFiles: '确定要删除 {count} 个文件吗？',
            deleteConfirmation: '此操作无法撤销。'
        },
        defaultNames: {
            untitled: '未命名'
        }
    },

    // Drag and drop operations
    dragDrop: {
        errors: {
            cannotMoveIntoSelf: '无法将文件夹移动到自身或其子文件夹中。',
            itemAlreadyExists: '此位置已存在名为“{name}”的项目。',
            failedToMove: '移动失败：{error}',
            failedToAddTag: '添加标签“{tag}”失败',
            failedToSetProperty: '更新属性失败：{error}',
            failedToClearTags: '清除标签失败',
            failedToMoveFolder: '移动文件夹“{name}”失败',
            failedToImportFiles: '导入失败：{names}'
        },
        notifications: {
            filesAlreadyExist: '{count} 个文件在目标位置已存在',
            filesAlreadyHaveTag: '{count} 个文件已经有此标签或更具体的标签',
            filesAlreadyHaveProperty: '{count} 个文件已拥有此属性',
            noTagsToClear: '没有要清除的标签',
            fileImported: '已导入 1 个文件',
            filesImported: '已导入 {count} 个文件'
        }
    },

    // Date grouping
    dateGroups: {
        future: '未来',
        today: '今天',
        yesterday: '昨天',
        previous7Days: '过去 7 天',
        previous30Days: '过去 30 天'
    },

    // Plugin commands
    commands: {
        open: '打开', // Command palette: Opens the Notebook Navigator view (English: Open)
        toggleLeftSidebar: '切换左侧边栏', // Command palette: Toggles left sidebar, opening Notebook Navigator when uncollapsing (English: Toggle left sidebar)
        openDailyNote: '打开日记',
        openWeeklyNote: '打开周记',
        openMonthlyNote: '打开月记',
        openQuarterlyNote: '打开季度笔记',
        openYearlyNote: '打开年记',
        revealFile: '定位文件', // Command palette: Reveals and selects the currently active file in the navigator (English: Reveal file)
        search: '搜索', // Command palette: Toggle search in the file list (English: Search)
        searchVaultRoot: '搜索整个仓库', // Command palette: Selects the vault root folder and focuses search with subfolders included (English: Search whole vault)
        toggleDualPane: '切换双窗格布局', // Command palette: Toggles between single-pane and dual-pane layout (English: Toggle dual pane layout)
        toggleDualPaneOrientation: '切换双窗格方向', // Command palette: Toggles dual-pane orientation between horizontal and vertical (English: Toggle dual pane orientation)
        toggleCalendar: '切换日历', // Command palette: Toggles showing the calendar overlay in the navigation pane (English: Toggle calendar)
        selectVaultProfile: '选择仓库配置文件', // Command palette: Opens a modal to choose a different vault profile (English: Switch vault profile)
        selectVaultProfile1: '选择仓库配置文件 1', // Command palette: Activates the first vault profile without opening the modal (English: Select vault profile 1)
        selectVaultProfile2: '选择仓库配置文件 2', // Command palette: Activates the second vault profile without opening the modal (English: Select vault profile 2)
        selectVaultProfile3: '选择仓库配置文件 3', // Command palette: Activates the third vault profile without opening the modal (English: Select vault profile 3)
        deleteFile: '删除文件', // Command palette: Deletes the currently active file (English: Delete file)
        createNewNote: '创建新笔记', // Command palette: Creates a new note in the currently selected folder (English: Create new note)
        createNewNoteFromTemplate: '从模板新建笔记', // Command palette: Creates a new note from a template in the currently selected folder (English: Create new note from template)
        moveFiles: '移动文件', // Command palette: Move selected files to another folder (English: Move files)
        mergeNotes: '合并笔记', // Command palette: Creates one note from selected Markdown notes (English: Merge notes)
        selectNextFile: '选择下一个文件', // Command palette: Selects the next file in the current view (English: Select next file)
        selectPreviousFile: '选择上一个文件', // Command palette: Selects the previous file in the current view (English: Select previous file)
        navigateBack: '向后导航',
        navigateForward: '向前导航',
        convertToFolderNote: '转换为文件夹笔记', // Command palette: Converts the active file into a folder note with a new folder (English: Convert to folder note)
        setAsFolderNote: '设为文件夹笔记', // Command palette: Renames the active file to its folder note name (English: Set as folder note)
        detachFolderNote: '解除文件夹笔记关联', // Command palette: Renames the active folder note to a new name (English: Detach folder note)
        pinAllFolderNotes: '固定所有文件夹笔记', // Command palette: Pins all folder notes to shortcuts (English: Pin all folder notes)
        navigateToFolder: '导航到文件夹', // Command palette: Navigate to a folder using fuzzy search (English: Navigate to folder)
        navigateToTag: '导航到标签', // Command palette: Navigate to a tag using fuzzy search (English: Navigate to tag)
        navigateToProperty: '导航到属性', // Command palette: Navigate to a property key or value using fuzzy search (English: Navigate to property)
        addShortcut: '添加到快捷方式', // Command palette: Adds or removes the current file, folder, tag, or property from shortcuts (English: Add to shortcuts)
        openShortcut: '打开快捷方式 {number}',
        toggleDescendants: '切换后代', // Command palette: Toggles showing notes from descendants (English: Toggle descendants)
        toggleHidden: '切换隐藏的文件夹、标签和笔记', // Command palette: Toggles showing hidden items (English: Toggle hidden items)
        toggleTagSort: '切换标签排序', // Command palette: Toggles between alphabetical and frequency tag sorting (English: Toggle tag sort order)
        toggleTagsBySelection: '按选择切换标签',
        togglePropertiesBySelection: '按选择切换属性',
        togglePinnedSection: '切换固定区域',
        collapseExpand: '折叠/展开所有导航项', // Command palette: Collapse or expand all folders and tags (English: Collapse / expand all navigation items)
        collapseExpandListGroups: '折叠/展开所有列表分组',
        collapseExpandSelectedItem: '折叠/展开所选项目',
        addTag: '为选定文件添加标签', // Command palette: Opens a dialog to add a tag to selected files (English: Add tag to selected files)
        setProperty: '为选定文件设置属性', // Command palette: Opens a fuzzy dialog to set a property on selected files (English: Set property on selected files)
        removeTag: '从选定文件移除标签', // Command palette: Opens a dialog to remove a tag from selected files (English: Remove tag from selected files)
        removeAllTags: '从选定文件移除所有标签', // Command palette: Removes all tags from selected files (English: Remove all tags from selected files)
        openAllFiles: '打开所有文件', // Command palette: Opens all files in the current folder or tag (English: Open all files)
        rebuildCache: '重建缓存', // Command palette: Rebuilds the local Notebook Navigator cache (English: Rebuild cache)
        restoreDefaultSettings: '恢复默认设置' // Command palette: Replaces the settings file with defaults after startup was aborted (English: Restore default settings)
    },

    // Plugin UI
    plugin: {
        viewName: 'Notebook Navigator', // Name shown in the view header/tab (English: Notebook Navigator)
        calendarViewName: '日历', // Name shown in the view header/tab (English: Calendar)
        folderNoteSidebarViewName: '文件夹笔记', // Name shown in the folder note sidebar tab (English: Folder note)
        ribbonTooltip: 'Notebook Navigator', // Tooltip for the ribbon icon in the left sidebar (English: Notebook Navigator)
        revealInNavigator: '在 Notebook Navigator 中定位', // Context menu item to reveal a file in the navigator (English: Reveal in Notebook Navigator)
        settingsUnavailableNotice:
            'Notebook Navigator 无法读取其设置，因此未启动。如果仓库正在同步，请在同步完成后重启 Obsidian。要使用默认设置重新开始，请运行命令“恢复默认设置”。', // Notice shown when startup is aborted because the settings file is missing or cannot be read (English: Notebook Navigator could not read its settings and did not start. If your vault is syncing, restart Obsidian after the sync completes. To start over with default settings, run the command "Restore default settings".)
        settingsMissingConfirm: {
            title: '使用默认设置开始？', // Title of the dialog shown when the plugin is enabled while its settings file is missing (English: Start with default settings?)
            messageRecentInstall:
                'Notebook Navigator 刚刚安装，没有设置文件。如果这是全新安装或重新安装，请使用默认设置继续。如果您的设置来自同步服务，请取消，等待同步完成后重启 Obsidian。', // Dialog message when the plugin folder was written recently (English: Notebook Navigator was just installed and has no settings file. If this is a new install or a reinstall, continue with default settings. If your settings come from a sync service, cancel, wait for the sync to complete, and restart Obsidian.)
            messageExistingInstall:
                'Notebook Navigator 已在此设备上安装了一段时间，但设置文件缺失。如果仓库仍在同步，请取消，等待同步完成后重启 Obsidian 以保留现有设置。仅在想要使用默认设置重新开始时继续。', // Dialog message when the plugin folder has existed for a while (English: Notebook Navigator has been installed on this device for a while, but its settings file is missing. If your vault is still syncing, cancel, wait for the sync to complete, and restart Obsidian to keep your existing settings. Continue only to start over with default settings.)
            confirmButton: '使用默认设置' // Confirm button label in the missing-settings dialog (English: Use default settings)
        },
        settingsRecovery: {
            confirmTitle: '恢复默认设置', // Title of the confirmation dialog for the settings recovery command (English: Restore default settings)
            confirmMessage:
                '此操作会将 Notebook Navigator 的设置文件替换为默认设置。如果仓库仍在同步，恢复的默认设置可能会覆盖其他设备上保存的设置。可读取的设置文件会先复制到插件文件夹中带时间戳的备份文件。', // Body of the confirmation dialog for the settings recovery command
            confirmButton: '恢复默认', // Confirm button label in the settings recovery dialog (English: Restore defaults)
            failedNotice: '无法完成设置恢复。已保留本地偏好设置。', // Notice shown when settings recovery cannot be completed (English: Could not complete settings recovery. Local preferences were kept.)
            completedNotice: '已恢复默认设置。请重启 Obsidian 以完成。' // Notice shown after the settings file was replaced with defaults (English: Default settings restored. Restart Obsidian to finish.)
        }
    },

    // Tooltips
    tooltips: {
        lastModifiedAt: '最后修改于',
        createdAt: '创建于',
        file: '个文件',
        files: '个文件',
        folder: '个文件夹',
        folders: '个文件夹'
    },

    // Settings
    settings: {
        changeDefaultSettings: '更改默认设置',
        metadataReport: {
            exportSuccess: '失败的元数据报告已导出至：{filename}',
            exportFailed: '导出元数据报告失败'
        },
        pageGroups: {
            configuration: '配置',
            navigationPane: '导航窗格',
            listPane: '列表窗格',
            calendarAndTools: '日历和工具'
        },
        pages: {
            displayFilters: {
                label: '显示过滤器',
                description: '隐藏的文件夹、标签、文件、文件标签和属性规则。'
            },
            appearanceAndBehavior: {
                label: '外观和行为',
                description: '行为、键盘导航、鼠标按钮、外观和格式。',
                groups: {
                    startup: '启动',
                    keyboardNavigation: '键盘导航',
                    mouseButtons: '鼠标按钮',
                    desktopAppearance: '桌面外观',
                    mobileAppearance: '移动端外观',
                    appearance: '外观',
                    icons: '图标',
                    formatting: '格式'
                }
            },
            navigationPane: {
                label: '导航窗格',
                description: '布局、外观、文件数量、折叠行为和彩虹颜色。',
                groups: {
                    appearance: '外观',
                    collapseItems: '折叠项目',
                    dragAndDrop: '拖放',
                    fileCounts: '文件数'
                }
            },
            shortcutsAndRecentFiles: {
                label: '快捷方式与最近文件',
                description: '快捷方式可见性、徽章、最近文件和固定项目。',
                groups: {
                    shortcuts: '快捷方式',
                    recentFiles: '最近文件'
                }
            },
            foldersAndFolderNotes: {
                label: '文件夹和文件夹笔记',
                description: '文件夹显示、文件夹笔记、文件夹笔记模板和文件夹笔记行为。',
                groups: {
                    folders: '文件夹',
                    folderNotes: '文件夹笔记',
                    folderNoteFiles: '文件夹笔记文件'
                }
            },
            tagsAndProperties: {
                label: '标签与属性',
                description: '标签和属性部分、图标、排序、范围和继承。',
                groups: {
                    tags: '标签',
                    properties: '属性'
                }
            },
            listPane: {
                label: '列表窗格',
                description: '排序、分组、列表模式、固定笔记和绘图预览。',
                groups: {
                    appearance: '外观',
                    sortAndGroup: '排序与分组',
                    groupHeaders: '分组标题',
                    pinnedNotes: '固定笔记',
                    behavior: '行为'
                }
            },
            fileOperations: {
                label: '文件操作与模板',
                description: '模板、新建笔记命令、删除确认、附件以及移动文件冲突时的行为。',
                groups: {
                    templates: '模板',
                    templateCommands: '新建笔记命令'
                }
            },
            frontmatterFields: {
                label: '前置元数据字段',
                description: '用于显示名称、时间戳、图标和颜色的前置元数据字段。'
            },
            fileDisplay: {
                label: '文件显示',
                description: '标题、预览文本、特色图片、标签、属性、日期、字数和字符数。',
                groups: {
                    icon: '图标'
                }
            },
            calendar: {
                label: '导航日历',
                description: '日历显示、日期笔记、模板、区域设置和侧边栏位置。',
                groups: {
                    appearance: '外观',
                    leftSidebar: '左侧边栏',
                    calendarIntegration: '日历集成',
                    rightSidebar: '右侧边栏'
                }
            },
            advanced: {
                label: '高级',
                description: '诊断、元数据清理、导入/导出和重置。',
                groups: {
                    maintenance: '维护',
                    settingsManagement: '重置设置'
                }
            }
        },
        items: {
            listPaneTitle: {
                name: '列表窗格标题',
                desc: '选择列表窗格标题的显示位置。',
                options: {
                    header: '显示在标题栏',
                    listPane: '显示在列表窗格',
                    hidden: '不显示'
                }
            },
            colorListPaneTitle: {
                name: '为列表窗格标题着色',
                desc: '将所选文件夹、标签或属性的颜色应用于列表窗格标题。'
            },
            defaultSortOrder: {
                name: '默认排序方式',
                desc: '选择笔记的默认排序方式。“用于排序的属性”中的属性会作为额外的排序选项显示。',
                directions: {
                    asc: '升序',
                    desc: '降序'
                },
                dateDirections: {
                    newestOnTop: '最新在顶部',
                    oldestOnTop: '最旧在顶部'
                },
                textDirections: {
                    aOnTop: '升序',
                    zOnTop: '降序'
                },
                fields: {
                    dateEdited: '编辑日期',
                    dateCreated: '创建日期',
                    title: '标题',
                    fileName: '文件名',
                    property: '属性'
                }
            },
            defaultSortDirection: {
                name: '排序方向'
            },
            defaultGroupingDirection: {
                name: '分组方向',
                options: {
                    follow: '跟随排序'
                }
            },
            sortingProperties: {
                name: '用于排序的属性',
                desc: '以逗号分隔的 frontmatter 属性。每个属性会作为排序选项显示在默认排序方式设置和列表窗格的排序菜单中。这些属性不会被更改。',
                placeholder: 'published, author',
                defaultsResetNotices: {
                    sort: '默认排序方式已重置，因为其属性已不可用。',
                    grouping: '默认分组已重置，因为其属性已不可用。',
                    both: '默认排序方式和默认分组已重置，因为其属性已不可用。'
                }
            },
            propertySecondarySort: {
                name: '次要排序',
                desc: '与属性排序配合使用，当笔记具有相同的属性值或没有属性值时生效。',
                options: {
                    title: '标题',
                    fileName: '文件名',
                    dateCreated: '创建日期',
                    dateEdited: '编辑日期'
                }
            },
            propertySortInstructions: {
                intro: '按属性排序和分组的工作方式：',
                items: [
                    '**排序：** 选择“优先级”等属性后，笔记会按各自的优先级值排序。',
                    '**分组：** 选择“状态”等属性后，每个状态值都会创建一个标题。状态相同的笔记会显示在同一标题下。',
                    '**多个值：** 如果属性包含列表，Notebook Navigator 会使用完整列表。例如，如果“主题”包含“书籍”和“历史”，笔记会按“书籍, 历史”这个完整列表排序或分组，而不会分别按每个主题处理。',
                    '**缺少值：** 分组时，没有该属性的笔记会显示在末尾的 **无** 下。',
                    '**标签和属性视图：** 选择 **文件夹** 分组后，会改为显示日期标题。'
                ]
            },
            groupingProperties: {
                name: '用于分组的属性',
                desc: '以逗号分隔的 frontmatter 属性。每个属性会作为分组选项显示在默认分组设置和列表窗格的排序菜单中。这些属性不会被更改。',
                placeholder: 'status, genre'
            },
            groupHeadersInstructions: {
                intro: '自定义分组标题显示在列表窗格中笔记的上方。',
                items: ['在列表窗格的排序菜单中，将分组设置为 **自定义**。', '右键点击笔记并选择 **设置分组标题**，在其上方添加标题。']
            },
            scrollToSelectedFileOnListChanges: {
                name: '列表变更时滚动到选定文件',
                desc: '在固定笔记、显示后代笔记、更改文件夹外观或执行文件操作时滚动到选定的文件。'
            },
            includeDescendantNotes: {
                name: '显示子文件夹/后代的笔记',
                desc: '在查看文件夹、标签或属性时包含嵌套子文件夹以及标签和属性后代中的笔记。'
            },
            filterPinnedNotesByFolder: {
                name: '仅在笔记所在文件夹中固定',
                desc: '固定笔记仅在其所在文件夹中显示为已固定。适用于文件夹笔记或固定笔记较多的情况。不影响标签或属性视图。'
            },
            separateFileCounts: {
                name: '分别显示当前和后代文件计数',
                desc: '为文件夹、标签和属性以“当前 ▾ 后代”格式显示文件计数。'
            },
            defaultGrouping: {
                name: '默认分组',
                desc: '不分组会将排序结果保持为单一列表。**标题**在不改变顺序的情况下为其添加标注：自定义显示在 frontmatter 中定义的标题，日期插入日期标题。**分组**会重新排列列表：文件夹和属性分组按自身顺序排列，每个分组内的笔记遵循排序方式。',
                families: {
                    headers: '标题',
                    groups: '分组'
                },
                options: {
                    none: '不分组',
                    custom: '自定义',
                    date: '日期',
                    folder: '文件夹'
                }
            },
            alwaysShowAllTagAndPropertyPills: {
                name: '始终显示所有标签和属性标记',
                desc: '禁用时，与当前导航选择匹配的标记会被隐藏（例如，浏览“食谱”标签时，“食谱”标签标记会被隐藏）。启用后所有标记始终可见。'
            },
            stickyGroupHeaders: {
                name: '固定分组标题',
                desc: '滚动时保持当前日期、文件夹、属性或固定部分的标题可见。'
            },
            showSubfolderPaths: {
                name: '显示子文件夹路径',
                desc: '在列表窗格中按文件夹分组时，显示子文件夹路径，而不是仅显示文件夹名称。'
            },
            showGroupHeaderItemCounts: {
                name: '显示项目计数',
                desc: '在列表窗格的每个分组标题中显示项目数量。'
            },
            showCurrentFolderFilesAtBottom: {
                name: '文件夹分组：当前文件夹文件置底',
                desc: '当默认分组为文件夹时，将所选文件夹中的直属文件移到子文件夹分组下方。'
            },
            showFileIcons: {
                name: '显示文件图标',
                desc: '显示文件图标并保留左对齐间距。禁用后将移除图标和缩进。优先级：未完成任务图标 > 自定义图标 > 文件夹图标 > 文件名图标 > 文件类型图标 > 默认图标。'
            },
            useFolderIcon: {
                name: '使用文件夹图标',
                desc: '当未设置自定义文件图标时显示父文件夹图标。当未设置自定义文件颜色时使用文件夹颜色。'
            },
            showFileNameIcons: {
                name: '按文件名设置图标',
                desc: '根据文件名中的文本分配图标。'
            },
            fileNameIconMap: {
                name: '文件名图标映射',
                desc: '包含指定文本的文件将获得指定图标。每行一个映射：文本=图标',
                placeholder: '# 文本=图标\n会议=ph-calendar\n发票=ph-receipt',
                editTooltip: '编辑映射'
            },
            showFileTypeIcons: {
                name: '按文件类型设置图标',
                desc: '根据文件扩展名分配图标。'
            },
            fileTypeIconPreset: {
                name: '文件图标预设',
                desc: '选择内置图标或图标包预设。自定义扩展名规则会覆盖此预设。',
                options: {
                    builtIn: '内置图标'
                }
            },
            fileTypeIconMap: {
                name: '文件类型图标映射',
                desc: '具有指定扩展名的文件将获得指定图标。每行一个映射：扩展名=图标',
                placeholder: '# Extension=icon\ncpp=ph-file-code\npdf=ph-file-pdf',
                editTooltip: '编辑映射'
            },
            compactItemHeight: {
                name: '精简项目高度',
                desc: '设置桌面和移动端的紧凑列表项高度（像素）。',
                resetTooltip: '恢复默认值 (28px)'
            },
            compactItemHeightScaleText: {
                name: '随精简高度缩放文本',
                desc: '当减小紧凑列表项高度时同步缩放文本。'
            },
            showQuickActions: {
                name: '显示快速操作',
                desc: '悬停在文件上时显示操作按钮。按钮控件选择显示哪些操作。'
            },
            dualPane: {
                name: '双窗格布局',
                desc: '并排显示导航窗格和列表窗格。'
            },
            dualPaneOrientation: {
                name: '双窗格方向',
                desc: '双窗格启用时选择水平或垂直布局。',
                options: {
                    horizontal: '水平分割',
                    vertical: '垂直分割'
                }
            },
            narrowSidebarBehavior: {
                name: '侧边栏过窄时',
                desc: '选择导航窗格和列表窗格无法并排显示时的处理方式。',
                options: {
                    none: '不执行任何操作',
                    singlePane: '切换到单窗格',
                    vertical: '切换到垂直分割'
                }
            },
            narrowSidebarThresholdMode: {
                name: '窄侧边栏阈值',
                desc: '选择侧边栏宽度阈值的计算方式。',
                options: {
                    fitPanes: '适配窗格',
                    customWidth: '自定义宽度'
                }
            },
            narrowSidebarThresholdWidth: {
                name: '窄侧边栏阈值宽度',
                desc: '当侧边栏窄于此宽度时切换。',
                resetTooltip: '重置为默认宽度'
            },
            paneBackgroundColor: {
                name: '背景色',
                desc: '为导航窗格和列表窗格选择背景色。',
                options: {
                    separate: '分开背景',
                    listBackground: '使用列表背景',
                    navigationBackground: '使用导航背景'
                }
            },
            zoomLevel: {
                name: '缩放级别',
                desc: '控制 Notebook Navigator 的整体缩放级别（百分比）。'
            },
            useFloatingToolbarsOnIOS: {
                name: '在 iOS 上使用浮动工具栏',
                desc: '仅适用于 iOS。'
            },
            defaultStartupView: {
                name: '单窗格启动视图',
                desc: '选择在单窗格布局中打开 Notebook Navigator 时显示的窗格。',
                options: {
                    navigation: '导航窗格',
                    listPane: '列表窗格'
                }
            },
            toolbarButtons: {
                name: '工具栏按钮',
                desc: '选择在工具栏中显示哪些按钮。隐藏的按钮仍可通过命令和菜单访问。'
            },
            openNewNotesInNewTab: {
                name: '在新标签页中打开新笔记',
                desc: '启用后，“创建新笔记”命令会在新标签页中打开笔记。禁用后，笔记将替换当前标签页。'
            },
            autoRevealActiveNote: {
                name: '自动定位活动笔记',
                desc: '从快速切换器、链接或搜索打开笔记时自动显示。'
            },
            autoRevealShortestPath: {
                name: '自动显示：使用最短路径',
                desc: '启用：自动显示选择最近的可见祖先文件夹或标签。禁用：自动显示选择文件的实际文件夹和精确标签。'
            },
            autoRevealIgnoreRightSidebar: {
                name: '自动显示：忽略右侧边栏事件',
                desc: '在右侧边栏中点击或更改笔记时不更改活动笔记。'
            },
            autoRevealIgnoreOtherWindows: {
                name: '自动显示：忽略其他窗口的事件',
                desc: '在其他窗口中操作笔记时不更改活动笔记。'
            },
            singlePaneAnimation: {
                name: '单窗格动画',
                desc: '在单窗格模式下切换窗格时的过渡持续时间（毫秒）。',
                resetTooltip: '重置为默认值'
            },
            autoSelectFirstNote: {
                name: '自动选择第一个笔记',
                desc: '切换文件夹、标签或属性时自动打开第一个笔记。'
            },
            disableShortcutAutoScroll: {
                name: '禁用快捷方式自动滚动',
                desc: '点击快捷方式中的项目时不滚动导航窗格。'
            },
            expandOnSelection: {
                name: '选中时展开',
                desc: '选中时展开文件夹、标签和属性。在单窗格模式下，首次选中展开，再次选中显示文件。'
            },
            collapseOtherBranchesOnExpand: {
                name: '仅展开一个分支',
                desc: '展开文件夹、标签或属性时折叠同一树中的其他分支。'
            },
            springLoadedFolders: {
                name: '拖动时展开',
                desc: '拖动操作中悬停时展开文件夹和标签。'
            },
            springLoadedFoldersInitialDelay: {
                name: '拖动时展开：首次展开延迟',
                desc: '拖动时首次展开文件夹或标签前的延迟（秒）。'
            },
            springLoadedFoldersSubsequentDelay: {
                name: '拖动时展开：后续展开延迟',
                desc: '同一次拖动中展开更多文件夹或标签前的延迟（秒）。'
            },
            showShortcuts: {
                name: '显示快捷方式',
                desc: '在导航窗格中显示快捷方式部分。'
            },
            shortcutBadgeDisplay: {
                name: '快捷方式徽章',
                desc: '在快捷方式旁边显示的内容。使用“打开快捷方式 1-9”命令可直接打开快捷方式。',
                options: {
                    position: '位置 (1-9)',
                    count: '项目计数',
                    none: '无'
                }
            },
            showRecentFiles: {
                name: '显示最近文件',
                desc: '在导航窗格中显示最近文件部分。'
            },
            hideFileTypesFromRecentFiles: {
                name: '从最近文件中隐藏文件类型',
                desc: '选择在最近文件部分中隐藏的文件类型。',
                options: {
                    none: '无',
                    folderNotes: '文件夹笔记'
                }
            },
            recentFilesCount: {
                name: '最近文件数量',
                desc: '要显示的最近文件数量。'
            },
            pinRecentFilesWithShortcuts: {
                name: '将最近文件与快捷方式一起固定',
                desc: '固定快捷方式时包含最近文件。'
            },
            calendarPlacement: {
                name: '日历位置',
                desc: '在左侧边栏或右侧边栏中显示。',
                options: {
                    leftSidebar: '左侧边栏',
                    rightSidebar: '右侧边栏'
                }
            },
            calendarSinglePanePlacement: {
                name: '单窗格位置',
                desc: '单窗格模式下日历显示的位置。',
                options: {
                    navigationPane: '导航窗格',
                    belowPanes: '窗格下方'
                }
            },
            calendarLocale: {
                name: '日历语言',
                desc: '控制日历日期格式、周编号和每周的第一天。',
                weekPathMismatchWarning: '可见日历和周记路径使用了不同的每周起始日或周编号方式。',
                options: {
                    systemDefault: '系统默认'
                }
            },
            calendarMonthNameFormat: {
                name: '月份名称格式',
                desc: '显示完整（一月）或简称（1月）的月份名称。',
                options: {
                    full: '一月（完整）',
                    short: '1月（简称）'
                }
            },
            showInfoButtons: {
                name: '显示信息按钮',
                desc: '在搜索栏和日历标题中显示信息按钮。'
            },
            calendarLeftSidebarWeeksToShow: {
                name: '左侧边栏显示周数',
                desc: '右侧边栏的日历始终显示完整月份。',
                options: {
                    fullMonth: '完整月份',
                    oneWeek: '1 周',
                    weeksCount: '{count} 周'
                }
            },
            calendarHighlightToday: {
                name: '高亮今天日期',
                desc: '使用背景颜色和加粗文本高亮今天日期。'
            },
            calendarShowWeekNumber: {
                name: '显示周号',
                desc: '在每行开头显示周号。'
            },
            calendarShowQuarter: {
                name: '显示季度',
                desc: '在日历标题中添加季度标签。'
            },
            calendarShowOutsideMonthDays: {
                name: '显示其他月份的日期',
                desc: '当日历显示整月时，显示上个月和下个月的日期。'
            },
            calendarShowYearCalendar: {
                name: '显示年历',
                desc: '在右侧边栏中显示年份导航和月份网格。'
            },
            dailyNoteSource: {
                name: '日记来源',
                desc: '日历笔记的来源。',
                options: {
                    dailyNotes: '日记（核心插件）',
                    notebookNavigator: 'Notebook Navigator'
                },
                info: {
                    dailyNotes: '文件夹和日期格式在日记核心插件中配置。'
                }
            },
            calendarPeriodicNotesLocale: {
                name: '周期笔记语言',
                desc: '控制 Notebook Navigator 周期笔记路径中本地化的月份名称、星期名称、周号和每周起始日。',
                options: {
                    calendar: '日历',
                    obsidian: 'Obsidian'
                }
            },

            periodicNotesRootFolder: {
                name: '根文件夹（仓库配置文件）',
                desc: '周期笔记的基础文件夹。日期模式可以包含子文件夹。随所选仓库配置文件更改。',
                placeholder: '个人/日记'
            },
            templateFolderLocation: {
                name: '模板文件夹位置',
                desc: '模板文件选择器显示此文件夹中的笔记。',
                placeholder: '模板',
                usage: '模板文件夹中的模板用于日历笔记、文件夹笔记、文件夹模板和从模板新建笔记。在导航日历 > 日历集成中配置日历模板，在文件夹和文件夹笔记 > 文件夹笔记文件中配置文件夹笔记模板。'
            },
            calendarDailyNotePattern: {
                name: '日记',
                desc: '使用 Moment 日期格式设置路径。将子文件夹名称用方括号括起来，例如 [Work]/YYYY。点击模板图标设置模板。在文件操作与模板 > 模板中设置模板文件夹位置。',
                placeholder: 'YYYY/YYYYMMDD',
                parsingError: '模式必须能格式化并重新解析为完整日期（年、月、日）。'
            },
            calendarPeriodicNotePatterns: {
                momentDescPrefix: '使用 ',
                momentLinkText: 'Moment 日期格式',
                momentDescSuffix:
                    ' 设置路径。将子文件夹名称用方括号括起来，例如 [Work]/YYYY。点击模板图标设置模板。在文件操作与模板 > 模板中设置模板文件夹位置。',
                example: '当前语法：{path}'
            },
            templateEngine: {
                name: '模板引擎',
                desc: 'Notebook Navigator 创建笔记时处理模板文件的引擎。 自动模式在已安装 Templater 插件时，对包含 <% 的模板使用 Templater，其他模板使用内置引擎。',
                options: {
                    automatic: '自动',
                    builtin: 'Notebook Navigator',
                    templater: 'Templater'
                },
                templaterInstalled: 'Templater 插件：已安装',
                templaterNotInstalled: 'Templater 插件：未安装',
                templaterAutomatic: '包含 Templater 命令（<%）的模板由 Templater 处理，其他模板由内置引擎处理。',
                templaterUsage: '所有模板都由 Templater 处理。模板文件中的内置占位符不会被替换。',
                templaterMissingWarning:
                    '无法从模板创建笔记。请在{location}中将{setting}更改为{automatic}或{builtin}，或安装并启用 Templater 插件。',
                tokens: '内置占位符：{{title}}, {{folder}}, {{path}}, {{date}}, {{date:FORMAT}}, {{date+1d}}, {{time}}, {{today}}, {{now}}, {{yesterday}}, {{tomorrow}}, {{monday}} 至 {{sunday}}, {{cursor}}。写 {{!date}} 可将 {{date}} 保留为文本。',
                usage: '{{title}}、{{date}} 等模板占位符会在创建笔记时被替换。请在文件操作与模板 > 模板中配置模板引擎。'
            },
            showFolderTemplateIcons: {
                name: '显示文件夹模板图标',
                desc: '在导航窗格中用图标标记设置了自己模板的文件夹。'
            },
            templateCommands: {
                name: '命令',
                desc: '每个命令都会用自己的模板或文件夹模板创建一篇笔记并自动生成文件名。可从命令面板运行，或绑定到快捷键或按钮。',
                empty: '尚未添加命令。',
                add: '添加命令',
                edit: '编辑',
                unnamed: '未命名命令',
                locationCurrent: '当前文件夹',
                locationFolder: '指定文件夹'
            },
            folderTemplates: {
                name: '文件夹模板',
                desc: '新笔记使用其所在文件夹或最近的上级文件夹的模板。在文件夹右键菜单中设置模板。日历、日记和文件夹笔记的模板优先。',
                empty: '未设置文件夹模板。',
                scopeSubfolders: '文件夹及子文件夹',
                scopeFolder: '仅此文件夹'
            },
            calendarWeeklyNotePattern: {
                name: '周记',
                parsingError: '模式必须能格式化并重新解析为完整周（周年、周数）。',
                weekPathMismatchWarning: '周记路径使用周期笔记语言。请使用匹配的语言，或使用 "GGGG" 与 "WW" 以星期一为基准的周。',
                mixedWeekTokensWarning:
                    '此模式混用了基于星期一的周标记（"W" 或 "G"）和基于语言的周标记（"w" 或 "g"）。请始终使用同一组：以星期一为基准的周使用 "GGGG" 与 "WW"，如果周记应遵循所选语言设置，则使用 "gggg" 与 "ww"。'
            },
            calendarMonthlyNotePattern: {
                name: '月记',
                parsingError: '模式必须能格式化并重新解析为完整月份（年、月）。'
            },
            calendarQuarterlyNotePattern: {
                name: '季度笔记',
                parsingError: '模式必须能格式化并重新解析为完整季度（年、季度）。'
            },
            calendarYearlyNotePattern: {
                name: '年记',
                parsingError: '模式必须能格式化并重新解析为完整年份（年）。'
            },
            periodicNoteTemplateFile: {
                current: '模板文件：{name}'
            },
            showTooltips: {
                name: '显示工具提示',
                desc: '悬停时显示笔记和文件夹的额外信息工具提示。'
            },
            showTooltipPath: {
                name: '在工具提示中显示路径',
                desc: '在工具提示中的笔记名称下方显示文件夹路径。'
            },
            showTooltipTags: {
                name: '在工具提示中显示标签',
                desc: '启用标签部分时，在工具提示中显示笔记的标签。'
            },
            resetPaneSeparator: {
                name: '重置窗格分隔符位置',
                desc: '将导航窗格和列表窗格之间的可拖动分隔符重置为默认位置。',
                buttonText: '重置分隔符',
                notice: '分隔符位置已重置。重启 Obsidian 或重新打开 Notebook Navigator 以应用。'
            },
            importAndExportSettings: {
                name: '导入和导出设置',
                desc: '将 Notebook Navigator 设置导出或导入为 JSON。导入会替换所有设置。',
                importButtonText: '导入',
                exportButtonText: '导出',
                import: {
                    modalTitle: '导入设置',
                    fileButtonName: '从文件导入',
                    fileButtonDesc: '从磁盘加载 JSON 文件。',
                    fileButtonText: '从文件导入',
                    editorName: 'JSON',
                    editorDesc: '在下方粘贴或编辑 JSON。未包含的设置将重置为默认值。',
                    placeholder: '{\n  "folderSortOrder": "alpha-desc"\n}',
                    confirmButtonText: '导入',
                    confirmTitle: '导入设置？',
                    confirmMessage: '导入会替换当前的 Notebook Navigator 设置。',
                    backupToggleName: '导入前将当前设置保存到仓库根目录',
                    backupToggleDesc: '在仓库根目录中创建带时间戳的 JSON 文件。',
                    successWithBackupNotice: '设置已导入。之前的设置已保存到 {path}。',
                    backupError: '无法保存当前设置：{message}',
                    successNotice: '设置已导入。',
                    errorNotice: '导入设置失败：{message}',
                    fileReadError: '无法读取文件：{message}'
                },
                export: {
                    modalTitle: '导出设置',
                    editorName: 'JSON',
                    editorDesc: '仅包含与默认值不同的设置。',
                    placeholder: '{}',
                    copyButtonText: '复制到剪贴板',
                    downloadButtonText: '下载',
                    copyNotice: '设置已复制到剪贴板。',
                    downloadNotice: '设置已导出。',
                    downloadError: '下载设置失败：{message}'
                }
            },
            resetAllSettings: {
                name: '重置所有设置',
                desc: '将 Notebook Navigator 的所有设置重置为默认值。',
                buttonText: '重置所有设置',
                confirmTitle: '重置所有设置？',
                confirmMessage: '这将把 Notebook Navigator 的所有设置重置为默认值。此操作无法撤销。',
                confirmButtonText: '重置所有设置',
                notice: '所有设置已重置。重启 Obsidian 或重新打开 Notebook Navigator 以应用。',
                error: '重置设置失败。'
            },
            multiSelectModifier: {
                name: '多选修饰键',
                desc: '选择哪个修饰键切换多选模式。选择 Option/Alt 时，Cmd/Ctrl 点击会在新标签页中打开笔记。',
                options: {
                    cmdCtrl: 'Cmd/Ctrl 点击',
                    optionAlt: 'Option/Alt 点击'
                }
            },
            enterToOpenFiles: {
                name: '按 Enter 键打开文件',
                desc: '仅在列表键盘导航时按 Enter 键打开文件。在 macOS 上，这会阻止 Enter 键重命名文件。'
            },
            shiftEnterAction: {
                name: 'Shift+Enter',
                desc: '选择 Shift+Enter 是打开还是重命名所选文件。'
            },
            cmdEnterAction: {
                name: 'Cmd+Enter',
                desc: '选择 Cmd+Enter 是打开还是重命名所选文件。'
            },
            ctrlEnterAction: {
                name: 'Ctrl+Enter',
                desc: '选择 Ctrl+Enter 是打开还是重命名所选文件。'
            },
            mouseBackForwardAction: {
                name: '鼠标后退/前进按钮',
                desc: '桌面端鼠标后退和前进按钮的操作。',
                options: {
                    systemDefault: '使用系统默认',
                    singlePaneSwitch: '切换窗格（单窗格）',
                    history: '浏览历史'
                }
            },
            hideNotesWithPropertyRules: {
                name: '按属性规则隐藏笔记（仓库配置文件）',
                desc: '逗号分隔的前置元数据规则列表。使用 `key` 或 `key=value` 条目（例如：status=done, published=true, archived）。',
                placeholder: 'status=done, published=true, archived'
            },
            hideFiles: {
                name: '隐藏文件（仓库配置文件）',
                desc: '逗号分隔的文件名模式列表，用于隐藏文件。支持 * 通配符和 / 路径（例如：temp-*, *.png, /assets/*）。',
                placeholder: 'temp-*, *.png, /assets/*'
            },
            vaultProfiles: {
                name: '仓库配置文件',
                desc: '配置文件存储文件类型可见性、隐藏文件、隐藏文件夹、隐藏标签、隐藏笔记的属性规则、快捷方式和导航横幅。在此处或从导航窗格中的仓库配置文件切换器切换配置文件。',
                defaultName: '默认',
                addButton: '添加配置文件',
                editProfilesButton: '编辑配置文件',
                addProfileOption: '添加配置文件...',
                applyButton: '应用',
                deleteButton: '删除配置文件',
                addModalTitle: '添加配置文件',
                editProfilesModalTitle: '编辑配置文件',
                addModalPlaceholder: '配置文件名称',
                deleteModalTitle: '删除 {name}',
                deleteModalMessage: '删除 {name}？保存在此配置文件中的隐藏文件、文件夹、标签和基于属性的笔记过滤器将被删除。',
                moveUp: '上移',
                moveDown: '下移',
                errors: {
                    emptyName: '请输入配置文件名称',
                    duplicateName: '配置文件名称已存在'
                }
            },
            vaultProfileSwitcher: {
                name: '仓库配置文件切换器',
                desc: '选择仓库配置文件切换器显示的位置。',
                options: {
                    header: '显示在标题栏',
                    navigation: '显示在导航窗格'
                }
            },
            hideFolders: {
                name: '隐藏文件夹（仓库配置文件）',
                desc: '逗号分隔的要隐藏的文件夹列表。名称模式：assets*（以 assets 开头的文件夹），*_temp（以 _temp 结尾）。路径模式：/归档（仅根目录归档），/res*（以 res 开头的根文件夹），/*/temp（一级目录下的 temp 文件夹），/项目/*（项目内的所有文件夹）。',
                placeholder: '模板, assets*, /归档, /res*'
            },
            descendantExcludedFolders: {
                name: '从子文件夹笔记中排除文件夹（仓库配置文件）',
                desc: '逗号分隔的文件夹列表，用于在收集子文件夹中的笔记时跳过这些文件夹。文件夹仍会显示，选择该文件夹时仍会显示其中的笔记。使用与隐藏文件夹相同的模式。',
                placeholder: '日记, 资源, /归档'
            },
            showFileTypes: {
                name: '显示文件类型（仓库配置文件）',
                desc: '过滤在导航器中显示的文件类型。Obsidian 不支持的文件类型可能会在外部应用程序中打开。',
                options: {
                    documents: '文档 (.md, .canvas, .base)',
                    supported: '支持（在 Obsidian 中打开）',
                    all: '全部（可能外部打开）'
                }
            },
            propertyKeys: {
                name: '属性键（仓库配置文件）',
                desc: 'Frontmatter 属性键，可按键设置导航和文件列表的可见性。',
                addButtonTooltip: '配置属性键',
                noneConfigured: '未配置属性',
                singleConfigured: '已配置 1 个属性：{properties}',
                multipleConfigured: '已配置 {count} 个属性：{properties}'
            },
            dateFormat: {
                name: '日期格式',
                desc: '用于显示日期的格式（使用 Moment 格式）。',
                placeholder: 'YYYY年M月D日',
                help: '常用格式：\nYYYY年M月D日 = 2022年5月25日\nYYYY-MM-DD = 2022-05-25\nMM/DD/YYYY = 05/25/2022\n\n标记：\nYYYY/YY = 年\nMMMM/MMM/MM/M = 月\nDD/D = 日\ndddd/ddd = 星期',
                helpTooltip: '使用 Moment 格式',
                momentLinkText: 'Moment 格式'
            },
            timeFormat: {
                name: '时间格式',
                desc: '用于显示时间的格式（使用 Moment 格式）。',
                placeholder: 'HH:mm',
                help: '常用格式：\nHH:mm = 14:30（24小时制）\nAh:mm = 下午2:30（12小时制）\nHH:mm:ss = 14:30:45\nAh:mm:ss = 下午2:30:45\n\n标记：\nHH/H = 24小时制\nhh/h = 12小时制\nmm = 分钟\nss = 秒\nA = 上午/下午',
                helpTooltip: '使用 Moment 格式',
                momentLinkText: 'Moment 格式'
            },
            showRootFolder: {
                name: '显示根文件夹',
                desc: '在树中将仓库名称显示为根文件夹。'
            },
            showFolderIcons: {
                name: '显示文件夹图标',
                desc: '在导航窗格的文件夹旁显示图标。'
            },
            inheritFolderColors: {
                name: '继承文件夹颜色',
                desc: '子文件夹从父文件夹继承颜色。'
            },
            folderSortOrder: {
                name: '文件夹排序方式',
                desc: '右键点击任意文件夹，可为其子项设置不同的排序方式。',
                options: {
                    alphaAsc: 'A 到 Z',
                    alphaDesc: 'Z 到 A'
                }
            },
            showFileCount: {
                name: '显示文件数',
                desc: '在文件夹、标签和属性旁显示文件数量。'
            },
            showShortcutAndRecentItemIcons: {
                name: '显示快捷方式和最近项目的图标',
                desc: '在快捷方式和最近文件分区中的项目旁显示图标。'
            },
            applyColorToIconsOnly: {
                name: '仅对图标应用颜色',
                desc: '启用时，自定义颜色仅应用于图标。禁用时，颜色将同时应用于图标和文本标签。'
            },
            copyLightToDark: '将浅色模式颜色复制到深色模式', // (English: Copy light mode color to dark mode)
            collapseItems: {
                name: '折叠项目',
                desc: '选择展开/折叠全部按钮影响的内容。',
                options: {
                    all: '全部',
                    foldersOnly: '仅文件夹',
                    tagsOnly: '仅标签',
                    propertiesOnly: '仅属性'
                }
            },
            keepSelectedItemExpanded: {
                name: '保持选中项展开',
                desc: '折叠时，保持选中项及其父级展开。'
            },
            excludeVaultRootFromCollapse: {
                name: '折叠时跳过仓库根目录',
                desc: '折叠所有项目时，保持仓库根文件夹的当前状态。'
            },
            treeIndentation: {
                name: '树形缩进',
                desc: '调整嵌套文件夹、标签和属性的缩进宽度（像素）。'
            },
            navItemHeight: {
                name: '行高',
                desc: '调整导航窗格中文件夹、标签和属性的高度（像素）。'
            },
            navItemHeightScaleText: {
                name: '随行高调整文字大小',
                desc: '降低行高时减小导航文字大小。'
            },
            showIndentGuides: {
                name: '显示缩进参考线',
                desc: '显示嵌套文件夹、标签和属性的缩进参考线。'
            },
            navCountLeaderStyle: {
                name: '显示前导符',
                desc: '在项目名称和文件数量之间显示点、短划线或直线。',
                options: {
                    none: '无',
                    dots: '点 (...)',
                    dashes: '短划线 (---)',
                    line: '直线'
                }
            },
            rootItemSpacing: {
                name: '根级项目间距',
                desc: '根级文件夹、标签和属性之间的间距（像素）。'
            },
            showTags: {
                name: '显示标签',
                desc: '在导航器中显示标签部分。'
            },
            showTagIcons: {
                name: '显示标签图标',
                desc: '在导航窗格的标签旁显示图标。'
            },
            inheritTagColors: {
                name: '继承标签颜色',
                desc: '子标签从父标签继承颜色。'
            },
            tagSortOrder: {
                name: '标签排序方式',
                desc: '右键点击任意标签，可为其子项设置不同的排序方式。',
                options: {
                    alphaAsc: 'A 到 Z',
                    alphaDesc: 'Z 到 A',
                    frequency: '频率',
                    lowToHigh: '从低到高',
                    highToLow: '从高到低'
                }
            },
            showTagsFolder: {
                name: '显示标签文件夹',
                desc: '将“标签”显示为可折叠文件夹。'
            },
            showUntaggedNotes: {
                name: '显示无标签笔记',
                desc: '为没有任何标签的笔记显示“无标签”项目。'
            },
            filterTagsBySelection: {
                name: '按选择筛选标签',
                desc: '仅显示所选文件夹或属性中笔记包含的标签。'
            },
            keepEmptyTagsProperty: {
                name: '删除最后一个标签后保留 tags 属性',
                desc: '当所有标签被删除时保留 frontmatter 中的 tags 属性。禁用时，tags 属性将从 frontmatter 中删除。'
            },
            showProperties: {
                name: '显示属性',
                desc: '在导航器中显示属性部分。',
                propertyKeysInfoPrefix: '在',
                propertyKeysInfoLinkText: '通用 > 属性键',
                propertyKeysInfoSuffix: '中配置属性'
            },
            showPropertyIcons: {
                name: '显示属性图标',
                desc: '在导航窗格中属性旁边显示图标。'
            },
            inheritPropertyColors: {
                name: '继承属性颜色',
                desc: '属性值继承其属性键的颜色和背景色。'
            },
            propertySortOrder: {
                name: '属性排序方式',
                desc: '右键点击任意属性以设置其值的不同排序方式。',
                options: {
                    alphaAsc: 'A 到 Z',
                    alphaDesc: 'Z 到 A',
                    frequency: '频率',
                    lowToHigh: '从低到高',
                    highToLow: '从高到低'
                }
            },
            showPropertiesFolder: {
                name: '显示属性文件夹',
                desc: '将“属性”显示为可折叠文件夹。'
            },
            filterPropertiesBySelection: {
                name: '按选择筛选属性',
                desc: '仅显示所选文件夹或标签中笔记包含的属性。'
            },
            hideTags: {
                name: '隐藏标签（仓库配置文件）',
                desc: '逗号分隔的标签模式列表。名称模式：tag*（以指定文本开头）、*tag（以指定文本结尾）。路径模式：归档（标签及其后代）、归档/*（仅后代）、项目/*/草稿（中间通配符）。',
                placeholder: '归档*, *草稿, 项目/*/旧'
            },
            hideNotesWithTags: {
                name: '隐藏带标签的笔记（仓库配置文件）',
                desc: '逗号分隔的标签模式列表。包含匹配标签的笔记将被隐藏。名称模式：tag*（以指定文本开头）、*tag（以指定文本结尾）。路径模式：归档（标签及其后代）、归档/*（仅后代）、项目/*/草稿（中间通配符）。',
                placeholder: '归档*, *草稿, 项目/*/旧'
            },
            enableFolderNotes: {
                name: '启用文件夹笔记',
                desc: '具有匹配笔记文件的文件夹显示为可点击的链接。'
            },
            folderNoteType: {
                name: '默认文件夹笔记类型',
                desc: '从上下文菜单创建的文件夹笔记类型。',
                options: {
                    ask: '创建时询问',
                    markdown: 'Markdown',
                    canvas: 'Canvas',
                    base: 'Base'
                }
            },
            folderNoteName: {
                name: '文件夹笔记名称',
                desc: '不含扩展名的文件夹笔记名称。使用 {{folder}} 插入文件夹名称，或输入固定名称，例如 index。'
            },
            folderNoteTemplate: {
                name: '文件夹笔记模板',
                desc: '创建文件夹笔记时使用的模板文件。Markdown 模板可以使用 Templater。Canvas 和 Base 模板会作为文件内容复制。在文件操作与模板 > 模板中设置模板文件夹位置。',
                formatWarning: '模板格式必须与所选文件夹笔记类型匹配：.md、.canvas 或 .base。'
            },
            folderNamesOpenFolderNotes: {
                name: '文件夹名称打开文件夹笔记',
                desc: '点击文件夹名称会打开其文件夹笔记。关闭时，文件夹笔记仅提供文件夹元数据，例如名称、图标和颜色。'
            },
            hideFolderNoteInList: {
                name: '在列表中隐藏文件夹笔记',
                desc: '在文件列表中隐藏文件夹笔记。'
            },
            pinCreatedFolderNote: {
                name: '固定创建的文件夹笔记',
                desc: '从上下文菜单创建时固定文件夹笔记。'
            },
            folderNoteOpenLocation: {
                name: '打开文件夹笔记到',
                desc: '选择点击文件夹笔记链接时文件夹笔记的打开位置。',
                options: {
                    currentTab: '当前标签页',
                    newTab: '新标签页',
                    rightSidebar: '右侧边栏'
                }
            },
            showClosestFolderNoteInRightSidebar: {
                name: '右侧边栏：显示最近的文件夹笔记',
                desc: '选择文件夹时，右侧边栏会自动显示最近的上级文件夹笔记。'
            },
            confirmBeforeDelete: {
                name: '删除前确认',
                desc: '删除笔记或文件夹时显示确认对话框'
            },
            deleteAttachments: {
                name: '删除文件时删除附件',
                desc: '如果未在其他地方使用，则自动删除关联的附件和生成的绘图预览',
                options: {
                    ask: '每次询问',
                    always: '始终',
                    never: '从不'
                }
            },
            moveFileConflicts: {
                name: '移动冲突',
                desc: '将文件移动到已有同名文件的文件夹时。每次询问（重命名、覆盖、取消）或始终重命名。',
                options: {
                    ask: '每次询问',
                    rename: '始终重命名'
                }
            },
            metadataCleanup: {
                name: '清理元数据',
                desc: '移除在 Obsidian 外部删除、移动或重命名文件、文件夹、标签或属性时留下的孤立元数据。这仅影响 Notebook Navigator 设置文件。',
                buttonText: '清理元数据',
                error: '设置清理失败',
                loading: '正在检查元数据...',
                statusClean: '没有需要清理的元数据',
                statusCounts:
                    '孤立项目：{folders} 文件夹，{tags} 标签，{properties} 属性，{files} 文件，{pinned} 固定项，{separators} 分隔符'
            },
            rebuildCache: {
                name: '重建缓存',
                desc: '如果出现标签缺失、预览不正确或图片缺失，请使用此功能。这可能在同步冲突或意外关闭后发生。',
                buttonText: '重建缓存',
                error: '重建缓存失败',
                indexingTitle: '正在索引仓库...',
                progress: '正在更新 Notebook Navigator 缓存。'
            },
            startupDebugLogging: {
                name: 'Startup debug logging (not synced)',
                desc: 'Write startup diagnostics to a timestamped markdown file in the vault root, then stop after startup settles. The file may sync and can include file paths.'
            },
            useFrontmatterMetadata: {
                name: '使用前置元数据',
                desc: '使用前置元数据设置笔记名称、时间戳、图标和颜色'
            },
            frontmatterNameFields: {
                name: '名称字段（多个）',
                desc: '逗号分隔的前置元数据字段列表。使用第一个非空值。回退到文件名。',
                placeholder: 'title, name'
            },
            frontmatterIconField: {
                name: '图标字段',
                desc: '文件图标的前置元数据字段。留空使用存储在设置中的图标。',
                placeholder: 'icon'
            },
            frontmatterColorField: {
                name: '颜色字段',
                desc: '文件颜色的前置元数据字段。留空使用存储在设置中的颜色。',
                placeholder: 'color'
            },
            frontmatterBackgroundField: {
                name: '背景字段',
                desc: '背景颜色的前置元数据字段。留空使用存储在设置中的背景颜色。',
                placeholder: 'background'
            },
            migrateIconsAndColorsFromSettings: {
                name: '从设置迁移图标和颜色',
                desc: '存储在设置中：{icons} 个图标，{colors} 种颜色。',
                button: '迁移',
                buttonWorking: '正在迁移...',
                noticeNone: '设置中未保存任何文件图标或颜色。',
                noticeDone: '已迁移 {migratedIcons}/{icons} 个图标，{migratedColors}/{colors} 种颜色。',
                noticeFailures: '失败的条目：{failures}。',
                noticeError: '迁移失败。请检查控制台以获取详细信息。'
            },
            frontmatterCreatedField: {
                name: '创建时间戳字段',
                desc: '创建时间戳的前置元数据字段名称。留空仅使用文件系统日期。',
                placeholder: 'created'
            },
            frontmatterModifiedField: {
                name: '修改时间戳字段',
                desc: '修改时间戳的前置元数据字段名称。留空仅使用文件系统日期。',
                placeholder: 'modified'
            },
            frontmatterTimestampFormat: {
                name: '时间戳格式',
                desc: '用于解析前置元数据中时间戳的格式。留空使用 ISO 8601 解析。',
                helpTooltip: '使用 Moment 格式',
                momentLinkText: 'Moment 格式',
                help: '常用格式：\nYYYY-MM-DD[T]HH:mm:ss → 2025-01-04T14:30:45\nYYYY-MM-DD[T]HH:mm:ssZ → 2025-08-07T16:53:39+02:00\nDD/MM/YYYY HH:mm:ss → 04/01/2025 14:30:45\nMM/DD/YYYY h:mm:ss a → 01/04/2025 2:30:45 PM'
            },
            cacheStatistics: {
                localCache: '本地缓存',
                items: '项',
                withTags: '包含标签',
                withMetadata: '包含元数据'
            },
            metadataInfo: {
                successfullyParsed: '成功解析',
                itemsWithName: '个带名称的项目',
                withCreatedDate: '个带创建日期',
                withModifiedDate: '个带修改日期',
                withIcon: '个带图标',
                withColor: '个带颜色',
                failedToParse: '解析失败',
                createdDates: '个创建日期',
                modifiedDates: '个修改日期',
                checkTimestampFormat: '请检查您的时间戳格式。',
                exportFailed: '导出错误'
            }
        }
    }
};
