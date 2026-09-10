import { describe, expect, it } from 'vitest';

import { findGatewayNode, findParkingGatewayNode } from './multiModal';
import { Graph } from '../types/route.types';

describe('multi-modal routing gateway logic', () => {
  const graph: Graph = {
    nodes: {
      Destination: { id: 'Destination', coordinates: [0, 0], connectedEdges: ['D-B', 'D-E'] },
      B: { id: 'B', coordinates: [0, 1], connectedEdges: ['D-B', 'B-G'] },
      G: { id: 'G', coordinates: [0, 2], connectedEdges: ['B-G'] },
      E: { id: 'E', coordinates: [1, 0], connectedEdges: ['D-E', 'E-P'] },
      P: { id: 'P', coordinates: [1, 1], connectedEdges: ['E-P'] },
    },
    edges: {
      'D-B': {
        id: 'D-B',
        from: 'Destination',
        to: 'B',
        transportModes: ['walking'],
        hasStairs: false,
        distanceMeters: 80,
        bidirectional: true,
        surface: 'paved',
      },
      'B-G': {
        id: 'B-G',
        from: 'B',
        to: 'G',
        transportModes: ['walking'],
        hasStairs: false,
        distanceMeters: 80,
        bidirectional: true,
        surface: 'paved',
      },
      'D-E': {
        id: 'D-E',
        from: 'Destination',
        to: 'E',
        transportModes: ['walking'],
        hasStairs: false,
        distanceMeters: 80,
        bidirectional: true,
        surface: 'paved',
      },
      'E-P': {
        id: 'E-P',
        from: 'E',
        to: 'P',
        transportModes: ['walking', 'car'],
        hasStairs: false,
        distanceMeters: 80,
        bidirectional: true,
        surface: 'paved',
      },
    },
  };

  it('finds the nearest vehicle-accessible gateway node', () => {
    const gateway = findGatewayNode(graph, 'Destination', 'car', 500);

    expect(gateway).toEqual({ gatewayNodeId: 'E', walkDistanceMeters: 80 });
  });

  it('prefers a named parking lot gateway when available', () => {
    const parkingNodeIds = new Set(['P']);
    const gateway = findParkingGatewayNode(graph, 'Destination', 'car', parkingNodeIds, 500);

    expect(gateway).toEqual({ gatewayNodeId: 'P', walkDistanceMeters: 160 });
  });
});
