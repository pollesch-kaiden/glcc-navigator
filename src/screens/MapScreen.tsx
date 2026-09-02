/**
 * MapScreen.tsx
 * ─────────────────────────────────────────────────────────
 * Main screen of the GLCC Navigator app.
 * Orchestrates the map, POI system, and routing UI.
 *
 * Used by: AppNavigator.tsx
 * ─────────────────────────────────────────────────────────
 */

import React, {useState, useCallback, useMemo, useEffect, useRef} from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {Ionicons, MaterialIcons} from '@expo/vector-icons';
import { GLCCMap, GLCCMapRef } from '@/components/Map/GLCCMap';
import { GLCC_BOUNDS} from "@/utils/mapStyle";
import { TransportPicker } from '@/components/Routing/TransportPicker';
import { useAppStore } from '@/store/useAppStore';
import { useLocation } from '@/hooks/useLocation';
import { POI } from '@/types';
import { usePOIs } from '@/hooks/usePOIs';
import { useRouting } from '@/hooks/useRouting';
import graphData from '../../assets/map/graph.json';
import { Graph } from '@/types/route.types';
import {useOfflinePack} from "@/hooks/useOfflinePack";
import {OfflineDownloadBanner} from "@/components/Map/OfflineDownloadBanner";
import {OfflineManager} from "@maplibre/maplibre-react-native";
import { SettingsScreen} from "@/screens/SettingsScreen";
import { FilterDrawer} from "@/components/POI/FilterDrawer";

// Cast through unknown since JSON imports don't preserve exact tuple types
const graph = graphData as unknown as Graph;

function isWithinBounds(coords: [number, number], bounds: [number, number, number, number]): boolean {
    const [lng, lat] = coords;
    const [west, south, east, north] = bounds;
    return lng >= west && lng <= east && lat >= south && lat <= north;
}

