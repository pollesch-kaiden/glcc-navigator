/**
 * AppNavigator.tsx
 * ─────────────────────────────────────────────────────────
 * Root navigation component for the GLCC Navigator app.
 * Decides which screen to show based on whether the user
 * has completed onboarding.
 *
 * Flow:
 *  First launch → OnboardingScreen
 *  After onboarding → MapScreen (placeholder for now)
 *
 * Reads hasCompletedOnboarding from Zustand store.
 * Once onboarding is done it's persisted to AsyncStorage
 * so the user never sees it again on this device.
 *
 * Used by: App.tsx
 * ─────────────────────────────────────────────────────────
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../store/useAppStore';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { MapScreen } from '../screens/MapScreen';

export function AppNavigator() {
    const { hasCompletedOnboarding } = useAppStore();

    const [onboardingDone, setOnboardingDone] = useState(
        hasCompletedOnboarding
    );

    function handleOnboardingComplete() {
        setOnboardingDone(true);
    }

    if (!onboardingDone) {
        return <OnboardingScreen onComplete={handleOnboardingComplete} />;
    }

    return <MapScreen />;
}

const styles = StyleSheet.create({
    placeholder: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#1a4a2e',
        gap: 16,
    },
    placeholderTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#ffffff',
    },
    placeholderText: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.6)',
        textAlign: 'center',
        paddingHorizontal: 32,
    },
    resetButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 24,
        backgroundColor: 'rgba(255,255,255,0.15)',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 20,
    },
    resetText: {
        color: '#ffffff',
        fontSize: 14,
    },
});