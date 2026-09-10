/**
 * TraceOverlayLayer.tsx
 * ─────────────────────────────────────────────────────────
 * Renders in-progress path tracing on the map:
 *  - Committed segments (locked, solid green)
 *  - The currently-open segment (still extendable, orange)
 *  - A proximity ring around the last placed node showing
 *    how close the next tap/step must be
 *
 * Used by: GLCCMap.tsx
 * ─────────────────────────────────────────────────────────
 */

import React, { useMemo } from 'react';
import { GeoJSONSource, Layer } from '@maplibre/maplibre-react-native';
import { generateCircleFeature } from '@/utils/geoRing';
import { TraceSegment } from '@/types/pathTrace.types';

interface TraceOverlayLayerProps {
    segments: TraceSegment[];
    ringCenter?: [number, number] | null;
    ringRadiusMeters?: number;
}

export function TraceOverlayLayer({
                                      segments,
                                      ringCenter,
                                      ringRadiusMeters = 10,
                                  }: TraceOverlayLayerProps) {
    const lineCollection = useMemo(
        () => ({
            type: 'FeatureCollection' as const,
            features: segments
                .filter((s) => s.coordinates.length >= 2)
                .map((s) => ({
                    type: 'Feature' as const,
                    geometry: {
                        type: 'LineString' as const,
                        coordinates: s.coordinates,
                    },
                    properties: { closed: s.closed },
                })),
        }),
        [segments]
    );

    const ringFeature = useMemo(() => {
        if (!ringCenter) return null;
        return generateCircleFeature(ringCenter, ringRadiusMeters);
    }, [ringCenter, ringRadiusMeters]);

    return (
        <>
            <GeoJSONSource id="trace-lines" data={lineCollection}>
                <Layer
                    id="trace-lines-layer"
                    type="line"
                    layout={{ 'line-cap': 'round', 'line-join': 'round' }}
                    paint={{
                        'line-color': [
                            'case',
                            ['==', ['get', 'closed'], true],
                            '#1a4a2e',
                            '#e67e22',
                        ],
                        'line-width': 4,
                    }}
                />
            </GeoJSONSource>

            {ringFeature && (
                <GeoJSONSource id="trace-ring" data={ringFeature}>
                    <Layer
                        id="trace-ring-fill"
                        type="fill"
                        paint={{ 'fill-color': '#1a4a2e', 'fill-opacity': 0.15 }}
                    />
                    <Layer
                        id="trace-ring-outline"
                        type="line"
                        paint={{ 'line-color': '#1a4a2e', 'line-width': 1.5 }}
                    />
                </GeoJSONSource>
            )}
        </>
    );
}