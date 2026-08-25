/**
 * useAppStore.ts
 * ─────────────────────────────────────────────────────────
 * Global Zustand state store for the GLCC Navigator app.
 * Single source of truth for all shared app state.
 *
 * Persisted to device storage (survives app close):
 *  - transportMode: user's selected travel mode
 *  - canUseStairs: accessibility preference
 *  - hasCompletedOnboarding: first launch flag
 *
 * Session state (resets on app close):
 *  - selectedPOI: currently tapped POI
 *  - activeRoute: current route coordinates (main segment —
 *    either the full route, or the vehicle portion of a
 *    multi-modal route)
 *  - finalApproachRoute: the last-mile walking segment when
 *    a vehicle mode can't reach the destination directly —
 *    rendered as a dashed/lighter line, null otherwise
 *  - activeFilters: active POI filter tags
 *  - isLoadingRoute: route calculation in progress
 *  - routeError: error message if routing fails
 *
 * Used by: all screens and most components
 * ─────────────────────────────────────────────────────────
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TransportMode, RouteOptions } from '../types/route.types';
import { POI, ActivityTag, POICategory } from '../types/poi.types';

interface AppState {
    // ─── Persisted User Preferences ───────────────────────────
    transportMode: TransportMode;
    canUseStairs: boolean;
    hasCompletedOnboarding: boolean;

    // ─── Session State ─────────────────────────────────────────
    selectedPOI: POI | null;
    activeRoute: [number, number][] | null;
    finalApproachRoute: [number, number][] | null;
    activeFilters: (ActivityTag | POICategory | string)[];
    isLoadingRoute: boolean;
    routeError: string | null;

    // ─── Actions: Preferences ──────────────────────────────────
    setTransportMode: (mode: TransportMode) => void;
    setCanUseStairs: (can: boolean) => void;
    completeOnboarding: () => void;
    resetOnboarding: () => void;

    // ─── Actions: Navigation ───────────────────────────────────
    setSelectedPOI: (poi: POI | null) => void;
    setActiveRoute: (route: [number, number][] | null) => void;
    setFinalApproachRoute: (route: [number, number][] | null) => void;
    setIsLoadingRoute: (loading: boolean) => void;
    setRouteError: (error: string | null) => void;
    clearRoute: () => void;

    // ─── Actions: Filters ──────────────────────────────────────
    toggleFilter: (tag: ActivityTag | POICategory | string) => void;
    clearFilters: () => void;

    // ─── Derived ───────────────────────────────────────────────
    getRouteOptions: () => RouteOptions;
}

export const useAppStore = create<AppState>()(
    persist(
        (set, get) => ({
            // ─── Defaults ────────────────────────────────────────
            transportMode: 'walking',
            canUseStairs: true,
            hasCompletedOnboarding: false,
            selectedPOI: null,
            activeRoute: null,
            finalApproachRoute: null,
            activeFilters: [],
            isLoadingRoute: false,
            routeError: null,

            // ─── Preference Actions ───────────────────────────────
            setTransportMode: (mode) => set({ transportMode: mode }),

            setCanUseStairs: (can) => set({ canUseStairs: can }),

            completeOnboarding: () => set({ hasCompletedOnboarding: true }),

            resetOnboarding: () =>
                set({
                    hasCompletedOnboarding: false,
                    transportMode: 'walking',
                    canUseStairs: true,
                }),

            // ─── Navigation Actions ───────────────────────────────
            setSelectedPOI: (poi) => set({ selectedPOI: poi }),

            setActiveRoute: (route) =>
                set({
                    activeRoute: route,
                    isLoadingRoute: false,
                    routeError: null,
                }),

            setFinalApproachRoute: (route) => set({ finalApproachRoute: route }),

            setIsLoadingRoute: (loading) => set({ isLoadingRoute: loading }),

            setRouteError: (error) =>
                set({
                    routeError: error,
                    isLoadingRoute: false,
                    activeRoute: null,
                    finalApproachRoute: null,
                }),

            clearRoute: () =>
                set({
                    activeRoute: null,
                    finalApproachRoute: null,
                    routeError: null,
                    isLoadingRoute: false,
                }),

            // ─── Filter Actions ───────────────────────────────────
            toggleFilter: (tag) =>
                set((state) => ({
                    activeFilters: state.activeFilters.includes(tag)
                        ? state.activeFilters.filter((f) => f !== tag)
                        : [...state.activeFilters, tag],
                })),

            clearFilters: () => set({ activeFilters: [] }),

            // ─── Derived ──────────────────────────────────────────
            getRouteOptions: () => ({
                transportMode: get().transportMode,
                noStairs: !get().canUseStairs,
            }),
        }),
        {
            name: 'glcc-app-storage',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({
                transportMode: state.transportMode,
                canUseStairs: state.canUseStairs,
                hasCompletedOnboarding: state.hasCompletedOnboarding,
            }),
        }
    )
);