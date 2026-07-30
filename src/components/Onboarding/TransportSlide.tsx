/**
 * TransportSlide.tsx
 * ─────────────────────────────────────────────────────────
 * Second slide of the onboarding flow.
 * Asks the user how they are getting around the campus.
 * Sets the default transport mode in the Zustand store.
 *
 * Transport options:
 *  - Walking (default)
 *  - Biking
 *  - Golf Cart
 *  - Car
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
import { TransportMode } from '../../types/route.types';
import { useAppStore } from '../../store/useAppStore';

const { width } = Dimensions.get('window');

interface TransportSlideProps {
    onNext: () => void;
}

interface TransportOption {
    mode: TransportMode;
    emoji: string;
    label: string;
    description: string;
}

const TRANSPORT_OPTIONS: TransportOption[] = [
    {
        mode: 'walking',
        emoji: '🚶',
        label: 'Walking',
        description: 'On foot',
    },
    {
        mode: 'biking',
        emoji: '🚴',
        label: 'Biking',
        description: 'Bicycle or e-bike',
    },
    {
        mode: 'golf_cart',
        emoji: '⛳',
        label: 'Golf Cart',
        description: 'Campus golf cart',
    },
    {
        mode: 'car',
        emoji: '🚗',
        label: 'Car',
        description: 'Personal vehicle',
    },
];

export function TransportSlide({ onNext }: TransportSlideProps) {
    const { transportMode, setTransportMode } = useAppStore();

    function handleSelect(mode: TransportMode) {
        setTransportMode(mode);
    }

    return (
        <LinearGradient
            colors={['#1a4a2e', '#2d7a4f']}
            style={styles.container}
        >
            <View style={styles.header}>
                <Text style={styles.step}>Step 1 of 2</Text>
                <Text style={styles.title}>How are you{'\n'}getting around?</Text>
                <Text style={styles.subtitle}>
                    We'll show you the best routes for your transport type
                </Text>
            </View>

            <View style={styles.optionsContainer}>
                {TRANSPORT_OPTIONS.map((option) => {
                    const isSelected = transportMode === option.mode;
                    return (
                        <TouchableOpacity
                            key={option.mode}
                            style={[
                                styles.option,
                                isSelected && styles.optionSelected,
                            ]}
                            onPress={() => handleSelect(option.mode)}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.optionEmoji}>{option.emoji}</Text>
                            <View style={styles.optionText}>
                                <Text
                                    style={[
                                        styles.optionLabel,
                                        isSelected && styles.optionLabelSelected,
                                    ]}
                                >
                                    {option.label}
                                </Text>
                                <Text
                                    style={[
                                        styles.optionDescription,
                                        isSelected && styles.optionDescriptionSelected,
                                    ]}
                                >
                                    {option.description}
                                </Text>
                            </View>
                            {isSelected && (
                                <Text style={styles.checkmark}>✓</Text>
                            )}
                        </TouchableOpacity>
                    );
                })}
            </View>

            <Text style={styles.changeNote}>
                You can change this anytime on the map
            </Text>

            <TouchableOpacity style={styles.button} onPress={onNext}>
                <Text style={styles.buttonText}>Next →</Text>
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
        flex: 1,
        gap: 12,
    },
    option: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 16,
        padding: 20,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    optionSelected: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderColor: '#ffffff',
    },
    optionEmoji: {
        fontSize: 32,
        marginRight: 16,
    },
    optionText: {
        flex: 1,
    },
    optionLabel: {
        fontSize: 18,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.85)',
        marginBottom: 2,
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
    changeNote: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.45)',
        textAlign: 'center',
        marginVertical: 16,
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