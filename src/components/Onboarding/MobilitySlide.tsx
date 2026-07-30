/**
 * MobilitySlide.tsx
 * ─────────────────────────────────────────────────────────
 * Third slide of the onboarding flow.
 * Asks the user if they can navigate stairs.
 * Sets canUseStairs in the Zustand store.
 *
 * If the user selects "No":
 *  - A* routing will skip all edges where hasStairs: true
 *  - POIs only reachable via stairs are flagged in the UI
 *  - Inaccessible POIs are hidden from filtered results
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

interface MobilitySlideProps {
    onNext: () => void;
}

export function MobilitySlide({ onNext }: MobilitySlideProps) {
    const { canUseStairs, setCanUseStairs } = useAppStore();

    return (
        <LinearGradient
            colors={['#1a4a2e', '#2d7a4f']}
            style={styles.container}
        >
            <View style={styles.header}>
                <Text style={styles.step}>Step 2 of 2</Text>
                <Text style={styles.title}>
                    Can you comfortably{'\n'}navigate stairs?
                </Text>
                <Text style={styles.subtitle}>
                    The campus has some hilly areas with steps between paths.
                    We'll route around them if needed.
                </Text>
            </View>

            <View style={styles.optionsContainer}>
                {/* Yes — stairs are fine */}
                <TouchableOpacity
                    style={[
                        styles.option,
                        canUseStairs && styles.optionSelected,
                    ]}
                    onPress={() => setCanUseStairs(true)}
                    activeOpacity={0.8}
                >
                    <Text style={styles.optionEmoji}>🦵</Text>
                    <View style={styles.optionText}>
                        <Text
                            style={[
                                styles.optionLabel,
                                canUseStairs && styles.optionLabelSelected,
                            ]}
                        >
                            Yes, stairs are fine
                        </Text>
                        <Text
                            style={[
                                styles.optionDescription,
                                canUseStairs && styles.optionDescriptionSelected,
                            ]}
                        >
                            Show me all routes including steps
                        </Text>
                    </View>
                    {canUseStairs && (
                        <Text style={styles.checkmark}>✓</Text>
                    )}
                </TouchableOpacity>

                {/* No — avoid stairs */}
                <TouchableOpacity
                    style={[
                        styles.option,
                        !canUseStairs && styles.optionSelected,
                    ]}
                    onPress={() => setCanUseStairs(false)}
                    activeOpacity={0.8}
                >
                    <Text style={styles.optionEmoji}>♿</Text>
                    <View style={styles.optionText}>
                        <Text
                            style={[
                                styles.optionLabel,
                                !canUseStairs && styles.optionLabelSelected,
                            ]}
                        >
                            No, please avoid stairs
                        </Text>
                        <Text
                            style={[
                                styles.optionDescription,
                                !canUseStairs && styles.optionDescriptionSelected,
                            ]}
                        >
                            Only show accessible routes and ramps
                        </Text>
                    </View>
                    {!canUseStairs && (
                        <Text style={styles.checkmark}>✓</Text>
                    )}
                </TouchableOpacity>
            </View>

            {/* Accessibility note */}
            {!canUseStairs && (
                <View style={styles.accessibilityNote}>
                    <Text style={styles.accessibilityNoteText}>
                        ♿ Accessibility mode is on. Some areas of campus may
                        not be fully reachable without stairs. We'll always
                        find the best accessible route available.
                    </Text>
                </View>
            )}

            <Text style={styles.changeNote}>
                You can change this anytime in settings
            </Text>

            <TouchableOpacity style={styles.button} onPress={onNext}>
                <Text style={styles.buttonText}>Continue →</Text>
            </TouchableOpacity>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 32,
        paddingTop: 80,
        paddingBottom: 60,
    },
    header: {
        marginBottom: 32,
    },
    step: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.5)',
        letterSpacing: 2,
        textTransform: 'uppercase',
        marginBottom: 12,
    },
    title: {
        fontSize: 32,
        fontWeight: '700',
        color: '#ffffff',
        lineHeight: 40,
        marginBottom: 12,
    },
    subtitle: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.7)',
        lineHeight: 22,
    },
    optionsContainer: {
        gap: 16,
        marginBottom: 24,
    },
    option: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 16,
        padding: 24,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    optionSelected: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderColor: '#ffffff',
    },
    optionEmoji: {
        fontSize: 36,
        marginRight: 16,
    },
    optionText: {
        flex: 1,
    },
    optionLabel: {
        fontSize: 18,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.85)',
        marginBottom: 4,
    },
    optionLabelSelected: {
        color: '#ffffff',
    },
    optionDescription: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.55)',
    },
    optionDescriptionSelected: {
        color: 'rgba(255,255,255,0.75)',
    },
    checkmark: {
        fontSize: 20,
        color: '#ffffff',
        fontWeight: '700',
    },
    accessibilityNote: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderLeftWidth: 3,
        borderLeftColor: '#ffffff',
    },
    accessibilityNoteText: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.8)',
        lineHeight: 20,
    },
    changeNote: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.45)',
        textAlign: 'center',
        marginBottom: 16,
    },
    button: {
        backgroundColor: '#ffffff',
        paddingVertical: 16,
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