/**
 * Hook that connects it all together
 */

import { useCallback, useState } from 'react';
import { findRoute } from '../routing/astar';
import { findNearestNode } from '../utils/haversine';
import { useAppStore } from '../store/useAppStore';
import { Graph } from '../types/route.types';

// We'll swap this for real data once we have GeoJSON
const EMPTY_GRAPH: Graph = { nodes: {}, edges: {} };

export function useRouting(graph: Graph = EMPTY_GRAPH) {
    const { getRouteOptions, setActiveRoute, setIsLoadingRoute, setRouteError } =
        useAppStore();

    const [lastRoute, setLastRoute] = useState<[number, number][] | null>(null);

    const calculateRoute = useCallback(
        (
            userCoords: [number, number],
            destinationNodeId: string
        ): void => {
            setIsLoadingRoute(true);

            const options = getRouteOptions();

            // Snap user's GPS position to nearest valid node
            const startNodeId = findNearestNode(userCoords, graph, options);

            if (!startNodeId) {
                setRouteError(
                    'Could not find a nearby path. Try switching transport mode.'
                );
                return;
            }

            // Run A* on device
            const route = findRoute(
                graph,
                startNodeId,
                destinationNodeId,
                options
            );

            if (!route) {
                setRouteError(
                    'No route found. This destination may not be reachable by your current transport mode.'
                );
                return;
            }

            setLastRoute(route);
            setActiveRoute(route);
        },
        [graph, getRouteOptions, setActiveRoute, setIsLoadingRoute, setRouteError]
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