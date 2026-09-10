import { describe, expect, it } from 'vitest';

import { findRoute } from './astar';
import { Graph } from '../types/route.types';

describe('A* routing', () => {
  const graph: Graph = {
    nodes: {
      A: { id: 'A', coordinates: [0, 0], connectedEdges: ['A-B', 'A-D'] },
      B: { id: 'B', coordinates: [0, 1], connectedEdges: ['A-B', 'B-C'] },
      C: { id: 'C', coordinates: [0, 2], connectedEdges: ['B-C', 'D-C'] },
      D: { id: 'D', coordinates: [1, 0], connectedEdges: ['A-D', 'D-C'] },
    },
    edges: {
      'A-B': {
        id: 'A-B',
        from: 'A',
        to: 'B',
        transportModes: ['walking'],
        hasStairs: false,
        distanceMeters: 50,
        bidirectional: true,
        surface: 'paved',
      },
      'B-C': {
        id: 'B-C',
        from: 'B',
        to: 'C',
        transportModes: ['walking'],
        hasStairs: true,
        distanceMeters: 50,
        bidirectional: true,
        surface: 'paved',
      },
      'A-D': {
        id: 'A-D',
        from: 'A',
        to: 'D',
        transportModes: ['walking'],
        hasStairs: false,
        distanceMeters: 100,
        bidirectional: true,
        surface: 'paved',
      },
      'D-C': {
        id: 'D-C',
        from: 'D',
        to: 'C',
        transportModes: ['walking'],
        hasStairs: false,
        distanceMeters: 100,
        bidirectional: true,
        surface: 'paved',
      },
    },
  };

  it('returns the shortest route when stairs are allowed', () => {
    const route = findRoute(graph, 'A', 'C', { transportMode: 'walking', noStairs: false });

    expect(route).not.toBeNull();
    expect(route).toEqual([
      graph.nodes.A.coordinates,
      graph.nodes.B.coordinates,
      graph.nodes.C.coordinates,
    ]);
  });

  it('avoids stair edges when accessibility mode is enabled', () => {
    const route = findRoute(graph, 'A', 'C', { transportMode: 'walking', noStairs: true });

    expect(route).not.toBeNull();
    expect(route).toEqual([
      graph.nodes.A.coordinates,
      graph.nodes.D.coordinates,
      graph.nodes.C.coordinates,
    ]);
  });
});
