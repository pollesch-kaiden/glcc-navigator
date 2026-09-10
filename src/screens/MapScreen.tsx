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
    Alert,
} from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import {Ionicons, MaterialIcons} from '@expo/vector-icons';
import { GLCCMap, GLCCMapRef } from '@/components/Map/GLCCMap';
import { GLCC_BOUNDS} from "@/utils/mapStyle";
import { TransportPicker } from '@/components/Routing/TransportPicker';
import { useAppStore } from '@/store/useAppStore';
import { useLocation } from '@/hooks/useLocation';
import { POI, TransportMode } from '@/types';
import { usePOIs } from '@/hooks/usePOIs';
import { useRouting } from '@/hooks/useRouting';
import graphData from '../../assets/map/graph.json';
import { Graph } from '@/types/route.types';
import { useOfflinePack} from "@/hooks/useOfflinePack";
import { OfflineDownloadBanner} from "@/components/Map/OfflineDownloadBanner";
import { OfflineManager} from "@maplibre/maplibre-react-native";
import { SettingsScreen} from "@/screens/SettingsScreen";
import { FilterDrawer} from "@/components/POI/FilterDrawer";
import { AdminPOIListScreen} from "@/screens/AdminPOIListScreen";
import { AdminPOIFormScreen} from "@/screens/AdminPOIFormScreen";
import { useAdminStore} from "@/store/useAdminStore";
import { findNearestNode, haversineDistance } from "@/utils/haversine";
import { usePaths } from "@/hooks/usePaths";
import { useLiveGraph } from "@/hooks/useLiveGraph";
import { usePathTracer } from "@/hooks/usePathTracer";
import { PathTracerControls } from "@/components/Map/PathTracerControls";
import { PathNameModal } from "@/components/Map/PathNameModal";
import { AdminPathListScreen } from "@/screens/AdminPathListScreen";
import { TransportModeMultiSelect } from '@/components/Routing/TransportModeMultiSelect';
import { PathFeature } from '@/routing/buildGraph';

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

