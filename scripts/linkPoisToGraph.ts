/**
 * linkPoisToGraph.ts
 * ─────────────────────────────────────────────────────────
 * Calculates the nearest routing graph node for every POI
 * and writes the result as a nearestNodeId override into
 * glcc-pois-custom.json.
 *
 * Handles two cases:
 *  1. POIs imported from OSM (glcc-pois-osm.json) — linked
 *     and merged into a matching custom entry, or a new stub
 *     entry is created if none exists yet.
 *  2. Brand-new custom-only POIs that don't exist in OSM at
 *     all (e.g. manually added parking lots) — these already
 *     live only in glcc-pois-custom.json, so they are linked
 *     directly in place.
 *
 * This must be re-run any time:
 *  - New POIs are added (OSM or custom)
 *  - The path network changes (graph.json regenerated)
 *
 * Usage:
 *   npx ts-node scripts/linkPoisToGraph.ts
 *
 * Uses simple haversine distance — good enough since we're
 * just snapping to the closest point on the path network,
 * not doing actual routing math here.
 * ─────────────────────────────────────────────────────────
 */

import * as fs from 'fs';
import * as path from 'path';

const EARTH_RADIUS = 6_371_000;
const FAR_THRESHOLD_METERS = 100; // flag POIs unusually far from any path

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

const graphFile = path.resolve(__dirname, '../assets/map/graph.json');
const osmPoisFile = path.resolve(
    __dirname,
    '../assets/map/glcc-pois-osm.json'
);
const customPoisFile = path.resolve(
    __dirname,
    '../assets/map/glcc-pois-custom.json'
);

if (!fs.existsSync(graphFile)) {
    console.error('Error: graph.json not found. Run `npm run generate-graph` first.');
    process.exit(1);
}

const graph = JSON.parse(fs.readFileSync(graphFile, 'utf-8'));
const osmPois = JSON.parse(fs.readFileSync(osmPoisFile, 'utf-8'));

let customData: { type: string; features: any[] };

if (fs.existsSync(customPoisFile)) {
    try {
        const parsed = JSON.parse(fs.readFileSync(customPoisFile, 'utf-8'));
        customData = {
            type: 'FeatureCollection',
            features: Array.isArray(parsed.features) ? parsed.features : [],
        };
    } catch (err) {
        console.warn('Warning: could not parse glcc-pois-custom.json, starting fresh');
        customData = { type: 'FeatureCollection', features: [] };
    }
} else {
    customData = { type: 'FeatureCollection', features: [] };
}

// Build a quick lookup of existing custom entries by id
const customById = new Map<string, any>();
for (const feature of customData.features) {
    customById.set(feature.properties.id, feature);
}

const nodeEntries = Object.entries(graph.nodes) as [string, any][];

if (nodeEntries.length === 0) {
    console.error('Error: graph has no nodes. Check glcc-paths.geojson has data.');
    process.exit(1);
}

function findNearestNode(coords: number[]): { id: string; distance: number } {
    let nearestId = '';
    let minDist = Infinity;

    for (const [id, node] of nodeEntries) {
        const dist = haversine(coords, node.coordinates);
        if (dist < minDist) {
            minDist = dist;
            nearestId = id;
        }
    }

    return { id: nearestId, distance: minDist };
}

let linked = 0;
let farWarnings = 0;

// ── Step 1: Link every OSM-imported POI ──────────────────────
for (const poiFeature of osmPois.features) {
    const poiId = poiFeature.properties.id;
    const coords = poiFeature.geometry.coordinates;

    const { id: nearestNodeId, distance } = findNearestNode(coords);

    if (distance > FAR_THRESHOLD_METERS) {
        farWarnings++;
        console.warn(
            `Warning: "${poiFeature.properties.name}" is ${Math.round(distance)}m from nearest path (node ${nearestNodeId})`
        );
    }

    const existing = customById.get(poiId);

    if (existing) {
        existing.properties.nearestNodeId = nearestNodeId;
    } else {
        customById.set(poiId, {
            type: 'Feature',
            geometry: poiFeature.geometry,
            properties: {
                id: poiId,
                nearestNodeId,
            },
        });
    }

    linked++;
}

// ── Step 2: Link brand-new custom-only POIs (not from OSM) ──
// These already live only in glcc-pois-custom.json and were
// never touched by the loop above, since that loop only
// iterates osmPois.features.
for (const [poiId, feature] of customById.entries()) {
    const alreadyProcessed = osmPois.features.some(
        (f: any) => f.properties.id === poiId
    );
    if (alreadyProcessed) continue;

    const coords = feature.geometry.coordinates;
    const { id: nearestNodeId, distance } = findNearestNode(coords);

    if (distance > FAR_THRESHOLD_METERS) {
        farWarnings++;
        console.warn(
            `Warning: "${feature.properties.name ?? poiId}" is ${Math.round(distance)}m from nearest path (node ${nearestNodeId})`
        );
    }

    feature.properties.nearestNodeId = nearestNodeId;
    linked++;
}

const output = {
    type: 'FeatureCollection' as const,
    features: Array.from(customById.values()),
};

fs.writeFileSync(customPoisFile, JSON.stringify(output, null, 2));

console.log(`Linked ${linked} POIs to nearest graph nodes`);
if (farWarnings > 0) {
    console.log(
        `${farWarnings} POIs are more than ${FAR_THRESHOLD_METERS}m from any path — consider adding paths near them`
    );
}
console.log(`Output: ${customPoisFile}`);