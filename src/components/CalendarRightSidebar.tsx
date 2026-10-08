import { useCallback, useEffect, useRef, useState } from 'react';
import { TFile } from 'obsidian';
import { useServices } from '../context/ServicesContext';
import { useSettingsState } from '../context/SettingsContext';
import { isStorageRuntimeActive, subscribeStorageRuntimeActive } from '../context/StorageContext';
import { runAsyncAction } from '../utils/async';
import { getDBInstance } from '../storage/fileOperations';
import { FrontmatterSyncService } from '../services/content/frontmatterSyncService';
import { NotebookNavigatorView } from '../view/NotebookNavigatorView';
import { Calendar } from './calendar';

export function CalendarRightSidebar() {
    const { app, plugin } = useServices();
    const settings = useSettingsState();
    const isMountedRef = useRef(true);
    const latestSettingsRef = useRef(settings);
    latestSettingsRef.current = settings;
    // Standalone adapter: the calendar sidebar must work without StorageContext, so it owns a local
    // FrontmatterSyncService instance restricted to the markdownPipeline provider (properties only).
    const calendarContentServiceRef = useRef<FrontmatterSyncService | null>(null);
    const visibleCalendarNoteFilesRef = useRef<TFile[]>([]);
    const visibleCalendarNotePathsRef = useRef<Set<string>>(new Set());
    const [storageRuntimeActive, setStorageRuntimeActive] = useState(() => isStorageRuntimeActive());

    const getCalendarContentService = useCallback(() => {
        if (!calendarContentServiceRef.current) {
            calendarContentServiceRef.current = new FrontmatterSyncService(app);
        }

        return calendarContentServiceRef.current;
    }, [app]);

    const queueCalendarContentRefresh = useCallback(
        (files: TFile[]) => {
            if (storageRuntimeActive || isStorageRuntimeActive() || files.length === 0) {
                return;
            }

            const markdownFiles = files.filter(file => file.extension === 'md');
            if (markdownFiles.length === 0) {
                return;
            }

            void getCalendarContentService().processFiles(markdownFiles, latestSettingsRef.current, {
                providers: ['markdownPipeline']
            });
        },
        [getCalendarContentService, storageRuntimeActive]
    );

    useEffect(() => {
        isMountedRef.current = true;

        return () => {
            isMountedRef.current = false;
            calendarContentServiceRef.current?.stop();
            calendarContentServiceRef.current = null;
        };
    }, []);

    useEffect(() => subscribeStorageRuntimeActive(setStorageRuntimeActive), []);

    useEffect(() => {
        if (storageRuntimeActive) {
            // Storage runtime owns content generation while active → drop the standalone pending work.
            calendarContentServiceRef.current?.stop();
            calendarContentServiceRef.current = null;
            return;
        }

        // Restart after a previous stop() so queued refreshes are processed again.
        calendarContentServiceRef.current?.start();
        queueCalendarContentRefresh(visibleCalendarNoteFilesRef.current);
    }, [queueCalendarContentRefresh, storageRuntimeActive]);

    useEffect(() => {
        const modifyRef = app.vault.on('modify', file => {
            if (storageRuntimeActive || !(file instanceof TFile) || file.extension !== 'md') {
                return;
            }

            if (!visibleCalendarNotePathsRef.current.has(file.path)) {
                return;
            }

            queueCalendarContentRefresh([file]);
        });

        return () => {
            app.vault.offref(modifyRef);
        };
    }, [app.vault, queueCalendarContentRefresh, storageRuntimeActive]);

    const handleAddDateFilter = useCallback(
        (dateToken: string) => {
            runAsyncAction(async () => {
                let leaves = plugin.getNavigatorLeaves();
                let shouldRevealLeaf = true;
                if (leaves.length === 0) {
                    await plugin.activateView();
                    leaves = plugin.getNavigatorLeaves();
                    shouldRevealLeaf = false;
                }

                const navigatorLeaf = leaves[0];
                if (!navigatorLeaf) {
                    return;
                }

                const navigatorView = navigatorLeaf.view;
                if (!(navigatorView instanceof NotebookNavigatorView)) {
                    return;
                }

                navigatorView.addDateFilterToSearch(dateToken);
                if (shouldRevealLeaf) {
                    await app.workspace.revealLeaf(navigatorLeaf);
                }
            });
        },
        [app.workspace, plugin]
    );
    const handleVisibleCalendarNoteFilesChange = useCallback(
        (files: TFile[]) => {
            visibleCalendarNoteFilesRef.current = files;
            visibleCalendarNotePathsRef.current = new Set(files.map(file => file.path));
            queueCalendarContentRefresh(files);
        },
        [queueCalendarContentRefresh]
    );

    return (
        <div className="nn-calendar-right-sidebar nn-list-pane">
            <div className="nn-calendar-right-sidebar-content">
                <Calendar
                    weeksToShowOverride={6}
                    onAddDateFilter={handleAddDateFilter}
                    onVisibleCalendarNoteFilesChange={handleVisibleCalendarNoteFilesChange}
                    isRightSidebar={true}
                />
            </div>
        </div>
    );
}
