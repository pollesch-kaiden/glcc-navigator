/**
 * usePOIs.ts
 * ─────────────────────────────────────────────────────────
 * Loads and merges POIs from three sources, in priority order:
 *
 *  1. glcc-pois-osm.json    → auto-imported from OpenStreetMap
 *  2. glcc-pois-custom.json → your manual enrichments/additions
 *  3. Admin overlay          → in-app edits made in Admin Mode,
 *                              stored in AsyncStorage, take
 *                              effect immediately without a
 *                              rebuild
 *
 * A POI marked deleted (either via the admin overlay or baked
 * into glcc-pois-custom.json after a previous export) is
 * filtered out of the final result entirely.
 *
 * Used by: MapScreen.tsx
 * ─────────────────────────────────────────────────────────
 */

import { useMemo } from 'react';
import osmData from '../../assets/map/glcc-pois-osm.json';
import customData from '../../assets/map/glcc-pois-custom.json';
import { useAdminStore } from '@/store/useAdminStore';
import { POI } from '@/types';

function featureToPOI(feature: any): Partial<POI> & { id: string } {
    return {
        ...feature.properties,
        coordinates: feature.geometry.coordinates,
    };
}

export function usePOIs(): POI[] {
    const adminEdits = useAdminStore((state) => state.adminEdits);

    return useMemo(() => {
        const osmFeatures = (osmData as any)?.features ?? [];
        const customFeatures = (customData as any)?.features ?? [];

        const osmPois = osmFeatures.map(featureToPOI);
        const customEntries = customFeatures.map(featureToPOI);

        const merged = new Map<string, any>();

        for (const poi of osmPois) {
            merged.set(poi.id, poi);
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
                merged.set(custom.id, custom);
            }
        }

        // Admin overlay — highest priority, lets in-app changes
        // take effect immediately without needing a rebuild
        for (const edit of Object.values(adminEdits) as any[]) {
            if (edit.deleted) {
                merged.delete(edit.id);
                continue;
            }
            const existing = merged.get(edit.id);
            merged.set(edit.id, existing ? { ...existing, ...edit } : edit);
        }

        // Final safety filter — also catches deletion tombstones
        // that were baked directly into glcc-pois-custom.json by a
        // previous export, even with no admin overlay active
        return Array.from(merged.values()).filter((p) => !p.deleted) as POI[];
    }, [adminEdits]);
}