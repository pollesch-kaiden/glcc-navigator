import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  },
}));

import { useAdminStore } from './useAdminStore';

describe('admin store edits', () => {
  beforeEach(() => {
    useAdminStore.setState({
      isAdminUnlocked: false,
      adminEdits: {},
      adminPathEdits: {},
    });
  });

  it('stores POI edits and supports delete tombstones', () => {
    useAdminStore.getState().unlockAdmin();
    useAdminStore.getState().saveEdit({ id: 'custom-1', name: 'Updated Room', category: 'lodging' });
    useAdminStore.getState().markDeleted('osm-123');

    expect(useAdminStore.getState().isAdminUnlocked).toBe(true);
    expect(useAdminStore.getState().adminEdits['custom-1']).toMatchObject({
      id: 'custom-1',
      name: 'Updated Room',
      category: 'lodging',
    });
    expect(useAdminStore.getState().adminEdits['osm-123']).toMatchObject({
      id: 'osm-123',
      deleted: true,
    });
  });

  it('stores path edits and clears all in one action', () => {
    useAdminStore.getState().savePathEdit({
      id: 'path-1',
      name: 'Loop Trail',
      transportModes: ['walking'],
      hasStairs: false,
    });

    expect(useAdminStore.getState().adminPathEdits['path-1']).toMatchObject({
      id: 'path-1',
      name: 'Loop Trail',
      transportModes: ['walking'],
    });

    useAdminStore.getState().clearAllPathEdits();
    expect(useAdminStore.getState().adminPathEdits).toEqual({});
  });
});
