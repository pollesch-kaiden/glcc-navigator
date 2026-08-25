/**
 * generateGraph.ts
 * ─────────────────────────────────────────────────────────
 * Build script — NOT part of the mobile app.
 * Run manually from terminal when paths GeoJSON changes.
 *
 * Usage: npx ts-node scripts/generateGraph.ts
 *
 * What it does:
 *  1. Reads assets/map/glcc-paths.geojson
 *  2. Treats EVERY coordinate point along EVERY path as a
 *     potential node — not just the start/end points.
 *  3. Creates an edge between each consecutive pair of points
 *     within a path.
 *  4. Snaps nearby points (within 5m) to the same node —
 *     this is what lets crossing paths actually connect,
 *     since they'll share a node at/near their intersection.
 *  5. Outputs assets/map/graph.json
 *
 * You never edit graph.json directly — always edit
 * glcc-paths.geojson and re-run this script.
 *
 * Input:  assets/map/glcc-paths.geojson
 * Output: assets/map/graph.json
 * ─────────────────────────────────────────────────────────
 */

import * as fs from 'fs';
import * as path from 'path';

const SNAP_THRESHOLD_METERS = 5; // nodes within 5m are merged
const EARTH_RADIUS = 6_371_000;

function haversine(a: number[], b: number[]): number {
    const toRad = (d: number) => (d * Math.PI) / 180;
    const dLat = toRad(b[1] - a[1]);
    const dLon = toRad(b[0] - a[0]);
    const x =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(a[1])) *
        Math.cos(toRad(b[1])) *
        Math.sin(dLon / 2) ** 2;
    return EARTH_RADIUS * 2 * Math.asin(Math.sqrt(x));
}

function pad(n: number, prefix: string): string {
    return `${prefix}-${String(n).padStart(3, '0')}`;
}

const pathsFile = path.resolve(
    __dirname,
    '../assets/map/glcc-paths.geojson'
);
const outputFile = path.resolve(
    __dirname,
    '../assets/map/graph.json'
);

if (!fs.existsSync(pathsFile)) {
    console.error('❌ glcc-paths.geojson not found in assets/map/');
    process.exit(1);
}

const geojson = JSON.parse(fs.readFileSync(pathsFile, 'utf-8'));

const nodes: Record<string, any> = {};
const edges: Record<string, any> = {};
let nodeCount = 1;
let edgeCount = 1;

// Simple spatial index — group candidate nodes by rounded
// coordinate to avoid checking every node against every point
// (this matters more once path counts grow much larger)
const spatialBuckets = new Map<string, string[]>();

function bucketKey(coords: number[]): string {
    // ~0.0005 degrees ≈ 55m — coarse enough to catch nearby
    // points but keeps bucket lookups fast
    const bx = Math.round(coords[0] / 0.0005);
    const by = Math.round(coords[1] / 0.0005);
    return `${bx},${by}`;
}

function getOrCreateNode(coords: number[]): string {
    const key = bucketKey(coords);
    const candidates = [
        ...(spatialBuckets.get(key) ?? []),
        ...(spatialBuckets.get(`${Number(key.split(',')[0]) - 1},${key.split(',')[1]}`) ?? []),
        ...(spatialBuckets.get(`${Number(key.split(',')[0]) + 1},${key.split(',')[1]}`) ?? []),
        ...(spatialBuckets.get(`${key.split(',')[0]},${Number(key.split(',')[1]) - 1}`) ?? []),
        ...(spatialBuckets.get(`${key.split(',')[0]},${Number(key.split(',')[1]) + 1}`) ?? []),
    ];

    for (const id of candidates) {
        if (haversine(coords, nodes[id].coordinates) < SNAP_THRESHOLD_METERS) {
            return id;
        }
    }

    const id = pad(nodeCount++, 'node');
    nodes[id] = {
        id,
        coordinates: [coords[0], coords[1]],
        connectedEdges: [],
    };

    if (!spatialBuckets.has(key)) spatialBuckets.set(key, []);
    spatialBuckets.get(key)!.push(id);

    return id;
}

let skipped = 0;
let segmentCount = 0;

for (const feature of geojson.features) {
    if (feature.geometry.type !== 'LineString') {
        skipped++;
        continue;
    }

    const coords: number[][] = feature.geometry.coordinates;
    const props = feature.properties ?? {};

    if (coords.length < 2) {
        skipped++;
        continue;
    }

    // Create an edge between EVERY consecutive pair of points
    // in this path, not just the first and last. This is what
    // allows paths that cross mid-way (sharing a coordinate)
    // to actually connect in the graph.
    for (let i = 0; i < coords.length - 1; i++) {
        const fromId = getOrCreateNode(coords[i]);
        const toId = getOrCreateNode(coords[i + 1]);

        if (fromId === toId) continue; // skip zero-length segments

        const distance = haversine(coords[i], coords[i + 1]);

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
        };

        nodes[fromId].connectedEdges.push(edgeId);
        nodes[toId].connectedEdges.push(edgeId);

        segmentCount++;
    }
}

fs.writeFileSync(outputFile, JSON.stringify({ nodes, edges }, null, 2));

console.log('✅ Graph generated successfully!');
console.log(`   Nodes: ${Object.keys(nodes).length}`);
console.log(`   Edges: ${Object.keys(edges).length}`);
console.log(`   Path segments processed: ${segmentCount}`);
if (skipped > 0) {
    console.log(`   Skipped: ${skipped} non-LineString features`);
}
console.log(`   Output: ${outputFile}`);