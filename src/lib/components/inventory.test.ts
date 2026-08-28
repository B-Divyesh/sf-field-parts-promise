import { describe, expect, it } from 'vitest';

import { componentInventory } from './inventory';

describe('component inventory contract', () => {
  it('stays within the venture design-system boundary', () => {
    expect(componentInventory).toHaveLength(20);
    expect(new Set(componentInventory).size).toBe(componentInventory.length);
  });

  it('includes the core M1 allocation components', () => {
    expect(componentInventory).toEqual(
      expect.arrayContaining([
        'DemoBanner',
        'StatusPlate',
        'RequiredPartRow',
        'AllocationSheet',
        'ReorderSuggestion'
      ])
    );
  });
});
