/**
 * App.tsx
 * ─────────────────────────────────────────────────────────
 * Root component of the GLCC Navigator app.
 * Renders the AppNavigator which handles all routing
 * between onboarding and the main map experience.
 *
 * SafeAreaProvider ensures content respects device notches
 * and home indicators on modern iPhones.
 * ─────────────────────────────────────────────────────────
 */

import React, { useEffect } from 'react';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import { AppNavigator } from '@/navigation/AppNavigator';
import { useRemoteContentStore } from '@/store/useRemoteContentStore';

export default function App() {
    const checkForUpdates = useRemoteContentStore((state) => state.checkForUpdates);

    useEffect(() => {
        void checkForUpdates();
    }, [checkForUpdates]);

    return (
        <SafeAreaProvider initialMetrics={initialWindowMetrics}>
            <AppNavigator />
        </SafeAreaProvider>
    );
}