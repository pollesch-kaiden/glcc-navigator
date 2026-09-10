import { beforeEach, describe, expect, it, vi } from 'vitest';

const { shareAsync, isAvailableAsync, writes } = vi.hoisted(() => ({
  shareAsync: vi.fn(async () => undefined),
  isAvailableAsync: vi.fn(async () => true),
  writes: [] as string[],
}));

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(async () => null),
    setItem: vi.fn(async () => undefined),
    removeItem: vi.fn(async () => undefined),
  },
}));

vi.mock('expo-file-system', () => ({
  Paths: { cache: '/tmp/cache' },
  File: class FileMock {
    uri: string;
    constructor(dir: string, name: string) {
      this.uri = `${dir}/${name}`;
    }
    write(content: string) {
      writes.push(content);
    }
  },
}));

vi.mock('expo-sharing', () => ({
  shareAsync,
  isAvailableAsync,
}));

import { exportPOIData } from './exportPOIData';
import { exportPathData } from './exportPathData';
import { useAdminStore } from '../store/useAdminStore';

describe('export logic', () => {
  beforeEach(() => {
    writes.length = 0;
    shareAsync.mockClear();
    isAvailableAsync.mockClear();
    useAdminStore.setState({
      adminEdits: {},
      adminPathEdits: {},
    });
  });

  it('merges admin POI edits and includes tombstones for deleted OSM entries', async () => {
    useAdminStore.setState({
      adminEdits: {
        'osm-123': { id: 'osm-123', deleted: true },
        'custom-99': { id: 'custom-99', name: 'New custom POI', category: 'parking' },
      },
    });

    await exportPOIData();

    expect(writes.length).toBe(1);
    const exported = JSON.parse(writes[0]);
    expect(exported.features).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          properties: expect.objectContaining({ id: 'custom-99', name: 'New custom POI' }),
        }),
        expect.objectContaining({
          properties: expect.objectContaining({ id: 'osm-123', deleted: true }),
        }),
      ])
    );
    expect(shareAsync).toHaveBeenCalledTimes(1);
  });

  it('merges admin path edits and removes deleted custom paths from export', async () => {
    useAdminStore.setState({
      adminPathEdits: {
        'path-1': {
          id: 'path-1',
          name: 'Updated trail',
          coordinates: [[0, 0], [1, 1]],
          transportModes: ['walking'],
        },
        'custom-path-2': { id: 'custom-path-2', deleted: true },
      },
    });

    await exportPathData();

    expect(writes.length).toBe(1);
    const exported = JSON.parse(writes[0]);
    expect(exported.features).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          properties: expect.objectContaining({ id: 'path-1', name: 'Updated trail' }),
        }),
      ])
    );
    expect(exported.features.some((feature: any) => feature.properties?.id === 'custom-path-2')).toBe(false);
  });
});
