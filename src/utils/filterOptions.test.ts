import { describe, expect, it } from 'vitest';

import { ACTIVITY_OPTIONS, CATEGORY_OPTIONS } from './filterOptions';

describe('filter options', () => {
  it('includes the expected core activities', () => {
    const values = ACTIVITY_OPTIONS.map((option) => option.value);

    expect(values).toContain('dining');
    expect(values).toContain('sleeping');
    expect(values).toContain('sports');
  });

  it('includes the vending category and related categories', () => {
    const values = CATEGORY_OPTIONS.map((option) => option.value);

    expect(values).toContain('lodging');
    expect(values).toContain('parking');
    expect(values).toContain('has_vending');
  });
});
