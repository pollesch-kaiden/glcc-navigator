/**
 * importOsmPaths.ts
 * ─────────────────────────────────────────────────────────
 * Converts a raw OpenStreetMap GeoJSON export (from Overpass
 * Turbo, using "out geom;") into our app's path schema.
 *
 * Usage:
 *   1. Query Overpass for highway ways within GLCC bounds
 *   2. Export as GeoJSON with "out geom;" (full line geometry)
 *   3. Save to assets/map/osm-import/glcc-paths-raw.geojson
 *   4. Run: npx ts-node scripts/importOsmPaths.ts
 *   5. Output written to assets/map/glcc-paths.geojson
 *
 * Maps OSM highway tags to our transport mode rules:
 *   footway/path/pedestrian → walking only
 *   cycleway                → walking + biking
 *   residential/service     → walking + biking + golf_cart + car
 *   track                   → walking + biking + golf_cart
 *
 * After running this, regenerate the routing graph with:
 *   npm run generate-graph
 * ─────────────────────────────────────────────────────────
 */

import * as fs from 'fs';
import * as path from 'path';

const inputFile = path.resolve(
    __dirname,
    '../assets/map/osm-import/glcc-paths-raw.geojson'
);
const outputFile = path.resolve(
    __dirname,
    '../assets/map/glcc-paths.geojson'
);

if (!fs.existsSync(inputFile)) {
    console.error('❌ Raw OSM paths file not found at:', inputFile);
    console.error('   Export from overpass-turbo.eu first.');
    process.exit(1);
}

const raw = JSON.parse(fs.readFileSync(inputFile, 'utf-8'));

// ── OSM highway tag → transport mode mapping ────────────────
function mapTransportModes(tags: Record<string, string>): string[] {
    const highway = tags.highway;

    // Walking-only paths
    if (
        highway === 'footway' ||
        highway === 'path' ||
        highway === 'pedestrian' ||
        highway === 'steps'
    ) {
        return ['walking'];
    }

    // Bike-friendly paths
    if (highway === 'cycleway') {
        return ['walking', 'biking'];
    }

    // Unpaved tracks — assume golf cart accessible
    if (highway === 'track') {
        return ['walking', 'biking', 'golf_cart'];
    }

    // Full roads — everything allowed
    if (
        highway === 'residential' ||
        highway === 'service' ||
        highway === 'unclassified' ||
        highway === 'tertiary'
    ) {
        return ['walking', 'biking', 'golf_cart', 'car'];
    }

    // Default fallback — walking only (safest assumption)
    return ['walking'];
}

function mapSurface(tags: Record<string, string>): string {
    if (tags.surface === 'paved' || tags.surface === 'asphalt') return 'paved';
    if (tags.surface === 'gravel') return 'gravel';
    if (tags.surface === 'dirt' || tags.surface === 'ground') return 'dirt';
    if (tags.surface === 'grass') return 'grass';
    if (tags.highway === 'residential' || tags.highway === 'service') return 'paved';
    return 'paved'; // default assumption
}

function hasStairs(tags: Record<string, string>): boolean {
    return tags.highway === 'steps';
}

const converted = {
    type: 'FeatureCollection' as const,
    features: [] as any[],
};

let skipped = 0;

for (const feature of raw.features) {
    if (feature.geometry?.type !== 'LineString') {
        skipped++;
        continue;
    }

    const tags = feature.properties?.tags ?? feature.properties ?? {};

    if (!tags.highway) {
        skipped++;
        continue;
    }

    converted.features.push({
        type: 'Feature',
        geometry: {
            type: 'LineString',
            coordinates: feature.geometry.coordinates,
        },
        properties: {
            id: `osm-${feature.id ?? Math.random().toString(36).slice(2)}`,
            name: tags.name ?? '',
            transportModes: mapTransportModes(tags),
            surface: mapSurface(tags),
            hasStairs: hasStairs(tags),
            bidirectional: tags.oneway !== 'yes',
            source: 'osm',
        },
    });
}

fs.writeFileSync(outputFile, JSON.stringify(converted, null, 2));

console.log(`✅ Converted ${converted.features.length} paths from OSM`);
console.log(`   Skipped ${skipped} features (no highway tag or not a line)`);
console.log(`   Output: ${outputFile}`);
console.log(`\n   Next step: run 'npm run generate-graph' to rebuild the routing graph`);