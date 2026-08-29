/**
 * CoordinatePicker.tsx
 * ─────────────────────────────────────────────────────────
 * Developer tool for finding exact map coordinates.
 * Shows a fixed crosshair in the center of the screen.
 * As the user pans the map beneath it, the live coordinates
 * of whatever is under the crosshair are displayed and can
 * be copied to the clipboard.
 *
 * This is a foundational piece for the future in-app admin
 * editor — used today for manually correcting/adding POI
 * coordinates when building the custom POI JSON file.
 *
 * Toggle on/off via the reticle button in the corner of the
 * map screen. Only meant for development/admin use, not for
 * regular guests.
 *
 * Used by: MapScreen.tsx
 * ─────────────────────────────────────────────────────────
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';

interface CoordinatePickerProps {
    isActive: boolean;
    onToggle: () => void;
    centerCoordinate: [number, number] | null;
}

export function CoordinatePicker({
                                     isActive,
                                     onToggle,
                                     centerCoordinate,
                                 }: CoordinatePickerProps) {
    const [copied, setCopied] = useState(false);

    async function handleCopy() {
        if (!centerCoordinate) return;

        const [lng, lat] = centerCoordinate;
        const formatted = `[${lng.toFixed(7)}, ${lat.toFixed(7)}]`;

        await Clipboard.setStringAsync(formatted);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    }

    return (
        <>
            {/* Toggle button — always visible */}
            <TouchableOpacity
                style={[styles.toggleButton, isActive && styles.toggleButtonActive]}
                onPress={onToggle}
                activeOpacity={0.8}
            >
                <Ionicons
                    name="locate-outline"
                    size={22}
                    color={isActive ? '#ffffff' : '#1a4a2e'}
                />
            </TouchableOpacity>

            {/* Crosshair overlay — only shown when active */}
            {isActive && (
                <>
                    <View style={styles.crosshairContainer} pointerEvents="none">
                        <View style={styles.crosshairVertical} />
                        <View style={styles.crosshairHorizontal} />
                        <View style={styles.crosshairCenterDot} />
                    </View>

                    {/* Coordinate display panel */}
                    <View style={styles.coordPanel}>
                        <Text style={styles.coordLabel}>Center Coordinate</Text>
                        <Text style={styles.coordValue}>
                            {centerCoordinate
                                ? `${centerCoordinate[0].toFixed(7)}, ${centerCoordinate[1].toFixed(7)}`
                                : 'Loading...'}
                        </Text>

                        <TouchableOpacity
                            style={styles.copyButton}
                            onPress={handleCopy}
                            activeOpacity={0.8}
                        >
                            <Ionicons
                                name={copied ? 'checkmark' : 'copy-outline'}
                                size={16}
                                color="#ffffff"
                            />
                            <Text style={styles.copyButtonText}>
                                {copied ? 'Copied!' : 'Copy [lng, lat]'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </>
            )}
        </>
    );
}

const styles = StyleSheet.create({
    toggleButton: {
        position: 'absolute',
        bottom: 20,
        left: 75,
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#ffffff',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
        zIndex: 200,
    },
    toggleButtonActive: {
        backgroundColor: '#1a4a2e',
    },
    crosshairContainer: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        width: 40,
        height: 40,
        marginLeft: -20,
        marginTop: -20,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 150,
    },
    crosshairVertical: {
        position: 'absolute',
        width: 2,
        height: 40,
        backgroundColor: '#e74c3c',
    },
    crosshairHorizontal: {
        position: 'absolute',
        width: 40,
        height: 2,
        backgroundColor: '#e74c3c',
    },
    crosshairCenterDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#e74c3c',
        borderWidth: 1,
        borderColor: '#ffffff',
    },
    coordPanel: {
        position: 'absolute',
        top: 100,
        left: 16,
        right: 16,
        backgroundColor: 'rgba(26,46,26,0.95)',
        borderRadius: 12,
        padding: 14,
        zIndex: 200,
    },
    coordLabel: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.6)',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 4,
    },
    coordValue: {
        fontSize: 15,
        color: '#ffffff',
        fontWeight: '600',
        fontVariant: ['tabular-nums'],
        marginBottom: 10,
    },
    copyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        backgroundColor: '#2d7a4f',
        paddingVertical: 8,
        borderRadius: 8,
    },
    copyButtonText: {
        color: '#ffffff',
        fontSize: 13,
        fontWeight: '600',
    },
});