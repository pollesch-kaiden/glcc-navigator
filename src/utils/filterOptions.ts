/**
 * filterOptions.ts
 * ─────────────────────────────────────────────────────────
 * Display labels for POI filter tags, used by FilterDrawer
 * to render selectable Activity and Category filter chips.
 *
 * Used by: FilterDrawer.tsx
 * ─────────────────────────────────────────────────────────
 */

export interface FilterOption {
    value: string;
    label: string;
}

export const ACTIVITY_OPTIONS: FilterOption[] = [
    { value: 'swimming', label: 'Swimming' },
    { value: 'kayaking', label: 'Kayaking' },
    { value: 'hiking', label: 'Hiking' },
    { value: 'fishing', label: 'Fishing' },
    { value: 'meetings', label: 'Meetings' },
    { value: 'dining', label: 'Dining' },
    { value: 'sleeping', label: 'Sleeping' },
    { value: 'sports', label: 'Sports' },
    { value: 'worship', label: 'Worship' },
    { value: 'nature', label: 'Nature' },
    { value: 'history', label: 'History' },
    { value: 'beach', label: 'Beach' },
    { value: 'bonfire', label: 'Bonfire' },
    { value: 'games', label: 'Games' },
    { value: 'art', label: 'Art' },
    { value: 'music', label: 'Music' },
];

export const CATEGORY_OPTIONS: FilterOption[] = [
    { value: 'accommodation', label: 'Accommodation' },
    { value: 'dining', label: 'Dining' },
    { value: 'conference', label: 'Conference' },
    { value: 'recreation', label: 'Recreation' },
    { value: 'landmark', label: 'Landmark' },
    { value: 'restroom', label: 'Restroom' },
    { value: 'parking', label: 'Parking' },
    { value: 'waterfront', label: 'Waterfront' },
    { value: 'chapel', label: 'Chapel' },
    { value: 'other', label: 'Other' },
];