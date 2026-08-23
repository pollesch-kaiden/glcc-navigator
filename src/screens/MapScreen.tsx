/**
 * MapScreen.tsx
 * ─────────────────────────────────────────────────────────
 * Main screen of the GLCC Navigator app.
 * Orchestrates the map, POI system, and routing UI.
 *
 * Used by: AppNavigator.tsx
 * ─────────────────────────────────────────────────────────
 */

import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {Ionicons, MaterialIcons} from '@expo/vector-icons';
import { GLCCMap } from '../components/Map/GLCCMap';
import { TransportPicker } from '../components/Routing/TransportPicker';
import { useAppStore } from '../store/useAppStore';
import { useLocation } from '../hooks/useLocation';
import { POI, ActivityTag } from '../types/poi.types';
import { usePOIs } from '../hooks/usePOIs';

// ── Category display config ─────────────────────────────────
const CATEGORY_ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
    accommodation: 'bed-outline',
    dining: 'restaurant-outline',
    recreation: 'bicycle-outline',
    chapel: 'business-outline',
    conference: 'people-outline',
    waterfront: 'boat-outline',
    landmark: 'flag-outline',
    restroom: 'body-outline',
    parking: 'car-outline',
    other: 'location-outline',
};

const CATEGORY_LABEL: Record<string, string> = {
    accommodation: 'Lodging',
    dining: 'Dining',
    recreation: 'Recreation',
    chapel: 'Chapel',
    conference: 'Conference',
    waterfront: 'Waterfront',
    landmark: 'Landmark',
    restroom: 'Restroom',
    parking: 'Parking',
    other: 'Point of Interest',
};

