/**
 * RouteLayer.tsx
 * ─────────────────────────────────────────────────────────
 * Renders the active navigation route as a colored line
 * on the map using MapLibre GeoJSONSource + Layer.
 *
 * v11 API changes:
 *  - ShapeSource → GeoJSONSource
 *  - shape prop → data prop
 *  - LineLayer → Layer with type="line"
 *  - style prop → paint prop with kebab-case keys
 *  - source is set explicitly to match GL JS semantics
 *
 * Draws two layers:
 *  1. Wide shadow line underneath for contrast
 *  2. Main green route line on top
 *
 * Used by: GLCCMap.tsx
 * ─────────────────────────────────────────────────────────
 */

import React from 'react';
import {
    GeoJSONSource,
    Layer,
} from '@maplibre/maplibre-react-native';

interface RouteLayerProps {
    coordinates: [number, number][];
}

export function RouteLayer({ coordinates }: RouteLayerProps) {
    if (!coordinates || coordinates.length < 2) return null;

    const routeGeoJSON: GeoJSON.Feature<GeoJSON.LineString> = {
        type: 'Feature',
        geometry: {
            type: 'LineString',
            coordinates,
        },
        properties: {},
    };

    return (
        <GeoJSONSource id="routeSource" data={routeGeoJSON}>
            {/* Shadow underneath for contrast */}
            <Layer
                id="routeShadow"
                source="routeSource"
                type="line"
                layout={{
                    'line-cap': 'round',
                    'line-join': 'round',
                }}
                paint={{
                    'line-color': 'rgba(0, 0, 0, 0.15)',
                    'line-width': 9,
                }}
            />
            {/* Main route line */}
            <Layer
                id="routeLine"
                source="routeSource"
                type="line"
                layout={{
                    'line-cap': 'round',
                    'line-join': 'round',
                }}
                paint={{
                    'line-color': '#2d7a4f',
                    'line-width': 5,
                }}
            />
        </GeoJSONSource>
    );
}