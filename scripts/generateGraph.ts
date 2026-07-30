/**
 * Graph Generator Script - script to build graph from GeoJSON
 *
 * Converts glcc-paths.geojson into graph.json
 * which is used by the A* routing engine
 *
 * Usage: npx ts-node scripts/generateGraph.ts
 * Run this every time you update glcc-paths.geojson
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
    console.error('   Create this file first before running the generator');
    process.exit(1);
}

const geojson = JSON.parse(fs.readFileSync(pathsFile, 'utf-8'));

const nodes: Record<string, any> = {};
const edges: Record<string, any> = {};
let nodeCount = 1;
let edgeCount = 1;

function getOrCreateNode(coords: number[]): string {
    // Check if a node already exists within snap threshold
    for (const [id, node] of Object.entries(nodes)) {
        if (haversine(coords, (node as any).coordinates) < SNAP_THRESHOLD_METERS) {
            return id;
        }
    }
    // Create a new node
    const id = pad(nodeCount++, 'node');
    nodes[id] = {
        id,
        coordinates: [coords[0], coords[1]],
        connectedEdges: [],
    };
    return id;
}

let skipped = 0;

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

    // Create or find nodes at start and end of this path
    const startId = getOrCreateNode(coords[0]);
    const endId = getOrCreateNode(coords[coords.length - 1]);

    // Calculate total distance along the path
    let distance = 0;
    for (let i = 0; i < coords.length - 1; i++) {
        distance += haversine(coords[i], coords[i + 1]);
    }

    const edgeId = pad(edgeCount++, 'edge');

    edges[edgeId] = {
        id: edgeId,
        from: startId,
        to: endId,
        transportModes: props.transportModes ?? ['walking'],
        hasStairs: props.hasStairs ?? false,
        distanceMeters: Math.round(distance),
        bidirectional: props.bidirectional ?? true,
        surface: props.surface ?? 'paved',
    };

    // Connect edge to both nodes
    nodes[startId].connectedEdges.push(edgeId);
    nodes[endId].connectedEdges.push(edgeId);
}

fs.writeFileSync(outputFile, JSON.stringify({ nodes, edges }, null, 2));

console.log('✅ Graph generated successfully!');
console.log(`   Nodes: ${Object.keys(nodes).length}`);
console.log(`   Edges: ${Object.keys(edges).length}`);
if (skipped > 0) {
    console.log(`   Skipped: ${skipped} non-LineString features`);
}
console.log(`   Output: ${outputFile}`);