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

import { useCallback, useState, useMemo } from 'react';
import { findRoute } from '@/routing/astar';
import { findGatewayNode, findParkingGatewayNode } from '@/routing/multiModal';
import { findNearestNode, haversineDistance } from '@/utils/haversine';
import { useAppStore } from '@/store/useAppStore';
import { Graph, TransportMode } from '@/types';
import { POI } from '../types/poi.types';

const EMPTY_GRAPH: Graph = { nodes: {}, edges: {} };

// If the user's snapped position is farther than this from the
// actual path network, treat it as "not near campus" rather than
// silently computing a meaningless route
const MAX_SNAP_DISTANCE_METERS = 300;

export function useRouting(graph: Graph = EMPTY_GRAPH, pois: POI[] = []) {
    const {
        getRouteOptions,
        setActiveRoute,
        setFinalApproachRoute,
        setParkingLotName,
        setIsLoadingRoute,
        setRouteError,
    } = useAppStore();

    const [lastRoute, setLastRoute] = useState<[number, number][] | null>(null);

    // Map of graph nodeId -> parking lot POI name, built once
    // whenever the POI list changes
    const parkingNodeMap = useMemo(() => {
        const map = new Map<string, string>();
        for (const poi of pois) {
            if (poi.category === 'parking' && poi.nearestNodeId) {
                map.set(poi.nearestNodeId, poi.name);
            }
        }
        return map;
    }, [pois]);

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
                setParkingLotName(null)
                return;
            }

            // ── Attempt 2: multi-modal (vehicle + final walk)
            // Only applies to non-walking modes — walking has nowhere
            // further to fall back to
            if (options.transportMode !== 'walking') {
                const walkingOptions = {
                    ...options,
                    transportMode: 'walking' as TransportMode,
                };

                // Only Cars are routed through the parking lots; bikes and carts can get closer
                // Prefer routing to an actual known parking lot over a
                // generic point on a road, when one exists within range
                let gateway = null;
                let lotName: string | null = null;

                if (options.transportMode === 'car' && parkingNodeMap.size > 0) {
                    gateway = findParkingGatewayNode(
                        graph,
                        destinationNodeId,
                        options.transportMode,
                        new Set(parkingNodeMap.keys())
                    );
                    if (gateway) {
                        lotName = parkingNodeMap.get(gateway.gatewayNodeId) ?? null;
                    }
                }

                // Fall back to any generic vehicle-accessible point if no
                // known parking lot is close enough
                if (!gateway) {
                    gateway = findGatewayNode(graph, destinationNodeId, options.transportMode);
                    lotName = null;
                }

                if (gateway) {
                    const vehicleRoute = findRoute(
                        graph,
                        startNodeId,
                        gateway.gatewayNodeId,
                        options
                    );

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
                        setParkingLotName(lotName);
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
                    setParkingLotName(null);
                    return;
                }
            }

            setRouteError(
                'No route found. This destination may not be reachable right now.'
            );
        },
        [
            graph,
            parkingNodeMap,
            getRouteOptions,
            setActiveRoute,
            setFinalApproachRoute,
            setParkingLotName,
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