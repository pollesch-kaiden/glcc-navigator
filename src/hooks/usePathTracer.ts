/**
 * usePathTracer.ts
 * ─────────────────────────────────────────────────────────
 * State machine for the Admin Path Tracing feature — both
 * On-Campus (live GPS) and Off-Campus (tap-to-place) modes.
 *
 * A trace session is made of one or more TraceSegments.
 * Toggling a transport mode or Has Stairs while the current
 * segment already has 2+ points closes ("locks") it and opens
 * a new one starting from the same last coordinate, so
 * segments always connect with zero gap.
 *
 * Used by: MapScreen.tsx
 * ─────────────────────────────────────────────────────────
 */

import { useState, useRef } from 'react';
import * as Location from 'expo-location';
import { TransportMode } from '@/types';
import {
    TraceSegment,
    TraceMode,
    MAX_TRACE_NODE_DISTANCE_METERS,
    MIN_GPS_TRACE_DISTANCE_METERS,
} from '@/types/pathTrace.types';
import { haversineDistance } from '@/utils/haversine';
import { useAdminStore } from '@/store/useAdminStore';

function emptySegment(
    startCoord: [number, number] | null,
    transportModes: TransportMode[],
    hasStairs: boolean
): TraceSegment {
    return {
        coordinates: startCoord ? [startCoord] : [],
        transportModes,
        hasStairs,
        closed: false,
    };
}

function generateTraceGroupId(): string {
    return `trace-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function usePathTracer() {
    const { savePathEdit } = useAdminStore();

    const [traceMode, setTraceMode] = useState<TraceMode>('off-campus');
    const [isActive, setIsActive] = useState(false);
    const [isRecording, setIsRecording] = useState(false);

    const [committedSegments, setCommittedSegments] = useState<TraceSegment[]>([]);
    const [currentSegment, setCurrentSegment] = useState<TraceSegment>(
        emptySegment(null, ['walking'], false)
    );

    const [outOfRangeWarning, setOutOfRangeWarning] = useState(false);
    const locationSubscription = useRef<Location.LocationSubscription | null>(null);

    function getLastPoint(): [number, number] | null {
        if (currentSegment.coordinates.length > 0) {
            return currentSegment.coordinates[currentSegment.coordinates.length - 1];
        }
        if (committedSegments.length > 0) {
            const last = committedSegments[committedSegments.length - 1];
            return last.coordinates[last.coordinates.length - 1] ?? null;
        }
        return null;
    }

    function startTrace(mode: TraceMode, transportModes: TransportMode[], hasStairs: boolean) {
        setTraceMode(mode);
        setCommittedSegments([]);
        setCurrentSegment(emptySegment(null, transportModes, hasStairs));
        setOutOfRangeWarning(false);
        setIsActive(true);
        setIsRecording(false);
    }

    function appendPoint(coord: [number, number], maxDistanceMeters: number) {
        const last = getLastPoint();

        if (last) {
            const distance = haversineDistance(last, coord);
            if (distance > maxDistanceMeters) {
                setOutOfRangeWarning(true);
                return false;
            }
        }

        setOutOfRangeWarning(false);
        setCurrentSegment((prev) => ({
            ...prev,
            coordinates: [...prev.coordinates, coord],
        }));
        return true;
    }

    function placeNode(coord: [number, number]) {
        appendPoint(coord, MAX_TRACE_NODE_DISTANCE_METERS);
    }

    async function startRecording(): Promise<{ success: boolean; error?: string }> {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            return { success: false, error: 'Location permission is required to trace on foot.' };
        }

        setIsRecording(true);

        locationSubscription.current = await Location.watchPositionAsync(
            {
                accuracy: Location.Accuracy.BestForNavigation,
                distanceInterval: 3,
            },
            (loc) => {
                const coord: [number, number] = [loc.coords.longitude, loc.coords.latitude];
                const last = getLastPoint();

                if (last && haversineDistance(last, coord) < MIN_GPS_TRACE_DISTANCE_METERS) {
                    return;
                }

                setCurrentSegment((prev) => ({
                    ...prev,
                    coordinates: [...prev.coordinates, coord],
                }));
                setOutOfRangeWarning(false);
            }
        );

        return { success: true };
    }

    function pauseRecording() {
        locationSubscription.current?.remove();
        locationSubscription.current = null;
        setIsRecording(false);
    }

    function applyToggle(nextTransportModes: TransportMode[], nextHasStairs: boolean) {
        setCurrentSegment((prev) => {
            if (prev.coordinates.length >= 2) {
                const closedSegment: TraceSegment = { ...prev, closed: true };
                const bridgeCoord = prev.coordinates[prev.coordinates.length - 1] as [number, number];

                setCommittedSegments((segs) => [...segs, closedSegment]);

                return emptySegment(bridgeCoord, nextTransportModes, nextHasStairs);
            }

            return { ...prev, transportModes: nextTransportModes, hasStairs: nextHasStairs };
        });
    }

    function toggleTransportMode(mode: TransportMode) {
        const current = currentSegment.transportModes;
        const next = current.includes(mode)
            ? current.filter((m) => m !== mode)
            : [...current, mode];
        applyToggle(next.length > 0 ? next : current, currentSegment.hasStairs);
    }

    function toggleStairs(value: boolean) {
        applyToggle(currentSegment.transportModes, value);
    }

    function undoLastPoint() {
        setCurrentSegment((prev) => {
            if (prev.coordinates.length === 0) return prev;
            return { ...prev, coordinates: prev.coordinates.slice(0, -1) };
        });
    }

    function discardTrace() {
        pauseRecording();
        setIsActive(false);
        setCommittedSegments([]);
        setCurrentSegment(emptySegment(null, ['walking'], false));
        setOutOfRangeWarning(false);
    }

    function getFinalSegments(): TraceSegment[] {
        const all = [...committedSegments];
        if (currentSegment.coordinates.length >= 2) {
            all.push({ ...currentSegment, closed: true });
        }
        return all;
    }

    function saveTrace(name: string) {
        pauseRecording();
        const segments = getFinalSegments();
        const traceGroupId = generateTraceGroupId();

        segments.forEach((segment, index) => {
            const id = `${traceGroupId}-seg${index + 1}`;
            savePathEdit({
                id,
                coordinates: segment.coordinates,
                name,
                traceGroupId,
                transportModes: segment.transportModes,
                hasStairs: segment.hasStairs,
                bidirectional: true,
                surface: 'paved',
                source: 'admin',
            });
        });

        setIsActive(false);
        setCommittedSegments([]);
        setCurrentSegment(emptySegment(null, ['walking'], false));
    }

    return {
        traceMode,
        isActive,
        isRecording,
        committedSegments,
        currentSegment,
        outOfRangeWarning,
        canUndo: currentSegment.coordinates.length > 0,
        lastPoint: getLastPoint(),

        startTrace,
        placeNode,
        startRecording,
        pauseRecording,
        toggleTransportMode,
        toggleStairs,
        undoLastPoint,
        discardTrace,
        getFinalSegments,
        saveTrace,
    };
}