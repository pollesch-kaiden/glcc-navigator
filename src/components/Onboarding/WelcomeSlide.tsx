/**
 * WelcomeSlide.tsx
 * ─────────────────────────────────────────────────────────
 * First slide of the onboarding flow.
 * Introduces the app and GLCC to the user.
 * Shows the GLCC logo, app name, and a brief description.
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
    Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface WelcomeSlideProps {
    onNext: () => void;
}

export function WelcomeSlide({ onNext }: WelcomeSlideProps) {
    return (
        <LinearGradient
            colors={['#1a4a2e', '#2d7a4f']}
            style={styles.container}
        >
            <View style={styles.logoContainer}>
                <Image
                    source={require('../../../assets/branding/icon-mark-green.png')}
                    style={styles.logo}
                    resizeMode="contain"
                />
            </View>

            <View style={styles.textContainer}>
                <Text style={styles.title}>Green Lake</Text>
                <Text style={styles.subtitle}>Conference Center</Text>
                <Text style={styles.appName}>Campus Navigator</Text>

                <View style={styles.divider} />

                <Text style={styles.description}>
                    Find buildings, discover activities, and get directions
                    across the 900-acre lakeside campus — even without cell service.
                </Text>
            </View>

            <TouchableOpacity style={styles.button} onPress={onNext}>
                <Text style={styles.buttonText}>Get Started</Text>
                <Ionicons name="arrow-forward" size={18} color="#1a4a2e" />
            </TouchableOpacity>

            <Text style={styles.footer}>
                Takes about 30 seconds to set up
            </Text>
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
    logoContainer: {
        width: 110,
        height: 110,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 32,
    },
    logo: {
        width: 70,
        height: 70,
    },
    textContainer: {
        alignItems: 'center',
        marginBottom: 48,
    },
    title: {
        fontSize: 36,
        fontWeight: '700',
        color: '#ffffff',
        letterSpacing: 1,
    },
    subtitle: {
        fontSize: 20,
        fontWeight: '400',
        color: 'rgba(255,255,255,0.85)',
        marginBottom: 8,
    },
    appName: {
        fontSize: 14,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.6)',
        letterSpacing: 3,
        textTransform: 'uppercase',
        marginBottom: 24,
    },
    divider: {
        width: 60,
        height: 2,
        backgroundColor: 'rgba(255,255,255,0.3)',
        marginBottom: 24,
    },
    description: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.85)',
        textAlign: 'center',
        lineHeight: 24,
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#ffffff',
        paddingVertical: 16,
        paddingHorizontal: 48,
        borderRadius: 32,
        marginBottom: 16,
        width: width - 64,
    },
    buttonText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1a4a2e',
    },
    footer: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.5)',
    },
});