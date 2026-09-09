/**
 * generateGraph.ts
 * ─────────────────────────────────────────────────────────
 * Build script — NOT part of the mobile app.
 * Run manually from terminal when paths GeoJSON changes.
 *
 * Usage: npx ts-node scripts/generateGraph.ts
 *
 * Core node-snapping/edge-building logic now lives in
 * src/routing/buildGraph.ts, shared with the running app so
 * admin-traced paths can be test-routed live before export.
 * This script is now just file I/O around that shared function.
 *
 * Input:  assets/map/glcc-paths.json
 * Output: assets/map/graph.json
 * ─────────────────────────────────────────────────────────
 */

import * as fs from 'fs';
import * as path from 'path';
import { buildGraph, PathFeature } from '../src/routing/buildGraph';

const pathsFile = path.resolve(__dirname, '../assets/map/glcc-paths.json');
const outputFile = path.resolve(__dirname, '../assets/map/graph.json');

if (!fs.existsSync(pathsFile)) {
    console.error('❌ glcc-paths.json not found in assets/map/');
    process.exit(1);
}

const geojson = JSON.parse(fs.readFileSync(pathsFile, 'utf-8'));

let skipped = 0;
const validFeatures: PathFeature[] = [];

for (const feature of geojson.features) {
    if (feature.geometry.type !== 'LineString' || feature.geometry.coordinates.length < 2) {
        skipped++;
        continue;
    }
    validFeatures.push(feature);
}

const graph = buildGraph(validFeatures);

fs.writeFileSync(outputFile, JSON.stringify(graph, null, 2));

console.log('✅ Graph generated successfully!');
console.log(`   Nodes: ${Object.keys(graph.nodes).length}`);
console.log(`   Edges: ${Object.keys(graph.edges).length}`);
if (skipped > 0) {
    console.log(`   Skipped: ${skipped} non-LineString or too-short features`);
}
console.log(`   Output: ${outputFile}`);