async function handleResetDatabase() {
    await OfflineManager.resetDatabase();
    console.log('Offline database reset')
}

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
    const {
        selectedPOI,
        setSelectedPOI,
        clearRoute,
        canUseStairs,
        setCanUseStairs,
        setActiveRoute,
        finalApproachRoute,
        parkingLotName,
        transportMode,
        setTransportMode,
        activeFilters,
        toggleFilter,
        clearFilters,
    } = useAppStore();

    const { hasPermission, location } = useLocation();
    const pois = usePOIs();

    const filteredPOIs = useMemo(() => {
        if (activeFilters.length === 0) return pois;
        return pois.filter((poi) =>
            activeFilters.some(
                (filter) => poi.activities.includes(filter as any) || poi.category === filter
            )
        );
    }, [pois, activeFilters]);

    const [showPOICard, setShowPOICard] = useState(false);
    const { status, progress, error, downloadPack, deletePack } = useOfflinePack()
    const [showSettings, setShowSettings] = useState(false);
    const [showFilterDrawer, setShowFilterDrawer] = useState(false);
    const mapRef = useRef<GLCCMapRef>(null);

    // Fallback start point if GPS isn't available — center of GLCC campus
    const FALLBACK_START: [number, number] = [-89.0165, 43.8158];

    const { calculateRoute } = useRouting(graph, pois);

    const isUserOutsideBounds = useMemo(() => {
        if (!location) return false;
        return !isWithinBounds(location, GLCC_BOUNDS);
    }, [location]);

    const handleGetDirections = useCallback(() => {
        if (!selectedPOI) return;

        // Test coordinates near GLCC — replace with real `location`
        // once testing on-site, change to FALLBACK_START
        const start: [number, number] = [-89.0128168, 43.8205914];

        // Real GPS location and use FALLBACK_START when not available
        // const start = location ?? FALLBACK_START;

        if (
            !isWithinBounds(start, GLCC_BOUNDS) ||
            !isWithinBounds(selectedPOI.coordinates, GLCC_BOUNDS)
        ) {
            console.warn('⚠️ Start or destination is outside GLCC bounds — routing skipped');
            useAppStore.getState().setRouteError(
                'Directions are only available while on the GLCC campus.'
            );
            return;
        }

        calculateRoute(start, selectedPOI.nearestNodeId);
    }, [selectedPOI, calculateRoute]);

    // Automatically recalculate the active route whenever the
    // transport mode or accessibility preference changes while a
    // POI is selected — rather than clearing the route, which was
    // the previous (undesired) behavior.
    useEffect(() => {
        if (selectedPOI && showPOICard) {
            handleGetDirections();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [transportMode, canUseStairs]);

    const handlePOIPress = useCallback(
        (poi: POI) => {
            setSelectedPOI(poi);
            setShowPOICard(true);
        },
        [setSelectedPOI]
    );

    function handleSelectPOIFromSearch(poi: POI) {
        setShowFilterDrawer(false);
        mapRef.current?.flyToPOI(poi.coordinates);
        handlePOIPress(poi);
    }

    const handleCloseCard = useCallback(() => {
        setShowPOICard(false);
        setSelectedPOI(null);
        clearRoute();
    }, [setSelectedPOI, clearRoute]);

    return (
        <View style={styles.container}>
            {/* ── Full screen map ─────────────────────────── */}
            <GLCCMap ref={mapRef} pois={filteredPOIs} onPOIPress={handlePOIPress} />

            {/* ── Transport mode picker (floating top bar) w/ Filter Menu ── */}
            <View style={styles.topBar}>
                <SafeAreaView edges={['top']}>
                    <View style={styles.topBarRow}>
                        <TouchableOpacity
                            style={styles.hamburgerButton}
                            onPress={() => setShowFilterDrawer(true)}
                        >
                            <Ionicons name="menu-outline" size={20} color="#1a2e1a" />
                        </TouchableOpacity>
                        <TransportPicker />
                    </View>
                </SafeAreaView>
            </View>
            <TouchableOpacity
                style={styles.settingsButton}
                onPress={() => setShowSettings(true)}
            >
                <Ionicons name="settings-outline" size={22} color="#1a4a2e" />
            </TouchableOpacity>

            {/* ── No GPS warning ───────────────────────────  */}
            {hasPermission === false && (
                <View style={styles.noGPSBanner}>
                    <Ionicons name="location-outline" size={14} color="#ffffff" />
                    <Text style={styles.noGPSText}>
                        Enable location in Settings for turn-by-turn directions
                    </Text>
                </View>
            )}

            <OfflineDownloadBanner
                status={status}
                progress={progress}
                error={error}
                onDownload={downloadPack}
            />

            {/* ── Outside GLCC warning ─────────────────────── */}
            {isUserOutsideBounds && (
                <View style={styles.outsideBoundsBanner}>
                    <Ionicons name="location-outline" size={14} color="#ffffff" />
                    <Text style={styles.outsideBoundsText}>
                        You appear to be off-campus — directions are not available unless on GLCC Campus
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

                    {finalApproachRoute && (
                        <View style={styles.approachNotice}>
                            <Ionicons name="walk-outline" size={14} color="#6ba888" />
                            <Text style={styles.approachNoticeText}>
                                {parkingLotName
                                    ? `Park at ${parkingLotName}, then walk to the destination`
                                    : 'Includes a short walk from parking'}
                            </Text>
                        </View>
                    )}

                    <TouchableOpacity
                        style={[
                            styles.directionsButton,
                            selectedPOI.hasStairs &&
                            !canUseStairs &&
                            styles.directionsButtonWarning,
                        ]}
                        onPress={handleGetDirections}
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
            <Modal
                visible={showSettings}
                animationType="slide"
                onRequestClose={() => setShowSettings(false)}
            >
                <SettingsScreen
                    onClose={() => setShowSettings(false)}
                    canUseStairs={canUseStairs}
                    setCanUseStairs={setCanUseStairs}
                    transportMode={transportMode}
                    setTransportMode={setTransportMode}
                    offlineStatus={status}
                    offlineProgress={progress}
                    offlineError={error}
                    onDownloadOffline={downloadPack}
                    onDeleteOffline={deletePack}
                />
            </Modal>
            <FilterDrawer
                visible={showFilterDrawer}
                onClose={() => setShowFilterDrawer(false)}
                pois={pois}
                activeFilters={activeFilters}
                onToggleFilter={toggleFilter}
                onClearFilters={clearFilters}
                onSelectPOI={handleSelectPOIFromSearch}
            />
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
    topBarRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginHorizontal: 16,
        marginTop: 8,
    },
    hamburgerButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.95)',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
    },
    settingsButton: {
        position: 'absolute',
        bottom: 20,
        left: 16,
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
    approachNotice: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 12,
    },
    approachNoticeText: {
        fontSize: 12,
        color: '#6ba888',
        fontWeight: '600',
    },
    outsideBoundsBanner: {
        position: 'absolute',
        bottom: 120,
        left: 16,
        right: 16,
        backgroundColor: 'rgba(230, 126, 34, 0.95)', // orange, distinct from the gray no-GPS banner
        borderRadius: 12,
        padding: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    outsideBoundsText: {
        color: '#ffffff',
        fontSize: 13,
        textAlign: 'center',
        flexShrink: 1,
    },
});