/**
 * useLiveGraph.ts
 * ─────────────────────────────────────────────────────────
 * Produces the graph that should actually be used for
 * routing. Under normal conditions (no admin path edits),
 * this is just the bundled, pre-built graph.json — cheap and
 * instant.
 *
 * Once any admin path edits exist (a newly-traced path, or a
 * correction/deletion of an existing OSM/custom path), the
 * full graph is rebuilt in-memory from usePaths()'s already-
 * merged output (OSM + custom + admin, tombstones applied)
 * using the same buildGraph() logic as the offline script.
 *
 * This lets a newly-traced or edited path be test-routed
 * immediately, on-site, with no export/rebuild step required.
 *
 * Used by: MapScreen.tsx
 * ─────────────────────────────────────────────────────────
 */

import { useMemo } from 'react';
import { Graph } from '@/types/route.types';
import { useAdminStore } from '@/store/useAdminStore';
import { buildGraph, PathFeature } from '@/routing/buildGraph';

export function useLiveGraph(baseGraph: Graph, paths: PathFeature[]): Graph {
    const adminPathEdits = useAdminStore((state) => state.adminPathEdits);

    const hasAdminPathEdits = useMemo(
        () => Object.keys(adminPathEdits).length > 0,
        [adminPathEdits]
    );

    return useMemo(() => {
        if (!hasAdminPathEdits) return baseGraph;
        return buildGraph(paths);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hasAdminPathEdits, paths]);
}