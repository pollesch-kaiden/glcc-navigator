/**
 * exportPOIData.ts
 * ─────────────────────────────────────────────────────────
 * Merges the bundled glcc-pois-custom.json with the in-app
 * admin overlay (AsyncStorage) into one complete, ready-to-use
 * custom POI file, then opens the native Share sheet so it can
 * be sent to your Mac (email, AirDrop, Files, etc.).
 *
 * After exporting: replace your real glcc-pois-custom.json
 * with the exported file, run linkPoisToGraph.ts, and commit.
 *
 * Deletion handling:
 *  - OSM-sourced POIs (id starts with "osm-") that were deleted
 *    are kept as a { id, deleted: true } tombstone, so usePOIs()
 *    continues to hide them even after this file is baked into
 *    the next build.
 *  - Custom-only POIs that were deleted are simply left out of
 *    the export entirely — no tombstone needed since they never
 *    existed outside the custom file.
 *
 * Used by: SettingsScreen.tsx
 * ─────────────────────────────────────────────────────────
 */

import { Paths, File } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import customData from '../../assets/map/glcc-pois-custom.json';
import { useAdminStore } from '../store/useAdminStore';

export async function exportPOIData(): Promise<void> {
    const adminEdits = useAdminStore.getState().adminEdits;

    const byId = new Map<string, any>();

    for (const feature of (customData as any).features) {
        byId.set(feature.properties.id, {
            ...feature.properties,
            coordinates: feature.geometry.coordinates,
        });
    }

    for (const [id, edit] of Object.entries(adminEdits) as [string, any][]) {
        if (edit.deleted) {
            if (id.startsWith('osm-')) {
                byId.set(id, { id, deleted: true });
            } else {
                byId.delete(id);
            }
            continue;
        }

        const existing = byId.get(id) ?? { id };
        byId.set(id, { ...existing, ...edit });
    }

    const featureCollection = {
        type: 'FeatureCollection',
        features: Array.from(byId.values()).map((entry) => {
            const { coordinates, ...properties } = entry;
            return {
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: coordinates ?? [0, 0],
                },
                properties,
            };
        }),
    };

    const file = new File(Paths.cache, 'glcc-pois-custom.json');
    file.write(JSON.stringify(featureCollection, null, 2));
    const fileUri = file.uri;

    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
        await Sharing.shareAsync(fileUri, {
            mimeType: 'application/json',
            dialogTitle: 'Export GLCC POI Data',
        });
    }
}