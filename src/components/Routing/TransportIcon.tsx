/**
 * TransportIcon.tsx
 * ─────────────────────────────────────────────────────────
 * Renders the correct icon for a given transport mode.
 * Golf cart uses MaterialCommunityIcons since Ionicons has
 * no dedicated cart icon (golf-outline is just a flag pin).
 * Everything else uses Ionicons for visual consistency.
 *
 * Used by: TransportPicker.tsx, TransportSlide.tsx, ReadySlide.tsx
 * ─────────────────────────────────────────────────────────
 */

import React from 'react';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { TransportMode } from '../../types/route.types';

interface TransportIconProps {
    mode: TransportMode;
    size: number;
    color: string;
}

export function TransportIcon({ mode, size, color }: TransportIconProps) {
    if (mode === 'golf_cart') {
        return (
            <MaterialCommunityIcons name="golf-cart" size={size} color={color} />
        );
    }

    const iconMap: Record<Exclude<TransportMode, 'golf_cart'>, keyof typeof Ionicons.glyphMap> = {
        walking: 'walk-outline',
        biking: 'bicycle-outline',
        car: 'car-outline',
    };

    return (
        <Ionicons
            name={iconMap[mode as Exclude<TransportMode, 'golf_cart'>]}
            size={size}
            color={color}
        />
    );
}