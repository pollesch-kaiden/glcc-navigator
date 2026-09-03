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

import React from 'react';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import { AppNavigator } from '@/navigation/AppNavigator';

export default function App() {
    return (
        <SafeAreaProvider initialMetrics={initialWindowMetrics}>
            <AppNavigator />
        </SafeAreaProvider>
    );
}