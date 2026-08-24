/**
 * mapStyle.ts
 * ─────────────────────────────────────────────────────────
 * Map configuration and style URL for the GLCC Navigator.
 *
 * CONFIRMED: Protomaps tiles load reliably on physical
 * devices. Occasional timeout errors in the iOS Simulator
 * are a known CoreSimulator networking bug (-2103/-1001),
 * unrelated to this code or the Protomaps service itself.
 * Develop using a physical device for map-related work.
 *
 * Used by: GLCCMap.tsx
 * ─────────────────────────────────────────────────────────
 */
import { layers,namedFlavor } from '@protomaps/basemaps';
import {StyleSpecification} from "@maplibre/maplibre-react-native";

const PROTOMAPS_API_KEY = process.env.EXPO_PUBLIC_PROTOMAPS_API_KEY;

if (!PROTOMAPS_API_KEY) {
    console.warn('⚠️ EXPO_PUBLIC_PROTOMAPS_API_KEY is not set in .env');
}

// Use demotiles when issues with Protomaps pop up
// export const MAP_STYLE_URL = 'https://demotiles.maplibre.org/style.json';

export const MAP_STYLE: StyleSpecification = {
    version: 8,
    glyphs:
        'https://protomaps.github.io/basemaps-assets/fonts/{fontstack}/{range}.pbf',
    sprite: 'https://protomaps.github.io/basemaps-assets/sprites/v4/light',
    sources: {
        protomaps: {
            type: 'vector' as const,
            tiles: [
                `https://api.protomaps.com/tiles/v4/{z}/{x}/{y}.mvt?key=${PROTOMAPS_API_KEY}`,
            ],
            maxzoom: 15,
            attribution: '<a href="https://openstreetmap.org">© OpenStreetMap</a>',
        },
    },
    layers: layers('protomaps', namedFlavor('light'), { lang: 'en' }),
};

// ── Edit these four values to change the opening map view ──
// Format: [west, south, east, north]
// Current values frame the GLCC campus on Green Lake, WI
export const GLCC_BOUNDS: [number, number, number, number] = [
    -89.030, // west  ← increase to move left edge right
    43.808,  // south ← decrease to show more area below
    -89.003, // east  ← decrease to move right edge left
    43.823,  // north ← increase to show more area above
];

// Slightly wider than GLCC_BOUNDS to give a little breathing
// room while panning, but prevents scrolling far from campus
export const MAX_PAN_BOUNDS: [number, number, number, number] = [
    -89.045, // west
    43.798,  // south
    -88.988, // east
    43.833,  // north
];

export const MAP_CONFIG = {
    // centerCoordinate: [-89.  0004, 43.8445] as [number, number],
    zoomLevel: 13, //Default at 16
    minZoom: 1,    //Default is 14 but 1 lets me zoom all the way out
    maxZoom: 19,
};