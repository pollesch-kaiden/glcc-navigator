/**
 * RouteLayer.tsx
 * ─────────────────────────────────────────────────────────
 * Renders the active navigation route on the map.
 *
 * Two possible segments:
 *  - Main route (solid green line) — either the full route,
 *    or the vehicle portion of a multi-modal route
 *  - Final approach (dashed, lighter line) — the last-mile
 *    walking segment shown when a vehicle mode can't reach
 *    the destination directly (e.g. "park here, walk the
 *    rest of the way")
 *
 * Used by: GLCCMap.tsx
 * ─────────────────────────────────────────────────────────
 */

import React from 'react';
import { GeoJSONSource, Layer } from '@maplibre/maplibre-react-native';

interface RouteLayerProps {
    coordinates: [number, number][];
    approachCoordinates?: [number, number][] | null;
}

export function RouteLayer({
                               coordinates,
                               approachCoordinates,
                           }: RouteLayerProps) {
    const hasMainRoute = coordinates && coordinates.length >= 2;
    const hasApproach = approachCoordinates && approachCoordinates.length >= 2;

    if (!hasMainRoute) return null;

    const routeGeoJSON: GeoJSON.Feature<GeoJSON.LineString> = {
        type: 'Feature',
        geometry: {
            type: 'LineString',
            coordinates,
        },
        properties: {},
    };

    const approachGeoJSON: GeoJSON.Feature<GeoJSON.LineString> | null = hasApproach
        ? {
            type: 'Feature',
            geometry: {
                type: 'LineString',
                coordinates: approachCoordinates!,
            },
            properties: {},
        }
        : null;

    return (
        <>
            {/* Main route — solid line */}
            <GeoJSONSource id="routeSource" data={routeGeoJSON}>
                <Layer
                    id="routeShadow"
                    type="line"
                    layout={{ 'line-cap': 'round', 'line-join': 'round' }}
                    paint={{
                        'line-color': 'rgba(0, 0, 0, 0.15)',
                        'line-width': 9,
                    }}
                />
                <Layer
                    id="routeLine"
                    type="line"
                    layout={{ 'line-cap': 'round', 'line-join': 'round' }}
                    paint={{
                        'line-color': '#2d7a4f',
                        'line-width': 5,
                    }}
                />
            </GeoJSONSource>

            {/* Final approach — dashed, lighter line for the last-mile
          walking segment when routing switched from a vehicle
          mode to walking */}
            {approachGeoJSON && (
                <GeoJSONSource id="approachSource" data={approachGeoJSON}>
                    <Layer
                        id="approachLine"
                        type="line"
                        layout={{ 'line-cap': 'round', 'line-join': 'round' }}
                        paint={{
                            'line-color': '#6ba888',
                            'line-width': 4,
                            'line-dasharray': [2, 2],
                        }}
                    />
                </GeoJSONSource>
            )}
        </>
    );
}