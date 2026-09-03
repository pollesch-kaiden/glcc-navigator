/**
 * SettingsScreen.tsx
 * ─────────────────────────────────────────────────────────
 * Full-screen settings modal. Presented via a slide-up
 * animation with a down-chevron dismiss button in the top
 * left, matching common professional app patterns (Apple
 * Music, Spotify, etc).
 *
 * Sections:
 *  - Accessibility preference (stairs OK / avoid stairs)
 *  - Default transport mode
 *  - Offline map management (download/delete)
 *  - Contact and bug reporting
 *  - App info and map attribution credits
 *
 * Used by: MapScreen.tsx
 * ─────────────────────────────────────────────────────────
 */

import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
    Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { TransportIcon } from '@/components/Routing/TransportIcon';
import { TransportMode } from '@/types';
import { OfflinePackStatus } from '@/hooks/useOfflinePack';
import { promptAndDownload } from '@/utils/offlineDownloadPrompt';
import { getAppVersion} from "@/utils/appInfo";
import { useAdminStore} from "@/store/useAdminStore";
import {exportPOIData} from "@/utils/exportPOIData";

// Easy to update once a real contact address is decided
const SUPPORT_EMAIL = 'kaidenpollesch@gmail.com';

const TRANSPORT_OPTIONS: { mode: TransportMode; label: string }[] = [
    { mode: 'walking', label: 'Walking' },
    { mode: 'biking', label: 'Biking' },
    { mode: 'golf_cart', label: 'Golf Cart' },
    { mode: 'car', label: 'Car' },
];

interface SettingsScreenProps {
    onClose: () => void;
    canUseStairs: boolean;
    setCanUseStairs: (value: boolean) => void;
    transportMode: TransportMode;
    setTransportMode: (mode: TransportMode) => void;
    offlineStatus: OfflinePackStatus;
    offlineProgress: number;
    offlineError: string | null;
    onDownloadOffline: () => void;
    onDeleteOffline: () => void;
    onOpenAdminList: () => void;
}

