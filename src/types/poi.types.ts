/**
 * poi.types.ts
 * ─────────────────────────────────────────────────────────
 * Type definitions for Points of Interest (POIs) on the
 * GLCC campus — buildings, landmarks, recreation areas, etc.
 *
 * Defines:
 *  - POICategory: broad classification (lodging,
 *                 dining, recreation, chapel, etc.)
 *  - ActivityTag: what you can DO at a POI (swimming,
 *                 kayaking, meetings, worship, etc.)
 *  - POI: full data shape for a single point of interest
 *         including coordinates, activities, amenities,
 *         accessibility info, and routing connection
 *
 * Used by: useAppStore.ts, usePOIFilter.ts, POICard.tsx,
 *          POIDetailSheet.tsx, POIMarkers.tsx
 * ─────────────────────────────────────────────────────────
 */
export type POICategory =
    | 'lodging'
    | 'dining'
    | 'conference'
    | 'recreation'
    | 'landmark'
    | 'restroom'
    | 'parking'
    | 'waterfront'
    | 'chapel'
    | 'other';

export type ActivityTag =
    | 'swimming'
    | 'kayaking'
    | 'hiking'
    | 'fishing'
    | 'meetings'
    | 'dining'
    | 'sleeping'
    | 'sports'
    | 'worship'
    | 'nature'
    | 'history'
    | 'beach'
    | 'bonfire'
    | 'games'
    | 'art'
    | 'music';

export interface POI {
    id: string;
    name: string;
    category: POICategory;
    coordinates: [number, number];
    description: string;
    activities: ActivityTag[];
    amenities: string[];
    accessible: boolean;
    hasStairs: boolean;
    nearestNodeId: string;
    tags: string[];
    hours?: string;
    phone?: string;
    imageAsset?: string;
}