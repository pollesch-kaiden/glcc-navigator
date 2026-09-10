/**
 * useLocation.ts
 * ─────────────────────────────────────────────────────────
 * React hook that manages GPS location for the app.
 * Requests foreground location permission on mount.
 * Watches position continuously with high accuracy.
 *
 * Returns:
 *  - location: [longitude, latitude] or null if unavailable
 *  - hasPermission: true/false/null (null = not yet asked)
 *  - error: error message string or null
 *
 * In the iOS simulator, location defaults to Apple HQ
 * unless you set a custom location via:
 *  Simulator → Features → Location → Custom Location
 *
 * Used by: MapScreen.tsx
 * ─────────────────────────────────────────────────────────
 */

import { useState, useEffect } from 'react';
import * as Location from 'expo-location';

export function useLocation() {
    const [location, setLocation] = useState<[number, number] | null>(null);
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let subscription: Location.LocationSubscription | null = null;

        async function startWatching() {
            try {
                const { status } =
                    await Location.requestForegroundPermissionsAsync();
                const granted = status === 'granted';
                setHasPermission(granted);

                if (!granted) {
                    setError('Location permission denied');
                    return;
                }

                subscription = await Location.watchPositionAsync(
                    {
                        accuracy: Location.Accuracy.High,
                        timeInterval: 3000,
                        distanceInterval: 5,
                    },
                    (loc) => {
                        setLocation([
                            loc.coords.longitude,
                            loc.coords.latitude,
                        ]);
                    }
                );
            } catch (err) {
                setError('Failed to get location');
                console.warn('Location error:', err);
            }
        }

        startWatching();

        return () => {
            subscription?.remove();
        };
    }, []);

    return { location, hasPermission, error };
}