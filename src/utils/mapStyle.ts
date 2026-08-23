/**
 * mapStyle.ts
 * ─────────────────────────────────────────────────────────
 * Generates the MapLibre style URL for Protomaps tiles.
 * Centralizes the API key and style configuration so it
 * only needs to be changed in one place.
 *
 * Protomaps style options:
 *  - light     → clean light map good for navigation
 *  - dark      → dark mode
 *  - white     → minimal white
 *  - grayscale → muted colors
 *
 * Used by: GLCCMap.tsx
 * ─────────────────────────────────────────────────────────
 */

const PROTOMAPS_API_KEY = process.env.EXPO_PUBLIC_PROTOMAPS_API_KEY;

if (!PROTOMAPS_API_KEY) {
    console.warn('⚠️ EXPO_PUBLIC_PROTOMAPS_API_KEY is not set in .env');
}

// Use demotiles when issues with Protomaps pop up
// export const MAP_STYLE_URL = 'https://demotiles.maplibre.org/style.json';

export const MAP_STYLE_URL = `https://api.protomaps.com/styles/v5/light/en.json?key=${PROTOMAPS_API_KEY}`;

// ── Edit these four values to change the opening map view ──
// Format: [west, south, east, north]
// Current values frame the GLCC campus on Green Lake, WI
export const GLCC_BOUNDS: [number, number, number, number] = [
    -89.030, // west  ← increase to move left edge right
    43.808,  // south ← decrease to show more area below
    -89.003, // east  ← decrease to move right edge left
    43.823,  // north ← increase to show more area above
];

export const MAP_CONFIG = {
    // centerCoordinate: [-89.  0004, 43.8445] as [number, number],
    zoomLevel: 13, //Default at 16
    minZoom: 1,    //Default is 14 but 1 lets me zoom all the way out
    maxZoom: 19,
};