export function MapScreen() {
    const { selectedPOI, setSelectedPOI, clearRoute, canUseStairs } =
        useAppStore();

    const { hasPermission } = useLocation();
    const pois = usePOIs();
    const [showPOICard, setShowPOICard] = useState(false);

    const handlePOIPress = useCallback(
        (poi: POI) => {
            setSelectedPOI(poi);
            setShowPOICard(true);
        },
        [setSelectedPOI]
    );

    const handleCloseCard = useCallback(() => {
        setShowPOICard(false);
        setSelectedPOI(null);
        clearRoute();
    }, [setSelectedPOI, clearRoute]);

    return (
        <View style={styles.container}>
            {/* ── Full screen map ─────────────────────────── */}
            <GLCCMap pois={pois} onPOIPress={handlePOIPress} />

            {/* ── Transport mode picker (floating top bar) ── */}
            <View style={styles.topBar}>
                <SafeAreaView edges={['top']}>
                    <TransportPicker />
                </SafeAreaView>
            </View>

            {/* ── No GPS warning ───────────────────────────  */}
            {hasPermission === false && (
                <View style={styles.noGPSBanner}>
                    <Ionicons name="location-outline" size={14} color="#ffffff" />
                    <Text style={styles.noGPSText}>
                        Enable location in Settings for turn-by-turn directions
                    </Text>
                </View>
            )}

            {/* ── POI info card ────────────────────────────  */}
            {showPOICard && selectedPOI && (
                <View style={styles.poiCard}>
                    <TouchableOpacity
                        style={styles.closeButton}
                        onPress={handleCloseCard}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                        <Ionicons name="close" size={18} color="#666" />
                    </TouchableOpacity>

                    <View style={styles.categoryRow}>
                        <Ionicons
                            name={CATEGORY_ICON[selectedPOI.category] ?? 'location-outline'}
                            size={14}
                            color="#2d7a4f"
                        />
                        <Text style={styles.poiCategory}>
                            {CATEGORY_LABEL[selectedPOI.category] ?? 'Point of Interest'}
                        </Text>
                    </View>

                    <Text style={styles.poiName}>{selectedPOI.name}</Text>

                    <Text style={styles.poiDescription} numberOfLines={2}>
                        {selectedPOI.description}
                    </Text>

                    <View style={styles.badgeRow}>
                        {selectedPOI.accessible && (
                            <View style={[styles.badge, styles.badgeGreen]}>
                                <MaterialIcons
                                    name="accessible"
                                    size={12}
                                    color="#1a4a2e"
                                />
                                <Text style={styles.badgeText}>Accessible</Text>
                            </View>
                        )}
                        {selectedPOI.hasStairs && !canUseStairs && (
                            <View style={[styles.badge, styles.badgeOrange]}>
                                <Ionicons
                                    name="warning-outline"
                                    size={12}
                                    color="#8a5a1e"
                                />
                                <Text style={styles.badgeText}>Has stairs</Text>
                            </View>
                        )}
                        {selectedPOI.hours && (
                            <View style={[styles.badge, styles.badgeGray]}>
                                <Ionicons name="time-outline" size={12} color="#555" />
                                <Text style={styles.badgeText}>{selectedPOI.hours}</Text>
                            </View>
                        )}
                    </View>

                    {selectedPOI.activities.length > 0 && (
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            style={styles.activitiesScroll}
                        >
                            {selectedPOI.activities.map((activity) => (
                                <View key={activity} style={styles.activityChip}>
                                    <Text style={styles.activityText}>{activity}</Text>
                                </View>
                            ))}
                        </ScrollView>
                    )}

                    <TouchableOpacity
                        style={[
                            styles.directionsButton,
                            selectedPOI.hasStairs &&
                            !canUseStairs &&
                            styles.directionsButtonWarning,
                        ]}
                        onPress={() => {
                            console.log('Get directions to:', selectedPOI.name);
                        }}
                    >
                        {selectedPOI.hasStairs && !canUseStairs && (
                            <Ionicons
                                name="accessibility-outline"
                                size={18}
                                color="#ffffff"
                            />
                        )}
                        <Text style={styles.directionsText}>
                            {selectedPOI.hasStairs && !canUseStairs
                                ? 'Find Accessible Route'
                                : 'Get Directions'}
                        </Text>
                        <Ionicons name="arrow-forward" size={18} color="#ffffff" />
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    topBar: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
    },
    noGPSBanner: {
        position: 'absolute',
        bottom: 120,
        left: 16,
        right: 16,
        backgroundColor: 'rgba(0,0,0,0.75)',
        borderRadius: 12,
        padding: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    noGPSText: {
        color: '#ffffff',
        fontSize: 13,
        textAlign: 'center',
    },
    poiCard: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#ffffff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: 40,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 8,
        zIndex: 100,
    },
    closeButton: {
        position: 'absolute',
        top: 16,
        right: 16,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#f0f0f0',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 101,
    },
    categoryRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 4,
    },
    poiCategory: {
        fontSize: 12,
        fontWeight: '600',
        color: '#2d7a4f',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    poiName: {
        fontSize: 22,
        fontWeight: '700',
        color: '#1a2e1a',
        marginBottom: 8,
        paddingRight: 40,
    },
    poiDescription: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
        marginBottom: 12,
    },
    badgeRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginBottom: 12,
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 12,
    },
    badgeGreen: {
        backgroundColor: '#e8f5e9',
    },
    badgeOrange: {
        backgroundColor: '#fff3e0',
    },
    badgeGray: {
        backgroundColor: '#f5f5f5',
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '500',
        color: '#333',
    },
    activitiesScroll: {
        marginBottom: 16,
    },
    activityChip: {
        backgroundColor: '#e8f5e9',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 14,
        marginRight: 8,
    },
    activityText: {
        fontSize: 12,
        color: '#2d7a4f',
        fontWeight: '600',
        textTransform: 'capitalize',
    },
    directionsButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#1a4a2e',
        paddingVertical: 16,
        borderRadius: 16,
    },
    directionsButtonWarning: {
        backgroundColor: '#e67e22',
    },
    directionsText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '700',
    },
});