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
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useAppStore } from '../../store/useAppStore';

const { width } = Dimensions.get('window');

interface MobilitySlideProps {
    onNext: () => void;
}

export function MobilitySlide({ onNext }: MobilitySlideProps) {
    const { canUseStairs, setCanUseStairs } = useAppStore();

    return (
        <LinearGradient colors={['#1a4a2e', '#2d7a4f']} style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.step}>Step 2 of 2</Text>
                <Text style={styles.title}>Can you comfortably{'\n'}navigate stairs?</Text>
                <Text style={styles.subtitle}>
                    The campus has some hilly areas with steps between paths.
                    We'll route around them if needed.
                </Text>
            </View>

            <View style={styles.optionsContainer}>
                <TouchableOpacity
                    style={[styles.option, canUseStairs && styles.optionSelected]}
                    onPress={() => setCanUseStairs(true)}
                    activeOpacity={0.8}
                >
                    <View style={styles.iconWrapper}>
                        <Ionicons
                            name="walk-outline"
                            size={28}
                            color={canUseStairs ? '#1a4a2e' : '#ffffff'}
                        />
                    </View>
                    <View style={styles.optionText}>
                        <Text style={[styles.optionLabel, canUseStairs && styles.optionLabelSelected]}>
                            Yes, stairs are fine
                        </Text>
                        <Text style={[styles.optionDescription, canUseStairs && styles.optionDescriptionSelected]}>
                            Show me all routes including steps
                        </Text>
                    </View>
                    {canUseStairs && (
                        <Ionicons name="checkmark-circle" size={22} color="#1a4a2e" />
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.option, !canUseStairs && styles.optionSelected]}
                    onPress={() => setCanUseStairs(false)}
                    activeOpacity={0.8}
                >
                    <View style={styles.iconWrapper}>
                        <MaterialIcons
                            name="accessible"
                            size={28}
                            color={!canUseStairs ? '#1a4a2e' : '#ffffff'}
                        />
                    </View>
                    <View style={styles.optionText}>
                        <Text style={[styles.optionLabel, !canUseStairs && styles.optionLabelSelected]}>
                            No, please avoid stairs
                        </Text>
                        <Text style={[styles.optionDescription, !canUseStairs && styles.optionDescriptionSelected]}>
                            Only show accessible routes and ramps
                        </Text>
                    </View>
                    {!canUseStairs && (
                        <Ionicons name="checkmark-circle" size={22} color="#1a4a2e" />
                    )}
                </TouchableOpacity>
            </View>

            {!canUseStairs && (
                <View style={styles.accessibilityNote}>
                    <Text style={styles.accessibilityNoteText}>
                        Accessibility mode is on. Some areas of campus may not be
                        fully reachable without stairs. We'll always find the best
                        accessible route available.
                    </Text>
                </View>
            )}

            <Text style={styles.changeNote}>
                You can change this anytime in settings
            </Text>

            <TouchableOpacity style={styles.button} onPress={onNext}>
                <Text style={styles.buttonText}>Continue</Text>
                <Ionicons name="arrow-forward" size={18} color="#1a4a2e" />
            </TouchableOpacity>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, paddingHorizontal: 32, paddingTop: 80, paddingBottom: 60 },
    header: { marginBottom: 32 },
    step: {
        fontSize: 13, color: 'rgba(255,255,255,0.5)', letterSpacing: 2,
        textTransform: 'uppercase', marginBottom: 12,
    },
    title: { fontSize: 32, fontWeight: '700', color: '#ffffff', lineHeight: 40, marginBottom: 12 },
    subtitle: { fontSize: 16, color: 'rgba(255,255,255,0.7)', lineHeight: 22 },
    optionsContainer: { gap: 16, marginBottom: 24 },
    option: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 16, padding: 22,
        borderWidth: 2, borderColor: 'transparent',
    },
    optionSelected: { backgroundColor: 'rgba(255,255,255,0.95)', borderColor: '#ffffff' },
    iconWrapper: { width: 48, alignItems: 'center', marginRight: 12 },
    optionText: { flex: 1 },
    optionLabel: { fontSize: 18, fontWeight: '600', color: 'rgba(255,255,255,0.85)', marginBottom: 4 },
    optionLabelSelected: { color: '#1a2e1a' },
    optionDescription: { fontSize: 14, color: 'rgba(255,255,255,0.55)' },
    optionDescriptionSelected: { color: 'rgba(26,46,26,0.6)' },
    accessibilityNote: {
        backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 16,
        marginBottom: 16, borderLeftWidth: 3, borderLeftColor: '#ffffff',
    },
    accessibilityNoteText: { fontSize: 13, color: 'rgba(255,255,255,0.8)', lineHeight: 20 },
    changeNote: { fontSize: 13, color: 'rgba(255,255,255,0.45)', textAlign: 'center', marginBottom: 16 },
    button: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        backgroundColor: '#ffffff', paddingVertical: 16, paddingHorizontal: 48,
        borderRadius: 32, width: width - 64,
    },
    buttonText: { fontSize: 18, fontWeight: '700', color: '#1a4a2e' },
});