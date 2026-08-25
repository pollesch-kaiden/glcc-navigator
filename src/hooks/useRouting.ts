/**
 * useRouting.ts
 * ─────────────────────────────────────────────────────────
 * React hook that connects the A* routing engine to the
 * app's UI layer. Supports full multi-modal routing:
 *
 *  1. Try a direct route with the selected transport mode
 *  2. If that fails (e.g. destination only reachable by foot),
 *     find the nearest "gateway" node where the vehicle network
 *     meets the walking network, route there by vehicle, then
 *     walk the final stretch — mirrors real "park and walk"
 *     campus navigation
 *  3. Last resort: fall back to a full walking route so the
 *     user always gets *something* usable
 *
 * Also validates that the user's snapped starting position is
 * actually close to a real path — prevents nonsensical routes
 * when GPS reports a location far from campus (e.g. testing
 * off-site without properly faked location).
 *
 * Used by: MapScreen.tsx
 * ─────────────────────────────────────────────────────────
 */

import { useCallback, useState } from 'react';
import { findRoute } from '../routing/astar';
import { findGatewayNode } from '../routing/multiModal';
import { findNearestNode, haversineDistance } from '../utils/haversine';
import { useAppStore } from '../store/useAppStore';
import { Graph, TransportMode } from '../types/route.types';

const EMPTY_GRAPH: Graph = { nodes: {}, edges: {} };

// If the user's snapped position is farther than this from the
// actual path network, treat it as "not near campus" rather than
// silently computing a meaningless route
const MAX_SNAP_DISTANCE_METERS = 300;

export function useRouting(graph: Graph = EMPTY_GRAPH) {
    const {
        getRouteOptions,
        setActiveRoute,
        setFinalApproachRoute,
        setIsLoadingRoute,
        setRouteError,
    } = useAppStore();

    const [lastRoute, setLastRoute] = useState<[number, number][] | null>(null);

    const calculateRoute = useCallback(
        (userCoords: [number, number], destinationNodeId: string): void => {
            setIsLoadingRoute(true);
            setFinalApproachRoute(null);

            const options = getRouteOptions();
            const startNodeId = findNearestNode(userCoords, graph, options);

            if (!startNodeId) {
                setRouteError(
                    'Could not find a nearby path. Try switching transport mode.'
                );
                return;
            }

            // Sanity check — if the nearest path is unreasonably far
            // from the user's actual position, don't produce a route
            // that would be meaningless
            const startNode = graph.nodes[startNodeId];
            const snapDistance = haversineDistance(userCoords, startNode.coordinates);

            if (snapDistance > MAX_SNAP_DISTANCE_METERS) {
                setRouteError(
                    'You appear to be too far from campus paths for accurate directions.'
                );
                return;
            }

            // ── Attempt 1: direct route with the selected mode ──
            const directRoute = findRoute(
                graph,
                startNodeId,
                destinationNodeId,
                options
            );

            if (directRoute) {
                setLastRoute(directRoute);
                setActiveRoute(directRoute);
                return;
            }

            // ── Attempt 2: multi-modal (vehicle + final walk) ──
            // Only applies to non-walking modes — walking has nowhere
            // further to fall back to
            if (options.transportMode !== 'walking') {
                const gateway = findGatewayNode(
                    graph,
                    destinationNodeId,
                    options.transportMode
                );

                if (gateway) {
                    const vehicleRoute = findRoute(
                        graph,
                        startNodeId,
                        gateway.gatewayNodeId,
                        options
                    );

                    const walkingOptions = {
                        ...options,
                        transportMode: 'walking' as TransportMode,
                    };

                    const walkingRoute = findRoute(
                        graph,
                        gateway.gatewayNodeId,
                        destinationNodeId,
                        walkingOptions
                    );

                    if (vehicleRoute && walkingRoute) {
                        setLastRoute(vehicleRoute);
                        setActiveRoute(vehicleRoute);
                        setFinalApproachRoute(walkingRoute);
                        return;
                    }
                }
            }

            // ── Attempt 3: full walking fallback (last resort) ──
            const walkingOptions = {
                ...options,
                transportMode: 'walking' as TransportMode,
            };
            const walkingStartNodeId = findNearestNode(
                userCoords,
                graph,
                walkingOptions
            );

            if (walkingStartNodeId) {
                const fullWalkingRoute = findRoute(
                    graph,
                    walkingStartNodeId,
                    destinationNodeId,
                    walkingOptions
                );

                if (fullWalkingRoute) {
                    setLastRoute(fullWalkingRoute);
                    setActiveRoute(fullWalkingRoute);
                    return;
                }
            }

            setRouteError(
                'No route found. This destination may not be reachable right now.'
            );
        },
        [
            graph,
            getRouteOptions,
            setActiveRoute,
            setFinalApproachRoute,
            setIsLoadingRoute,
            setRouteError,
        ]
    );

    const clearRoute = useCallback(() => {
        setLastRoute(null);
        useAppStore.getState().clearRoute();
    }, []);

    return {
        calculateRoute,
        clearRoute,
        lastRoute,
    };
}