export function SettingsScreen({
   onClose,
   canUseStairs,
   setCanUseStairs,
   transportMode,
   setTransportMode,
   offlineStatus,
   offlineProgress,
   offlineError,
   onDownloadOffline,
   onDeleteOffline,
   onOpenAdminList,
   }: SettingsScreenProps) {
    const insets = useSafeAreaInsets();
    const appVersion = getAppVersion();

    function handleDeleteOfflinePress() {
        Alert.alert(
            'Delete Offline Map',
            'This will remove the downloaded map data. You can download it again anytime, but it will require an internet connection.',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: onDeleteOffline },
            ]
        );
    }

    function handleContactPress() {
        Linking.openURL(
            `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
                'GLCC Navigator - Contact'
            )}`
        );
    }

    function handleReportBugPress() {
        Linking.openURL(
            `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
                'GLCC Navigator - Bug Report'
            )}&body=${encodeURIComponent(
                `App Version: ${appVersion}\n\nDescribe the issue:\n`
            )}`
        );
    }

    const { isAdminUnlocked, unlockAdmin, lockAdmin } = useAdminStore();
    const [versionTapCount, setVersionTapCount] = useState(0);
    const lastTapTime = useRef(0);
    const TAP_WINDOW_MS = 2000; // taps must happen within 2s of each other

    function handleVersionTap() {
        const now = Date.now();

        if (now - lastTapTime.current > TAP_WINDOW_MS) {
            // Too much time passed since the last tap — restart the count
            setVersionTapCount(1);
        } else {
            const next = versionTapCount + 1;
            setVersionTapCount(next);

            if (next >= 7) {
                setVersionTapCount(0);

                if (isAdminUnlocked) {
                    lockAdmin();
                    Alert.alert('Admin Mode Locked', 'The POI editor is now hidden.');
                } else {
                    unlockAdmin();
                    Alert.alert('Admin Mode Unlocked', 'You now have access to the POI editor.');
                }
            }
        }

        lastTapTime.current = now;
    }

    return (
        <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={onClose}
                    style={styles.closeButton}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                    <Ionicons name="chevron-down" size={24} color="#1a2e1a" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Settings</Text>
                <View style={styles.headerSpacer} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Accessibility */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Accessibility</Text>
                    <Text style={styles.sectionDescription}>
                        Choose whether routes should avoid stairs
                    </Text>

                    <TouchableOpacity
                        style={[styles.optionRow, canUseStairs && styles.optionRowSelected]}
                        onPress={() => setCanUseStairs(true)}
                    >
                        <Ionicons
                            name="walk-outline"
                            size={22}
                            color={canUseStairs ? '#1a4a2e' : '#666'}
                        />
                        <Text
                            style={[styles.optionLabel, canUseStairs && styles.optionLabelSelected]}
                        >
                            Stairs are fine
                        </Text>
                        {canUseStairs && (
                            <Ionicons name="checkmark-circle" size={20} color="#1a4a2e" />
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.optionRow, !canUseStairs && styles.optionRowSelected]}
                        onPress={() => setCanUseStairs(false)}
                    >
                        <MaterialIcons
                            name="accessible"
                            size={22}
                            color={!canUseStairs ? '#1a4a2e' : '#666'}
                        />
                        <Text
                            style={[styles.optionLabel, !canUseStairs && styles.optionLabelSelected]}
                        >
                            Avoid stairs
                        </Text>
                        {!canUseStairs && (
                            <Ionicons name="checkmark-circle" size={20} color="#1a4a2e" />
                        )}
                    </TouchableOpacity>
                </View>

                {/* Default Transport Mode */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Default Transport Mode</Text>
                    <Text style={styles.sectionDescription}>
                        Used each time you open the app
                    </Text>

                    {TRANSPORT_OPTIONS.map((option) => {
                        const isSelected = transportMode === option.mode;
                        return (
                            <TouchableOpacity
                                key={option.mode}
                                style={[styles.optionRow, isSelected && styles.optionRowSelected]}
                                onPress={() => setTransportMode(option.mode)}
                            >
                                <TransportIcon
                                    mode={option.mode}
                                    size={22}
                                    color={isSelected ? '#1a4a2e' : '#666'}
                                />
                                <Text
                                    style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}
                                >
                                    {option.label}
                                </Text>
                                {isSelected && (
                                    <Ionicons name="checkmark-circle" size={20} color="#1a4a2e" />
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* Offline Map */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Offline Map</Text>

                    {offlineStatus === 'ready' && (
                        <>
                            <View style={styles.statusRow}>
                                <Ionicons name="checkmark-circle" size={20} color="#2d7a4f" />
                                <Text style={styles.statusText}>Map downloaded for offline use</Text>
                            </View>
                            <TouchableOpacity
                                style={styles.dangerButton}
                                onPress={handleDeleteOfflinePress}
                            >
                                <Text style={styles.dangerButtonText}>Delete Offline Map</Text>
                            </TouchableOpacity>
                        </>
                    )}

                    {offlineStatus === 'not-downloaded' && (
                        <>
                            <Text style={styles.sectionDescription}>
                                Download the campus map so it works without an internet connection
                            </Text>
                            <TouchableOpacity
                                style={styles.primaryButton}
                                onPress={() => promptAndDownload(onDownloadOffline)}
                            >
                                <Text style={styles.primaryButtonText}>Download Map</Text>
                            </TouchableOpacity>
                        </>
                    )}

                    {offlineStatus === 'downloading' && (
                        <View style={styles.statusRow}>
                            <Ionicons name="cloud-download-outline" size={20} color="#1a4a2e" />
                            <Text style={styles.statusText}>
                                Downloading... {Math.round(offlineProgress)}%
                            </Text>
                        </View>
                    )}

                    {offlineStatus === 'error' && (
                        <>
                            <View style={styles.statusRow}>
                                <Ionicons name="alert-circle-outline" size={20} color="#c0392b" />
                                <Text style={styles.statusText}>{offlineError}</Text>
                            </View>
                            <TouchableOpacity
                                style={styles.primaryButton}
                                onPress={() => promptAndDownload(onDownloadOffline)}
                            >
                                <Text style={styles.primaryButtonText}>Retry Download</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>

                {/* Contact & Support */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Contact & Support</Text>

                    <TouchableOpacity style={styles.linkRow} onPress={handleContactPress}>
                        <Ionicons name="mail-outline" size={20} color="#1a4a2e" />
                        <Text style={styles.linkText}>Contact Us</Text>
                        <Ionicons name="chevron-forward" size={18} color="#999" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.linkRow} onPress={handleReportBugPress}>
                        <Ionicons name="bug-outline" size={20} color="#1a4a2e" />
                        <Text style={styles.linkText}>Report a Bug</Text>
                        <Ionicons name="chevron-forward" size={18} color="#999" />
                    </TouchableOpacity>
                </View>

                {/* App Info */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>About</Text>
                    <TouchableOpacity onPress={handleVersionTap} activeOpacity={1}>
                        <Text style={styles.aboutText}>GLCC Navigator v{appVersion}</Text>
                    </TouchableOpacity>
                    {isAdminUnlocked && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Admin</Text>

                            <TouchableOpacity style={styles.linkRow} onPress={onOpenAdminList}>
                                <Ionicons name="create-outline" size={20} color="#1a4a2e" />
                                <Text style={styles.linkText}>Manage POIs</Text>
                                <Ionicons name="chevron-forward" size={18} color="#999" />
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.linkRow} onPress={exportPOIData}>
                                <Ionicons name="share-outline" size={20} color="#1a4a2e" />
                                <Text style={styles.linkText}>Export POI Data</Text>
                                <Ionicons name="chevron-forward" size={18} color="#999" />
                            </TouchableOpacity>
                        </View>
                    )}
                    <Text style={styles.attributionText}>
                        Map data from OpenStreetMap contributors, available under the
                        Open Database License. Map rendering by MapLibre. Tiles hosted
                        by Protomaps.
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    closeButton: {
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#1a2e1a',
    },
    headerSpacer: {
        width: 32,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 40,
    },
    section: {
        marginBottom: 28,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: '#1a2e1a',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    sectionDescription: {
        fontSize: 13,
        color: '#777',
        marginBottom: 12,
    },
    optionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderRadius: 12,
        backgroundColor: '#f7f7f7',
        marginBottom: 8,
    },
    optionRowSelected: {
        backgroundColor: '#e8f5e9',
    },
    optionLabel: {
        flex: 1,
        fontSize: 15,
        color: '#444',
        fontWeight: '500',
    },
    optionLabelSelected: {
        color: '#1a2e1a',
        fontWeight: '700',
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    statusText: {
        fontSize: 14,
        color: '#444',
        flexShrink: 1,
    },
    primaryButton: {
        backgroundColor: '#1a4a2e',
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
    },
    primaryButtonText: {
        color: '#ffffff',
        fontWeight: '700',
        fontSize: 14,
    },
    dangerButton: {
        backgroundColor: '#fdecea',
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
    },
    dangerButtonText: {
        color: '#c0392b',
        fontWeight: '700',
        fontSize: 14,
    },
    linkRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderRadius: 12,
        backgroundColor: '#f7f7f7',
        marginBottom: 8,
    },
    linkText: {
        flex: 1,
        fontSize: 15,
        color: '#1a2e1a',
        fontWeight: '500',
    },
    aboutText: {
        fontSize: 14,
        color: '#444',
        marginBottom: 8,
    },
    attributionText: {
        fontSize: 12,
        color: '#999',
        lineHeight: 18,
    },
});