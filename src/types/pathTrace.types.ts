/**
 * pathTrace.types.ts
 * ─────────────────────────────────────────────────────────
 * Types for the in-app Path Tracing / Editing admin feature.
 * ─────────────────────────────────────────────────────────
 */

import { TransportMode } from './route.types';

export interface TraceSegment {
    coordinates: [number, number][];
    transportModes: TransportMode[];
    hasStairs: boolean;
    closed: boolean; // true once locked by a toggle change; false = still being extended
}

export type TraceMode = 'off-campus' | 'on-campus';

export const MAX_TRACE_NODE_DISTANCE_METERS = 10;
export const MIN_GPS_TRACE_DISTANCE_METERS = 5;