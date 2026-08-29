/**
 * useOfflinePack.ts
 * ─────────────────────────────────────────────────────────
 * Manages downloading and checking the offline map tile pack
 * for the GLCC campus area using MapLibre's OfflineManager.
 *
 * Includes a stall detector: if no progress update is received
 * for STALL_TIMEOUT_MS (e.g. network dropped mid-download),
 * the download is treated as failed rather than hanging at a
 * fixed percentage forever. The partially-downloaded pack is
 * deleted so a retry starts clean.
 *
 * Used by: MapScreen.tsx (via OfflineDownloadBanner)
 * ─────────────────────────────────────────────────────────
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
    OfflineManager,
    OfflinePack,
    OfflinePackStatus as NativePackStatus,
} from '@maplibre/maplibre-react-native';
import { PROTOMAPS_STYLE_URL, GLCC_BOUNDS } from '../utils/mapStyle';

const PACK_METADATA_KEY = 'glcc-campus-offline';
const STALL_TIMEOUT_MS = 15000; // no progress for 15s = treat as failed

export type OfflinePackStatus =
    | 'checking'
    | 'not-downloaded'
    | 'downloading'
    | 'ready'
    | 'error';

function findGlccPack(packs: OfflinePack[]): OfflinePack | undefined {
    return packs.find((p) => p.metadata?.packKey === PACK_METADATA_KEY);
}

export function useOfflinePack() {
    const [status, setStatus] = useState<OfflinePackStatus>('checking');
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);

    const stallTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const clearStallTimer = useCallback(() => {
        if (stallTimer.current) {
            clearTimeout(stallTimer.current);
            stallTimer.current = null;
        }
    }, []);

    const resetStallTimer = useCallback(() => {
        clearStallTimer();
        stallTimer.current = setTimeout(async () => {
            console.warn('Offline pack download stalled — no progress, treating as failed');
            setError('Download stalled. Check your connection and try again.');
            setStatus('error');

            // Clean up the partial pack so a retry starts fresh rather
            // than silently resuming a corrupted/incomplete state
            try {
                const packs = await OfflineManager.getPacks();
                const existing = findGlccPack(packs);
                if (existing) {
                    await OfflineManager.deletePack(existing.id);
                }
            } catch (err) {
                console.warn('Error cleaning up stalled pack:', err);
            }
        }, STALL_TIMEOUT_MS);
    }, [clearStallTimer]);

    const checkForExistingPack = useCallback(async () => {
        try {
            const packs = await OfflineManager.getPacks();
            const existing = findGlccPack(packs);
            setStatus(existing ? 'ready' : 'not-downloaded');
        } catch (err) {
            console.warn('Error checking offline packs:', err);
            setStatus('not-downloaded');
        }
    }, []);

    useEffect(() => {
        checkForExistingPack();
        return () => clearStallTimer();
    }, [checkForExistingPack, clearStallTimer]);

    const downloadPack = useCallback(async () => {
        setStatus('downloading');
        setProgress(0);
        setError(null);
        resetStallTimer();

        try {
            await OfflineManager.createPack(
                {
                    mapStyle: PROTOMAPS_STYLE_URL,
                    bounds: GLCC_BOUNDS,
                    minZoom: 13,
                    maxZoom: 18,
                    metadata: { packKey: PACK_METADATA_KEY },
                },
                (_pack: OfflinePack, packStatus: NativePackStatus) => {
                    const percent = packStatus?.percentage ?? 0;

                    // Any progress update, even 0%, means the connection is
                    // alive — reset the stall timer
                    resetStallTimer();
                    setProgress(percent);

                    if (percent === 100) {
                        clearStallTimer();
                        setStatus('ready');
                    }
                },
                (_pack: OfflinePack, err) => {
                    clearStallTimer();
                    console.warn('Offline pack download error:', err);
                    setError('Download failed. Check your connection and try again.');
                    setStatus('error');
                }
            );
        } catch (err) {
            clearStallTimer();
            console.warn('Error creating offline pack:', err);
            setError('Could not start download.');
            setStatus('error');
        }
    }, [resetStallTimer, clearStallTimer]);

    const deletePack = useCallback(async () => {
        if (status === 'downloading') {
            console.warn('Cannot delete pack while downloading — wait for it to finish or fail first');
            return;
        }

        try {
            const packs = await OfflineManager.getPacks();
            const existing = findGlccPack(packs);

            if (existing) {
                await OfflineManager.deletePack(existing.id);
            }

            setStatus('not-downloaded');
            setProgress(0);
        } catch (err) {
            console.warn('Error deleting offline pack:', err);
        }
    }, [status]);

    return { status, progress, error, downloadPack, deletePack };
}