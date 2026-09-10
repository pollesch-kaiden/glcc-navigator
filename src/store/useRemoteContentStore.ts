import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { checkForRemoteContentUpdate, readCachedRemoteContent } from '@/utils/remoteContent';

interface RemoteContentState {
    poiData: any | null;
    pathData: any | null;
    version: string | null;
    checkedAt: string | null;
    isChecking: boolean;
    error: string | null;
    checkForUpdates: () => Promise<void>;
    hydrateFromCache: () => Promise<void>;
    clearRemoteData: () => void;
}

export const useRemoteContentStore = create<RemoteContentState>()(
    persist(
        (set, get) => ({
            poiData: null,
            pathData: null,
            version: null,
            checkedAt: null,
            isChecking: false,
            error: null,

            hydrateFromCache: async () => {
                const cached = await readCachedRemoteContent();
                set({
                    poiData: cached.poiData,
                    pathData: cached.pathData,
                    version: cached.version,
                    checkedAt: new Date().toISOString(),
                });
            },

            checkForUpdates: async () => {
                if (get().isChecking) return;
                set({ isChecking: true, error: null });

                try {
                    const result = await checkForRemoteContentUpdate();
                    if (result) {
                        set({
                            poiData: result.poiData,
                            pathData: result.pathData,
                            version: result.version,
                            checkedAt: new Date().toISOString(),
                            error: null,
                        });
                    } else {
                        const cached = await readCachedRemoteContent();
                        set({
                            poiData: cached.poiData,
                            pathData: cached.pathData,
                            version: cached.version,
                            checkedAt: new Date().toISOString(),
                        });
                    }
                } catch (error) {
                    set({
                        error: error instanceof Error ? error.message : 'Remote content check failed',
                    });
                } finally {
                    set({ isChecking: false });
                }
            },

            clearRemoteData: () => {
                set({ poiData: null, pathData: null, version: null, checkedAt: null, error: null });
            },
        }),
        {
            name: 'glcc-remote-content',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);