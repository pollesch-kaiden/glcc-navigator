/**
 * usePaths.ts
 * ─────────────────────────────────────────────────────────
 * Merges path data from three sources at runtime, mirroring
 * usePOIs.ts exactly:
 *
 *  1. glcc-paths.json       — auto-generated from OSM
 *  2. glcc-paths-custom.json — hand-traced/enriched paths
 *  3. useAdminStore.adminPathEdits — live in-app admin edits,
 *     highest priority, supports tombstone deletes
 *
 * This is the raw path data (coordinates + properties) — not
 * the routing graph. It exists so the Admin Path Editor can
 * display, select, and edit actual named path features on the
 * map, which graph.json alone doesn't retain (it only has
 * anonymous nodes/edges with no path identity or name).
 *
 * Used by: (Admin Path Editor screens, once built)
 * ─────────────────────────────────────────────────────────
 */

import { useMemo } from 'react';
import osmPaths from '../../assets/map/glcc-paths.json';
import customPaths from '../../assets/map/glcc-paths-custom.json';
import { useAdminStore } from '@/store/useAdminStore';
import { useRemoteContentStore } from '@/store/useRemoteContentStore';
import { PathFeature } from '@/routing/buildGraph';

export function usePaths(): PathFeature[] {
    const adminPathEdits = useAdminStore((state) => state.adminPathEdits);
    const remotePathData = useRemoteContentStore((state) => state.pathData);
    const activeCustomPaths = remotePathData ?? customPaths;

    return useMemo(() => {
        const merged = new Map<string, PathFeature>();

        // 1. Base layer — OSM
        for (const feature of (osmPaths as any).features as PathFeature[]) {
            const id = feature.properties?.id;
            if (id) merged.set(id, feature);
        }

        // 2. Custom layer — overrides/adds on top of OSM
        for (const feature of (activeCustomPaths as any).features as PathFeature[]) {
            const id = feature.properties?.id;
            if (id) merged.set(id, feature);
        }

        // 3. Admin layer — highest priority, supports tombstones
        for (const [id, entry] of Object.entries(adminPathEdits)) {
            if (entry.deleted) {
                merged.delete(id);
                continue;
            }

            const existing = merged.get(id);
            merged.set(id, {
                type: 'Feature',
                geometry: {
                    type: 'LineString',
                    coordinates: entry.coordinates ?? existing?.geometry.coordinates ?? [],
                },
                properties: {
                    ...(existing?.properties ?? {}),
                    ...entry,
                },
            });
        }

        return Array.from(merged.values());
    }, [activeCustomPaths, adminPathEdits]);
}