/**
 * Distance math + snap to nearest node
 */
import { Graph, RouteOptions } from '../types/route.types';

const EARTH_RADIUS_METERS = 6_371_000;

/**
 * Calculates straight-line distance in meters between
 * two [longitude, latitude] coordinate pairs
 */
export function haversineDistance(
    [lon1, lat1]: [number, number],
    [lon2, lat2]: [number, number]
): number {
    const toRad = (deg: number) => (deg * Math.PI) / 180;

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) ** 2;

    return EARTH_RADIUS_METERS * 2 * Math.asin(Math.sqrt(a));
}

/**
 * Finds the closest graph node to a given coordinate
 * that is reachable given the user's transport mode
 * and accessibility settings
 */
export function findNearestNode(
    userCoords: [number, number],
    graph: Graph,
    options: RouteOptions
): string | null {
    let nearestId: string | null = null;
    let minDist = Infinity;

    for (const [id, node] of Object.entries(graph.nodes)) {
        // Only snap to nodes that have at least one valid
        // edge for the user's transport mode + stair preference
        const hasValidEdge = node.connectedEdges.some((edgeId) => {
            const edge = graph.edges[edgeId];
            if (!edge) return false;

            const modeAllowed = edge.transportModes.includes(
                options.transportMode
            );
            const stairsOk = !options.noStairs || !edge.hasStairs;

            return modeAllowed && stairsOk;
        });

        if (!hasValidEdge) continue;

        const dist = haversineDistance(userCoords, node.coordinates);
        if (dist < minDist) {
            minDist = dist;
            nearestId = id;
        }
    }

    return nearestId;
}