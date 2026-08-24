/**
 * POIMarkers.tsx
 * ─────────────────────────────────────────────────────────
 * Renders all Points of Interest as individual Marker
 * components on the map.
 *
 * v11 API notes:
 *  - coordinate prop → lngLat prop
 *  - lngLat takes [longitude, latitude] as LngLat type
 *
 * Press handling lives on the inner TouchableOpacity only.
 * Putting onPress on both Marker and the child view fires
 * the callback twice per tap.
 *
 * Used by: GLCCMap.tsx
 * ─────────────────────────────────────────────────────────
 */

import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
} from 'react-native';
import { Marker } from '@maplibre/maplibre-react-native';
import { POI, POICategory } from '../../types/poi.types';

interface POIMarkersProps {
    pois: POI[];
    onPOIPress: (poi: POI) => void;
}

const CATEGORY_COLORS: Record<POICategory, string> = {
    accommodation: '#4a90e2',
    dining:        '#e74c3c',
    recreation:    '#27ae60',
    chapel:        '#9b59b6',
    conference:    '#e67e22',
    landmark:      '#f39c12',
    restroom:      '#95a5a6',
    parking:       '#7f8c8d',
    waterfront:    '#2980b9',
    other:         '#2d7a4f',
};

const CATEGORY_ICONS: Record<POICategory, string> = {
    accommodation: '🛏️',
    dining:        '🍽️',
    recreation:    '🏃',
    chapel:        '⛪',
    conference:    '🏛️',
    landmark:      '📍',
    restroom:      '🚻',
    parking:       '🅿️',
    waterfront:    '🏖️',
    other:         '📌',
};

export function POIMarkers({ pois, onPOIPress }: POIMarkersProps) {
    if (!pois || pois.length === 0) return null;

    return (
        <>
            {pois.map((poi) => (
                <Marker
                    key={poi.id}
                    id={poi.id}
                    lngLat={poi.coordinates}
                    anchor="bottom"
                >
                    <TouchableOpacity
                        style={styles.markerWrapper}
                        onPress={() => onPOIPress(poi)}
                        activeOpacity={0.8}
                    >
                        {/* Simple colored dot */}
                        <View
                            style={[
                                styles.markerCircle,
                                {
                                    backgroundColor:
                                        CATEGORY_COLORS[poi.category] ?? '#2d7a4f',
                                },
                            ]}
                        />

                        {/* Name label */}
                        <View style={styles.labelContainer}>
                            <Text style={styles.labelText} numberOfLines={1}>
                                {poi.name}
                            </Text>
                        </View>
                    </TouchableOpacity>
                </Marker>
            ))}
        </>
    );
}

const styles = StyleSheet.create({
    markerWrapper: {
        alignItems: 'center',
    },
    markerCircle: {
        width: 14,
        height: 14,
        borderRadius: 7,
        borderWidth: 2,
        borderColor: '#ffffff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
        elevation: 4,
    },
    labelContainer: {
        backgroundColor: 'rgba(255,255,255,0.92)',
        paddingHorizontal: 5,
        paddingVertical: 2,
        borderRadius: 6,
        marginTop: 3,
        maxWidth: 90,
    },
    labelText: {
        fontSize: 10,
        fontWeight: '600',
        color: '#1a2e1a',
        textAlign: 'center',
    },
});