/**
 * exportPathData.ts
 * ─────────────────────────────────────────────────────────
 * Merges the bundled OSM path data, bundled custom path data,
 * and the in-app admin path overlay into one ready-to-share
 * glcc-paths-custom.json export.
 *
 * This mirrors the POI export flow: it writes the merged result
 * into the app cache and opens the native Share sheet so the
 * user can send the file to a Mac or other workstation for
 * import/manual review.
 *
 * Deletion handling follows the same rules as the POI export:
 *  - OSM-sourced paths deleted in-app remain as a tombstone
 *    entry so the app can continue to hide them after a future
 *    rebuild.
 *  - Custom/admin paths deleted in-app are removed entirely.
 * ─────────────────────────────────────────────────────────
 */

import { Paths, File } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import osmPaths from '../../assets/map/glcc-paths.json';
import customPaths from '../../assets/map/glcc-paths-custom.json';
import { useAdminStore } from '../store/useAdminStore';
import { PathFeature } from '@/routing/buildGraph';

function collectFeatureMap(featureCollection: { features?: PathFeature[] } | undefined, map: Map<string, PathFeature>) {
    for (const feature of featureCollection?.features ?? []) {
        const id = feature?.properties?.id;
        if (!id) continue;
        map.set(id, feature);
    }
}

export async function exportPathData(): Promise<void> {
    const adminPathEdits = useAdminStore.getState().adminPathEdits;
    const merged = new Map<string, PathFeature>();

    collectFeatureMap(osmPaths as any, merged);
    collectFeatureMap(customPaths as any, merged);

    for (const [id, edit] of Object.entries(adminPathEdits)) {
        if (edit.deleted) {
            if (id.startsWith('osm-')) {
                merged.set(id, {
                    type: 'Feature',
                    geometry: { type: 'LineString', coordinates: [] },
                    properties: { id, deleted: true },
                });
            } else {
                merged.delete(id);
            }
            continue;
        }

        const existing = merged.get(id) ?? {
            type: 'Feature',
            geometry: { type: 'LineString', coordinates: [] },
            properties: { id },
        };

        merged.set(id, {
            type: 'Feature',
            geometry: {
                type: 'LineString',
                coordinates: edit.coordinates ?? existing.geometry.coordinates ?? [],
            },
            properties: {
                ...(existing.properties ?? {}),
                ...edit,
            },
        });
    }

    const featureCollection = {
        type: 'FeatureCollection',
        features: Array.from(merged.values())
            .filter((feature) => !feature.properties?.deleted)
            .map((feature) => ({
                type: 'Feature',
                geometry: {
                    type: feature.geometry?.type ?? 'LineString',
                    coordinates: feature.geometry?.coordinates ?? [],
                },
                properties: {
                    ...(feature.properties ?? {}),
                },
            })),
    };

    const file = new File(Paths.cache, 'glcc-paths-custom.json');
    file.write(JSON.stringify(featureCollection, null, 2));
    const canShare = await Sharing.isAvailableAsync();

    if (canShare) {
        await Sharing.shareAsync(file.uri, {
            mimeType: 'application/json',
            dialogTitle: 'Export GLCC Path Data',
        });
    }
}
