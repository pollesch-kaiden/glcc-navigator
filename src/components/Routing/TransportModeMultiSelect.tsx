/**
 * TransportModeMultiSelect.tsx
 * ─────────────────────────────────────────────────────────
 * Multi-select transport mode chips + a Has Stairs toggle,
 * used while tracing or editing a path segment — a single
 * segment can allow several transport modes at once, unlike
 * the single-select TransportPicker used for the user's own
 * active travel mode.
 *
 * Used by: (Path Tracing screen, once built)
 * ─────────────────────────────────────────────────────────
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Switch } from 'react-native';
import { TransportMode } from '@/types';
import { TransportIcon } from './TransportIcon';

interface TransportModeMultiSelectProps {
    selectedModes: TransportMode[];
    onToggleMode: (mode: TransportMode) => void;
    hasStairs: boolean;
    onToggleStairs: (value: boolean) => void;
    disabled?: boolean;
}

const OPTIONS: { mode: TransportMode; label: string }[] = [
    { mode: 'walking', label: 'Walk' },
    { mode: 'biking', label: 'Bike' },
    { mode: 'golf_cart', label: 'Cart' },
    { mode: 'car', label: 'Car' },
];

export function TransportModeMultiSelect({
                                             selectedModes,
                                             onToggleMode,
                                             hasStairs,
                                             onToggleStairs,
                                             disabled = false,
                                         }: TransportModeMultiSelectProps) {
    return (
        <View style={styles.wrapper}>
            <View style={styles.chipRow}>
                {OPTIONS.map((option) => {
                    const isSelected = selectedModes.includes(option.mode);
                    return (
                        <TouchableOpacity
                            key={option.mode}
                            style={[styles.chip, isSelected && styles.chipSelected]}
                            onPress={() => onToggleMode(option.mode)}
                            activeOpacity={0.8}
                            disabled={disabled}
                        >
                            <TransportIcon
                                mode={option.mode}
                                size={15}
                                color={isSelected ? '#ffffff' : '#1a2e1a'}
                            />
                            <Text style={[styles.chipLabel, isSelected && styles.chipLabelSelected]}>
                                {option.label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            <View style={styles.stairsRow}>
                <Text style={styles.stairsLabel}>Has Stairs</Text>
                <Switch value={hasStairs} onValueChange={onToggleStairs} disabled={disabled} />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        backgroundColor: 'rgba(255,255,255,0.97)',
        borderRadius: 16,
        padding: 10,
        gap: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
    },
    chipRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 18,
        backgroundColor: '#f2f2f2',
    },
    chipSelected: {
        backgroundColor: '#1a4a2e',
    },
    chipLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#1a2e1a',
    },
    chipLabelSelected: {
        color: '#ffffff',
    },
    stairsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderTopWidth: 1,
        borderTopColor: '#eee',
        paddingTop: 8,
    },
    stairsLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1a2e1a',
    },
});