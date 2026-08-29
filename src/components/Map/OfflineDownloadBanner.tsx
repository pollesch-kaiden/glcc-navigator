/**
 * OfflineDownloadBanner.tsx
 * ─────────────────────────────────────────────────────────
 * Prompts the user to download the campus map for offline
 * use. Shown on the map screen when no offline pack exists
 * yet. Displays download progress once started, and hides
 * automatically once the pack is ready.
 *
 * Checks network type before downloading — if on cellular,
 * shows a native-style confirmation (similar to the App
 * Store's "Use Wi-Fi Only" / "Use Cellular Data" prompt)
 * since offline map packs can be a large download.
 *
 * Used by: MapScreen.tsx
 * ─────────────────────────────────────────────────────────
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Network from 'expo-network';
import { OfflinePackStatus } from '../../hooks/useOfflinePack';

interface OfflineDownloadBannerProps {
    status: OfflinePackStatus;
    progress: number;
    error: string | null;
    onDownload: () => void;
}

async function handleDownloadPress(onDownload: () => void) {
    const state = await Network.getNetworkStateAsync();

    if (state.type === Network.NetworkStateType.WIFI) {
        onDownload();
        return;
    }

    if (state.type === Network.NetworkStateType.CELLULAR) {
        Alert.alert(
            'Cellular Data',
            'Downloading the offline map may use a large amount of cellular data. Wait for Wi-Fi, or continue using cellular?',
            [
                { text: 'Wait for Wi-Fi', style: 'cancel' },
                { text: 'Use Cellular', style: 'default', onPress: onDownload },
            ]
        );
        return;
    }

    Alert.alert(
        'No Internet Connection',
        'Connect to Wi-Fi or cellular data to download the offline map.'
    );
}

export function OfflineDownloadBanner({
                                          status,
                                          progress,
                                          error,
                                          onDownload,
                                      }: OfflineDownloadBannerProps) {
    if (status === 'ready' || status === 'checking') return null;

    return (
        <View style={styles.container}>
            {status === 'not-downloaded' && (
                <>
                    <Ionicons name="cloud-download-outline" size={20} color="#1a4a2e" />
                    <View style={styles.textContainer}>
                        <Text style={styles.title}>Download map for offline use</Text>
                        <Text style={styles.subtitle}>
                            Lets the map work without a connection on campus
                        </Text>
                    </View>
                    <TouchableOpacity
                        style={styles.button}
                        onPress={() => handleDownloadPress(onDownload)}
                    >
                        <Text style={styles.buttonText}>Download</Text>
                    </TouchableOpacity>
                </>
            )}

            {status === 'downloading' && (
                <>
                    <Ionicons name="cloud-download-outline" size={20} color="#1a4a2e" />
                    <View style={styles.textContainer}>
                        <Text style={styles.title}>Downloading map...</Text>
                        <View style={styles.progressBarTrack}>
                            <View
                                style={[styles.progressBarFill, { width: `${progress}%` }]}
                            />
                        </View>
                    </View>
                    <Text style={styles.progressPercent}>{Math.round(progress)}%</Text>
                </>
            )}

            {status === 'error' && (
                <>
                    <Ionicons name="alert-circle-outline" size={20} color="#c0392b" />
                    <View style={styles.textContainer}>
                        <Text style={styles.title}>Download failed</Text>
                        <Text style={styles.subtitle}>{error}</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.button}
                        onPress={() => handleDownloadPress(onDownload)}
                    >
                        <Text style={styles.buttonText}>Retry</Text>
                    </TouchableOpacity>
                </>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 130,
        left: 16,
        right: 16,
        backgroundColor: '#ffffff',
        borderRadius: 14,
        padding: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
        zIndex: 150,
    },
    textContainer: {
        flex: 1,
    },
    title: {
        fontSize: 13,
        fontWeight: '700',
        color: '#1a2e1a',
    },
    subtitle: {
        fontSize: 11,
        color: '#666',
        marginTop: 1,
    },
    button: {
        backgroundColor: '#1a4a2e',
        paddingVertical: 6,
        paddingHorizontal: 14,
        borderRadius: 16,
    },
    buttonText: {
        color: '#ffffff',
        fontSize: 12,
        fontWeight: '700',
    },
    progressBarTrack: {
        height: 4,
        backgroundColor: '#e0e0e0',
        borderRadius: 2,
        marginTop: 4,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#2d7a4f',
    },
    progressPercent: {
        fontSize: 13,
        fontWeight: '700',
        color: '#1a4a2e',
    },
});