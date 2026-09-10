import { beforeEach, describe, expect, it, vi } from 'vitest';

const storage: Record<string, string> = {};
const networkState = { isConnected: true, isInternetReachable: true, type: 'WIFI' };

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(async (key: string) => storage[key] ?? null),
    setItem: vi.fn(async (key: string, value: string) => {
      storage[key] = value;
    }),
    removeItem: vi.fn(async (key: string) => {
      delete storage[key];
    }),
  },
}));

vi.mock('expo-network', () => ({
  __esModule: true,
  default: {
    NetworkStateType: { WIFI: 'WIFI' },
  },
  getNetworkStateAsync: vi.fn(async () => networkState),
  NetworkStateType: { WIFI: 'WIFI' },
}));

import { checkForRemoteContentUpdate } from './remoteContent';

describe('remote content fail-safe behavior', () => {
  beforeEach(() => {
    Object.keys(storage).forEach((key) => delete storage[key]);
    global.fetch = vi.fn();
  });

  it('returns null while offline to avoid any overwrite', async () => {
    networkState.isConnected = false;
    networkState.isInternetReachable = false;

    const result = await checkForRemoteContentUpdate();
    expect(result).toBeNull();
  });

  it('keeps cached data when the remote manifest is invalid', async () => {
    networkState.isConnected = true;
    networkState.isInternetReachable = true;
    storage.glcc_remote_content_version = '2026-09-09-1';
    storage.glcc_remote_poi_custom = JSON.stringify({ old: true });
    storage.glcc_remote_paths_custom = JSON.stringify({ oldPaths: true });

    global.fetch = vi.fn(async (url: string) => ({
      ok: true,
      json: async () => {
        if (url.endsWith('content-manifest.json')) {
          return { version: '' };
        }
        throw new Error('should not fetch files when manifest is invalid');
      },
    })) as any;

    const result = await checkForRemoteContentUpdate();
    expect(result).toBeNull();
    expect(storage.glcc_remote_content_version).toBe('2026-09-09-1');
  });

  it('keeps the previous cache when the newer remote JSON download is incomplete', async () => {
    networkState.isConnected = true;
    networkState.isInternetReachable = true;
    storage.glcc_remote_content_version = '2026-09-09-1';
    storage.glcc_remote_poi_custom = JSON.stringify({ oldPoi: true });
    storage.glcc_remote_paths_custom = JSON.stringify({ oldPath: true });

    global.fetch = vi.fn(async (url: string) => {
      if (url.endsWith('content-manifest.json')) {
        return {
          ok: true,
          json: async () => ({ version: '2026-09-10-1', poiFile: 'assets/map/poi.json', pathFile: 'assets/map/paths.json' }),
        } as any;
      }
      if (url.endsWith('poi.json')) {
        return {
          ok: true,
          json: async () => null,
        } as any;
      }
      if (url.endsWith('paths.json')) {
        return {
          ok: false,
          json: async () => ({ ok: false }),
        } as any;
      }
      throw new Error(`Unexpected URL: ${url}`);
    }) as any;

    const result = await checkForRemoteContentUpdate();
    expect(result).toBeNull();
    expect(storage.glcc_remote_content_version).toBe('2026-09-09-1');
  });
});
