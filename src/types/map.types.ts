/**
 * map.types.ts
 * ─────────────────────────────────────────────────────────
 * Type definitions and constants for map configuration.
 *
 * Defines:
 *  - BoundingBox: geographic bounds (west/south/east/north)
 *  - MapRegion: center + delta for map viewport
 *  - GLCC_BOUNDS: the exact bounding box of the campus
 *                 used for offline tile download
 *  - GLCC_CENTER: the default map center coordinate
 *  - GLCC_DEFAULT_ZOOM: starting zoom level for the map
 *
 * Used by: GLCCMap.tsx, useOfflinePack.ts, MapScreen.tsx
 * ─────────────────────────────────────────────────────────
 */
export interface BoundingBox {
    west: number;
    south: number;
    east: number;
    north: number;
}

export interface MapRegion {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
}

export const GLCC_BOUNDS: BoundingBox = {
    west: -89.037333,
    south: 43.813917,
    east: -88.970056,
    north: 43.838056,
};

export const GLCC_CENTER: [number, number] = [
    -89.003694, // longitude
    43.825987,  // latitude
];

export const GLCC_DEFAULT_ZOOM = 15;