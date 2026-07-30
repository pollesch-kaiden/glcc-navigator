/**
 * ReadySlide.tsx
 * ─────────────────────────────────────────────────────────
 * Final slide of the onboarding flow.
 * Confirms the user's selections and launches the map.
 * Calls completeOnboarding() in the Zustand store which
 * sets hasCompletedOnboarding: true — this means the user
 * will never see onboarding again on this device.
 *
 * Used by: OnboardingScreen.tsx
 * ─────────────────────────────────────────────────────────
 */

import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppStore } from '../../store/useAppStore';

const { width } = Dimensions.get('window');

// Human readable labels for each transport mode
const TRANSPORT_LABELS: Record<string, string> = {
    walking: '🚶 Walking',
    biking: '🚴 Biking',
    golf_cart: '⛳ Golf Cart',
    car: '🚗 Car',
};

interface ReadySlideProps {
    onFinish: () => void;
}

export function ReadySlide({ onFinish }: ReadySlideProps) {
    const { transportMode, canUseStairs, completeOnboarding } =
        useAppStore();

    function handleFinish() {
        completeOnboarding();
        onFinish();
    }

    return (
        <LinearGradient
            colors={['#1a4a2e', '#2d7a4f']}
            style={styles.container}
        >
            <View style={styles.iconContainer}>
                <Text style={styles.icon}>🗺️</Text>
            </View>

            <Text style={styles.title}>You're all set!</Text>
            <Text style={styles.subtitle}>
                Here's how we've set up your experience
            </Text>

            {/* Summary card */}
            <View style={styles.summaryCard}>
                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Transport</Text>
                    <Text style={styles.summaryValue}>
                        {TRANSPORT_LABELS[transportMode]}
                    </Text>
                </View>

                <View style={styles.summaryDivider} />

                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Accessibility</Text>
                    <Text style={styles.summaryValue}>
                        {canUseStairs ? '🦵 Stairs OK' : '♿ Avoiding stairs'}
                    </Text>
                </View>

                <View style={styles.summaryDivider} />

                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Maps</Text>
                    <Text style={styles.summaryValue}>
                        📱 Works offline
                    </Text>
                </View>
            </View>

            <Text style={styles.note}>
                First time opening? Download the campus map on WiFi
                for the best offline experience.
            </Text>

            <TouchableOpacity
                style={styles.button}
                onPress={handleFinish}
                activeOpacity={0.9}
            >
                <Text style={styles.buttonText}>Explore the Campus 🌲</Text>
            </TouchableOpacity>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
        paddingVertical: 60,
    },
    iconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(255,255,255,0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    icon: {
        fontSize: 48,
    },
    title: {
        fontSize: 36,
        fontWeight: '700',
        color: '#ffffff',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.7)',
        marginBottom: 32,
        textAlign: 'center',
    },
    summaryCard: {
        backgroundColor: 'rgba(255,255,255,0.12)',
        borderRadius: 20,
        padding: 24,
        width: '100%',
        marginBottom: 24,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    summaryLabel: {
        fontSize: 15,
        color: 'rgba(255,255,255,0.6)',
    },
    summaryValue: {
        fontSize: 15,
        fontWeight: '600',
        color: '#ffffff',
    },
    summaryDivider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.15)',
        marginVertical: 4,
    },
    note: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.5)',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 32,
        paddingHorizontal: 16,
    },
    button: {
        backgroundColor: '#ffffff',
        paddingVertical: 18,
        paddingHorizontal: 48,
        borderRadius: 32,
        alignItems: 'center',
        width: width - 64,
    },
    buttonText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1a4a2e',
    },
});