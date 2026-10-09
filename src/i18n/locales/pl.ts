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
 * Polish language strings for Notebook Navigator
 * Organized by feature/component for easy maintenance
 */
export const STRINGS_PL = {
    language: {
        downloading: 'Pobieranie języków…',
        continueInEnglish: 'Kontynuuj po angielsku',
        downloadFailed: 'Nie udało się pobrać języków. Notebook Navigator używa języka angielskiego.'
    },
    // Common UI elements
    common: {
        cancel: 'Anuluj', // Button text for canceling dialogs and operations (English: Cancel)
        delete: 'Usuń', // Button text for delete operations in dialogs (English: Delete)
        clear: 'Wyczyść', // Button text for clearing values (English: Clear)
        remove: 'Usuń', // Button text for remove operations in dialogs (English: Remove)
        restoreDefault: 'Przywróć domyślne', // Button text for restoring values to defaults (English: Restore default)
        submit: 'Wyślij', // Button text for submitting forms and dialogs (English: Submit)
        save: 'Zapisz', // Button text for saving settings and dialogs (English: Save)
        lightMode: 'Tryb jasny', // Label for light theme mode (English: Light mode)
        darkMode: 'Tryb ciemny', // Label for dark theme mode (English: Dark mode)
        noSelection: 'Nie wybrano', // Placeholder text when no folder or tag is selected (English: No selection)
        untagged: 'Bez tagów', // Label for notes without any tags (English: Untagged)
        unknownError: 'Nieznany błąd', // Generic fallback when an error has no message (English: Unknown error)
        clipboardWriteError: 'Nie można zapisać do schowka',
        previous: 'Poprzedni', // Generic aria label for previous navigation (English: Previous)
        next: 'Następny' // Generic aria label for next navigation (English: Next)
    },

    // List pane
    listPane: {
        emptyStateNoSelection: 'Wybierz folder lub tag, aby wyświetlić notatki', // Message shown when no folder or tag is selected (English: Select a folder or tag to view notes)
        emptyStateNoNotes: 'Brak notatek', // Message shown when a folder/tag has no notes (English: No notes)
        pinnedSection: 'Przypięte', // Header for the pinned notes section at the top of file list (English: Pinned)
        notesSection: 'Notatki', // Header shown between pinned and regular items when showing documents only (English: Notes)
        filesSection: 'Pliki', // Header shown between pinned and regular items when showing supported or all files (English: Files)
        hiddenItemAriaLabel: '{name} (ukryte)', // Accessibility label applied to list items that are normally hidden
        collapseGroup: 'Zwiń grupę',
        expandGroup: 'Rozwiń grupę',
        propertyGroupNoValue: 'Brak'
    },

    // Tag list
    tagList: {
        untaggedLabel: 'Bez tagów', // Label for the special item showing notes without tags (English: Untagged)
        tags: 'Tagi' // Label for the tags virtual folder (English: Tags)
    },

    navigationPane: {
        shortcutsHeader: 'Skróty',
        recentFilesHeader: 'Ostatnie pliki', // Header label for recent files section in navigation pane (English: Recent files)
        properties: 'Atrybuty',
        vaultRootLabel: 'Sejf',
        pinShortcuts: 'Przypnij skróty',
        pinShortcutsAndRecentFiles: 'Przypnij skróty i ostatnie pliki',
        unpinShortcuts: 'Odepnij skróty',
        unpinShortcutsAndRecentFiles: 'Odepnij skróty i ostatnie pliki',
        resizePinnedShortcuts: 'Zmień rozmiar przypiętych skrótów',
        profileMenuAria: 'Zmień profil sejfu'
    },

    navigationCalendar: {
        ariaLabel: 'Kalendarz',
        dailyNotesNotEnabled: 'Wbudowana wtyczka Dziennik jest wyłączona.',
        noteHiddenByProfile: 'Notatka kalendarza jest ukryta przez bieżący profil sejfu.',
        helpModal: {
            title: 'Skróty kalendarza',
            items: [
                'Kliknij dowolny dzień, aby otworzyć lub utworzyć dziennik. Tygodnie, miesiące, kwartały i lata działają w ten sam sposób.',
                'Wypełniona kropka pod dniem oznacza, że jest do niego dołączona notatka. Pusta kropka oznacza, że są do niego przypisane zadania do wykonania.',
                'Jeśli notatka zawiera obrazek, pojawia się on jako tło dnia.'
            ],
            dateFilterCmdCtrl: 'Kliknij datę z `Cmd/Ctrl`, aby filtrować według tej daty na liście plików.',
            dateFilterOptionAlt: 'Kliknij datę z `Option/Alt`, aby filtrować według tej daty na liście plików.'
        }
    },

    dailyNotes: {
        createFailed: 'Nie można utworzyć dziennika.'
    },

    templates: {
        invalidTokens: 'Szablon "{name}" zawiera nieprawidłowe tokeny: {tokens}',
        invalidFileNameTokens: 'Format nazwy pliku polecenia "{name}" zawiera nieprawidłowe tokeny: {tokens}',
        readFailed: 'Nie udało się odczytać szablonu "{name}". Notatka została utworzona bez niego.',
        folderNotSet: 'Ustaw folder szablonów w Operacje na plikach i szablony > Szablony, zanim utworzysz notatki na podstawie szablonów.',
        templateNotFound: 'Nie znaleziono szablonu "{name}".',
        folderNotFound: 'Nie znaleziono folderu "{name}".',
        templaterMissing: 'Wtyczka Templater nie jest zainstalowana. Zmień silnik szablonów w Operacje na plikach i szablony > Szablony.'
    },

    shortcuts: {
        folderExists: 'Folder jest już w skrótach',
        noteExists: 'Notatka jest już w skrótach',
        tagExists: 'Tag jest już w skrótach',
        propertyExists: 'Atrybut jest już w skrótach',
        invalidProperty: 'Nieprawidłowy atrybut',
        searchExists: 'Skrót wyszukiwania już istnieje',
        emptySearchQuery: 'Wprowadź wyszukiwanie przed zapisaniem',
        emptySearchName: 'Wprowadź nazwę przed zapisaniem wyszukiwania',
        add: 'Dodaj do skrótów',
        addNotesCount: 'Dodaj notatki do skrótów: {count}',
        addFilesCount: 'Dodaj pliki do skrótów: {count}',
        rename: 'Zmień nazwę skrótu',
        remove: 'Usuń ze skrótów',
        removeAll: 'Usuń wszystkie skróty',
        removeAllConfirm: 'Usunąć wszystkie skróty?',
        folderNotesPinned: 'Przypięte notatki folderu: {count}'
    },

    // Pane header
    paneHeader: {
        collapseAllFolders: 'Zwiń elementy', // Tooltip for button that collapses expanded items (English: Collapse items)
        expandAllFolders: 'Rozwiń wszystkie elementy', // Tooltip for button that expands all items (English: Expand all items)
        collapseAllListGroups: 'Zwiń wszystkie grupy listy',
        expandAllListGroups: 'Rozwiń wszystkie grupy listy',
        showCalendar: 'Pokaż kalendarz',
        hideCalendar: 'Ukryj kalendarz',
        newFolder: 'Nowy folder', // Tooltip for create new folder button (English: New folder)
        newNote: 'Nowa notatka', // Tooltip for create new note button (English: New note)
        mobileBackToNavigation: 'Wróć do nawigacji', // Mobile-only back button text to return to navigation pane (English: Back to navigation)
        changeChildSortOrder: 'Zmień kolejność sortowania',
        changeSortAndGroup: 'Zmień sortowanie i grupowanie',
        resetViewToDefaults: 'Przywróć widok do ustawień domyślnych',
        descendants: 'potomków',
        subfolders: 'podfolderów',
        subtags: 'podtagów',
        childValues: 'wartości podrzędnych',
        applySortAndGroupToDescendants: (target: string) => `Zastosuj sortowanie i grupowanie dla ${target}`,
        showFolders: 'Pokaż nawigację', // Tooltip for button to show the navigation pane (English: Show navigation)
        showExcludedItems: 'Pokaż ukryte foldery, tagi i notatki', // Tooltip for button to show hidden items (English: Show hidden items)
        hideExcludedItems: 'Ukryj ukryte foldery, tagi i notatki', // Tooltip for button to hide hidden items (English: Hide hidden items)
        showDualPane: 'Pokaż oba panele', // Tooltip for button to show dual-pane layout (English: Show dual panes)
        showSinglePane: 'Pokaż jeden panel', // Tooltip for button to show single-pane layout (English: Show single pane)
        dualPaneAutoFallbackNotice:
            'Podwójne panele są niedostępne, gdy pasek boczny jest zbyt wąski. Aby to zmienić, ustaw „Gdy pasek boczny jest zbyt wąski” na „Nic nie rób” w Ustawienia > Wygląd i zachowanie.',
        showNotesFromSubfolders: 'Pokaż notatki z podfolderów',
        showFilesFromSubfolders: 'Pokaż pliki z podfolderów',
        showNotesFromDescendants: 'Pokaż notatki z potomnych',
        showFilesFromDescendants: 'Pokaż pliki z potomnych',
        search: 'Szukaj' // Tooltip for search button (English: Search)
    },
    // Search input
    searchInput: {
        placeholder: 'Szukaj...', // Placeholder text for search input (English: Search...)
        placeholderVault: 'Szukaj w sejfie...',
        placeholderOmnisearch: 'Omnisearch...', // Placeholder text when Omnisearch provider is active (English: Omnisearch...)
        clearSearch: 'Wyczyść wyszukiwanie', // Tooltip for clear search button (English: Clear search)
        switchToFilterSearch: 'Przełącz na wyszukiwanie z filtrem',
        switchToOmnisearch: 'Przełącz na Omnisearch',
        saveSearchShortcut: 'Zapisz wyszukiwanie w skrótach',
        removeSearchShortcut: 'Usuń wyszukiwanie ze skrótów',
        shortcutModalTitle: 'Zapisz wyszukiwanie',
        shortcutNamePlaceholder: 'Wprowadź nazwę skrótu',
        shortcutStartIn: 'Zawsze rozpocznij w: {path}',
        searchHelp: 'Składnia wyszukiwania',
        searchHelpTitle: 'Składnia wyszukiwania',
        searchHelpModal: {
            intro: 'Wyszukiwanie z filtrem znajduje notatki według nazw wyświetlanych, aliasów, atrybutów, tagów, dat i filtrów, połączonych w jednym zapytaniu (np. `meeting .status=active #work @thisweek`). Kliknij ikonę gwiazdki, aby zapisać wyszukiwanie w skrótach.',
            introInstallOmnisearch: 'Wyszukiwanie pełnotekstowe w treści notatek wymaga wtyczki Omnisearch.',
            introSwitching:
                'Przełączaj się między wyszukiwaniem z filtrem a Omnisearch za pomocą strzałek w górę i w dół lub klikając ikonę wyszukiwania.',
            activeFilterSearch: 'Wyszukiwanie z filtrem jest aktywne.',
            activeOmnisearch: 'Omnisearch jest aktywny.',
            omnisearchIntro:
                'Omnisearch wykonuje wyszukiwanie pełnotekstowe w treści notatek w całym sejfie. Notebook Navigator pokazuje dopasowania należące do bieżącego folderu, tagu lub wybranych elementów.',
            sections: {
                fileNames: {
                    title: 'Nazwy plików i aliasy',
                    items: [
                        '`word` Dopasuj notatki ze słowem "word" w nazwie wyświetlanej lub aliasie.',
                        '`word1 word2` Każde słowo musi występować w nazwie wyświetlanej lub aliasach.',
                        '`-word` Wyklucz notatki zawierające słowo "word" w nazwie wyświetlanej lub aliasie.',
                        '`"text"` Dopasuj tekst dosłownie; fraza rozpoczynająca się od cudzysłowu nigdy nie jest interpretowana jako tag, atrybut, data ani filtr (na przykład: `".F"`).',
                        '`-"text"` Wyklucz notatki zawierające dosłowny tekst w nazwie wyświetlanej lub aliasie.'
                    ]
                },
                tags: {
                    title: 'Tagi',
                    items: [
                        '`#tag` Uwzględnij notatki z tagiem (pasuje również do zagnieżdżonych tagów, takich jak `#tag/subtag`).',
                        '`#` Uwzględnij tylko otagowane notatki.',
                        '`-#tag` Wyklucz notatki z tym tagiem.',
                        '`-#` Uwzględnij tylko nieotagowane notatki.',
                        '`#tag1 #tag2` Znajdź oba tagi (niejawne AND).',
                        '`#tag1 AND #tag2` Znajdź oba tagi (jawne AND).',
                        '`#tag1 OR #tag2` Znajdź którykolwiek z tagów.',
                        '`#a OR #b AND #c` AND ma wyższy priorytet: pasuje do `#a` lub zarówno do `#b`, jak i do `#c`.',
                        'Kliknij tag z Cmd/Ctrl, aby dodać go operatorem AND. Kliknij tag z Cmd/Ctrl+Shift, aby dodać go operatorem OR.'
                    ]
                },
                properties: {
                    title: 'Atrybuty',
                    items: [
                        '`.key` Uwzględnij notatki z kluczem atrybutu zaczynającym się od `key`.',
                        '`.key=value` Uwzględnij notatki, których wartość atrybutu zawiera `value`.',
                        '`."Reading Status"` Uwzględnij notatki z atrybutem zawierającym spacje.',
                        '`."Reading Status"="In Progress"` Atrybuty i ich wartości ze spacjami muszą być w podwójnych cudzysłowach.',
                        '`-.key` Wyklucz notatki z kluczem atrybutu zaczynającym się od `key`.',
                        '`-.key=value` Wyklucz notatki, których wartość atrybutu zawiera `value`.',
                        'Kliknij atrybut z Cmd/Ctrl, aby dodać go operatorem AND. Kliknij atrybut z Cmd/Ctrl+Shift, aby dodać go operatorem OR.'
                    ]
                },
                tasks: {
                    title: 'Filtry',
                    items: [
                        '`folder:meetings` Uwzględnij notatki z folderu o nazwie `meetings`.',
                        '`folder:/work/meetings` Uwzględnij notatki tylko z `work/meetings` (bez podfolderów).',
                        '`folder:/` Uwzględnij notatki tylko z folderu głównego sejfu.',
                        '`-folder:archive` Wyklucz notatki z folderu o nazwie `archive`.',
                        '`-folder:/archive` Wyklucz notatki tylko z `archive` (bez podfolderów).',
                        '`ext:md` Uwzględnij notatki z rozszerzeniem `md` (`ext:.md` jest również obsługiwane).',
                        '`-ext:pdf` Wyklucz notatki z rozszerzeniem `pdf`.',
                        'Łącz z tagami, nazwami i datami (na przykład: `folder:/work/meetings ext:md @thisweek`).'
                    ]
                },
                connectors: {
                    title: 'Zachowanie AND/OR',
                    items: [
                        '`AND` i `OR` są operatorami tylko w zapytaniach zawierających wyłącznie tagi i atrybuty.',
                        'Zapytania zawierające wyłącznie tagi i atrybuty mają tylko filtry tagów i atrybutów: `#tag`, `-#tag`, `#`, `-#`, `.key`, `-.key`, `.key=value`, `-.key=value`.',
                        'Jeśli zapytanie zawiera nazwy, daty (`@...`), filtry folderów (`folder:...`) lub filtry rozszerzeń (`ext:...`), `AND` i `OR` są dopasowywane jako słowa.',
                        'Przykładowe zapytanie z operatorem: `#work OR .status=started`.',
                        'Przykładowe zapytanie mieszane: `#work OR ext:md` (`OR` jest wyszukiwane w nazwach plików).'
                    ]
                },
                dates: {
                    title: 'Daty',
                    items: [
                        '`@today` Znajdź dzisiejsze notatki, korzystając z domyślnego pola daty.',
                        '`@yesterday`, `@last7d`, `@last30d`, `@thisweek`, `@thismonth` Względne zakresy dat.',
                        '`@2026-02-07` Znajdź konkretny dzień (obsługuje też `@20260207`).',
                        '`@2026` Znajdź rok kalendarzowy.',
                        '`@2026-02` lub `@202602` Znajdź miesiąc kalendarzowy.',
                        '`@2026-W05` lub `@2026W05` Znajdź tydzień ISO.',
                        '`@2026-Q2` lub `@2026Q2` Znajdź kwartał kalendarzowy.',
                        '`@13/02/2026` Formaty numeryczne z separatorami (`@07022026` jest zgodny z ustawieniami regionalnymi, w razie niejednoznaczności).',
                        '`@2026-02-01..2026-02-07` Znajdź zakres dat włącznie z dniami granicznymi (obsługiwane są daty bez początku lub końca).',
                        '`@c:...` lub `@m:...` Wyszukaj według daty utworzenia lub modyfikacji.',
                        '`-@...` Wyklucz dopasowanie daty.'
                    ]
                },
                omnisearch: {
                    title: 'Omnisearch',
                    items: [
                        'Zapytanie jest wysyłane do wtyczki Omnisearch i podlega składni zapytań Omnisearch. Tokeny wyszukiwania z filtrem, takie jak `#tag`, `.property` i `@date`, nie mają specjalnego znaczenia.',
                        'Gdy wybrany jest folder, do zapytania dołączane jest `path:"<folder>/"`, dzięki czemu Omnisearch dopasowuje wyniki w tym folderze i jego podfolderach. Zapytania zawierające już `path:` są wysyłane bez zmian.',
                        'Omnisearch zwraca maksymalnie 50 wyników uporządkowanych według trafności. Wyszukiwania z większą liczbą dopasowań pomijają notatki o niższej trafności.',
                        'Ograniczenie wyszukiwania do ścieżek folderów zawierających znaki spoza ASCII wymaga Omnisearch w wersji 1.30.0 lub nowszej. Starsze wersje przeszukują cały sejf, a wyniki są następnie filtrowane do folderu.',
                        'Zapytania krótsze niż 3 znaki mogą działać wolno w dużych sejfach.'
                    ]
                }
            }
        }
    },

    // Context menus
    contextMenu: {
        file: {
            openInNewTab: 'Otwórz w nowej karcie',
            openToRight: 'Otwórz po prawej',
            openInNewWindow: 'Otwórz w nowym oknie',
            openMultipleInNewTabs: 'Otwórz notatki w nowych kartach: {count}',
            openMultipleFilesInNewTabs: 'Otwórz pliki w nowych kartach: {count}',
            openMultipleToRight: 'Otwórz notatki po prawej: {count}',
            openMultipleFilesToRight: 'Otwórz pliki po prawej: {count}',
            openMultipleInNewWindows: 'Otwórz notatki w nowych oknach: {count}',
            openMultipleFilesInNewWindows: 'Otwórz pliki w nowych oknach: {count}',
            pinNote: 'Przypnij notatkę',
            pinFile: 'Przypnij plik',
            unpinNote: 'Odepnij notatkę',
            unpinFile: 'Odepnij plik',
            pinMultipleNotes: 'Przypnij notatki: {count}',
            pinMultipleFiles: 'Przypnij pliki: {count}',
            unpinMultipleNotes: 'Odepnij notatki: {count}',
            unpinMultipleFiles: 'Odepnij pliki: {count}',
            duplicateNote: 'Duplikuj notatkę',
            duplicateFile: 'Duplikuj plik',
            duplicateMultipleNotes: 'Duplikuj notatki: {count}',
            duplicateMultipleFiles: 'Duplikuj pliki: {count}',
            openVersionHistory: 'Otwórz historię wersji',
            revealInFolder: 'Pokaż w folderze',
            revealInFinder: 'Pokaż w Finderze',
            showInExplorer: 'Pokaż w eksploratorze systemowym',
            openInDefaultApp: 'Otwórz w domyślnej aplikacji',
            renameNote: 'Zmień nazwę notatki',
            renameFile: 'Zmień nazwę pliku',
            deleteNote: 'Usuń notatkę',
            deleteFile: 'Usuń plik',
            deleteMultipleNotes: 'Usuń notatki: {count}',
            deleteMultipleFiles: 'Usuń pliki: {count}',
            moveNoteToFolder: 'Przenieś notatkę do...',
            moveFileToFolder: 'Przenieś plik do...',
            moveMultipleNotesToFolder: 'Przenieś notatki ({count}) do...',
            moveMultipleFilesToFolder: 'Przenieś pliki ({count}) do...',
            mergeNotes: 'Scal notatki ({count})...',
            mergeNotesInGroup: 'Scal notatki w grupie...',
            addTag: 'Dodaj tag',
            addPropertyKey: 'Ustaw atrybut',
            removeTag: 'Usuń tag',
            removeAllTags: 'Usuń wszystkie tagi',
            changeIcon: 'Zmień ikonkę',
            changeColor: 'Zmień kolor'
        },
        folder: {
            newNote: 'Nowa notatka',
            newNoteFromTemplate: 'Nowa notatka na podstawie szablonu',
            newFolder: 'Nowy folder',
            newCanvas: 'Nowa tablica',
            newBase: 'Nowa baza danych',
            newDrawing: 'Nowy rysunek',
            newExcalidrawDrawing: 'Nowy rysunek Excalidraw',
            newTldrawDrawing: 'Nowy rysunek Tldraw',
            duplicateFolder: 'Duplikuj folder',
            searchInFolder: 'Szukaj w folderze',
            createFolderNote: 'Utwórz notatkę folderu',
            setFolderTemplate: 'Ustaw szablon folderu...',
            changeFolderTemplate: 'Zmień szablon folderu...',
            removeFolderTemplate: 'Usuń szablon folderu',
            detachFolderNote: 'Odłącz notatkę folderu',
            deleteFolderNote: 'Usuń notatkę folderu',
            changeIcon: 'Zmień ikonkę',
            changeColor: 'Zmień kolor',
            changeBackground: 'Zmień tło',
            excludeFolder: 'Ukryj folder',
            unhideFolder: 'Pokaż folder',
            hideRootFolder: 'Ukryj folder główny',
            showRootFolder: 'Pokaż folder główny',
            excludeFromDescendants: 'Ukryj w folderach nadrzędnych',
            includeInDescendants: 'Pokaż w folderach nadrzędnych',
            hiddenFromParentsIndicator: 'Ukryte na listach folderów nadrzędnych',
            moveFolder: 'Przenieś folder do...',
            renameFolder: 'Zmień nazwę folderu',
            deleteFolder: 'Usuń folder'
        },
        tag: {
            changeIcon: 'Zmień ikonkę',
            changeColor: 'Zmień kolor',
            changeBackground: 'Zmień tło',
            showTag: 'Pokaż tag',
            hideTag: 'Ukryj tag'
        },
        property: {
            addKey: 'Konfiguruj klucze atrybutów',
            renameKey: 'Zmień nazwę atrybutu',
            deleteKey: 'Usuń atrybut'
        },
        navigation: {
            addSeparator: 'Dodaj separator',
            removeSeparator: 'Usuń separator'
        },
        copy: {
            title: 'Kopiuj',
            noteLink: 'link do notatki',
            fileLink: 'link do pliku',
            noteLinkAsFootnote: 'link do notatki jako przypis',
            fileLinkAsFootnote: 'link do pliku jako przypis',
            noteEmbed: 'osadzenie notatki',
            fileEmbed: 'osadzenie pliku',
            obsidianUrl: 'adres URL Obsidian',
            pathFromVaultFolder: 'ścieżka z folderu sejfu',
            pathFromSystemRoot: 'ścieżka z katalogu głównego systemu'
        },
        style: {
            title: 'Styl',
            copy: 'Kopiuj styl',
            paste: 'Wklej styl',
            removeIcon: 'Usuń ikonkę',
            removeColor: 'Usuń kolor',
            removeBackground: 'Usuń tło',
            clear: 'Wyczyść styl'
        }
    },

    // Folder appearance menu
    folderAppearance: {
        sortBy: 'Sortuj według',
        defaultSuffix: '(domyślne)',
        defaultLabel: 'Domyślne',
        groupBy: 'Grupuj według'
    },

    // Modal dialogs
    modals: {
        bulkApply: {
            applyButton: 'Zastosuj',
            applySortAndGroupTitle: (target: string) => `Zastosuj sortowanie i grupowanie dla ${target}?`,
            affectedCountMessage: (count: number) => `Istniejące nadpisania do zmiany: ${count}.`
        },
        mergeNotes: {
            title: 'Scal notatki',
            summary: 'Utwórz jedną notatkę z {count} notatek w {folder}.',
            frontmatterRule: 'Frontmatter z pierwszej notatki zostaje zachowany. Frontmatter z pozostałych notatek zostaje usunięty.',
            crossFolderWarning:
                'Notatki źródłowe znajdują się w różnych folderach. Linki względne i osadzenia mogą przestać działać w scalonej notatce.',
            outputName: 'Nazwa wyjściowa',
            outputNameDesc: 'Scalona notatka zostanie utworzona w folderze pokazanym powyżej.',
            outputNamePlaceholder: 'Scalone notatki',
            separator: 'Separator',
            separatorDesc: 'Wstawiany między notatkami.',
            separatorOptions: {
                none: 'Brak',
                blankLine: 'Pusty wiersz',
                horizontalRule: 'Linia pozioma',
                heading: 'Nagłówek z tytułem notatki'
            },
            moveSourcesToTrash: 'Przenieś notatki źródłowe do kosza po scaleniu',
            mergeButton: 'Scal'
        },
        iconPicker: {
            searchPlaceholder: 'Wyszukaj ikonki...',
            recentlyUsedHeader: 'Ostatnio używane',
            emptyStateSearch: 'Zacznij pisać, aby wyszukać ikonki',
            emptyStateNoResults: 'Nie znaleziono ikonek',
            showingResultsInfo: 'Wyświetlono 50 wyników z {count}. Wpisz więcej, aby zawęzić wyniki.',
            emojiInstructions: 'Wpisz lub wklej dowolną emotkę, aby użyć jej jako ikonki',
            removeIcon: 'Usuń ikonkę',
            removeFromRecents: 'Usuń z ostatnich',
            allTabLabel: 'Wszystkie'
        },
        fileIconRuleEditor: {
            addRuleAria: 'Dodaj regułę'
        },
        colorPicker: {
            currentColor: 'Aktywny',
            newColor: 'Nowy',
            paletteDefault: 'Domyślne',
            paletteCustom: 'Własne',
            copyColors: 'Kopiuj kolor',
            colorsCopied: 'Kolor skopiowany do schowka',
            pasteColors: 'Wklej kolor',
            pasteClipboardError: 'Nie można odczytać schowka',
            pasteInvalidFormat: 'Oczekiwano wartości koloru hex',
            colorsPasted: 'Kolor wklejony pomyślnie',
            resetUserColors: 'Wyczyść kolory niestandardowe',
            clearCustomColorsConfirm: 'Usunąć wszystkie kolory niestandardowe?',
            userColorSlot: 'Kolor {slot}',
            recentColors: 'Ostatnio używane kolory',
            clearRecentColors: 'Wyczyść ostatnie kolory',
            removeRecentColor: 'Usuń kolor',
            apply: 'Zastosuj',
            pickerLabel: 'Selektor',
            hexLabel: 'HEX',
            hexInputLabel: 'Wartość koloru HEX',
            saturationValueArea: 'Nasycenie i jasność',
            hueSlider: 'Odcień',
            alphaSlider: 'Przezroczystość'
        },
        appearance: {
            tabIcon: 'Ikona',
            tabColor: 'Kolor',
            tabBackground: 'Tło',
            resetIcon: 'Usuń ikonkę',
            resetColor: 'Usuń kolor',
            resetBackground: 'Usuń tło',
            clear: 'Wyczyść styl',
            apply: 'Zastosuj'
        },
        selectVaultProfile: {
            title: 'Zmień profil sejfu',
            currentBadge: 'Aktywny',
            emptyState: 'Brak dostępnych profili sejfu.'
        },
        tagOperation: {
            renameTitle: 'Zmień nazwę tagu {tag}',
            deleteTitle: 'Usuń tag {tag}',
            newTagPrompt: 'Nowa nazwa tagu',
            newTagPlaceholder: 'Wprowadź nową nazwę tagu',
            renameWarning: 'Zmiana nazwy tagu {oldTag} zmodyfikuje {files}: {count}.',
            deleteWarning: 'Usunięcie tagu {tag} zmodyfikuje {files}: {count}.',
            modificationWarning: 'Spowoduje to aktualizację dat modyfikacji plików.',
            affectedFiles: 'Pliki, na które to wpłynie:',
            andMore: '…i jeszcze {count}',
            confirmRename: 'Zmień nazwę tagu',
            renameUnchanged: '{tag} bez zmian',
            renameNoChanges: '{oldTag} → {newTag} ({countLabel})',
            renameBatchNotFinalized:
                'Zmieniono nazwę {renamed}/{total}. Nie zaktualizowano: {notUpdated}. Metadane i skróty nie zostały zaktualizowane.',
            invalidTagName: 'Wprowadź prawidłową nazwę tagu.',
            descendantRenameError: 'Nie można przenieść do tego samego lub podrzędnego tagu.',
            confirmDelete: 'Usuń tag',
            deleteBatchNotFinalized:
                'Usunięto z {removed}/{total}. Nie zaktualizowano: {notUpdated}. Metadane i skróty nie zostały zaktualizowane.',
            checkConsoleForDetails: 'Sprawdź konsolę, aby uzyskać szczegóły.',
            file: 'plik',
            files: 'pliki',
            inlineParsingWarning: {
                title: 'Zgodność tagów w treści',
                message:
                    '{tag} zawiera znaki, których Obsidian nie może przetworzyć w tagach w treści. Nie ma to wpływu na tagi w atrybutach.',
                confirm: 'Użyj mimo to'
            }
        },
        propertyOperation: {
            renameTitle: 'Zmień nazwę atrybutu {property}',
            deleteTitle: 'Usuń atrybut {property}',
            newKeyPrompt: 'Nowa nazwa atrybutu',
            newKeyPlaceholder: 'Wprowadź nową nazwę atrybutu',
            renameWarning: 'Zmiana nazwy atrybutu {property} zmodyfikuje {files}: {count}.',
            renameConflictWarning:
                'Atrybut {newKey} już istnieje ({files}: {count}). Zmiana nazwy {oldKey} zastąpi istniejące wartości {newKey}.',
            deleteWarning: 'Usunięcie atrybutu {property} zmodyfikuje {files}: {count}.',
            confirmRename: 'Zmień nazwę atrybutu',
            confirmDelete: 'Usuń atrybut',
            renameNoChanges: '{oldKey} → {newKey} (bez zmian)',
            renameSettingsUpdateFailed: 'Zmieniono nazwę atrybutu {oldKey} → {newKey}. Nie udało się zaktualizować ustawień.',
            deleteSingleSuccess: 'Usunięto atrybut {property} z 1 notatki',
            deleteMultipleSuccess: 'Usunięto atrybut {property} z {count} notatek',
            deleteSettingsUpdateFailed: 'Usunięto atrybut {property}. Nie udało się zaktualizować ustawień.',
            invalidKeyName: 'Wprowadź prawidłową nazwę atrybutu.'
        },
        fileSystem: {
            newFolderTitle: 'Nowy folder',
            renameFolderTitle: 'Zmień nazwę folderu',
            renameFileTitle: 'Zmień nazwę pliku',
            deleteFolderTitle: "Usunąć '{name}'?",
            deleteFileTitle: "Usunąć '{name}'?",
            deleteFileAttachmentsTitle: 'Usunąć załączniki pliku?',
            moveFileConflictTitle: 'Konflikt przenoszenia',
            folderNamePrompt: 'Wprowadź nazwę folderu:',
            hideInOtherVaultProfiles: 'Ukryj w innych profilach sejfu',
            renamePrompt: 'Wprowadź nową nazwę:',
            renameVaultTitle: 'Zmień widoczną nazwę sejfu',
            renameVaultPrompt: 'Wprowadź niestandardową nazwę (pozostaw puste, aby użyć nazwy domyślnej):',
            deleteFolderConfirm: 'Czy na pewno chcesz usunąć ten folder i całą jego zawartość?',
            deleteFileConfirm: 'Czy na pewno chcesz usunąć ten plik?',
            deleteFileAttachmentsDescriptionSingle: 'Ten załącznik nie jest już używany w żadnej notatce. Czy chcesz go usunąć?',
            deleteFileAttachmentsDescriptionMultiple: 'Te załączniki nie są już używane w żadnej notatce. Czy chcesz je usunąć?',
            deleteFileAttachmentsViewFileTreeAriaLabel: 'Drzewo plików',
            deleteFileAttachmentsViewGalleryAriaLabel: 'Galeria',
            moveFileConflictDescriptionSingle: 'Znaleziono konflikt pliku w „{folder}”.',
            moveFileConflictDescriptionMultiple: 'Znaleziono konflikty plików ({count}) w „{folder}”.',
            moveFileConflictAffectedFiles: 'Dotknięte pliki',
            moveFileConflictItem: '„{name}” → „{suggested}”{renameOnly}',
            moveFileConflictRenameOnly: '(tylko zmiana nazwy)',
            moveFileConflictRename: 'Zmień nazwę',
            moveFileConflictOverwrite: 'Nadpisz',
            removeAllTagsTitle: 'Usuń wszystkie tagi',
            removeAllTagsFromNote: 'Czy na pewno chcesz usunąć wszystkie tagi z tej notatki?',
            removeAllTagsFromNotes: 'Czy na pewno chcesz usunąć wszystkie tagi z {count} notatek?'
        },
        folderNoteType: {
            title: 'Wybierz typ notatki folderu',
            folderLabel: 'Folder: {name}'
        },
        folderSuggest: {
            placeholder: (name: string) => `Przenieś ${name} do folderu...`,
            multipleFilesLabel: (count: number) =>
                `${count} ${count === 1 ? 'plik' : count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 12 || count % 100 > 14) ? 'pliki' : 'plików'}`,
            navigatePlaceholder: 'Przejdź do folderu...',
            instructions: {
                navigate: 'aby przejść',
                move: 'aby przenieść',
                select: 'aby wybrać',
                dismiss: 'aby anulować'
            }
        },
        templateCommand: {
            titleAdd: 'Dodaj polecenie',
            titleEdit: 'Edytuj polecenie',
            name: 'Nazwa polecenia',
            namePlaceholder: 'Nowa notatka ze spotkania',
            template: 'Szablon',
            templateDesc: 'Opcjonalne. Bez szablonu stosowany jest szablon folderu docelowego, jeśli jest ustawiony.',
            templatePlaceholder: 'Szablony/Spotkanie.md',
            fileNameFormat: 'Format nazwy pliku',
            fileNameFormatDesc:
                'Tokeny takie jak {{date:YYYYMMDD}} i {{prompt:Tytuł}} są zastępowane podczas uruchamiania polecenia. Każdy monit pyta o wartość, a ta sama etykieta w szablonie otrzymuje tę samą wartość. {{number}} jest o jeden większy od najwyższego numeru używanego przez notatki w folderze o tym samym wzorcu nazwy, a {{number:00}} uzupełnia go zerami. Szablon również może używać {{number}}, a {{title}} wstawia wygenerowaną nazwę pliku.',
            fileNameFormatPlaceholder: '{{date:YYYYMMDD}} {{prompt:Tytuł}}',
            location: 'Lokalizacja',
            folder: 'Folder',
            folderPlaceholder: 'Spotkania',
            icon: 'Ikona',
            placement: 'Przycisk',
            placementNone: 'Brak',
            placementRibbon: 'Wstążka',
            placementTabBar: 'Pasek kart'
        },
        templateFile: {
            placeholder: 'Wyszukaj szablony...',
            instructions: {
                navigate: 'aby przejść',
                select: 'aby wybrać szablon',
                dismiss: 'aby anulować'
            }
        },
        tagSuggest: {
            navigatePlaceholder: 'Przejdź do tagu...',
            addPlaceholder: 'Wyszukaj tag, który chcesz dodać...',
            removePlaceholder: 'Wybierz tag do usunięcia...',
            createNewTag: 'Utwórz nowy tag: #{tag}',
            instructions: {
                navigate: 'aby przejść',
                select: 'aby wybrać',
                dismiss: 'aby anulować',
                add: 'aby dodać tag',
                remove: 'aby usunąć tag'
            }
        },
        propertySuggest: {
            placeholder: 'Wybierz atrybut...',
            navigatePlaceholder: 'Przejdź do atrybutu...',
            instructions: {
                navigate: 'aby nawigować',
                select: 'aby dodać atrybut',
                dismiss: 'aby anulować'
            }
        },
        propertyKeyVisibility: {
            title: 'Widoczność kluczy atrybutów',
            description:
                'Kontroluj, gdzie wyświetlane są wartości atrybutów. Kolumny odpowiadają panelowi nawigacji, panelowi listy i menu kontekstowemu pliku. Użyj dolnego wiersza, aby przełączyć wszystkie wiersze w kolumnie.',
            searchPlaceholder: 'Szukaj kluczy atrybutów...',
            propertyColumnLabel: 'Atrybut',
            showInNavigation: 'Pokaż w nawigacji',
            showInList: 'Pokaż na liście',
            showInFileMenu: 'Pokaż w menu pliku',
            toggleAllInNavigation: 'Przełącz wszystkie w nawigacji',
            toggleAllInList: 'Przełącz wszystkie na liście',
            toggleAllInFileMenu: 'Przełącz wszystkie w menu pliku',
            applyButton: 'Zastosuj',
            emptyState: 'Nie znaleziono kluczy atrybutów.'
        }
    },

    // File system operations
    fileSystem: {
        errors: {
            createFolder: 'Nie udało się utworzyć folderu: {error}',
            createFile: 'Nie udało się utworzyć pliku: {error}',
            renameFolder: 'Nie udało się zmienić nazwy folderu: {error}',
            renameFolderNoteConflict: 'Nie można zmienić nazwy: "{name}" już istnieje w tym folderze',
            renameFile: 'Nie udało się zmienić nazwy pliku: {error}',
            deleteFolder: 'Nie udało się usunąć folderu: {error}',
            deleteFile: 'Nie udało się usunąć pliku: {error}',
            deleteAttachments: 'Nie udało się usunąć załączników: {error}',
            mergeNotes: 'Nie udało się scalić notatek: {error}',
            mergeNotesOpenOutput:
                'Scalona notatka została utworzona jako {name}, ale nie można jej otworzyć: {error}. Notatki źródłowe nie zostały zmienione.',
            mergeNotesOpenSkipped: 'Inne żądanie otwarcia pliku miało pierwszeństwo.',
            mergeNotesTrashSources: 'Utworzono scaloną notatkę. Nie udało się przenieść notatek źródłowych ({count}) do kosza.',
            duplicateNote: 'Nie udało się zduplikować notatki: {error}',
            duplicateFolder: 'Nie udało się zduplikować folderu: {error}',
            openVersionHistory: 'Nie udało się otworzyć historii wersji: {error}',
            versionHistoryNotFound: 'Nie znaleziono polecenia historii wersji. Upewnij się, że Obsidian Sync jest włączony.',
            revealInExplorer: 'Nie udało się pokazać pliku w eksploratorze systemowym: {error}',
            openInDefaultApp: 'Nie udało się otworzyć w domyślnej aplikacji: {error}',
            openInDefaultAppNotAvailable: 'Otwieranie w domyślnej aplikacji nie jest dostępne na tej platformie',
            folderNoteAlreadyExists: 'Notatka folderu już istnieje',
            folderAlreadyExists: 'Folder "{name}" już istnieje',
            folderNotesDisabled: 'Włącz notatki folderu w ustawieniach, aby przekształcić pliki',
            folderNoteAlreadyLinked: 'Ten plik pełni już funkcję notatki folderu',
            folderNoteNotFound: 'Brak notatki folderu w wybranym folderze',
            folderNoteUnsupportedExtension: 'Nieobsługiwane rozszerzenie pliku: {extension}',
            folderNoteMoveFailed: 'Nie udało się przenieść pliku podczas konwersji: {error}',
            folderNoteRenameConflict: 'Plik o nazwie "{name}" już istnieje w folderze',
            folderNoteConversionFailed: 'Nie udało się przekształcić pliku na notatkę folderu',
            folderNoteConversionFailedWithReason: 'Nie udało się przekształcić pliku na notatkę folderu: {error}',
            folderNoteOpenFailed: 'Przekształcono plik, ale nie udało się otworzyć notatki folderu: {error}',
            failedToDeleteFile: 'Nie udało się usunąć {name}: {error}',
            failedToDeleteMultipleFiles: 'Nie udało się usunąć plików: {count}',
            versionHistoryNotAvailable: 'Historia wersji nie jest dostępna',
            drawingAlreadyExists: 'Rysunek o tej nazwie już istnieje',
            failedToCreateDrawing: 'Nie udało się utworzyć rysunku',
            noFolderSelected: 'Żaden folder nie jest wybrany w Notebook Navigator',
            noFileSelected: 'Żaden plik nie jest wybrany'
        },
        warnings: {
            linkBreakingNameCharacters: 'Ta nazwa zawiera znaki, które psują linki Obsidian: #, |, ^, %%, [[, ]].',
            forbiddenNameCharactersAllPlatforms: 'Nazwy nie mogą zaczynać się od kropki ani zawierać : lub /.',
            forbiddenNameCharactersWindows: 'Znaki zarezerwowane przez system Windows są niedozwolone: <, >, ", \\, |, ?, *.'
        },
        notices: {
            folderExcludedFromDescendants: 'Ukryte na listach folderów nadrzędnych: {name}',
            folderIncludedInDescendants: 'Pokazane na listach folderów nadrzędnych: {name}',
            mergeNotes: 'Scalono notatki ({count}) w {name}'
        },
        notifications: {
            deletedMultipleFiles: 'Usunięto pliki: {count}',
            movedMultipleFiles: 'Przeniesiono pliki ({count}) do {folder}',
            folderNoteConversionSuccess: 'Przekształcono plik na notatkę folderu w "{name}"',
            folderMoved: 'Przeniesiono folder "{name}"',
            deepLinkCopied: 'Adres URL Obsidian skopiowany do schowka',
            pathCopied: 'Ścieżka skopiowana do schowka',
            relativePathCopied: 'Ścieżka względna skopiowana do schowka',
            linkCopied: 'Link skopiowany do schowka',
            footnoteLinkCopied: 'Link przypisu skopiowany do schowka',
            embedLinkCopied: 'Link osadzenia skopiowany do schowka',
            tagAddedToNote: 'Dodano tag do 1 notatki',
            tagAddedToNotes: 'Dodano tag do wielu ({count}) notatek',
            tagRemovedFromNote: 'Usunięto tag z 1 notatki',
            tagRemovedFromNotes: 'Usunięto tag z wielu ({count}) notatek',
            tagsClearedFromNote: 'Wyczyszczono wszystkie tagi z 1 notatki',
            tagsClearedFromNotes: 'Wyczyszczono wszystkie tagi z wielu ({count}) notatek',
            noTagsToRemove: 'Brak tagów do usunięcia',
            noFilesSelected: 'Nie wybrano plików',
            mergeNotesRequireMultipleMarkdown: 'Wybierz co najmniej dwie notatki Markdown do scalenia',
            tagOperationsNotAvailable: 'Operacje na tagach niedostępne',
            propertyOperationsNotAvailable: 'Operacje na atrybutach niedostępne',
            tagsRequireMarkdown: 'Tagi są obsługiwane tylko w notatkach Markdown',
            propertiesRequireMarkdown: 'Atrybuty są obsługiwane tylko w notatkach Markdown',
            propertySetOnNote: 'Zaktualizowano atrybut w 1 notatce',
            propertySetOnNotes: 'Zaktualizowano atrybut w wielu ({count}) notatkach',
            hiddenFileReveal: 'Plik jest ukryty. Aby go wyświetlić, włącz opcję "Pokaż ukryte elementy".'
        },
        confirmations: {
            deleteMultipleFiles: 'Czy na pewno chcesz usunąć wiele ({count}) plików?',
            deleteConfirmation: 'Nie można cofnąć tej czynności.'
        },
        defaultNames: {
            untitled: 'Bez nazwy'
        }
    },

    // Drag and drop operations
    dragDrop: {
        errors: {
            cannotMoveIntoSelf: 'Nie można przenieść do tego samego lub podrzędnego folderu.',
            itemAlreadyExists: 'Element o nazwie "{name}" już istnieje w tej lokalizacji.',
            failedToMove: 'Nie udało się przenieść: {error}',
            failedToAddTag: 'Nie udało się dodać tagu "{tag}"',
            failedToSetProperty: 'Nie udało się zaktualizować atrybutu: {error}',
            failedToClearTags: 'Nie udało się wyczyścić tagów',
            failedToMoveFolder: 'Nie udało się przenieść folderu "{name}"',
            failedToImportFiles: 'Nie udało się zaimportować: {names}'
        },
        notifications: {
            filesAlreadyExist: 'Wiele plików ({count}) już istnieje w miejscu docelowym',
            filesAlreadyHaveTag: 'Wiele plików ({count}) już ma ten lub bardziej szczegółowy tag',
            filesAlreadyHaveProperty: 'Wiele plików ({count}) ma już ten atrybut',
            noTagsToClear: 'Brak tagów do wyczyszczenia',
            fileImported: 'Zaimportowano 1 plik',
            filesImported: 'Zaimportowano wiele plików ({count})'
        }
    },

    // Date grouping
    dateGroups: {
        future: 'Przyszłość',
        today: 'Dzisiaj',
        yesterday: 'Wczoraj',
        previous7Days: 'Poprzednie 7 dni',
        previous30Days: 'Poprzednie 30 dni'
    },

    // Plugin commands
    commands: {
        open: 'Otwórz', // Command palette: Opens the Notebook Navigator view (English: Open)
        toggleLeftSidebar: 'Przełącz lewy pasek boczny', // Command palette: Toggles left sidebar, opening Notebook Navigator when uncollapsing (English: Toggle left sidebar)
        openDailyNote: 'Otwórz dziennik',
        openWeeklyNote: 'Otwórz notatkę tygodnia',
        openMonthlyNote: 'Otwórz notatkę miesiąca',
        openQuarterlyNote: 'Otwórz notatkę kwartału',
        openYearlyNote: 'Otwórz notatkę roku',
        revealFile: 'Pokaż plik', // Command palette: Reveals and selects the currently active file in the navigator (English: Reveal file)
        search: 'Szukaj', // Command palette: Toggle search in the file list (English: Search)
        searchVaultRoot: 'Szukaj w całym sejfie', // Command palette: Selects the vault root folder and focuses search with subfolders included (English: Search whole vault)
        toggleDualPane: 'Przełącz układ podwójnego panelu', // Command palette: Toggles between single-pane and dual-pane layout (English: Toggle dual pane layout)
        toggleDualPaneOrientation: 'Przełącz orientację podwójnego panelu', // Command palette: Toggles dual-pane orientation between horizontal and vertical (English: Toggle dual pane orientation)
        toggleCalendar: 'Przełącz kalendarz', // Command palette: Toggles showing the calendar overlay in the navigation pane (English: Toggle calendar)
        selectVaultProfile: 'Wybierz profil sejfu', // Command palette: Opens a modal to choose a different vault profile (English: Switch vault profile)
        selectVaultProfile1: 'Wybierz profil sejfu 1', // Command palette: Activates the first vault profile without opening the modal (English: Select vault profile 1)
        selectVaultProfile2: 'Wybierz profil sejfu 2', // Command palette: Activates the second vault profile without opening the modal (English: Select vault profile 2)
        selectVaultProfile3: 'Wybierz profil sejfu 3', // Command palette: Activates the third vault profile without opening the modal (English: Select vault profile 3)
        deleteFile: 'Usuń pliki', // Command palette: Deletes the currently active file (English: Delete file)
        createNewNote: 'Utwórz nową notatkę', // Command palette: Creates a new note in the currently selected folder (English: Create new note)
        createNewNoteFromTemplate: 'Utwórz nową notatkę na podstawie szablonu', // Command palette: Creates a new note from a template in the currently selected folder (English: Create new note from template)
        moveFiles: 'Przenieś pliki', // Command palette: Move selected files to another folder (English: Move files)
        mergeNotes: 'Scal notatki', // Command palette: Creates one note from selected Markdown notes (English: Merge notes)
        selectNextFile: 'Wybierz następny plik', // Command palette: Selects the next file in the current view (English: Select next file)
        selectPreviousFile: 'Wybierz poprzedni plik', // Command palette: Selects the previous file in the current view (English: Select previous file)
        navigateBack: 'Nawiguj wstecz',
        navigateForward: 'Nawiguj do przodu',
        convertToFolderNote: 'Przekształć na notatkę folderu', // Command palette: Converts the active file into a folder note with a new folder (English: Convert to folder note)
        setAsFolderNote: 'Ustaw jako notatkę folderu', // Command palette: Renames the active file to its folder note name (English: Set as folder note)
        detachFolderNote: 'Odłącz notatkę folderu', // Command palette: Renames the active folder note to a new name (English: Detach folder note)
        pinAllFolderNotes: 'Przypnij wszystkie notatki folderu', // Command palette: Pins all folder notes to shortcuts (English: Pin all folder notes)
        navigateToFolder: 'Przejdź do folderu', // Command palette: Navigate to a folder using fuzzy search (English: Navigate to folder)
        navigateToTag: 'Przejdź do tagu', // Command palette: Navigate to a tag using fuzzy search (English: Navigate to tag)
        navigateToProperty: 'Przejdź do atrybutu', // Command palette: Navigate to a property key or value using fuzzy search (English: Navigate to property)
        addShortcut: 'Dodaj do skrótów', // Command palette: Adds or removes the current file, folder, tag, or property from shortcuts (English: Add to shortcuts)
        openShortcut: 'Otwórz skrót {number}',
        toggleDescendants: 'Przełącz potomków', // Command palette: Toggles showing notes from descendants (English: Toggle descendants)
        toggleHidden: 'Przełącz ukryte foldery, tagi i notatki', // Command palette: Toggles showing hidden items (English: Toggle hidden items)
        toggleTagSort: 'Przełącz sortowanie tagów', // Command palette: Toggles between alphabetical and frequency tag sorting (English: Toggle tag sort order)
        toggleTagsBySelection: 'Przełącz tagi według wyboru',
        togglePropertiesBySelection: 'Przełącz atrybuty według wyboru',
        togglePinnedSection: 'Przełącz przypiętą sekcję',
        collapseExpand: 'Zwiń / rozwiń wszystkie elementy nawigacji', // Command palette: Collapse or expand all folders and tags (English: Collapse / expand all navigation items)
        collapseExpandListGroups: 'Zwiń / rozwiń wszystkie grupy listy',
        collapseExpandSelectedItem: 'Zwiń / rozwiń wybrany element',
        addTag: 'Dodaj tag do wybranych plików', // Command palette: Opens a dialog to add a tag to selected files (English: Add tag to selected files)
        setProperty: 'Ustaw atrybut dla wybranych plików', // Command palette: Opens a fuzzy dialog to set a property on selected files (English: Set property on selected files)
        removeTag: 'Usuń tag z wybranych plików', // Command palette: Opens a dialog to remove a tag from selected files (English: Remove tag from selected files)
        removeAllTags: 'Usuń wszystkie tagi z wybranych plików', // Command palette: Removes all tags from selected files (English: Remove all tags from selected files)
        openAllFiles: 'Otwórz wszystkie pliki', // Command palette: Opens all files in the current folder or tag (English: Open all files)
        rebuildCache: 'Odbuduj pamięć podręczną', // Command palette: Rebuilds the local Notebook Navigator cache (English: Rebuild cache)
        restoreDefaultSettings: 'Przywróć ustawienia domyślne' // Command palette: Replaces the settings file with defaults after startup was aborted (English: Restore default settings)
    },

    // Plugin UI
    plugin: {
        viewName: 'Notebook Navigator', // Name shown in the view header/tab (English: Notebook Navigator)
        calendarViewName: 'Kalendarz', // Name shown in the view header/tab (English: Calendar)
        folderNoteSidebarViewName: 'Notatka folderu', // Name shown in the folder note sidebar tab (English: Folder note)
        ribbonTooltip: 'Notebook Navigator', // Tooltip for the ribbon icon in the left sidebar (English: Notebook Navigator)
        revealInNavigator: 'Pokaż w Notebook Navigator', // Context menu item to reveal a file in the navigator (English: Reveal in Notebook Navigator)
        settingsUnavailableNotice:
            'Notebook Navigator nie mógł odczytać swoich ustawień i nie został uruchomiony. Jeśli sejf jest synchronizowany, uruchom ponownie Obsidian po zakończeniu synchronizacji. Aby zacząć od nowa z ustawieniami domyślnymi, uruchom polecenie „Przywróć ustawienia domyślne”.', // Notice shown when startup is aborted because the settings file is missing or cannot be read (English: Notebook Navigator could not read its settings and did not start. If your vault is syncing, restart Obsidian after the sync completes. To start over with default settings, run the command "Restore default settings".)
        settingsMissingConfirm: {
            title: 'Rozpocząć z ustawieniami domyślnymi?', // Title of the dialog shown when the plugin is enabled while its settings file is missing (English: Start with default settings?)
            messageRecentInstall:
                'Notebook Navigator został właśnie zainstalowany i nie ma pliku ustawień. Jeśli to nowa instalacja lub ponowna instalacja, kontynuuj z ustawieniami domyślnymi. Jeśli ustawienia pochodzą z usługi synchronizacji, anuluj, poczekaj na zakończenie synchronizacji i uruchom ponownie Obsidian.', // Dialog message when the plugin folder was written recently (English: Notebook Navigator was just installed and has no settings file. If this is a new install or a reinstall, continue with default settings. If your settings come from a sync service, cancel, wait for the sync to complete, and restart Obsidian.)
            messageExistingInstall:
                'Notebook Navigator jest zainstalowany na tym urządzeniu od dłuższego czasu, ale brakuje pliku ustawień. Jeśli sejf nadal się synchronizuje, anuluj, poczekaj na zakończenie synchronizacji i uruchom ponownie Obsidian, aby zachować dotychczasowe ustawienia. Kontynuuj tylko po to, aby zacząć od nowa z ustawieniami domyślnymi.', // Dialog message when the plugin folder has existed for a while (English: Notebook Navigator has been installed on this device for a while, but its settings file is missing. If your vault is still syncing, cancel, wait for the sync to complete, and restart Obsidian to keep your existing settings. Continue only to start over with default settings.)
            confirmButton: 'Użyj ustawień domyślnych' // Confirm button label in the missing-settings dialog (English: Use default settings)
        },
        settingsRecovery: {
            confirmTitle: 'Przywróć ustawienia domyślne', // Title of the confirmation dialog for the settings recovery command (English: Restore default settings)
            confirmMessage:
                'Ta operacja zastępuje plik ustawień Notebook Navigator ustawieniami domyślnymi. Jeśli sejf jest nadal synchronizowany, przywrócone ustawienia domyślne mogą nadpisać ustawienia zapisane na innych urządzeniach. Czytelny plik ustawień jest najpierw kopiowany do kopii zapasowej ze znacznikiem czasu w folderze wtyczki.', // Body of the confirmation dialog for the settings recovery command
            confirmButton: 'Przywróć domyślne', // Confirm button label in the settings recovery dialog (English: Restore defaults)
            failedNotice: 'Nie udało się dokończyć odzyskiwania ustawień. Lokalne preferencje zostały zachowane.', // Notice shown when settings recovery cannot be completed (English: Could not complete settings recovery. Local preferences were kept.)
            completedNotice: 'Przywrócono ustawienia domyślne. Uruchom ponownie Obsidian, aby zakończyć.' // Notice shown after the settings file was replaced with defaults (English: Default settings restored. Restart Obsidian to finish.)
        }
    },

    // Tooltips
    tooltips: {
        lastModifiedAt: 'Zmodyfikowano',
        createdAt: 'Utworzono',
        file: 'plik',
        files: 'pliki',
        folder: 'folder',
        folders: 'foldery'
    },

    // Settings
    settings: {
        changeDefaultSettings: 'Zmień ustawienia domyślne',
        metadataReport: {
            exportSuccess: 'Raport nieprawidłowych metadanych wyeksportowany do: {filename}',
            exportFailed: 'Nie udało się wyeksportować raportu metadanych'
        },
        pageGroups: {
            configuration: 'Konfiguracja',
            navigationPane: 'Panel nawigacji',
            listPane: 'Panel listy',
            calendarAndTools: 'Kalendarz i narzędzia'
        },
        pages: {
            displayFilters: {
                label: 'Filtry wyświetlania',
                description: 'Ukryte foldery, tagi, pliki, tagi plików i reguły atrybutów.'
            },
            appearanceAndBehavior: {
                label: 'Wygląd i zachowanie',
                description: 'Zachowanie, nawigacja klawiaturą, przyciski myszy, wygląd i formatowanie.',
                groups: {
                    startup: 'Uruchamianie',
                    keyboardNavigation: 'Nawigacja klawiaturą',
                    mouseButtons: 'Przyciski myszy',
                    desktopAppearance: 'Wygląd na komputerze',
                    mobileAppearance: 'Wygląd mobilny',
                    appearance: 'Wygląd',
                    icons: 'Ikonki',
                    formatting: 'Formatowanie'
                }
            },
            navigationPane: {
                label: 'Panel nawigacji',
                description: 'Układ, wygląd, liczba plików, zachowanie zwijania i kolory tęczy.',
                groups: {
                    appearance: 'Wygląd',
                    collapseItems: 'Zwiń elementy',
                    dragAndDrop: 'Przeciągnij i upuść',
                    fileCounts: 'Liczba plików'
                }
            },
            shortcutsAndRecentFiles: {
                label: 'Skróty i ostatnie pliki',
                description: 'Widoczność skrótów, odznaki, ostatnie pliki i przypięte elementy.',
                groups: {
                    shortcuts: 'Skróty',
                    recentFiles: 'Ostatnie pliki'
                }
            },
            foldersAndFolderNotes: {
                label: 'Foldery i notatki folderu',
                description: 'Wyświetlanie folderów, notatki folderu, szablony notatek folderu i zachowanie notatek folderu.',
                groups: {
                    folders: 'Foldery',
                    folderNotes: 'Notatki folderu',
                    folderNoteFiles: 'Pliki notatek folderów'
                }
            },
            tagsAndProperties: {
                label: 'Tagi i atrybuty',
                description: 'Sekcje tagów i atrybutów, ikony, sortowanie, zakres i dziedziczenie.',
                groups: {
                    tags: 'Tagi',
                    properties: 'Atrybuty'
                }
            },
            listPane: {
                label: 'Panel listy',
                description: 'Sortowanie, grupowanie, tryby listy, przypięte notatki i podglądy rysunków.',
                groups: {
                    appearance: 'Wygląd',
                    sortAndGroup: 'Sortowanie i grupowanie',
                    groupHeaders: 'Nagłówki grup',
                    pinnedNotes: 'Przypięte notatki',
                    behavior: 'Zachowanie'
                }
            },
            fileOperations: {
                label: 'Operacje na plikach i szablony',
                description:
                    'Szablony, polecenia tworzenia notatek, potwierdzenia usuwania, załączniki i zachowanie przy konfliktach podczas przenoszenia plików.',
                groups: {
                    templates: 'Szablony',
                    templateCommands: 'Polecenia tworzenia notatek'
                }
            },
            frontmatterFields: {
                label: 'Pola metadanych',
                description: 'Pola metadanych dla nazw wyświetlanych, znaczników czasu, ikon i kolorów.'
            },
            fileDisplay: {
                label: 'Wyświetlanie plików',
                description: 'Tytuły, tekst podglądu, wyróżnione obrazy, tagi, atrybuty, daty, liczba słów i liczba znaków.',
                groups: {
                    icon: 'Ikonka'
                }
            },
            calendar: {
                label: 'Kalendarz',
                description: 'Wyświetlanie kalendarza, notatki dat, szablony, ustawienia regionalne i położenie paska bocznego.',
                groups: {
                    appearance: 'Wygląd',
                    leftSidebar: 'Lewy pasek boczny',
                    calendarIntegration: 'Integracja z kalendarzem',
                    rightSidebar: 'Prawy pasek boczny'
                }
            },
            advanced: {
                label: 'Zaawansowane',
                description: 'Diagnostyka, czyszczenie metadanych, import/eksport i resetowanie.',
                groups: {
                    maintenance: 'Konserwacja',
                    settingsManagement: 'Resetowanie ustawień'
                }
            }
        },
        items: {
            listPaneTitle: {
                name: 'Tytuł panelu listy',
                desc: 'Wybierz, gdzie ma być widoczny tytuł panelu listy.',
                options: {
                    header: 'Pokaż w nagłówku',
                    listPane: 'Pokaż w panelu listy',
                    hidden: 'Ukryj'
                }
            },
            colorListPaneTitle: {
                name: 'Koloruj tytuł panelu listy',
                desc: 'Stosuje kolor wybranego folderu, tagu lub atrybutu do tytułu panelu listy.'
            },
            defaultSortOrder: {
                name: 'Domyślny porządek sortowania',
                desc: 'Wybierz domyślny porządek sortowania notatek. Atrybuty z ustawienia Atrybuty sortowania pojawiają się jako dodatkowe opcje sortowania.',
                directions: {
                    asc: 'Rosnąco',
                    desc: 'Malejąco'
                },
                dateDirections: {
                    newestOnTop: 'Od najnowszych',
                    oldestOnTop: 'Od najstarszych'
                },
                textDirections: {
                    aOnTop: 'Od A do Z',
                    zOnTop: 'Od Z do A'
                },
                fields: {
                    dateEdited: 'Data edycji',
                    dateCreated: 'Data utworzenia',
                    title: 'Tytuł',
                    fileName: 'Nazwa pliku',
                    property: 'Atrybut'
                }
            },
            defaultSortDirection: {
                name: 'Kierunek sortowania'
            },
            defaultGroupingDirection: {
                name: 'Kierunek grupowania',
                options: {
                    follow: 'Zgodnie z sortowaniem'
                }
            },
            sortingProperties: {
                name: 'Atrybuty sortowania',
                desc: 'Atrybuty frontmatter rozdzielone przecinkami. Każdy atrybut pojawia się jako opcja sortowania w ustawieniu Domyślny porządek sortowania i w menu sortowania w panelu listy. Te atrybuty nie są zmieniane.',
                placeholder: 'published, author',
                defaultsResetNotices: {
                    sort: 'Domyślny porządek sortowania został zresetowany, ponieważ jego atrybut nie jest już dostępny.',
                    grouping: 'Domyślne grupowanie zostało zresetowane, ponieważ jego atrybut nie jest już dostępny.',
                    both: 'Domyślny porządek sortowania i domyślne grupowanie zostały zresetowane, ponieważ ich atrybuty nie są już dostępne.'
                }
            },
            propertySecondarySort: {
                name: 'Sortowanie drugorzędne',
                desc: 'Używane z sortowaniem według atrybutów, gdy notatki mają taką samą wartość lub jej nie mają.',
                options: {
                    title: 'Tytuł',
                    fileName: 'Nazwa pliku',
                    dateCreated: 'Data utworzenia',
                    dateEdited: 'Data edycji'
                }
            },
            propertySortInstructions: {
                intro: 'Jak działa sortowanie i grupowanie według atrybutu:',
                items: [
                    '**Sortowanie:** Wybranie atrybutu, takiego jak Priorytet, sortuje notatki według ich wartości Priorytetu.',
                    '**Grupowanie:** Wybranie atrybutu, takiego jak Status, tworzy nagłówek dla każdej wartości Statusu. Notatki z tym samym Statusem są wyświetlane pod tym samym nagłówkiem.',
                    '**Wiele wartości:** Jeśli atrybut zawiera listę, Notebook Navigator używa całej listy. Na przykład, jeśli Tematy zawierają Książki i Historię, notatka jest sortowana lub grupowana według „Książki, Historia”, a nie według każdego tematu osobno.',
                    '**Brakujące wartości:** Podczas grupowania notatki bez tego atrybutu są wyświetlane na końcu pod **Brak**.',
                    '**Widoki tagów i atrybutów:** Po wybraniu grupowania **Folder** zamiast tego wyświetlane są nagłówki dat.'
                ]
            },
            groupingProperties: {
                name: 'Atrybuty grupowania',
                desc: 'Atrybuty frontmatter rozdzielone przecinkami. Każdy atrybut pojawia się jako opcja grupowania w ustawieniu Domyślne grupowanie i w menu sortowania w panelu listy. Te atrybuty nie są zmieniane.',
                placeholder: 'status, genre'
            },
            groupHeadersInstructions: {
                intro: 'Niestandardowe nagłówki grup wyświetlają się nad notatkami w panelu listy.',
                items: [
                    'W menu sortowania w panelu listy ustaw grupowanie na **Niestandardowe**.',
                    'Kliknij notatkę prawym przyciskiem myszy i wybierz **Ustaw nagłówek grupy**, aby dodać nagłówek nad nią.'
                ]
            },
            scrollToSelectedFileOnListChanges: {
                name: 'Przewiń do wybranego pliku podczas zmian na liście',
                desc: 'Przewiń do wybranego pliku podczas przypinania notatek, wyświetlania notatek podrzędnych, zmiany wyglądu folderu lub wykonywania operacji na plikach.'
            },
            includeDescendantNotes: {
                name: 'Pokaż notatki z podfolderów / elementów podrzędnych',
                desc: 'Podczas przeglądania folderu, tagu lub atrybutu uwzględnij notatki z podfolderów oraz elementów podrzędnych tagów i atrybutów.'
            },
            filterPinnedNotesByFolder: {
                name: 'Przypinaj notatki tylko w ich folderze',
                desc: 'Przypięte notatki są wyświetlane jako przypięte tylko w swoim własnym folderze. Przydatne dla notatek folderów lub jeśli masz wiele przypiętych notatek. Nie wpływa na widoki tagów ani atrybutów.'
            },
            separateFileCounts: {
                name: 'Pokaż bieżącą i podrzędną liczbę plików oddzielnie',
                desc: 'Wyświetla liczbę plików jako "bieżące ▾ podrzędne" dla folderów, tagów i atrybutów.'
            },
            defaultGrouping: {
                name: 'Domyślne grupowanie',
                desc: 'Opcja „Nie grupuj” pozostawia posortowaną listę bez podziału na grupy. **Nagłówki** opisują posortowaną listę bez zmiany jej kolejności: Niestandardowe wyświetla nagłówki zdefiniowane w metadanych, a Data wstawia nagłówki dat. **Grupy** zmieniają kolejność listy: grupy folderów i atrybutów są porządkowane osobno, a notatki w każdej grupie zachowują porządek sortowania.',
                families: {
                    headers: 'Nagłówki',
                    groups: 'Grupy'
                },
                options: {
                    none: 'Nie grupuj',
                    custom: 'Niestandardowe',
                    date: 'Data',
                    folder: 'Folder'
                }
            },
            alwaysShowAllTagAndPropertyPills: {
                name: 'Zawsze pokazuj wszystkie etykiety tagów i atrybutów',
                desc: 'Po wyłączeniu etykiety odpowiadające bieżącemu wyborowi nawigacji są ukrywane (np. etykieta tagu „przepisy” jest ukrywana podczas przeglądania tagu „przepisy”). Włącz, aby wszystkie etykiety były zawsze widoczne.'
            },
            stickyGroupHeaders: {
                name: 'Przyklejone nagłówki grup',
                desc: 'Bieżący nagłówek sekcji daty, folderu, atrybutu lub przypiętej pozostaje widoczny podczas przewijania.'
            },
            showSubfolderPaths: {
                name: 'Pokaż ścieżki podfolderów',
                desc: 'Podczas grupowania według folderu w panelu listy pokazuj ścieżki podfolderów zamiast samych nazw folderów.'
            },
            showGroupHeaderItemCounts: {
                name: 'Pokaż liczbę elementów',
                desc: 'Wyświetla liczbę elementów w każdym nagłówku grupy w panelu listy.'
            },
            showCurrentFolderFilesAtBottom: {
                name: 'Grupowanie folderów: pliki bieżącego folderu na dole',
                desc: 'Gdy domyślne grupowanie to Folder, przenieś pliki znajdujące się bezpośrednio w wybranym folderze pod grupy podfolderów.'
            },
            showFileIcons: {
                name: 'Pokaż ikonki plików',
                desc: 'Wyświetla ikonki plików z wyrównaniem do lewej strony. Wyłączenie tej opcji powoduje usunięcie zarówno ikonek, jak i wcięć. Priorytet: ikonka nieukończonych zadań > ikonka niestandardowa > ikonka folderu > ikonka nazwy pliku > ikonka typu pliku > ikonka domyślna.'
            },
            useFolderIcon: {
                name: 'Użyj ikonki folderu',
                desc: 'Wyświetla ikonkę folderu nadrzędnego, gdy nie ustawiono niestandardowej ikonki pliku. Kolor folderu jest używany, gdy nie ustawiono niestandardowego koloru pliku.'
            },
            showFileNameIcons: {
                name: 'Ikonki na podstawie nazwy pliku',
                desc: 'Przypisuje ikonki do plików na podstawie tekstu w ich nazwach.'
            },
            fileNameIconMap: {
                name: 'Przypisanie ikonek na podstawie nazwy pliku',
                desc: 'Pliki zawierające dany tekst otrzymują określoną ikonkę. Jedno przypisanie na linię: tekst=ikonka',
                placeholder: '# tekst=ikona\nspotkanie=ph-calendar\nfaktura=ph-receipt',
                editTooltip: 'Edytuj przypisania'
            },
            showFileTypeIcons: {
                name: 'Ikonki według typu pliku',
                desc: 'Przypisuje ikonki do plików na podstawie ich rozszerzeń.'
            },
            fileTypeIconPreset: {
                name: 'Ustawienie wstępne ikonek plików',
                desc: 'Wybierz wbudowane ikonki lub ustawienie wstępne pakietu ikonek. Niestandardowe reguły rozszerzeń zastępują to ustawienie wstępne.',
                options: {
                    builtIn: 'Wbudowane ikonki'
                }
            },
            fileTypeIconMap: {
                name: 'Przypisanie ikonek na podstawie typu pliku',
                desc: 'Pliki z danym rozszerzeniem otrzymują określoną ikonkę. Jedno przypisanie na linię: rozszerzenie=ikonka',
                placeholder: '# rozszerzenie=ikonka\ncpp=ph-file-code\npdf=ph-file-pdf',
                editTooltip: 'Edytuj przypisania'
            },
            compactItemHeight: {
                name: 'Wysokość elementów w trybie kompaktowym',
                desc: 'Ustawia wysokość elementów kompaktowej listy na komputerach stacjonarnych i urządzeniach mobilnych (piksele).',
                resetTooltip: 'Przywróć wartość domyślną (28px)'
            },
            compactItemHeightScaleText: {
                name: 'Skalowanie tekstu z wysokością trybu kompaktowego',
                desc: 'Skaluje tekst na kompaktowej liście, gdy wysokość elementu zostanie zmniejszona.'
            },
            showQuickActions: {
                name: 'Pokaż szybkie czynności',
                desc: 'Wyświetla przyciski akcji po najechaniu kursorem na pliki. Wyróżnij ikonkę, aby wyświetlić czynność.'
            },
            dualPane: {
                name: 'Układ podwójnego panelu',
                desc: 'Wyświetla panel nawigacji i panel listy obok siebie.'
            },
            dualPaneOrientation: {
                name: 'Orientacja trybu podwójnego',
                desc: 'Wybierz układ poziomy lub pionowy, gdy aktywny jest podwójny panel.',
                options: {
                    horizontal: 'Podział poziomy',
                    vertical: 'Podział pionowy'
                }
            },
            narrowSidebarBehavior: {
                name: 'Gdy pasek boczny jest zbyt wąski',
                desc: 'Wybierz, co się dzieje, gdy panel nawigacji i panel listy nie mieszczą się obok siebie.',
                options: {
                    none: 'Nic nie rób',
                    singlePane: 'Przełącz na jeden panel',
                    vertical: 'Przełącz na podział pionowy'
                }
            },
            narrowSidebarThresholdMode: {
                name: 'Próg wąskiego paska bocznego',
                desc: 'Wybierz sposób obliczania progu szerokości paska bocznego.',
                options: {
                    fitPanes: 'Dopasuj panele',
                    customWidth: 'Niestandardowa szerokość'
                }
            },
            narrowSidebarThresholdWidth: {
                name: 'Szerokość progu wąskiego paska bocznego',
                desc: 'Przełączaj, gdy pasek boczny jest węższy niż ta szerokość.',
                resetTooltip: 'Przywróć domyślną szerokość'
            },
            paneBackgroundColor: {
                name: 'Kolor tła',
                desc: 'Wybierz kolory tła dla panelu nawigacji i listy.',
                options: {
                    separate: 'Oddzielne tła',
                    listBackground: 'Użyj tła listy',
                    navigationBackground: 'Użyj tła nawigacji'
                }
            },
            zoomLevel: {
                name: 'Poziom przybliżenia',
                desc: 'Kontroluje ogólny poziom przybliżenia Notebook Navigator (procent).'
            },
            useFloatingToolbarsOnIOS: {
                name: 'Użyj pływających pasków narzędzi w systemie iOS',
                desc: 'Dotyczy tylko iOS.'
            },
            defaultStartupView: {
                name: 'Widok początkowy w układzie jednopanelowym',
                desc: 'Wybierz panel wyświetlany po otwarciu Notebook Navigator w układzie jednopanelowym.',
                options: {
                    navigation: 'Panel nawigacji',
                    listPane: 'Panel listy'
                }
            },
            toolbarButtons: {
                name: 'Przyciski paska narzędzi',
                desc: 'Wybierz, które przyciski mają być wyświetlane na pasku narzędzi. Ukryte przyciski pozostają dostępne za pośrednictwem palety poleceń i w menu.'
            },
            openNewNotesInNewTab: {
                name: 'Otwieraj nowe notatki w nowej karcie',
                desc: 'Gdy włączone, polecenie Utwórz nową notatkę otwiera notatki w nowej karcie. Gdy wyłączone, notatki zastępują bieżącą kartę.'
            },
            autoRevealActiveNote: {
                name: 'Pokaż aktywną notatkę',
                desc: 'Automatycznie wyświetla notatki po otwarciu za pomocą okna szybkiego wyboru, linków lub wyszukiwania.'
            },
            autoRevealShortestPath: {
                name: 'Automatyczne ujawnianie: Użyj najkrótszej ścieżki',
                desc: 'Włączone: Automatyczne ujawnianie wybiera najbliższy widoczny folder nadrzędny lub tag. Wyłączone: Automatyczne ujawnianie wybiera rzeczywisty folder pliku i dokładny tag.'
            },
            autoRevealIgnoreRightSidebar: {
                name: 'Automatyczne ujawnianie: Ignoruj zdarzenia z prawego paska bocznego',
                desc: 'Nie zmieniaj aktywnej notatki podczas klikania lub zmiany notatek w prawym pasku bocznym.'
            },
            autoRevealIgnoreOtherWindows: {
                name: 'Automatyczne ujawnianie: Ignoruj zdarzenia z innych okien',
                desc: 'Nie zmieniaj aktywnej notatki podczas pracy z notatkami w innym oknie.'
            },
            singlePaneAnimation: {
                name: 'Animacja pojedynczego panelu',
                desc: 'Czas trwania przejścia podczas przełączania paneli w trybie pojedynczego panelu (w milisekundach).',
                resetTooltip: 'Przywróć domyślne'
            },
            autoSelectFirstNote: {
                name: 'Automatycznie wybierz pierwszą notatkę',
                desc: 'Automatycznie otwiera pierwszą notatkę po zmianie folderu, tagu lub atrybutu.'
            },
            disableShortcutAutoScroll: {
                name: 'Wyłącz automatyczne przewijanie skrótów',
                desc: 'Nie przewijaj panelu nawigacji podczas klikania elementów w skrótach.'
            },
            expandOnSelection: {
                name: 'Rozwiń podczas zaznaczania',
                desc: 'Rozwija foldery, tagi i atrybuty po zaznaczeniu. W trybie pojedynczego panelu pierwsze zaznaczenie powoduje rozwinięcie, drugie zaznaczenie powoduje wyświetlenie plików.'
            },
            collapseOtherBranchesOnExpand: {
                name: 'Jedna rozwinięta gałąź',
                desc: 'Zwijaj inne gałęzie w tym samym drzewie podczas rozwijania folderu, tagu lub atrybutu.'
            },
            springLoadedFolders: {
                name: 'Rozwiń podczas przeciągania',
                desc: 'Rozwija foldery i tagi po najechaniu kursorem podczas przeciągania.'
            },
            springLoadedFoldersInitialDelay: {
                name: 'Rozwiń podczas przeciągania: Opóźnienie pierwszego rozwinięcia',
                desc: 'Opóźnienie przed rozwinięciem pierwszego folderu lub tagu podczas przeciągania (w sekundach).'
            },
            springLoadedFoldersSubsequentDelay: {
                name: 'Rozwiń podczas przeciągania: Opóźnienie kolejnych rozwinięć',
                desc: 'Opóźnienie przed rozwinięciem kolejnych folderów lub tagów podczas tego samego przeciągania (w sekundach).'
            },
            showShortcuts: {
                name: 'Pokaż skróty',
                desc: 'Wyświetla sekcję skrótów w panelu nawigacji.'
            },
            shortcutBadgeDisplay: {
                name: 'Plakietka skrótu',
                desc: "Co ma być widoczne obok skrótów. Użyj poleceń 'Otwórz skrót 1-9', aby otworzyć skróty bezpośrednio.",
                options: {
                    position: 'Pozycja (1-9)',
                    count: 'Liczba elementów',
                    none: 'Brak'
                }
            },
            showRecentFiles: {
                name: 'Pokaż ostatnie pliki',
                desc: 'Wyświetla sekcję ostatnich plików w panelu nawigacji.'
            },
            hideFileTypesFromRecentFiles: {
                name: 'Ukryj typy plików z ostatnich plików',
                desc: 'Wybierz typy plików do ukrycia w sekcji ostatnich plików.',
                options: {
                    none: 'Brak',
                    folderNotes: 'Notatki folderów'
                }
            },
            recentFilesCount: {
                name: 'Liczba ostatnich plików',
                desc: 'Liczba ostatnich plików do wyświetlenia.'
            },
            pinRecentFilesWithShortcuts: {
                name: 'Przypnij ostatnie pliki razem ze skrótami',
                desc: 'Dołącz ostatnie pliki podczas przypinania skrótów.'
            },
            calendarPlacement: {
                name: 'Położenie kalendarza',
                desc: 'Umieść kalendarz w lewym lub prawym panelu bocznym.',
                options: {
                    leftSidebar: 'Lewy pasek boczny',
                    rightSidebar: 'Prawy pasek boczny'
                }
            },
            calendarSinglePanePlacement: {
                name: 'Pozycja w trybie pojedynczego panelu',
                desc: 'Gdzie kalendarz jest wyświetlany w trybie pojedynczego panelu.',
                options: {
                    navigationPane: 'Panel nawigacji',
                    belowPanes: 'Pod panelami'
                }
            },
            calendarLocale: {
                name: 'Ustawienia regionalne',
                desc: 'Kontroluje formatowanie dat kalendarza, numerację tygodni i pierwszy dzień tygodnia.',
                weekPathMismatchWarning:
                    'Widoczny kalendarz i ścieżki notatek tygodniowych używają różnych początków tygodni lub numeracji tygodni.',
                options: {
                    systemDefault: 'Domyślne'
                }
            },
            calendarMonthNameFormat: {
                name: 'Format nazwy miesiąca',
                desc: 'Pełna (styczeń) lub skrócona (sty) nazwa miesiąca.',
                options: {
                    full: 'styczeń (pełna)',
                    short: 'sty (krótka)'
                }
            },
            showInfoButtons: {
                name: 'Pokaż przyciski informacyjne',
                desc: 'Wyświetla przyciski informacyjne w pasku wyszukiwania i nagłówku kalendarza.'
            },
            calendarLeftSidebarWeeksToShow: {
                name: 'Tygodnie widoczne w lewym pasku bocznym',
                desc: 'Kalendarz w prawym pasku bocznym zawsze wyświetla cały miesiąc.',
                options: {
                    fullMonth: 'Cały miesiąc',
                    oneWeek: '1 tydzień',
                    weeksCount: 'tygodnie: {count}'
                }
            },
            calendarHighlightToday: {
                name: 'Wyróżnij dzisiejszą datę',
                desc: 'Wyróżnij dzisiejszą datę kolorem tła i pogrubioną czcionką.'
            },
            calendarShowWeekNumber: {
                name: 'Pokaż numer tygodnia',
                desc: 'Dodaje kolumnę z numerem tygodnia.'
            },
            calendarShowQuarter: {
                name: 'Pokaż kwartał',
                desc: 'Dodaje etykietę kwartału w nagłówku kalendarza.'
            },
            calendarShowOutsideMonthDays: {
                name: 'Pokaż dni z innych miesięcy',
                desc: 'Pokazuje dni poprzedniego i następnego miesiąca, gdy kalendarz wyświetla pełny miesiąc.'
            },
            calendarShowYearCalendar: {
                name: 'Pokaż kalendarz roczny',
                desc: 'Wyświetla nawigację roczną i siatkę miesięczną w prawym pasku bocznym.'
            },
            dailyNoteSource: {
                name: 'Źródło notatek',
                desc: 'Źródło notatek kalendarza.',
                options: {
                    dailyNotes: 'Dziennik (wbudowana wtyczka)',
                    notebookNavigator: 'Notebook Navigator'
                },
                info: {
                    dailyNotes: 'Folder i format daty można zmienić w ustawieniach wtyczki Dziennik.'
                }
            },
            calendarPeriodicNotesLocale: {
                name: 'Ustawienia regionalne notatek okresowych',
                desc: 'Kontroluje zlokalizowane nazwy miesięcy, dni tygodnia, numery tygodni oraz początki tygodni w ścieżkach notatek okresowych Notebook Navigator.',
                options: {
                    calendar: 'Kalendarz',
                    obsidian: 'Obsidian'
                }
            },

            periodicNotesRootFolder: {
                name: 'Folder główny (profil sejfu)',
                desc: 'Folder bazowy dla notatek okresowych. Wzory dat mogą zawierać podfoldery. Zmienia się wraz z wybranym profilem sejfu.',
                placeholder: 'Osobiste/Dziennik'
            },
            templateFolderLocation: {
                name: 'Lokalizacja folderu szablonów',
                desc: 'Wybór pliku szablonu pokazuje notatki z tego folderu.',
                placeholder: 'Szablony',
                usage: 'Szablony w folderze szablonów są używane przez notatki kalendarza, notatki folderów, szablony folderów i Nowa notatka na podstawie szablonu. Szablony kalendarza skonfiguruj w Kalendarz > Integracja z kalendarzem, a szablony notatek folderów w Foldery i notatki folderu > Pliki notatek folderów.'
            },
            calendarDailyNotePattern: {
                name: 'Notatki dziennika',
                desc: 'Sformatuj ścieżkę przy użyciu formatu daty Moment. Nazwy podfolderów umieść w nawiasach, np. [Work]/YYYY. Kliknij ikonkę szablonu, aby ustawić szablon. Ustaw lokalizację folderu szablonów w sekcji Operacje na plikach i szablony > Szablony.',
                placeholder: 'YYYY/YYYYMMDD',
                parsingError: 'Wzór musi być tak sformatowany, aby można było odczytać kompletną datę (rok, miesiąc, dzień).'
            },
            calendarPeriodicNotePatterns: {
                momentDescPrefix: 'Sformatuj ścieżkę przy użyciu ',
                momentLinkText: 'formatu daty Moment',
                momentDescSuffix:
                    '. Nazwy podfolderów umieść w nawiasach, np. [Work]/YYYY. Kliknij ikonkę szablonu, aby ustawić szablon. Ustaw lokalizację folderu szablonów w sekcji Operacje na plikach i szablony > Szablony.',
                example: 'Aktywna składnia: {path}'
            },
            templateEngine: {
                name: 'Silnik szablonów',
                desc: 'Silnik przetwarzający pliki szablonów podczas tworzenia notatek przez Notebook Navigator. Automatycznie używa Templater dla szablonów zawierających <%, gdy wtyczka Templater jest zainstalowana. Pozostałe szablony używają wbudowanego silnika.',
                options: {
                    automatic: 'Automatycznie',
                    builtin: 'Notebook Navigator',
                    templater: 'Templater'
                },
                templaterInstalled: 'Wtyczka Templater: zainstalowana',
                templaterNotInstalled: 'Wtyczka Templater: niezainstalowana',
                templaterAutomatic:
                    'Szablony zawierające polecenia Templater (<%) są przetwarzane przez Templater. Pozostałe szablony są przetwarzane przez wbudowany silnik.',
                templaterUsage:
                    'Wszystkie szablony są przetwarzane przez Templater. Wbudowane tokeny w plikach szablonów nie są zastępowane.',
                templaterMissingWarning:
                    'Nie można tworzyć notatek z szablonów. Zmień {setting} na {automatic} lub {builtin} w {location} albo zainstaluj i włącz wtyczkę Templater.',
                tokens: 'Wbudowane tokeny: {{title}}, {{folder}}, {{path}}, {{date}}, {{date:FORMAT}}, {{date+1d}}, {{time}}, {{today}}, {{now}}, {{yesterday}}, {{tomorrow}}, {{monday}} do {{sunday}}, {{cursor}}. Wpisz {{!date}}, aby zachować {{date}} jako tekst.',
                usage: 'Tokeny szablonów, takie jak {{title}} i {{date}}, są zastępowane podczas tworzenia notatki. Skonfiguruj silnik szablonów w Operacje na plikach i szablony > Szablony.'
            },
            showFolderTemplateIcons: {
                name: 'Pokazuj ikony szablonów folderów',
                desc: 'Oznacza ikoną w panelu nawigacji foldery, które mają własny szablon.'
            },
            templateCommands: {
                name: 'Polecenia',
                desc: 'Każde polecenie tworzy notatkę z wygenerowaną nazwą pliku, z własnego szablonu lub szablonu folderu. Uruchom je z palety poleceń albo przypisz do skrótu lub przycisku.',
                empty: 'Brak dodanych poleceń.',
                add: 'Dodaj polecenie',
                edit: 'Edytuj',
                unnamed: 'Polecenie bez nazwy',
                locationCurrent: 'Bieżący folder',
                locationFolder: 'Wybrany folder'
            },
            folderTemplates: {
                name: 'Szablony folderów',
                desc: 'Nowe notatki używają szablonu swojego folderu lub najbliższego folderu nadrzędnego. Szablony ustawia się w menu kontekstowym folderu. Szablony kalendarza, notatek dziennych i notatek folderu mają pierwszeństwo.',
                empty: 'Brak szablonów folderów.',
                scopeSubfolders: 'Folder i podfoldery',
                scopeFolder: 'Tylko ten folder'
            },
            calendarWeeklyNotePattern: {
                name: 'Notatki tygodniowe',
                parsingError: 'Wzór musi być tak sformatowany, aby można było odczytać pełny tydzień (rok tygodnia, numer tygodnia).',
                weekPathMismatchWarning:
                    'Ścieżki notatek tygodniowych używają ustawień regionalnych notatek okresowych. Użyj pasujących ustawień regionalnych lub użyj "GGGG" z "WW" dla tygodni rozpoczynających się w poniedziałek.',
                mixedWeekTokensWarning:
                    'Ten wzór miesza tokeny tygodnia rozpoczynające się w poniedziałek ("W" lub "G") z tokenami tygodnia opartymi na ustawieniach regionalnych ("w" lub "g"). Użyj konsekwentnie jednego zestawu: "GGGG" z "WW" dla tygodni rozpoczynających się w poniedziałek lub "gggg" z "ww", jeśli notatki tygodniowe mają być zgodne z wybranymi ustawieniami regionalnymi.'
            },
            calendarMonthlyNotePattern: {
                name: 'Notatki miesięczne',
                parsingError: 'Wzór musi być tak sformatowany, aby można było odczytać kompletną datę (rok, miesiąc).'
            },
            calendarQuarterlyNotePattern: {
                name: 'Notatki kwartalne',
                parsingError: 'Wzór musi być tak sformatowany, aby można było odczytać kompletną datę (rok, kwartał).'
            },
            calendarYearlyNotePattern: {
                name: 'Notatki roczne',
                parsingError: 'Wzór musi być tak sformatowany, aby można było odczytać kompletną datę (rok).'
            },
            periodicNoteTemplateFile: {
                current: 'Plik szablonu: {name}'
            },
            showTooltips: {
                name: 'Pokaż informacje',
                desc: 'Po najechaniu kursorem wyświetla dodatkowe informacje dotyczące notatek i folderów.'
            },
            showTooltipPath: {
                name: 'Pokaż ścieżkę w podpowiedziach',
                desc: 'Po najechaniu kursorem wyświetla ścieżkę folderu pod nazwami notatek.'
            },
            showTooltipTags: {
                name: 'Pokaż tagi w podpowiedziach',
                desc: 'Wyświetla tagi notatek w podpowiedziach, gdy sekcja tagów jest włączona.'
            },
            resetPaneSeparator: {
                name: 'Przywróć położenie separatora paneli',
                desc: 'Przywraca domyślne położenie separatora oddzielającego panel nawigacji i panel listy.',
                buttonText: 'Przywróć separator',
                notice: 'Przywrócono pozycję separatora. Uruchom ponownie Obsidian lub ponownie otwórz Notebook Navigator, aby zastosować zmiany.'
            },
            importAndExportSettings: {
                name: 'Importuj i eksportuj ustawienia',
                desc: 'Eksportuj lub importuj ustawienia Notebook Navigator jako JSON. Import zastępuje wszystkie ustawienia.',
                importButtonText: 'Importuj',
                exportButtonText: 'Eksportuj',
                import: {
                    modalTitle: 'Importuj ustawienia',
                    fileButtonName: 'Importuj z pliku',
                    fileButtonDesc: 'Wczytaj plik JSON z dysku.',
                    fileButtonText: 'Importuj z pliku',
                    editorName: 'JSON',
                    editorDesc: 'Wklej lub edytuj JSON poniżej. Nieuwzględnione ustawienia zostaną zresetowane do wartości domyślnych.',
                    placeholder: '{\n  "folderSortOrder": "alpha-desc"\n}',
                    confirmButtonText: 'Importuj',
                    confirmTitle: 'Zaimportować ustawienia?',
                    confirmMessage: 'Importowanie zastąpi bieżące ustawienia Notebook Navigator.',
                    backupToggleName: 'Zapisz bieżące ustawienia w katalogu głównym sejfu przed importem',
                    backupToggleDesc: 'Tworzy plik JSON ze znacznikiem czasu w katalogu głównym sejfu.',
                    successWithBackupNotice: 'Ustawienia zaimportowane. Poprzednie ustawienia zapisano w {path}.',
                    backupError: 'Nie można zapisać bieżących ustawień: {message}',
                    successNotice: 'Ustawienia zaimportowane.',
                    errorNotice: 'Nie udało się zaimportować ustawień: {message}',
                    fileReadError: 'Nie można odczytać pliku: {message}'
                },
                export: {
                    modalTitle: 'Eksportuj ustawienia',
                    editorName: 'JSON',
                    editorDesc: 'Uwzględnione są tylko ustawienia zmienione w stosunku do wartości domyślnych.',
                    placeholder: '{}',
                    copyButtonText: 'Kopiuj do schowka',
                    downloadButtonText: 'Pobierz',
                    copyNotice: 'Ustawienia skopiowane do schowka.',
                    downloadNotice: 'Ustawienia wyeksportowane.',
                    downloadError: 'Nie udało się pobrać ustawień: {message}'
                }
            },
            resetAllSettings: {
                name: 'Przywróć wszystkie ustawienia',
                desc: 'Przywraca wszystkie ustawienia Notebook Navigator do wartości domyślnych.',
                buttonText: 'Przywróć wszystkie ustawienia',
                confirmTitle: 'Przywrócić wszystkie ustawienia?',
                confirmMessage:
                    'Spowoduje to przywrócenie wszystkich ustawień Notebook Navigator do wartości domyślnych. Nie można cofnąć tej czynności.',
                confirmButtonText: 'Przywróć wszystkie ustawienia',
                notice: 'Przywrócono wszystkie ustawienia. Uruchom ponownie Obsidian lub ponownie otwórz Notebook Navigator, aby zastosować zmiany.',
                error: 'Nie udało się przywrócić ustawień.'
            },
            multiSelectModifier: {
                name: 'Zaznaczanie wielu elementów',
                desc: 'Wybierz, który klawisz umożliwia zaznaczanie wielu elementów. Gdy wybrano Option/Alt, kliknięcie z Cmd/Ctrl otwiera notatki w nowej karcie.',
                options: {
                    cmdCtrl: 'kliknięcie z Cmd/Ctrl',
                    optionAlt: 'kliknięcie z Option/Alt'
                }
            },
            enterToOpenFiles: {
                name: 'Naciśnij Enter, aby otworzyć pliki',
                desc: 'Otwieraj pliki tylko po naciśnięciu Enter podczas nawigacji po liście za pomocą klawiatury. W macOS zapobiega to zmianie nazw plików klawiszem Enter.'
            },
            shiftEnterAction: {
                name: 'Shift+Enter',
                desc: 'Wybierz, czy Shift+Enter otwiera, czy zmienia nazwę wybranego pliku.'
            },
            cmdEnterAction: {
                name: 'Cmd+Enter',
                desc: 'Wybierz, czy Cmd+Enter otwiera, czy zmienia nazwę wybranego pliku.'
            },
            ctrlEnterAction: {
                name: 'Ctrl+Enter',
                desc: 'Wybierz, czy Ctrl+Enter otwiera, czy zmienia nazwę wybranego pliku.'
            },
            mouseBackForwardAction: {
                name: 'Przyciski wstecz/dalej myszy',
                desc: 'Działanie przycisków wstecz i dalej myszy na komputerze.',
                options: {
                    systemDefault: 'Użyj domyślnych systemu',
                    singlePaneSwitch: 'Przełącz panele (jeden panel)',
                    history: 'Nawiguj historię'
                }
            },
            showFileTypes: {
                name: 'Pokaż typy plików (profil sejfu)',
                desc: 'Filtruj typy plików widoczne w przeglądarce. Pliki nieobsługiwane przez Obsidian mogą być otwierane w aplikacjach zewnętrznych.',
                options: {
                    documents: 'Dokumenty (.md, .canvas, .base)',
                    supported: 'Obsługiwane (otwiera się w Obsidian)',
                    all: 'Wszystkie (mogą otworzyć się zewnętrznie)'
                }
            },
            hideNotesWithPropertyRules: {
                name: 'Ukryj notatki na podstawie reguł atrybutów (profil sejfu)',
                desc: 'Lista reguł atrybutów rozdzielonych przecinkami. Użyj `key` lub `key=value` (np. status=done, published=true, archived).',
                placeholder: 'status=done, published=true, archived'
            },
            hideFiles: {
                name: 'Ukryj pliki (profil sejfu)',
                desc: 'Lista nazw plików oddzielonych przecinkami. Obsługuje symbole wieloznaczne * i ścieżki / (np. temp-*, *.png, /assets/*).',
                placeholder: 'temp-*, *.png, /assets/*'
            },
            vaultProfiles: {
                name: 'Profil sejfu',
                desc: 'Profile przechowują widoczność typów plików, ukryte pliki, ukryte foldery, ukryte tagi, reguły atrybutów dla ukrytych notatek, skróty i baner nawigacji. Przełączaj profile tutaj lub za pomocą przełącznika profilu sejfu w panelu nawigacji.',
                defaultName: 'Domyślny',
                addButton: 'Dodaj profil',
                editProfilesButton: 'Edytuj profile',
                addProfileOption: 'Dodaj profil...',
                applyButton: 'Zastosuj',
                deleteButton: 'Usuń profil',
                addModalTitle: 'Dodaj profil',
                editProfilesModalTitle: 'Edytuj profile',
                addModalPlaceholder: 'Nazwa profilu',
                deleteModalTitle: 'Usuń {name}',
                deleteModalMessage:
                    'Usunąć {name}? Filtry ukrytych plików, folderów, tagów i notatek oparte na atrybutach zapisane w tym profilu zostaną usunięte.',
                moveUp: 'Przesuń w górę',
                moveDown: 'Przesuń w dół',
                errors: {
                    emptyName: 'Wprowadź nazwę profilu',
                    duplicateName: 'Nazwa profilu już istnieje'
                }
            },
            vaultProfileSwitcher: {
                name: 'Przełącznik profilu sejfu',
                desc: 'Wybierz, gdzie jest widoczny przełącznik profilu sejfu.',
                options: {
                    header: 'Pokaż w nagłówku',
                    navigation: 'Pokaż w panelu nawigacji'
                }
            },
            hideFolders: {
                name: 'Ukryj foldery (profil sejfu)',
                desc: 'Lista folderów rozdzielonych przecinkami. Wzory nazw: assets* (foldery zaczynające się od assets), *_temp (kończące się na _temp). Wzory ścieżek: /archiwum (tylko archiwum w folderze głównym), /res* (foldery główne zaczynające się od res), /*/temp (foldery temp jeden poziom niżej), /projekty/* (wszystkie foldery wewnątrz folderu projekty).',
                placeholder: 'szablony, assets*, /archiwum, /res*'
            },
            descendantExcludedFolders: {
                name: 'Wyklucz foldery z notatek z podfolderów (profil sejfu)',
                desc: 'Lista folderów oddzielonych przecinkami, które mają być pomijane podczas zbierania notatek z podfolderów. Foldery pozostają widoczne, a wybranie folderu nadal pokazuje jego notatki. Używa tych samych wzorców co Ukryj foldery.',
                placeholder: 'dzienne, zasoby, /archiwum'
            },
            propertyKeys: {
                name: 'Klucze atrybutów (profil sejfu)',
                desc: 'Klucze atrybutów frontmatter z kontrolą widoczności per klucz dla nawigacji i listy plików.',
                addButtonTooltip: 'Konfiguruj klucze atrybutów',
                noneConfigured: 'Brak skonfigurowanych atrybutów',
                singleConfigured: '1 atrybut skonfigurowany: {properties}',
                multipleConfigured: 'Skonfigurowane atrybuty ({count}): {properties}'
            },
            dateFormat: {
                name: 'Format daty',
                desc: 'Format widocznych dat (format Moment).',
                placeholder: 'DD.MM.YYYY',
                help: 'Popularne formaty:\nDD.MM.YYYY = 25.05.2022\nDD/MM/YYYY = 25/05/2022\nYYYY-MM-DD = 2022-05-25\n\nTokeny:\nYYYY/YY = rok\nMMMM/MMM/MM = miesiąc\nDD/D = dzień\ndddd/ddd = dzień tygodnia',
                helpTooltip: 'Format z Moment',
                momentLinkText: 'format Moment'
            },
            timeFormat: {
                name: 'Format czasu',
                desc: 'Format widocznego czasu (format Moment).',
                placeholder: 'HH:mm',
                help: 'Popularne formaty:\nHH:mm = 14:30 (24-godzinny)\nh:mm a = 2:30 PM (12-godzinny)\nHH:mm:ss = 14:30:45\nh:mm:ss a = 2:30:45 PM\n\nTokeny:\nHH/H = 24-godzinny\nhh/h = 12-godzinny\nmm = minuty\nss = sekundy\na = AM/PM',
                helpTooltip: 'Format z Moment',
                momentLinkText: 'format Moment'
            },
            showRootFolder: {
                name: 'Pokaż folder główny',
                desc: 'Wyświetla nazwę sejfu jako folder główny w strukturze folderów.'
            },
            showFolderIcons: {
                name: 'Pokaż ikonki folderów',
                desc: 'Wyświetla ikonki obok folderów w panelu nawigacji.'
            },
            inheritFolderColors: {
                name: 'Dziedzicz kolory folderów',
                desc: 'Podfoldery dziedziczą kolor z folderów nadrzędnych.'
            },
            folderSortOrder: {
                name: 'Kolejność sortowania folderów',
                desc: 'Kliknij folder prawym przyciskiem myszy, aby ustawić inną kolejność sortowania dla jego elementów podrzędnych.',
                options: {
                    alphaAsc: 'od A do Z',
                    alphaDesc: 'od Z do A'
                }
            },
            showFileCount: {
                name: 'Pokaż liczbę plików',
                desc: 'Wyświetla liczbę plików obok folderów, tagów i atrybutów.'
            },
            showShortcutAndRecentItemIcons: {
                name: 'Pokaż ikonki skrótów i ostatnich elementów',
                desc: 'Wyświetla ikonki obok elementów w sekcjach Skróty i Ostatnie.'
            },
            applyColorToIconsOnly: {
                name: 'Zastosuj kolor tylko do ikonek',
                desc: 'Po włączeniu niestandardowe kolory są stosowane tylko do ikonek. Po wyłączeniu kolory są stosowane zarówno do ikonek, jak i etykiet tekstowych.'
            },
            copyLightToDark: 'Kopiuj kolor trybu jasnego do trybu ciemnego', // (English: Copy light mode color to dark mode)
            collapseItems: {
                name: 'Zwiń elementy',
                desc: 'Wybierz na co wpływa przycisk służący do zwijania i rozwijania elementów.',
                options: {
                    all: 'Wszystko',
                    foldersOnly: 'Tylko foldery',
                    tagsOnly: 'Tylko tagi',
                    propertiesOnly: 'Tylko atrybuty'
                }
            },
            keepSelectedItemExpanded: {
                name: 'Zachowaj wybrany element rozwinięty',
                desc: 'Podczas zwijania, zachowaj wybrany element oraz elementy nadrzędne rozwinięte.'
            },
            excludeVaultRootFromCollapse: {
                name: 'Pomiń katalog główny sejfu podczas zwijania',
                desc: 'Podczas zwijania wszystkich elementów pozostaw folder główny sejfu w bieżącym stanie.'
            },
            treeIndentation: {
                name: 'Wcięcie w strukturze',
                desc: 'Dostosuj szerokość wcięcia w strukturze folderów, tagów i atrybutów (piksele).'
            },
            navItemHeight: {
                name: 'Wysokość elementu',
                desc: 'Dostosuj wysokość folderów, tagów i atrybutów w panelu nawigacji (piksele).'
            },
            navItemHeightScaleText: {
                name: 'Skaluj tekst z wysokością elementu',
                desc: 'Zmniejsza tekst nawigacji, gdy wysokość elementu jest obniżona.'
            },
            showIndentGuides: {
                name: 'Pokaż linie wcięć',
                desc: 'Wyświetla linie wcięć w strukturze folderów, tagów i atrybutów.'
            },
            navCountLeaderStyle: {
                name: 'Pokaż znaki wiodące',
                desc: 'Wyświetla kropki, kreski lub linię między nazwami elementów a liczbą plików.',
                options: {
                    none: 'Brak',
                    dots: 'Kropki (...)',
                    dashes: 'Kreski (---)',
                    line: 'Linia'
                }
            },
            rootItemSpacing: {
                name: 'Odstęp elementów głównych',
                desc: 'Odstęp między folderami, tagami i atrybutami na poziomie głównym (piksele).'
            },
            showTags: {
                name: 'Pokaż tagi',
                desc: 'Wyświetla sekcję tagów w panelu nawigacji.'
            },
            showTagIcons: {
                name: 'Pokaż ikonki tagów',
                desc: 'Wyświetla ikonki obok tagów w panelu nawigacji.'
            },
            inheritTagColors: {
                name: 'Dziedzicz kolory tagów',
                desc: 'Tagi podrzędne dziedziczą kolor tagów nadrzędnych.'
            },
            tagSortOrder: {
                name: 'Kolejność sortowania tagów',
                desc: 'Kliknij tag prawym przyciskiem myszy, aby ustawić inną kolejność sortowania dla jego elementów podrzędnych.',
                options: {
                    alphaAsc: 'od A do Z',
                    alphaDesc: 'od Z do A',
                    frequency: 'liczba wystąpień',
                    lowToHigh: 'rosnąco',
                    highToLow: 'malejąco'
                }
            },
            showTagsFolder: {
                name: 'Pokaż folder tagów',
                desc: 'Wyświetla "Tagi" jako folder, który można zwinąć.'
            },
            showUntaggedNotes: {
                name: 'Pokaż nieotagowane notatki',
                desc: 'Wyświetla element "Bez tagów" dla notatek bez żadnych tagów.'
            },
            filterTagsBySelection: {
                name: 'Filtruj tagi według wyboru',
                desc: 'Pokaż tylko tagi występujące w notatkach w wybranym folderze lub atrybucie.'
            },
            keepEmptyTagsProperty: {
                name: 'Zachowaj atrybut tags po usunięciu ostatniego tagu',
                desc: 'Zachowuje atrybut tags, gdy wszystkie tagi zostaną usunięte. Gdy wyłączone, atrybut tags również zostanie usunięty.'
            },
            showProperties: {
                name: 'Pokaż atrybuty',
                desc: 'Wyświetl sekcję atrybutów w panelu nawigacji.',
                propertyKeysInfoPrefix: 'Konfiguruj atrybuty w ',
                propertyKeysInfoLinkText: 'Ogólne > Klucze atrybutów',
                propertyKeysInfoSuffix: ''
            },
            showPropertyIcons: {
                name: 'Pokaż ikonki atrybutów',
                desc: 'Wyświetl ikonki obok atrybutów w panelu nawigacji.'
            },
            inheritPropertyColors: {
                name: 'Dziedzicz kolory atrybutów',
                desc: 'Wartości dziedziczą kolor i tło atrybutu.'
            },
            propertySortOrder: {
                name: 'Kolejność sortowania atrybutów',
                desc: 'Kliknij prawym przyciskiem atrybut, aby zmienić kolejność sortowania wartości.',
                options: {
                    alphaAsc: 'A do Z',
                    alphaDesc: 'Z do A',
                    frequency: 'liczba wystąpień',
                    lowToHigh: 'rosnąco',
                    highToLow: 'malejąco'
                }
            },
            showPropertiesFolder: {
                name: 'Pokaż folder atrybutów',
                desc: 'Wyświetl "Atrybuty" jako zwijany folder.'
            },
            filterPropertiesBySelection: {
                name: 'Filtruj atrybuty według wyboru',
                desc: 'Pokaż tylko atrybuty występujące w notatkach w wybranym folderze lub tagu.'
            },
            hideTags: {
                name: 'Ukryj tagi (profil sejfu)',
                desc: 'Lista tagów rozdzielonych przecinkami. Format nazw: tag* (zaczynające się od), *tag (kończące się na). Format ścieżek: archiwum (tag i elementy podrzędne), archiwum/* (tylko elementy podrzędne), projekty/*/szkice (dowolne w środku).',
                placeholder: 'archiwum*, *szkic, projekty/*/stare'
            },
            hideNotesWithTags: {
                name: 'Ukryj notatki z tagami (profil sejfu)',
                desc: 'Lista tagów rozdzielonych przecinkami. Notatki zawierające pasujące tagi są ukryte. Format nazw: tag* (zaczynające się od), *tag (kończące się na). Format ścieżek: archiwum (tag i elementy podrzędne), archiwum/* (tylko elementy podrzędne), projekty/*/szkice (dowolne w środku).',
                placeholder: 'archiwum*, *szkic, projekty/*/stare'
            },
            enableFolderNotes: {
                name: 'Włącz notatki folderów',
                desc: 'Foldery z pasującym plikiem notatki są wyświetlane jako klikalne linki.'
            },
            folderNoteType: {
                name: 'Domyślny rodzaj notatki folderu',
                desc: 'Rodzaj notatki folderu tworzony za pomocą menu kontekstowego.',
                options: {
                    ask: 'Pytaj przy tworzeniu',
                    markdown: 'Markdown',
                    canvas: 'Tablica',
                    base: 'Baza danych'
                }
            },
            folderNoteName: {
                name: 'Nazwa notatki folderu',
                desc: 'Nazwa notatki folderu bez rozszerzenia. Użyj {{folder}}, aby wstawić nazwę folderu, lub wpisz stałą nazwę, na przykład index.'
            },
            folderNoteTemplate: {
                name: 'Szablon notatki folderu',
                desc: 'Plik szablonu używany podczas tworzenia notatek folderów. Szablony Markdown mogą używać Templatera. Szablony Canvas i Base są kopiowane jako zawartość pliku. Ustaw lokalizację folderu szablonów w Operacje na plikach i szablony > Szablony.',
                formatWarning: 'Format szablonu musi odpowiadać wybranemu typowi notatki folderu: .md, .canvas lub .base.'
            },
            folderNamesOpenFolderNotes: {
                name: 'Nazwy folderów otwierają notatki folderów',
                desc: 'Kliknięcie nazwy folderu otwiera jego notatkę folderu. Po wyłączeniu notatki folderów dostarczają tylko metadane folderu, takie jak nazwa, ikona i kolor.'
            },
            hideFolderNoteInList: {
                name: 'Ukryj notatki folderów na liście',
                desc: 'Ukryj notatki folderów z listy plików.'
            },
            pinCreatedFolderNote: {
                name: 'Przypnij utworzone notatki folderów',
                desc: 'Przypnij notatki folderów podczas tworzenia z menu kontekstowego.'
            },
            folderNoteOpenLocation: {
                name: 'Otwieraj notatki folderów w',
                desc: 'Wybierz, gdzie otwierają się notatki folderów po kliknięciu linków notatek folderów.',
                options: {
                    currentTab: 'Bieżąca karta',
                    newTab: 'Nowa karta',
                    rightSidebar: 'Prawy pasek boczny'
                }
            },
            showClosestFolderNoteInRightSidebar: {
                name: 'Prawy pasek boczny: Pokaż najbliższą notatkę folderu',
                desc: 'Po wybraniu folderu prawy pasek boczny automatycznie pokazuje najbliższą nadrzędną notatkę folderu.'
            },
            confirmBeforeDelete: {
                name: 'Potwierdź przed usunięciem',
                desc: 'Wyświetla możliwość potwierdzenia podczas usuwania notatek lub folderów'
            },
            deleteAttachments: {
                name: 'Usuń załączniki przy usuwaniu plików',
                desc: 'Automatycznie usuwaj powiązane załączniki i wygenerowane podglądy rysunków, jeśli nie są używane gdzie indziej',
                options: {
                    ask: 'Pytaj za każdym razem',
                    always: 'Zawsze',
                    never: 'Nigdy'
                }
            },
            moveFileConflicts: {
                name: 'Konflikty przenoszenia',
                desc: 'Podczas przenoszenia pliku do folderu, w którym istnieje już plik o tej samej nazwie. Pytaj za każdym razem (zmień nazwę, nadpisz, anuluj) lub zawsze zmieniaj nazwę.',
                options: {
                    ask: 'Pytaj za każdym razem',
                    rename: 'Zawsze zmieniaj nazwę'
                }
            },
            metadataCleanup: {
                name: 'Wyczyść metadane',
                desc: 'Usuwa niepowiązane metadane pozostałe po usunięciu, przeniesieniu lub zmianie nazwy plików, folderów, tagów lub atrybutów poza Obsidian. Dotyczy to wyłącznie pliku ustawień Notebook Navigator.',
                buttonText: 'Wyczyść metadane',
                error: 'Czyszczenie ustawień nie powiodło się',
                loading: 'Sprawdzanie metadanych...',
                statusClean: 'Brak metadanych do wyczyszczenia',
                statusCounts:
                    'Niepowiązane elementy: foldery {folders}, tagi {tags}, atrybuty {properties}, pliki {files}, przypięte {pinned}, separatory {separators}'
            },
            rebuildCache: {
                name: 'Odbuduj pamięć podręczną',
                desc: 'Użyj tej opcji, jeśli zauważysz brakujące tagi, nieprawidłowe podglądy lub brakujące wyróżnione obrazy. Może tak być w przypadku konfliktów synchronizacji lub po nieoczekiwanych zamknięciach.',
                buttonText: 'Odbuduj pamięć podręczną',
                error: 'Nie udało się odbudować pamięci podręcznej',
                indexingTitle: 'Indeksowanie sejfu...',
                progress: 'Aktualizowanie pamięci podręcznej Notebook Navigator.'
            },
            startupDebugLogging: {
                name: 'Startup debug logging (not synced)',
                desc: 'Write startup diagnostics to a timestamped markdown file in the vault root, then stop after startup settles. The file may sync and can include file paths.'
            },
            useFrontmatterMetadata: {
                name: 'Używaj metadanych',
                desc: 'Używaj metadanych dla nazwy notatki, znaczników czasu, ikonek i kolorów'
            },
            frontmatterIconField: {
                name: 'Pole ikonki',
                desc: 'Pole metadanych dla ikonek plików. Pozostaw puste, aby użyć ikonek zapisanych w ustawieniach.',
                placeholder: 'icon'
            },
            frontmatterColorField: {
                name: 'Pole koloru',
                desc: 'Pole metadanych dla kolorów plików. Pozostaw puste, aby użyć kolorów zapisanych w ustawieniach.',
                placeholder: 'color'
            },
            frontmatterBackgroundField: {
                name: 'Pole tła',
                desc: 'Pole metadanych dla kolorów tła. Pozostaw puste, aby użyć kolorów tła zapisanych w ustawieniach.',
                placeholder: 'background'
            },
            migrateIconsAndColorsFromSettings: {
                name: 'Przenieś ikonki i kolory z ustawień',
                desc: 'Zapisane w ustawieniach: ikonki {icons}, kolory {colors}.',
                button: 'Przenieś',
                buttonWorking: 'Przenoszenie...',
                noticeNone: 'W ustawieniach nie ma zapisanych żadnych ikonek plików ani kolorów.',
                noticeDone: 'Przeniesione: ikonki {migratedIcons}/{icons}, kolory {migratedColors}/{colors}.',
                noticeFailures: 'Niepowodzenie: {failures}.',
                noticeError: 'Przenoszenie nie powiodło się. Sprawdź konsolę, aby uzyskać więcej informacji.'
            },
            frontmatterNameFields: {
                name: 'Pola nazwy',
                desc: 'Lista pól metadanych rozdzielonych przecinkami. Używana jest pierwsza poprawna wartość. W przypadku braku wartości używana jest nazwa pliku.',
                placeholder: 'title, name'
            },
            frontmatterCreatedField: {
                name: 'Pole znacznika czasu utworzenia',
                desc: 'Nazwa pola metadanych dla znacznika czasu utworzenia. Pozostaw puste, aby używać tylko daty systemu plików.',
                placeholder: 'created'
            },
            frontmatterModifiedField: {
                name: 'Pole znacznika czasu modyfikacji',
                desc: 'Nazwa pola metadanych dla znacznika czasu modyfikacji. Pozostaw puste, aby używać tylko daty systemu plików.',
                placeholder: 'modified'
            },
            frontmatterTimestampFormat: {
                name: 'Format znacznika czasu',
                desc: 'Format używany do przetwarzania znaczników czasu w metadanych. Pozostaw puste, aby użyć formatu ISO 8601.',
                helpTooltip: 'Format z Moment',
                momentLinkText: 'format Moment',
                help: 'Popularne formaty:\nYYYY-MM-DD[T]HH:mm:ss → 2025-01-04T14:30:45\nYYYY-MM-DD[T]HH:mm:ssZ → 2025-08-07T16:53:39+02:00\nDD/MM/YYYY HH:mm:ss → 04/01/2025 14:30:45\nMM/DD/YYYY h:mm:ss a → 01/04/2025 2:30:45 PM'
            },
            cacheStatistics: {
                localCache: 'Lokalna pamięć podręczna',
                items: 'elementy',
                withTags: 'z tagami',
                withMetadata: 'z metadanymi'
            },
            metadataInfo: {
                successfullyParsed: 'Pomyślnie przetworzono elementy',
                itemsWithName: 'z nazwą',
                withCreatedDate: 'z datą utworzenia',
                withModifiedDate: 'z datą modyfikacji',
                withIcon: 'z ikonką',
                withColor: 'z kolorem',
                failedToParse: 'Nie udało się przetworzyć',
                createdDates: 'dat utworzenia',
                modifiedDates: 'dat modyfikacji',
                checkTimestampFormat: 'Sprawdź format znacznika czasu.',
                exportFailed: 'Eksportuj błędy'
            }
        }
    }
};
