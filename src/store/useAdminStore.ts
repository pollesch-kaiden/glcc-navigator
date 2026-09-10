/**
 * useAdminStore.ts
 * ─────────────────────────────────────────────────────────
 * Tracks Admin Mode unlock status and every POI change made
 * in-app (add, edit, delete). Persisted to AsyncStorage so
 * changes survive app restarts.
 *
 * adminEdits is keyed by POI id. Each entry is either:
 *  - A partial POI object (new POI, or fields to override on
 *    an existing OSM/custom POI)
 *  - { id, deleted: true } — a tombstone marking a POI as
 *    hidden, used for both custom-only POIs (fully removed on
 *    export) and OSM-sourced POIs (kept as a marker on export
 *    so usePOIs() continues to hide it after a future rebuild)
 *
 * These edits are merged into the live POI list at runtime by
 * usePOIs.ts, taking priority over both bundled OSM and custom
 * data — so changes take effect immediately without a rebuild.
 *
 * Used by: usePOIs.ts, AdminPOIListScreen.tsx,
 *          AdminPOIFormScreen.tsx, SettingsScreen.tsx,
 *          exportPOIData.ts
 * ─────────────────────────────────────────────────────────
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface AdminPOIEntry {
    id: string;
    deleted?: boolean;
    [key: string]: any;
}

// A single traced/edited path segment. Mirrors the shape of a
// GeoJSON LineString Feature's properties plus its own
// coordinates, since paths (unlike POIs) need geometry stored
// alongside their properties.
export interface AdminPathEntry {
    id: string;
    deleted?: boolean;
    coordinates?: number[][];
    name?: string;
    traceGroupId?: string;
    transportModes?: string[];
    hasStairs?: boolean;
    bidirectional?: boolean;
    surface?: string;
    source?: string;
    [key: string]: any;
}

interface AdminState {
    isAdminUnlocked: boolean;
    adminEdits: Record<string, AdminPOIEntry>;
    adminPathEdits: Record<string, AdminPathEntry>;

    unlockAdmin: () => void;
    lockAdmin: () => void;
    saveEdit: (entry: AdminPOIEntry) => void;
    markDeleted: (id: string) => void;
    clearAllEdits: () => void;

    savePathEdit: (entry: AdminPathEntry) => void;
    markPathDeleted: (id: string) => void;
    clearAllPathEdits: () => void;
}
export const useAdminStore = create<AdminState>()(
    persist(
        (set) => ({
            isAdminUnlocked: false,
            adminEdits: {},

            unlockAdmin: () => set({ isAdminUnlocked: true }),
            lockAdmin: () => set({ isAdminUnlocked: false }),

            saveEdit: (entry) =>
                set((state) => ({
                    adminEdits: { ...state.adminEdits, [entry.id]: entry },
                })),

            markDeleted: (id) =>
                set((state) => ({
                    adminEdits: { ...state.adminEdits, [id]: { id, deleted: true } },
                })),

            clearAllEdits: () => set({ adminEdits: {} }),

            adminPathEdits: {},

            savePathEdit: (entry) =>
                set((state) => ({
                    adminPathEdits: { ...state.adminPathEdits, [entry.id]: entry },
                })),

            markPathDeleted: (id) =>
                set((state) => ({
                    adminPathEdits: { ...state.adminPathEdits, [id]: { id, deleted: true } },
                })),

            clearAllPathEdits: () => set({ adminPathEdits: {} }),
        }),
        {
            name: 'glcc-admin-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);