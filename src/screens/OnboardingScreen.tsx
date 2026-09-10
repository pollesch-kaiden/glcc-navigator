/**
 * OnboardingScreen.tsx
 * ─────────────────────────────────────────────────────────
 * Container screen that manages the onboarding flow.
 * Handles progression between the 4 onboarding slides:
 *   0 → WelcomeSlide
 *   1 → TransportSlide
 *   2 → MobilitySlide
 *   3 → ReadySlide
 *
 * Uses a simple step counter and swaps components.
 * Shows a progress indicator at the bottom (dots).
 * Calls onComplete() when the user finishes — the
 * navigator then switches to the main MapScreen.
 *
 * Used by: AppNavigator.tsx
 * ─────────────────────────────────────────────────────────
 */

import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { WelcomeSlide } from '../components/Onboarding/WelcomeSlide';
import { TransportSlide } from '../components/Onboarding/TransportSlide';
import { MobilitySlide } from '../components/Onboarding/MobilitySlide';
import { ReadySlide } from '../components/Onboarding/ReadySlide';

interface OnboardingScreenProps {
    onComplete: () => void;
}

const TOTAL_STEPS = 4;

export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
    const [currentStep, setCurrentStep] = useState(0);

    function goNext() {
        setCurrentStep((prev) => Math.min(prev + 1, TOTAL_STEPS - 1));
    }

    function renderSlide() {
        switch (currentStep) {
            case 0:
                return <WelcomeSlide onNext={goNext} />;
            case 1:
                return <TransportSlide onNext={goNext} />;
            case 2:
                return <MobilitySlide onNext={goNext} />;
            case 3:
                return <ReadySlide onFinish={onComplete} />;
            default:
                return <WelcomeSlide onNext={goNext} />;
        }
    }

    return (
        <View style={styles.container}>
            {renderSlide()}

            {/* Progress dots — only show on slides 1-3 */}
            {currentStep > 0 && currentStep < TOTAL_STEPS - 1 && (
                <View style={styles.dotsContainer}>
                    {[1, 2].map((step) => (
                        <View
                            key={step}
                            style={[
                                styles.dot,
                                currentStep === step && styles.dotActive,
                            ]}
                        />
                    ))}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    dotsContainer: {
        position: 'absolute',
        bottom: 32,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
        pointerEvents: 'none',
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(255,255,255,0.3)',
    },
    dotActive: {
        backgroundColor: '#ffffff',
        width: 24,
    },
});