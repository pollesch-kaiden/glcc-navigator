/**
 * TransportPicker.tsx
 * ─────────────────────────────────────────────────────────
 * Transport mode selector at top of map screen.
 * Used by: MapScreen.tsx
 * ─────────────────────────────────────────────────────────
 */

import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TransportMode } from '@/types';
import { useAppStore } from '@/store/useAppStore';
import {TransportIcon} from "@/components/Routing/TransportIcon";

interface TransportOption {
    mode: TransportMode;
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
}

const TRANSPORT_OPTIONS: { mode: TransportMode; label: string }[] = [
    { mode: 'walking', label: 'Walk' },
    { mode: 'biking', label: 'Bike' },
    { mode: 'golf_cart', label: 'Cart' },
    { mode: 'car', label: 'Car' },
];

export function TransportPicker() {
    const { transportMode, setTransportMode, clearRoute } = useAppStore();

    function handleSelect(mode: TransportMode) {
        setTransportMode(mode);
        clearRoute();
    }

    return (
        <View style={styles.wrapper}>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                bounces={false}
            >
                {TRANSPORT_OPTIONS.map((option) => {
                    const isSelected = transportMode === option.mode;
                    return (
                        <TouchableOpacity
                            key={option.mode}
                            style={[styles.option, isSelected && styles.optionSelected]}
                            onPress={() => handleSelect(option.mode)}
                            activeOpacity={0.8}
                        >
                            <TransportIcon
                                mode={option.mode}
                                size={16}
                                color={isSelected ? '#ffffff' : '#1a2e1a'}
                            />
                            <Text style={[styles.label, isSelected && styles.labelSelected]}>
                                {option.label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderRadius: 24,
        marginHorizontal: 16,
        marginTop: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
    },
    scrollContent: { paddingHorizontal: 8, paddingVertical: 6, gap: 4 },
    option: {
        flexDirection: 'row', alignItems: 'center',
        paddingVertical: 8, paddingHorizontal: 14, borderRadius: 18, gap: 6,
    },
    optionSelected: { backgroundColor: '#1a4a2e' },
    label: { fontSize: 14, fontWeight: '600', color: '#1a2e1a' },
    labelSelected: { color: '#ffffff' },
});