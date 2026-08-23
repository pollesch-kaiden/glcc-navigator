/**
 * usePOIs.ts
 * ─────────────────────────────────────────────────────────
 * Loads and merges POIs from two sources:
 *  1. glcc-pois-osm.geojson    → auto-imported from OpenStreetMap
 *  2. glcc-pois-custom.geojson → manually added/edited by you
 *
 * Custom POIs with the same 'id' as an OSM POI will override
 * the OSM version — useful for correcting bad OSM data without
 * losing the ability to re-import fresh OSM data later.
 *
 * Used by: MapScreen.tsx
 * ─────────────────────────────────────────────────────────
 */

import { useMemo } from 'react';
import osmData from '../../assets/map/glcc-pois-osm.json';
import customData from '../../assets/map/glcc-pois-custom.json';
import { POI } from '../types/poi.types';

function featureToPOI(feature: any): POI {
    return {
        ...feature.properties,
        coordinates: feature.geometry.coordinates,
    };
}

export function usePOIs(): POI[] {
    return useMemo(() => {
        const osmPois = (osmData as any).features.map(featureToPOI);
        const customPois = (customData as any).features.map(featureToPOI);

        // Custom POIs override OSM POIs with the same id
        const merged = new Map<string, POI>();
        for (const poi of osmPois) merged.set(poi.id, poi);
        for (const poi of customPois) merged.set(poi.id, poi);

        return Array.from(merged.values());
    }, []);
}