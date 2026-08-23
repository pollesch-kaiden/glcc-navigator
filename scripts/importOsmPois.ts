/**
 * importOsmPois.ts
 * ─────────────────────────────────────────────────────────
 * Converts a raw OpenStreetMap GeoJSON export (from Overpass
 * Turbo) into our app's POI schema.
 *
 * Usage:
 *   1. Export data from overpass-turbo.eu as GeoJSON
 *   2. Save it to assets/map/osm-import/glcc-osm-raw.geojson
 *   3. Run: npx ts-node scripts/importOsmPois.ts
 *   4. Output written to assets/map/glcc-pois-osm.geojson
 *
 * This file is separate from glcc-pois-custom.geojson so you
 * can re-run the OSM import anytime without losing custom
 * POIs you've added by hand.
 * ─────────────────────────────────────────────────────────
 */

import * as fs from 'fs';
import * as path from 'path';

const inputFile = path.resolve(
    __dirname,
    '../assets/map/osm-import/glcc-osm-raw.geojson'
);
const outputFile = path.resolve(
    __dirname,
    '../assets/map/glcc-pois-osm.json'
);

if (!fs.existsSync(inputFile)) {
    console.error('   Raw OSM file not found at:', inputFile);
    console.error('   Export from overpass-turbo.eu first.');
    process.exit(1);
}

const raw = JSON.parse(fs.readFileSync(inputFile, 'utf-8'));

// ── OSM tag → our category mapping ──────────────────────────
function mapCategory(tags: Record<string, string>): string {
    if (tags.tourism === 'hotel' || tags.building === 'dormitory') return 'accommodation';
    if (tags.amenity === 'restaurant' || tags.amenity === 'cafe' || tags.amenity === 'fast_food') return 'dining';
    if (tags.amenity === 'place_of_worship' || tags.building === 'chapel') return 'chapel';
    if (tags.amenity === 'conference_centre' || tags.building === 'civic') return 'conference';
    if (tags.leisure || tags.sport) return 'recreation';
    if (tags.natural === 'beach' || tags.leisure === 'beach_resort') return 'waterfront';
    if (tags.amenity === 'toilets') return 'restroom';
    if (tags.amenity === 'parking') return 'parking';
    if (tags.historic || tags.tourism === 'attraction') return 'landmark';
    return 'other';
}

function getCoordinates(feature: any): [number, number] | null {
    if (feature.geometry?.type === 'Point') {
        return feature.geometry.coordinates;
    }
    // For ways/relations exported with "out center", Overpass
    // includes a "center" property with lat/lon
    if (feature.properties?.center) {
        return [feature.properties.center.lon, feature.properties.center.lat];
    }
    return null;
}

const converted = {
    type: 'FeatureCollection' as const,
    features: [] as any[],
};

let skipped = 0;

for (const feature of raw.features) {
    const tags = feature.properties?.tags ?? feature.properties ?? {};
    const name = tags.name;

    if (!name) {
        skipped++;
        continue;
    }

    const coords = getCoordinates(feature);
    if (!coords) {
        skipped++;
        continue;
    }

    const category = mapCategory(tags);

    converted.features.push({
        type: 'Feature',
        geometry: {
            type: 'Point',
            coordinates: coords,
        },
        properties: {
            id: `osm-${feature.id ?? feature.properties?.id ?? Math.random().toString(36).slice(2)}`,
            name,
            category,
            description: tags.description ?? '',
            activities: [],
            amenities: [],
            accessible: tags.wheelchair === 'yes',
            hasStairs: false,
            nearestNodeId: '',
            tags: Object.keys(tags),
            hours: tags.opening_hours ?? undefined,
            phone: tags.phone ?? undefined,
            source: 'osm', // marks this as imported, not custom
        },
    });
}

fs.writeFileSync(outputFile, JSON.stringify(converted, null, 2));

console.log(`   Converted ${converted.features.length} POIs from OSM`);
console.log(`   Skipped ${skipped} features (no name or coordinates)`);
console.log(`   Output: ${outputFile}`);