// ── Category display config
const CATEGORY_ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
    lodging: 'bed-outline',
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
    lodging: 'Lodging',
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

    const paths = usePaths();

    const filteredPOIs = useMemo(() => {
        if (activeFilters.length === 0) return pois;
        return pois.filter((poi) =>
            activeFilters.some(
                (filter) =>
                    poi.activities.includes(filter as any) ||
                    poi.category === filter ||
                    (filter === 'has_vending' && (poi.vendingLocations?.length ?? 0) > 0)
            )
        );
    }, [pois, activeFilters]);

    const [showPOICard, setShowPOICard] = useState(false);
    const { status, progress, error, downloadPack, deletePack } = useOfflinePack()
    const [showSettings, setShowSettings] = useState(false);
    const [showFilterDrawer, setShowFilterDrawer] = useState(false);
    const mapRef = useRef<GLCCMapRef>(null);

    //Admin useState calls
    const [showAdminList, setShowAdminList] = useState(false);
    const [showAdminForm, setShowAdminForm] = useState(false);
    const [editingAdminPOI, setEditingAdminPOI] = useState<POI | null>(null);
    const { saveEdit, markDeleted, savePathEdit, markPathDeleted } = useAdminStore();
    const [pickingLocationForAdmin, setPickingLocationForAdmin] = useState(false);
    const [pickedCoordinate, setPickedCoordinate] = useState<[number, number] | null>(null);
    const [pendingModalAction, setPendingModalAction] = useState<(() => void) | null>(null);

    const [showPathList, setShowPathList] = useState(false);
    const [showPathNameModal, setShowPathNameModal] = useState(false);
    const [pathEditTarget, setPathEditTarget] = useState<PathFeature | null>(null);
    const [pathEditSelection, setPathEditSelection] = useState<number[]>([]);
    const [pathEditModes, setPathEditModes] = useState<TransportMode[]>(['walking']);
    const [pathEditHasStairs, setPathEditHasStairs] = useState(false);
    const pathTracer = usePathTracer();

    const handleEditPath = useCallback((feature: PathFeature) => {
        setShowPathList(false);
        setShowPOICard(false);
        setSelectedPOI(null);
        clearRoute();
        setPathEditTarget(feature);
        setPathEditSelection([]);
        setPathEditModes((feature.properties?.transportModes as TransportMode[]) ?? ['walking']);
        setPathEditHasStairs(Boolean(feature.properties?.hasStairs));

        const coordinates = (feature.geometry.coordinates ?? []) as [number, number][];
        if (coordinates.length > 0) {
            const lngs = coordinates.map(([lng]) => lng);
            const lats = coordinates.map(([, lat]) => lat);
            const bounds = [
                Math.min(...lngs),
                Math.min(...lats),
                Math.max(...lngs),
                Math.max(...lats),
            ] as [number, number, number, number];
            const centerLng = (bounds[0] + bounds[2]) / 2;
            const centerLat = (bounds[1] + bounds[3]) / 2;
            mapRef.current?.flyToPOI([centerLng, centerLat]);
        }

        Alert.alert(
            'Edit existing path',
            'Tap two vertices on the selected path to define the edit range, then save.'
        );
    }, [clearRoute, setSelectedPOI]);

    const totalTracePoints = useMemo(
        () =>
            pathTracer.committedSegments.reduce((sum, segment) => sum + segment.coordinates.length, 0) +
            pathTracer.currentSegment.coordinates.length,
        [pathTracer.committedSegments, pathTracer.currentSegment.coordinates]
    );

    const activeTraceSegments = useMemo(() => {
        if (!pathTracer.isActive) return [];
        return pathTracer.currentSegment.coordinates.length >= 1
            ? [...pathTracer.committedSegments, pathTracer.currentSegment]
            : pathTracer.committedSegments;
    }, [pathTracer.isActive, pathTracer.committedSegments, pathTracer.currentSegment]);

    interface POIDraft {
        id?: string;
        name: string;
        category: string;
        description: string;
        activities: string[];
        amenitiesText: string;
        vendingLocationsText: string;
        accessible: boolean;
        hasStairs: boolean;
        hours: string;
        coordinates: [number, number] | null;
    }

    const EMPTY_DRAFT: POIDraft = {
        name: '',
        category: 'other',
        description: '',
        activities: [],
        amenitiesText: '',
        vendingLocationsText: '',
        accessible: false,
        hasStairs: false,
        hours: '',
        coordinates: null,
    };

    function generatePOIId(name: string): string {
        const slug = name
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
        const suffix = Math.random().toString(36).slice(2, 6);
        return `custom-${slug || 'poi'}-${suffix}`;
    }

    const [poiDraft, setPOIDraft] = useState<POIDraft>(EMPTY_DRAFT);
    // Fallback start point if GPS isn't available — center of GLCC campus
    const FALLBACK_START: [number, number] = [-89.0165, 43.8158];

    const liveGraph = useLiveGraph(graph, paths);
    const { calculateRoute } = useRouting(liveGraph, pois);

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
            if (pathTracer.isActive) return;
            setSelectedPOI(poi);
            setShowPOICard(true);
        },
        [pathTracer.isActive, setSelectedPOI]
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

    //Admin Handlers
    function handleAdminEditPOI(poi: POI) {
        setPOIDraft({
            id: poi.id,
            name: poi.name,
            category: poi.category,
            description: poi.description ?? '',
            activities: poi.activities ?? [],
            amenitiesText: (poi.amenities ?? []).join(', '),
            vendingLocationsText: (poi.vendingLocations ?? []).join(', '),
            accessible: poi.accessible ?? false,
            hasStairs: poi.hasStairs ?? false,
            hours: poi.hours ?? '',
            coordinates: poi.coordinates,
        });
        setEditingAdminPOI(poi);
        setPendingModalAction(() => () => setShowAdminForm(true));
        setShowAdminList(false);
    }

    function handleAdminAddNew() {
        setPOIDraft(EMPTY_DRAFT);
        setEditingAdminPOI(null);
        setPendingModalAction(() => () => setShowAdminForm(true));
        setShowAdminList(false);
    }

    function handleAdminDeletePOI(poi: POI) {
        markDeleted(poi.id);
    }

    function handleAdminSavePOI(draft: POIDraft) {
        if (!draft.name.trim()) {
            Alert.alert('Name required', 'Please enter a name for this POI.');
            return;
        }
        if (!draft.coordinates) {
            Alert.alert('Location required', 'Set a location before saving.');
            return;
        }

        const poi = {
            id: draft.id ?? generatePOIId(draft.name),
            name: draft.name.trim(),
            category: draft.category,
            coordinates: draft.coordinates,
            description: draft.description.trim(),
            activities: draft.activities,
            amenities: draft.amenitiesText
                .split(',')
                .map((a) => a.trim())
                .filter(Boolean),
            vendingLocations: draft.vendingLocationsText
                .split(',')
                .map((v) => v.trim())
                .filter(Boolean),
            accessible: draft.accessible,
            hasStairs: draft.hasStairs,
            nearestNodeId:
                findNearestNode(draft.coordinates, graph, {
                    transportMode: 'walking',
                    noStairs: false,
                }) ?? '',
            tags: editingAdminPOI?.tags ?? [],
            hours: draft.hours.trim() || undefined,
            source: 'custom',
        } as POI;

        saveEdit(poi as any);
        setShowAdminForm(false);
        setShowAdminList(true);
    }

    function handleConfirmPickedLocation(coords: [number, number]) {
        setPOIDraft((prev) => ({ ...prev, coordinates: coords }));
        setPickingLocationForAdmin(false);
        setShowAdminForm(true);
    }

    function handleStartPickingLocation() {
        setShowPOICard(false);

        setShowAdminForm(false);
        setPickingLocationForAdmin(true);
    }

    function handleOpenPathTracer() {
        setShowPOICard(false);
        setShowPathList(false);
        pathTracer.startTrace('off-campus', ['walking'], false);
    }

    function handleTraceMapPress(coords: [number, number]) {
        if (pathEditTarget) {
            const coordinates = (pathEditTarget.geometry.coordinates ?? []) as [number, number][];
            if (coordinates.length === 0) return;

            let nearestIndex = 0;
            let nearestDistance = Number.POSITIVE_INFINITY;

            coordinates.forEach((point, index) => {
                const distance = haversineDistance(point, coords);
                if (distance < nearestDistance) {
                    nearestDistance = distance;
                    nearestIndex = index;
                }
            });

            if (nearestDistance > 30) {
                Alert.alert('Select a nearby vertex', 'Tap closer to the path to choose a vertex for the edit range.');
                return;
            }

            setPathEditSelection((prev) => {
                if (prev.length === 0) return [nearestIndex];
                if (prev.length === 1) {
                    if (prev[0] === nearestIndex) return prev;
                    return [...prev, nearestIndex];
                }
                return [nearestIndex];
            });
            return;
        }

        if (!pathTracer.isActive || pathTracer.traceMode !== 'off-campus') return;
        pathTracer.placeNode(coords);
    }

    function handleSaveTrace(name: string) {
        pathTracer.saveTrace(name);
        setShowPathNameModal(false);
    }

    function handleCancelPathEdit() {
        setPathEditTarget(null);
        setPathEditSelection([]);
        setPathEditModes(['walking']);
        setPathEditHasStairs(false);
    }

    function handlePathEditModeToggle(mode: TransportMode) {
        setPathEditModes((prev) => {
            if (prev.includes(mode)) {
                return prev.filter((item) => item !== mode);
            }
            return [...prev, mode];
        });
    }

    function handleSavePathEdit() {
        if (!pathEditTarget) return;
        if (pathEditSelection.length < 2) {
            Alert.alert('Choose a range', 'Tap two vertices on the selected path to define the edit range.');
            return;
        }

        const originalId = pathEditTarget.properties?.id ?? `path-${Date.now()}`;
        const originalProps = pathEditTarget.properties ?? {};
        const coordinates = (pathEditTarget.geometry.coordinates ?? []) as [number, number][];

        const [start, end] = [
            Math.min(...pathEditSelection),
            Math.max(...pathEditSelection),
        ];

        const before = coordinates.slice(0, start + 1);
        const middle = coordinates.slice(start, end + 1);
        const after = coordinates.slice(end);

        const replacementSegments = [
            before.length >= 2 ? { id: `${originalId}-edit-before`, coordinates: before } : null,
            middle.length >= 2 ? { id: `${originalId}-edit-range`, coordinates: middle } : null,
            after.length >= 2 ? { id: `${originalId}-edit-after`, coordinates: after } : null,
        ].filter(Boolean) as Array<{ id: string; coordinates: [number, number][] }>;

        if (replacementSegments.length === 0) {
            Alert.alert('No editable segment', 'The selected range is too short to edit.');
            return;
        }

        markPathDeleted(originalId);
        replacementSegments.forEach((segment) => {
            const isMiddle = segment.id.endsWith('-edit-range');
            savePathEdit({
                id: segment.id,
                name: originalProps.name ?? originalId,
                coordinates: segment.coordinates,
                traceGroupId: originalProps.traceGroupId ?? originalId,
                transportModes: isMiddle ? pathEditModes : (originalProps.transportModes ?? ['walking']),
                hasStairs: isMiddle ? pathEditHasStairs : Boolean(originalProps.hasStairs),
                bidirectional: originalProps.bidirectional ?? true,
                surface: originalProps.surface ?? 'paved',
                source: 'admin',
            });
        });

        setPathEditTarget(null);
        setPathEditSelection([]);
        setPathEditModes(['walking']);
        setPathEditHasStairs(false);
        Alert.alert('Path updated', 'The edited path has been saved locally and will route immediately.');
    }

    return (
        <View style={styles.container}>
            {/* ── Full screen map  */}
            <GLCCMap
                ref={mapRef}
                pois={filteredPOIs}
                onPOIPress={handlePOIPress}
                forcePickerActive={pickingLocationForAdmin}
                onCenterCordChange={setPickedCoordinate}
                onMapPress={handleTraceMapPress}
                traceSegments={activeTraceSegments}
                traceRingCenter={pathTracer.lastPoint}
                interactivePOIs={!pathTracer.isActive && !pathEditTarget}
                hideCoordinatePicker={pathTracer.isActive || !!pathEditTarget}
                highlightedPath={pathEditTarget}
                selectedPathVertexIndexes={pathEditSelection}
            />

            {!pathTracer.isActive && !pathEditTarget && (
                <>
                    {/* ── Transport mode picker (floating top bar) w/ Filter Menu */}
                    <View style={styles.topBar}>
                        <SafeAreaView edges={['top']}>
                            <View style={styles.topBarRow}>
                                <TouchableOpacity
                                    style={styles.hamburgerButton}
                                    onPress={() => setShowFilterDrawer(true)}
                                >
                                    <Ionicons name="options-outline" size={20} color="#1a2e1a" />
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
                </>
            )}

            {/* ── No GPS warning  */}
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

            {!pathTracer.isActive && !pathEditTarget && isUserOutsideBounds && (
                <View style={styles.outsideBoundsBanner}>
                    <Ionicons name="location-outline" size={14} color="#ffffff" />
                    <Text style={styles.outsideBoundsText}>
                        You appear to be off-campus — directions are not available unless on GLCC Campus
                    </Text>
                </View>
            )}

            {!pathTracer.isActive && pickingLocationForAdmin && (
                <View style={styles.pickLocationBar}>
                    <Text style={styles.pickLocationText}>
                        Pan the map to position the crosshair, then confirm
                    </Text>
                    <View style={styles.pickLocationButtons}>
                        <TouchableOpacity
                            style={styles.pickCancelButton}
                            onPress={() => {
                                setPickingLocationForAdmin(false);
                                setShowAdminForm(true);
                            }}
                        >
                            <Text style={styles.pickCancelText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.pickConfirmButton}
                            onPress={() => pickedCoordinate && handleConfirmPickedLocation(pickedCoordinate)}
                        >
                            <Text style={styles.pickConfirmText}>Use This Location</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {pathTracer.isActive && (
                <PathTracerControls
                    traceMode={pathTracer.traceMode}
                    onChangeTraceMode={(nextMode) => {
                        if (pathTracer.currentSegment.coordinates.length === 0 && pathTracer.committedSegments.length === 0) {
                            pathTracer.startTrace(nextMode, pathTracer.currentSegment.transportModes, pathTracer.currentSegment.hasStairs);
                        }
                    }}
                    hasStartedPlacingPoints={totalTracePoints > 0}
                    selectedModes={pathTracer.currentSegment.transportModes}
                    onToggleMode={pathTracer.toggleTransportMode}
                    hasStairs={pathTracer.currentSegment.hasStairs}
                    onToggleStairs={pathTracer.toggleStairs}
                    isRecording={pathTracer.isRecording}
                    onStartRecording={async () => {
                        if (pathTracer.traceMode === 'on-campus' && isUserOutsideBounds) {
                            Alert.alert('Not on campus', 'You must be on campus before starting GPS tracing.');
                            return;
                        }

                        const result = await pathTracer.startRecording();
                        if (!result.success) {
                            Alert.alert('Location access required', result.error ?? 'Unable to start GPS tracing.');
                        }
                    }}
                    onPauseRecording={pathTracer.pauseRecording}
                    canUndo={pathTracer.canUndo}
                    onUndo={pathTracer.undoLastPoint}
                    onDiscard={pathTracer.discardTrace}
                    onEndPath={() => setShowPathNameModal(true)}
                    outOfRangeWarning={pathTracer.outOfRangeWarning}
                    totalPointCount={totalTracePoints}
                    isStartDisabled={pathTracer.traceMode === 'on-campus' && isUserOutsideBounds}
                />
            )}

            {pathEditTarget && (
                <View style={styles.pathEditBar}>
                    <Text style={styles.pathEditTitle}>Editing: {pathEditTarget.properties?.name ?? 'Unnamed Path'}</Text>
                    <Text style={styles.pathEditSubtitle}>
                        {pathEditSelection.length === 0
                            ? '0 of 2 vertices selected'
                            : `${pathEditSelection.length} of 2 vertices selected`}
                    </Text>

                    <TransportModeMultiSelect
                        selectedModes={pathEditModes}
                        onToggleMode={handlePathEditModeToggle}
                        hasStairs={pathEditHasStairs}
                        onToggleStairs={setPathEditHasStairs}
                    />

                    <View style={styles.pathEditActions}>
                        <TouchableOpacity style={styles.pathEditSecondary} onPress={handleCancelPathEdit}>
                            <Text style={styles.pathEditSecondaryText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.pathEditPrimary, pathEditSelection.length < 2 && styles.pathEditPrimaryDisabled]}
                            onPress={handleSavePathEdit}
                            disabled={pathEditSelection.length < 2}
                        >
                            <Text style={styles.pathEditPrimaryText}>Save Edit</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {/* ── POI info card */}
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

                    {(selectedPOI.vendingLocations?.length ?? 0) > 0 && (
                        <View style={styles.vendingSection}>
                            <Text style={styles.vendingTitle}>Vending machine locations</Text>

                            {selectedPOI.vendingLocations!.map((location, index) => (
                                <View
                                    key={`${selectedPOI.id}-vending-${index}`}
                                    style={styles.vendingRow}
                                >
                                    <Ionicons
                                        name={
                                            location.startsWith("Snack Vending")
                                                ? "nutrition-outline"
                                                : location.startsWith("Drink Vending")
                                                    ? "beer-outline"
                                                    : "nutrition-outline"
                                        }
                                        size={14}
                                        color="#2d7a4f"
                                    />

                                    <Text style={styles.vendingText}>{location}</Text>
                                </View>
                            ))}
                        </View>
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
                    onOpenAdminList={() => {
                        setShowSettings(false);
                        setShowAdminList(true);
                    }}
                   onOpenPathList={() => {
                       setShowSettings(false);
                       setShowPathList(true);
                   }}
                />
            </Modal>
            <Modal visible={showAdminList}
                   animationType="slide"
                   onDismiss={() => {
                       pendingModalAction?.();
                       setPendingModalAction(null);
                   }}
                   onRequestClose={() => setShowAdminList(false)}
            >
                <AdminPOIListScreen
                   pois={pois}
                   onClose={() => setShowAdminList(false)}
                   onEditPOI={handleAdminEditPOI}
                   onAddNew={handleAdminAddNew}
                   onDeletePOI={handleAdminDeletePOI}
                />
            </Modal>
            <Modal visible={showPathList} animationType="slide" onRequestClose={() => setShowPathList(false)}>
                <AdminPathListScreen
                   onClose={() => setShowPathList(false)}
                   onTraceNew={() => {
                       setShowPathList(false);
                       handleOpenPathTracer();
                   }}
                   onEditPath={handleEditPath}
                />
            </Modal>
            <PathNameModal
                visible={showPathNameModal}
                onCancel={() => setShowPathNameModal(false)}
                onConfirm={handleSaveTrace}
                segmentCount={pathTracer.getFinalSegments().length}
            />

            <Modal
                visible={showAdminForm && !pickingLocationForAdmin}
                animationType="slide"
                onRequestClose={() => setShowAdminForm(false)}
            >
                <SafeAreaProvider>
                    <AdminPOIFormScreen
                        draft={poiDraft}
                        onChange={setPOIDraft}
                        isNew={editingAdminPOI === null}
                        onClose={() => setShowAdminForm(false)}
                        onSave={handleAdminSavePOI}
                        onPickOnMap={handleStartPickingLocation}
                    />
                </SafeAreaProvider>
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
    pathEditBar: {
        position: 'absolute',
        bottom: 24,
        left: 16,
        right: 16,
        backgroundColor: 'rgba(255,255,255,0.96)',
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 4,
    },
    pathEditTitle: {
        color: '#1a2e1a',
        fontSize: 15,
        fontWeight: '700',
        marginBottom: 4,
    },
    pathEditSubtitle: {
        color: '#666',
        fontSize: 12,
        marginBottom: 12,
    },
    pathEditActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 8,
        marginTop: 12,
    },
    pathEditSecondary: {
        backgroundColor: '#f0f0f0',
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 10,
    },
    pathEditSecondaryText: {
        color: '#1a2e1a',
        fontWeight: '600',
    },
    pathEditPrimary: {
        backgroundColor: '#1a4a2e',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 10,
    },
    pathEditPrimaryDisabled: {
        opacity: 0.5,
    },
    pathEditPrimaryText: {
        color: '#ffffff',
        fontWeight: '700',
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
    vendingSection: {
        backgroundColor: '#f7fbf8',
        borderRadius: 12,
        padding: 10,
        marginBottom: 12,
    },
    vendingTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: '#1a2e1a',
        marginBottom: 6,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    vendingRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 6,
        marginBottom: 4,
    },
    vendingText: {
        flex: 1,
        fontSize: 13,
        color: '#335',
        lineHeight: 18,
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
        bottom: 80,
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
    pickLocationBar: {
        position: 'absolute',
        bottom: 100,
        left: 16,
        right: 16,
        backgroundColor: '#ffffff',
        borderRadius: 14,
        padding: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 6,
        zIndex: 300,
    },
    pickLocationText: {
        fontSize: 13,
        color: '#444',
        marginBottom: 10,
        textAlign: 'center',
    },
    pickLocationButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    pickCancelButton: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 10,
        backgroundColor: '#f2f2f2',
        alignItems: 'center',
    },
    pickCancelText: {
        color: '#444',
        fontWeight: '600',
        fontSize: 13,
    },
    pickConfirmButton: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 10,
        backgroundColor: '#1a4a2e',
        alignItems: 'center',
    },
    pickConfirmText: {
        color: '#ffffff',
        fontWeight: '700',
        fontSize: 13,
    },
});