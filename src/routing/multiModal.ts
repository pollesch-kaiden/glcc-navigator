/**
 * multiModal.ts
 * ─────────────────────────────────────────────────────────
 * Finds the nearest "gateway" node where a vehicle-accessible
 * path (car/bike/golf_cart) meets the walking network, near a
 * given destination.
 *
 * Models realistic campus navigation: "drive/bike/cart to this
 * point, then walk the rest of the way" — used when a
 * destination is only reachable by a short walking-only
 * footpath from the main road network.
 *
 * Used by: useRouting.ts
 * ─────────────────────────────────────────────────────────
 */

import { Graph, TransportMode } from '../types/route.types';

// Maximum distance (meters) to search for a vehicle-accessible
// gateway node near a walking-only destination. Increase if
// legitimate destinations are being marked unreachable by
// vehicle; decrease if gateway points feel too far away.
// 400m ≈ a 5 minute walk.
export const MAX_GATEWAY_WALK_DISTANCE_METERS = 400;

export interface GatewayResult {
    gatewayNodeId: string;
    walkDistanceMeters: number;
}

export function findGatewayNode(
    graph: Graph,
    destinationNodeId: string,
    vehicleMode: TransportMode,
    maxWalkDistanceMeters: number = MAX_GATEWAY_WALK_DISTANCE_METERS
): GatewayResult | null {
    const distances = new Map<string, number>();
    distances.set(destinationNodeId, 0);

    const queue: string[] = [destinationNodeId];

    while (queue.length > 0) {
        queue.sort((a, b) => distances.get(a)! - distances.get(b)!);
        const current = queue.shift()!;
        const currentDist = distances.get(current)!;

        if (currentDist > maxWalkDistanceMeters) continue;

        const node = graph.nodes[current];
        if (!node) continue;

        const hasVehicleAccess = node.connectedEdges.some(
            (edgeId: string) =>
                graph.edges[edgeId]?.transportModes.includes(vehicleMode)
        );

        if (hasVehicleAccess) {
            return { gatewayNodeId: current, walkDistanceMeters: currentDist };
        }

        for (const edgeId of node.connectedEdges) {
            const edge = graph.edges[edgeId];
            if (!edge.transportModes.includes('walking')) continue;

            const neighborId = edge.from === current ? edge.to : edge.from;
            const newDist = currentDist + edge.distanceMeters;

            if (newDist < (distances.get(neighborId) ?? Infinity)) {
                distances.set(neighborId, newDist);
                if (!queue.includes(neighborId)) {
                    queue.push(neighborId);
                }
            }
        }
    }

    return null;
}