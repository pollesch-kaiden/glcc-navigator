/**
 * GLCCMap.tsx
 * ─────────────────────────────────────────────────────────
 * Main map component that renders the GLCC campus map.
 *
 * Includes:
 *  - Developer coordinate picker tool (reticle button)
 *  - Retry overlay if the map style fails to load
 *  - Panning restricted to the GLCC campus area via maxBounds
 *
 * Note: iOS Simulator has a known intermittent networking bug
 * (-2103/-1001) causing tile timeouts. This is simulator-only
 * and does not occur on physical devices or in production.
 * The retry overlay below only triggers on full STYLE load
 * failure, not individual tile timeouts (which MapLibre
 * retries internally and show as harmless gray gaps).
 *
 * Used by: MapScreen.tsx
 * ─────────────────────────────────────────────────────────
 */

import React, { useState, useCallback, useImperativeHandle, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import {
    Map,
    Camera,
    UserLocation,
} from '@maplibre/maplibre-react-native';
import { Ionicons } from '@expo/vector-icons';
import { MAP_STYLE, MAP_CONFIG, GLCC_BOUNDS, MAX_PAN_BOUNDS } from '@/utils/mapStyle';
import { RouteLayer } from './RouteLayer';
import { POIMarkers } from './POIMarkers';
import { CoordinatePicker } from './CoordinatePicker';
import { useAppStore } from '@/store/useAppStore';
import { POI } from '@/types';

export interface GLCCMapRef {
    flyToPOI: (coordinates: [number, number]) => void;
}

interface GLCCMapProps {
    pois: POI[];
    onPOIPress: (poi: POI) => void;
}

export function GLCCMap({ pois, onPOIPress, ref }: GLCCMapProps & {ref?: React.Ref<any>}) {
    const { activeRoute, finalApproachRoute } = useAppStore();

    // ── Retry-on-failure state ─────────────────────────────
    const [mapKey, setMapKey] = useState(0);
    const [loadFailed, setLoadFailed] = useState(false);

    const handleRetry = useCallback(() => {
        setLoadFailed(false);
        setMapKey((prev) => prev + 1); // forces Map to remount
    }, []);

    const handleFailLoading = useCallback(() => {
        setLoadFailed(true);
    }, []);

    // ── Coordinate picker state ─────────────────────────────
    const [pickerActive, setPickerActive] = useState(false);
    const [centerCoord, setCenterCoord] = useState<[number, number] | null>(
        null
    );
    const cameraRef = useRef<any>(null);

    useImperativeHandle(ref, () => ({
        flyToPOI: (coordinates: [number, number]) => {
            cameraRef.current?.flyTo({ center: coordinates, zoom: 17, duration: 1000 });
        },
    }));

    const handleRegionChange = useCallback((event: any) => {
        // v11 moved payloads under nativeEvent; shape varies, so probe both.
        // Log once, read the real shape, then delete the fallbacks.
        if (__DEV__) {
            console.log('region event', JSON.stringify(event?.nativeEvent));
        }

        const ne = event?.nativeEvent ?? event;
        const center =
            ne?.center ??
            ne?.geometry?.coordinates ??
            ne?.properties?.center;

        if (Array.isArray(center) && center.length === 2) {
            setCenterCoord(center as [number, number]);
        }
    }, []);

    return (
        <View style={styles.container}>
            <Map
                key={mapKey}
                style={styles.map}
                mapStyle={MAP_STYLE}
                compass={true}
                compassPosition={{ bottom: 80, right: 8 }}
                logo={false}
                attribution={true}
                attributionPosition={{ bottom: 8, right: 8 }}
                onRegionDidChange={handleRegionChange}
                onDidFailLoadingMap={handleFailLoading}
            >
                <Camera
                    ref={cameraRef}
                    initialViewState={{
                        bounds: GLCC_BOUNDS,
                        padding: { top: 40, bottom: 40, left: 20, right: 20 },
                    }}
                    maxBounds={MAX_PAN_BOUNDS}
                    minZoom={MAP_CONFIG.minZoom}
                    maxZoom={MAP_CONFIG.maxZoom}
                />

                {activeRoute && activeRoute.length >= 2 && (
                    <RouteLayer
                        coordinates={activeRoute}
                        approachCoordinates={finalApproachRoute}
                    />
                )}

                <POIMarkers pois={pois} onPOIPress={onPOIPress} />

                <UserLocation animated={true} heading={true} />
            </Map>
            {__DEV__ && (
                <CoordinatePicker
                    isActive={pickerActive}
                    onToggle={() => setPickerActive((prev) => !prev)}
                    centerCoordinate={centerCoord}
                />
            )}

            {loadFailed && (
                <View style={styles.errorOverlay}>
                    <Ionicons name="cloud-offline-outline" size={40} color="#ffffff" />
                    <Text style={styles.errorTitle}>Map failed to load</Text>
                    <Text style={styles.errorText}>
                        Check your connection and try again
                    </Text>
                    <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
                        <Ionicons name="refresh-outline" size={16} color="#1a4a2e" />
                        <Text style={styles.retryText}>Retry</Text>
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
    map: {
        flex: 1,
    },
    errorOverlay: {
        ...StyleSheet.absoluteFill,
        backgroundColor: '#1a4a2e',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    errorTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#ffffff',
        marginTop: 8,
    },
    errorText: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.7)',
        marginBottom: 16,
    },
    retryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#ffffff',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 20,
    },
    retryText: {
        color: '#1a4a2e',
        fontWeight: '700',
        fontSize: 14,
    },
});