/**
 * UserDot.tsx
 * ─────────────────────────────────────────────────────────
 * Renders the user's current GPS location on the map
 * as a blue pulsing dot with a heading indicator.
 * Uses MapLibre's built-in UserLocation component.
 *
 * Props in v11:
 *  - animated: whether the dot animates between updates
 *  - heading: shows arrow pointing direction device faces
 *  - accuracy: shows accuracy radius circle
 *
 * Used by: GLCCMap.tsx
 * ─────────────────────────────────────────────────────────
 */

import React from 'react';
import { UserLocation } from '@maplibre/maplibre-react-native';

export function UserDot() {
    return (
        <UserLocation
            animated={true}
            heading={true}
            accuracy={true}
        />
    );
}