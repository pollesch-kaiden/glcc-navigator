import { describe, expect, it } from 'vitest';

import { GLCC_BOUNDS, MAP_STYLE, PROTOMAPS_STYLE_URL } from '../../src/utils/mapStyle';

describe('map style config', () => {
  it('exposes a valid Protomaps style and map bounds', () => {
    expect(MAP_STYLE.version).toBe(8);
    expect(MAP_STYLE.sources).toHaveProperty('protomaps');
    expect(Array.isArray(GLCC_BOUNDS)).toBe(true);
    expect(GLCC_BOUNDS).toHaveLength(4);
    expect(PROTOMAPS_STYLE_URL).toContain('protomaps.com');
  });
});
