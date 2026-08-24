/**
 * usePOIs.ts
 * ─────────────────────────────────────────────────────────
 * Loads and merges POIs from two sources:
 *
 *  1. glcc-pois-osm.json    → auto-imported from OpenStreetMap
 *  2. glcc-pois-custom.json → your manual enrichments/additions
 *
 * Custom entries are merged onto matching OSM entries by id —
 * you only need to specify the fields you want to add or
 * override. Any custom entry whose id does NOT match an
 * existing OSM POI is treated as a brand new POI.
 *
 * Used by: MapScreen.tsx
 * ─────────────────────────────────────────────────────────
 */

import { useMemo } from 'react';
import osmData from '../../assets/map/glcc-pois-osm.json';
import customData from '../../assets/map/glcc-pois-custom.json';
import { POI } from '../types/poi.types';

function featureToPOI(feature: any): Partial<POI> & { id: string } {
    return {
        ...feature.properties,
        coordinates: feature.geometry.coordinates,
    };
}

export function usePOIs(): POI[] {
    return useMemo(() => {
        // Defensive checks — prevents crashes if a file is
        // temporarily empty/malformed during editing
        const osmFeatures = (osmData as any)?.features ?? [];
        const customFeatures = (customData as any)?.features ?? [];

        const osmPois = osmFeatures.map(featureToPOI);
        const customEntries = customFeatures.map(featureToPOI);

        const merged = new Map<string, POI>();

        for (const poi of osmPois) {
            merged.set(poi.id, poi as POI);
        }

        for (const custom of customEntries) {
            const existing = merged.get(custom.id);

            if (existing) {
                merged.set(custom.id, {
                    ...existing,
                    ...custom,
                    activities: custom.activities ?? existing.activities,
                    amenities: custom.amenities ?? existing.amenities,
                    tags: custom.tags ?? existing.tags,
                });
            } else {
                merged.set(custom.id, custom as POI);
            }
        }

        return Array.from(merged.values());
    }, []);
}