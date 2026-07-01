export type TransportMode =
    | 'walking'
    | 'biking'
    | 'golf_cart'
    | 'car';

export type SurfaceType =
    | 'paved'
    | 'gravel'
    | 'dirt'
    | 'grass'
    | 'boardwalk';

export interface RouteOptions {
    transportMode: TransportMode;
    noStairs: boolean;
}

export interface GraphNode {
    id: string;
    coordinates: [number, number]; // [longitude, latitude]
    connectedEdges: string[];
}

export interface GraphEdge {
    id: string;
    from: string;
    to: string;
    transportModes: TransportMode[];
    hasStairs: boolean;
    distanceMeters: number;
    bidirectional: boolean;
    surface: SurfaceType;
}

export interface Graph {
    nodes: Record<string, GraphNode>;
    edges: Record<string, GraphEdge>;
}

// Path type presets — use these when building GeoJSON
// to keep transportModes consistent across the whole map
export const PATH_PRESETS: Record<string, TransportMode[]> = {
    walking_only:   ['walking'],
    walking_biking: ['walking', 'biking'],
    shared_path:    ['walking', 'biking', 'golf_cart'],
    road:           ['walking', 'biking', 'golf_cart', 'car'],
};