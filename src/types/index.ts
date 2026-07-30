/**
 * index.ts (types barrel)
 * ─────────────────────────────────────────────────────────
 * Re-exports all types from the types/ folder so they can
 * be imported from a single location.
 *
 * Instead of:
 *   import { POI } from '../types/poi.types'
 *   import { Graph } from '../types/route.types'
 *
 * You can write:
 *   import { POI, Graph } from '../types'
 *
 * Used by: everything
 * ─────────────────────────────────────────────────────────
 */
export * from './route.types';
export * from './poi.types';
export * from './map.types';