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
import { useAppStore } from '../store/useAppStore';
import { OnboardingScreen } from '../screens/OnboardingScreen';

export function AppNavigator() {
    const { hasCompletedOnboarding } = useAppStore();

    // Local state to handle the transition after onboarding
    // completes within the same session
    const [onboardingDone, setOnboardingDone] = useState(
        hasCompletedOnboarding
    );

    function handleOnboardingComplete() {
        setOnboardingDone(true);
    }

    if (!onboardingDone) {
        return (
            <OnboardingScreen onComplete={handleOnboardingComplete} />
        );
    }

// ── Placeholder — MapScreen goes here next ──────────────
    return (
        <View style={styles.placeholder}>
            <Text style={styles.placeholderEmoji}>🗺️</Text>
            <Text style={styles.placeholderTitle}>Map Coming Soon</Text>
            <Text style={styles.placeholderText}>
                Onboarding complete! The map screen is next.
            </Text>

            {/* DEV ONLY — remove before demo */}
            <TouchableOpacity
                style={styles.resetButton}
                onPress={() => {
                    useAppStore.getState().resetOnboarding();
                    setOnboardingDone(false);
                }}
            >
                <Text style={styles.resetText}>🔄 Reset Onboarding</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    placeholder: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#1a4a2e',
        gap: 16,
    },
    placeholderEmoji: {
        fontSize: 64,
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