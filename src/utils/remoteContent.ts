import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Network from 'expo-network';

export type RemoteContentManifest = {
    version: string;
    updatedAt?: string;
    poiFile?: string;
    pathFile?: string;
};

export const REMOTE_CONTENT_BASE_URL = 'https://pollesch-kaiden.github.io/glcc-navigator/';
export const REMOTE_CONTENT_MANIFEST_PATH = 'content-manifest.json';

const CACHE_KEYS = {
    version: 'glcc_remote_content_version',
    poi: 'glcc_remote_poi_custom',
    paths: 'glcc_remote_paths_custom',
};

export async function readCachedRemoteContent(): Promise<{
    poiData: any | null;
    pathData: any | null;
    version: string | null;
}> {
    const [version, poiData, pathData] = await Promise.all([
        AsyncStorage.getItem(CACHE_KEYS.version),
        AsyncStorage.getItem(CACHE_KEYS.poi),
        AsyncStorage.getItem(CACHE_KEYS.paths),
    ]);

    return {
        poiData: poiData ? JSON.parse(poiData) : null,
        pathData: pathData ? JSON.parse(pathData) : null,
        version,
    };
}

export async function writeCachedRemoteContent(
    version: string,
    poiData: any,
    pathData: any
): Promise<void> {
    await Promise.all([
        AsyncStorage.setItem(CACHE_KEYS.version, version),
        AsyncStorage.setItem(CACHE_KEYS.poi, JSON.stringify(poiData)),
        AsyncStorage.setItem(CACHE_KEYS.paths, JSON.stringify(pathData)),
    ]);
}

export async function clearCachedRemoteContent(): Promise<void> {
    await Promise.all([
        AsyncStorage.removeItem(CACHE_KEYS.version),
        AsyncStorage.removeItem(CACHE_KEYS.poi),
        AsyncStorage.removeItem(CACHE_KEYS.paths),
    ]);
}

async function isWifiReachable(): Promise<boolean> {
    const state = await Network.getNetworkStateAsync();
    return Boolean(state.isConnected && state.isInternetReachable && state.type === Network.NetworkStateType.WIFI);
}

async function fetchJson<T>(url: string): Promise<T | null> {
    try {
        const response = await fetch(url, { method: 'GET' });
        if (!response.ok) return null;
        return (await response.json()) as T;
    } catch {
        return null;
    }
}

export async function checkForRemoteContentUpdate(): Promise<{
    poiData: any | null;
    pathData: any | null;
    version: string | null;
} | null> {
    const shouldCheck = await isWifiReachable();
    if (!shouldCheck) return null;

    const manifestUrl = `${REMOTE_CONTENT_BASE_URL}${REMOTE_CONTENT_MANIFEST_PATH}`;
    const manifest = await fetchJson<RemoteContentManifest>(manifestUrl);
    if (!manifest?.version) return null;

    const cached = await readCachedRemoteContent();
    const cachedVersion = cached.version ?? '';
    if (cachedVersion && manifest.version === cachedVersion) {
        return cached.poiData || cached.pathData ? cached : null;
    }

    const poiFile = manifest.poiFile ?? 'glcc-pois-custom.json';
    const pathFile = manifest.pathFile ?? 'glcc-paths-custom.json';

    const [poiData, pathData] = await Promise.all([
        fetchJson<any>(`${REMOTE_CONTENT_BASE_URL}${poiFile}`),
        fetchJson<any>(`${REMOTE_CONTENT_BASE_URL}${pathFile}`),
    ]);

    if (!poiData && !pathData) return null;

    await writeCachedRemoteContent(manifest.version, poiData ?? null, pathData ?? null);

    return {
        poiData: poiData ?? null,
        pathData: pathData ?? null,
        version: manifest.version,
    };
}
