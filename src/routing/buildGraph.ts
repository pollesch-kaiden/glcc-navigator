/**
 * buildGraph.ts
 * ─────────────────────────────────────────────────────────
 * Shared graph-building logic used by both:
 *  - scripts/generateGraph.ts (Node script, full rebuild from
 *    the complete bundled paths dataset)
 *  - the running app (live, in-memory augmentation of the
 *    bundled graph with admin-traced/edited paths, so new
 *    paths can be test-routed before ever being exported)
 *
 * Core behavior (unchanged from the original generateGraph.ts):
 *  - Every coordinate along every LineString becomes a
 *    potential node, not just the endpoints.
 *  - Points within SNAP_THRESHOLD_METERS of an existing node
 *    are merged into that node, which is what allows crossing
 *    or touching paths to connect automatically.
 *  - An edge is created between every consecutive pair of
 *    points within a path.
 *
 * New capability:
 *  - If an `existingGraph` is passed in, its nodes/edges are
 *    seeded first, so new path features snap to and connect
 *    with an already-built graph instead of starting empty.
 *    Newly generated IDs are guaranteed not to collide with
 *    IDs already present in the seeded graph.
 * ─────────────────────────────────────────────────────────
 */

import { Graph, GraphNode, GraphEdge } from '../types/route.types';
import { haversineDistance } from '../utils/haversine';

export const SNAP_THRESHOLD_METERS = 5;

export interface PathFeature {
    type: 'Feature';
    geometry: {
        type: string;
        coordinates: number[][];
    };
    properties: {
        id?: string;
        name?: string;
        transportModes?: string[];
        hasStairs?: boolean;
        bidirectional?: boolean;
        surface?: string;
        [key: string]: any;
    };
}

interface BuildGraphOptions {
    existingGraph?: Graph;
}

function pad(n: number, prefix: string): string {
    return `${prefix}-${String(n).padStart(3, '0')}`;
}

// Finds the highest numeric suffix already used by a given
// prefix, so newly-generated IDs never collide with a seeded
// existing graph's IDs
function highestExistingId(ids: string[], prefix: string): number {
    let max = 0;
    const re = new RegExp(`^${prefix}-(\\d+)$`);
    for (const id of ids) {
        const match = id.match(re);
        if (match) {
            const n = parseInt(match[1], 10);
            if (n > max) max = n;
        }
    }
    return max;
}

/**
 * Builds a routing graph from a set of path features.
 *
 * If `options.existingGraph` is provided, the returned graph
 * is a full merge: every original node and edge, plus
 * whatever was newly created from `features`.
 */
export function buildGraph(
    features: PathFeature[],
    options: BuildGraphOptions = {}
): Graph {
    const nodes: Record<string, GraphNode> = {};
    const edges: Record<string, GraphEdge> = {};
    const spatialBuckets = new Map<string, string[]>();

    function bucketKey(coords: number[]): string {
        const bx = Math.round(coords[0] / 0.0005);
        const by = Math.round(coords[1] / 0.0005);
        return `${bx},${by}`;
    }

    function addToBucket(id: string, coords: number[]) {
        const key = bucketKey(coords);
        if (!spatialBuckets.has(key)) spatialBuckets.set(key, []);
        spatialBuckets.get(key)!.push(id);
    }

    let nodeCount = 1;
    let edgeCount = 1;

    if (options.existingGraph) {
        for (const [id, node] of Object.entries(options.existingGraph.nodes)) {
            nodes[id] = { ...node, connectedEdges: [...node.connectedEdges] } as GraphNode;
            addToBucket(id, node.coordinates as unknown as number[]);
        }
        for (const [id, edge] of Object.entries(options.existingGraph.edges)) {
            edges[id] = { ...edge } as GraphEdge;
        }
        nodeCount = highestExistingId(Object.keys(nodes), 'node') + 1;
        edgeCount = highestExistingId(Object.keys(edges), 'edge') + 1;
    }

    function getOrCreateNode(coords: number[]): string {
        const key = bucketKey(coords);
        const [kx, ky] = key.split(',').map(Number);
        const candidates = [
            ...(spatialBuckets.get(key) ?? []),
            ...(spatialBuckets.get(`${kx - 1},${ky}`) ?? []),
            ...(spatialBuckets.get(`${kx + 1},${ky}`) ?? []),
            ...(spatialBuckets.get(`${kx},${ky - 1}`) ?? []),
            ...(spatialBuckets.get(`${kx},${ky + 1}`) ?? []),
        ];

        for (const id of candidates) {
            const nodeCoords = nodes[id].coordinates as unknown as [number, number];
            if (haversineDistance([coords[0], coords[1]], nodeCoords) < SNAP_THRESHOLD_METERS) {
                return id;
            }
        }

        const id = pad(nodeCount++, 'node');
        nodes[id] = {
            id,
            coordinates: [coords[0], coords[1]],
            connectedEdges: [],
        } as unknown as GraphNode;

        addToBucket(id, coords);
        return id;
    }

    for (const feature of features) {
        if (feature.geometry.type !== 'LineString') continue;

        const coords = feature.geometry.coordinates;
        const props = feature.properties ?? {};

        if (coords.length < 2) continue;

        for (let i = 0; i < coords.length - 1; i++) {
            const fromId = getOrCreateNode(coords[i]);
            const toId = getOrCreateNode(coords[i + 1]);

            if (fromId === toId) continue;

            const distance = haversineDistance(
                [coords[i][0], coords[i][1]],
                [coords[i + 1][0], coords[i + 1][1]]
            );

            const edgeId = pad(edgeCount++, 'edge');

            edges[edgeId] = {
                id: edgeId,
                from: fromId,
                to: toId,
                transportModes: props.transportModes ?? ['walking'],
                hasStairs: props.hasStairs ?? false,
                distanceMeters: Math.round(distance),
                bidirectional: props.bidirectional ?? true,
                surface: props.surface ?? 'paved',
            } as unknown as GraphEdge;

            nodes[fromId].connectedEdges.push(edgeId);
            nodes[toId].connectedEdges.push(edgeId);
        }
    }

    return { nodes, edges };
}