/**
 * geoRing.ts
 * ─────────────────────────────────────────────────────────
 * Generates a true-to-scale circle polygon (in meters) around
 * a coordinate, used to show the "next node must be placed
 * within this radius" ring while tracing paths.
 *
 * Sized geographically rather than in pixels, so it stays
 * accurate at any zoom level.
 * ─────────────────────────────────────────────────────────
 */

const EARTH_RADIUS_METERS = 6_371_000;

export function generateCircleFeature(
    center: [number, number],
    radiusMeters: number,
    points: number = 32
) {
    const [lon, lat] = center;
    const latRad = (lat * Math.PI) / 180;
    const coords: [number, number][] = [];

    for (let i = 0; i <= points; i++) {
        const angle = (i / points) * 2 * Math.PI;
        const dx = radiusMeters * Math.cos(angle);
        const dy = radiusMeters * Math.sin(angle);

        const deltaLat = dy / EARTH_RADIUS_METERS;
        const deltaLon = dx / (EARTH_RADIUS_METERS * Math.cos(latRad));

        coords.push([
            lon + (deltaLon * 180) / Math.PI,
            lat + (deltaLat * 180) / Math.PI,
        ]);
    }

    return {
        type: 'Feature' as const,
        geometry: {
            type: 'Polygon' as const,
            coordinates: [coords],
        },
        properties: {},
    };
}