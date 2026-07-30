/**
 * astar.ts
 * ─────────────────────────────────────────────────────────
 * A* pathfinding algorithm for GLCC campus routing.
 * Runs entirely on-device — no server or internet needed.
 *
 * How it works:
 *  1. Start at the node nearest to the user's GPS position
 *  2. Explore connected edges, filtering by:
 *     - Transport mode (walking/biking/golf_cart/car)
 *     - Accessibility (skip edges where hasStairs: true)
 *     - Direction (skip one-way edges going wrong way)
 *  3. Use haversine distance as the heuristic (h score)
 *  4. Always expand the most promising node first (f score)
 *  5. Reconstruct the path once destination is reached
 *
 * Returns: ordered array of [lon, lat] coordinates
 *          or null if no valid route exists
 *
 * Used by: useRouting.ts
 * ─────────────────────────────────────────────────────────
 */
import { Graph, RouteOptions } from '../types/route.types';
import { haversineDistance } from '../utils/haversine';

interface AStarNode {
    gScore: number; // actual distance from start
    fScore: number; // gScore + heuristic estimate to end
}

/**
 * A* pathfinding algorithm
 * Finds the optimal route between two nodes in the graph
 * respecting transport mode and accessibility constraints
 *
 * Returns ordered array of [lon, lat] coordinates
 * or null if no valid route exists
 */
export function findRoute(
    graph: Graph,
    startNodeId: string,
    endNodeId: string,
    options: RouteOptions
): [number, number][] | null {
    const startNode = graph.nodes[startNodeId];
    const endNode = graph.nodes[endNodeId];

    // Basic validation
    if (!startNode || !endNode) return null;
    if (startNodeId === endNodeId) return [startNode.coordinates];

    // Nodes to evaluate — keyed by node ID
    const openSet = new Map<string, AStarNode>();

    // Nodes already evaluated
    const closedSet = new Set<string>();

    // Tracks how we got to each node (for path reconstruction)
    const cameFrom = new Map<string, string>();

    // Best known distance from start to each node
    const gScores = new Map<string, number>();

    // Initialize with start node
    gScores.set(startNodeId, 0);
    openSet.set(startNodeId, {
        gScore: 0,
        fScore: haversineDistance(
            startNode.coordinates,
            endNode.coordinates
        ),
    });

    while (openSet.size > 0) {
        // Get the node with the lowest fScore
        const currentId = getLowestFScore(openSet);

        // We reached the destination!
        if (currentId === endNodeId) {
            return reconstructPath(graph, cameFrom, currentId);
        }

        openSet.delete(currentId);
        closedSet.add(currentId);

        const currentNode = graph.nodes[currentId];
        const currentG = gScores.get(currentId) ?? Infinity;

        // Check all edges connected to this node
        for (const edgeId of currentNode.connectedEdges) {
            const edge = graph.edges[edgeId];
            if (!edge) continue;

            // ── Filter: wrong transport mode ──────────────────
            if (!edge.transportModes.includes(options.transportMode)) {
                continue;
            }

            // ── Filter: stairs when accessibility mode is on ──
            if (options.noStairs && edge.hasStairs) continue;

            // ── Filter: one-way edges ─────────────────────────
            if (!edge.bidirectional && edge.to === currentId) continue;

            // Determine which end of the edge is the neighbor
            const neighborId =
                edge.from === currentId ? edge.to : edge.from;

            if (closedSet.has(neighborId)) continue;

            const neighborNode = graph.nodes[neighborId];
            if (!neighborNode) continue;

            const tentativeG = currentG + edge.distanceMeters;
            const knownG = gScores.get(neighborId) ?? Infinity;

            if (tentativeG < knownG) {
                // This is a better path to the neighbor
                cameFrom.set(neighborId, currentId);
                gScores.set(neighborId, tentativeG);

                const h = haversineDistance(
                    neighborNode.coordinates,
                    endNode.coordinates
                );

                openSet.set(neighborId, {
                    gScore: tentativeG,
                    fScore: tentativeG + h,
                });
            }
        }
    }

    // No path found — destination unreachable for this mode
    return null;
}

/**
 * Returns the node ID with the lowest fScore from the open set
 */
function getLowestFScore(openSet: Map<string, AStarNode>): string {
    let lowestId = '';
    let lowestScore = Infinity;

    for (const [id, node] of openSet.entries()) {
        if (node.fScore < lowestScore) {
            lowestScore = node.fScore;
            lowestId = id;
        }
    }

    return lowestId;
}

/**
 * Traces back through cameFrom to build the final path
 */
function reconstructPath(
    graph: Graph,
    cameFrom: Map<string, string>,
    endNodeId: string
): [number, number][] {
    const path: [number, number][] = [];
    let current = endNodeId;

    while (cameFrom.has(current)) {
        path.unshift(graph.nodes[current].coordinates);
        current = cameFrom.get(current)!;
    }

    // Add the start node
    path.unshift(graph.nodes[current].coordinates);

    return path;
}