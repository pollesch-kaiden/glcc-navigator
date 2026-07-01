export type POICategory =
    | 'accommodation'
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