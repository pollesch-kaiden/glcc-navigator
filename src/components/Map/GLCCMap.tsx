/**
 * GLCCMap.tsx
 * ─────────────────────────────────────────────────────────
 * Main map component that renders the GLCC campus map.
 *
 * Layer order (bottom to top):
 *  1. Protomaps/Demo base tiles
 *  2. Route line (if active)
 *  3. POI markers (Marker components)
 *  4. User location dot
 *
 * Used by: MapScreen.tsx
 * ─────────────────────────────────────────────────────────
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';
import {
    Map,
    Camera,
    UserLocation,
} from '@maplibre/maplibre-react-native';
import { MAP_STYLE_URL, MAP_CONFIG, GLCC_BOUNDS } from '../../utils/mapStyle';
import { RouteLayer } from './RouteLayer';
import { POIMarkers } from './POIMarkers';
import { useAppStore } from '../../store/useAppStore';
import { POI } from '../../types/poi.types';

interface GLCCMapProps {
    pois: POI[];
    onPOIPress: (poi: POI) => void;
}

export function GLCCMap({ pois, onPOIPress }: GLCCMapProps) {
    const { activeRoute } = useAppStore();

    return (
        <View style={styles.container}>
            <Map
                style={styles.map}
                mapStyle={MAP_STYLE_URL}
                compass={true}
                compassPosition={{ bottom: 80, right: 8 }}
                logo={false}
                attribution={true}
                attributionPosition={{ bottom: 8, right: 8 }}
            >
                <Camera
                    initialViewState={{
                        bounds: GLCC_BOUNDS,
                        padding: {
                            top: 40,
                            bottom: 40,
                            left: 20,
                            right: 20,
                        },
                    }}
                    minZoom={MAP_CONFIG.minZoom}
                    maxZoom={MAP_CONFIG.maxZoom}
                />

                {/* Route line */}
                {activeRoute && activeRoute.length >= 2 && (
                    <RouteLayer coordinates={activeRoute} />
                )}

                {/* POI markers — Marker components render inside Map */}
                <POIMarkers pois={pois} onPOIPress={onPOIPress} />

                {/* User GPS dot */}
                <UserLocation
                    animated={true}
                    heading={true}
                />
            </Map>
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
});