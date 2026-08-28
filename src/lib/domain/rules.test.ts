import { describe, expect, it } from 'vitest';

import { createDemoWorkspace } from './fixture';
import { addAllocation } from './workspace';
import { availableQuantity, promiseStatus, reorderSuggestions } from './rules';

describe('promise rules', () => {
  it('reports the seeded missing part as at risk', () => {
    const workspace = createDemoWorkspace();
    const job = workspace.jobs[0];
    expect(promiseStatus(workspace, job).label).toBe('Date at risk');
    expect(promiseStatus(workspace, job).reason).toContain('Condensate pump');
  });

  it('changes to parts in hand only after the complete pump allocation', () => {
    const workspace = createDemoWorkspace();
    const result = addAllocation(workspace, {
      id: 'pump-allocation',
      jobId: workspace.jobs[0].id,
      requirementId: 'req-pump',
      sourceId: 'source-van-pump',
      sourceName: 'Van 2',
      kind: 'on_hand',
      quantity: 1,
      unit: 'each',
      updater: 'Field demo',
      checkedAt: '2026-08-28T10:00:00.000Z',
      createdAt: '2026-08-28T10:00:00.000Z'
    });
    expect(result.error).toBeUndefined();
    expect(
      promiseStatus(result.workspace, result.workspace.jobs[0]).label
    ).toBe('Parts in hand');
  });

  it('covers expected and stale supplier evidence without calling it guaranteed', () => {
    const workspace = createDemoWorkspace();
    workspace.sources.push({
      id: 'supplier-pump',
      name: 'Coastal Supply order',
      type: 'supplier_order',
      partDescription: 'Condensate pump',
      unit: 'each',
      onHand: 1,
      minimum: 0,
      lastCheckedAt: '2026-08-28T08:00:00.000Z',
      lastCheckedBy: 'Morgan Lee',
      supplierOrder: {
        reference: 'CS-881',
        expectedDate: '2026-08-31',
        confidence: 'Confirmed by supplier'
      }
    });
    const result = addAllocation(workspace, {
      id: 'supplier-allocation',
      jobId: workspace.jobs[0].id,
      requirementId: 'req-pump',
      sourceId: 'supplier-pump',
      sourceName: 'Coastal Supply order',
      kind: 'supplier_order',
      quantity: 1,
      unit: 'each',
      updater: 'Morgan Lee',
      checkedAt: '2026-08-28T08:00:00.000Z',
      createdAt: '2026-08-28T08:00:00.000Z'
    });
    expect(
      promiseStatus(
        result.workspace,
        result.workspace.jobs[0],
        new Date('2026-08-29')
      ).label
    ).toBe('Expected before visit');
    expect(
      promiseStatus(
        result.workspace,
        result.workspace.jobs[0],
        new Date('2026-09-02T12:00:00Z')
      ).label
    ).toBe('Needs a check');
  });

  it('suggests a reorder when the last spare is allocated', () => {
    const workspace = createDemoWorkspace();
    const result = addAllocation(workspace, {
      id: 'pump-allocation',
      jobId: workspace.jobs[0].id,
      requirementId: 'req-pump',
      sourceId: 'source-van-pump',
      sourceName: 'Van 2',
      kind: 'on_hand',
      quantity: 1,
      unit: 'each',
      updater: 'Field demo',
      checkedAt: '2026-08-28T10:00:00.000Z',
      createdAt: '2026-08-28T10:00:00.000Z'
    });
    expect(availableQuantity(result.workspace, 'source-van-pump')).toBe(0);
    expect(reorderSuggestions(result.workspace)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          sourceName: 'Van 2',
          partDescription: 'Condensate pump',
          remaining: 0
        })
      ])
    );
  });

  it('never permits a negative on-hand source through repeated allocation attempts', () => {
    let workspace = createDemoWorkspace();
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const result = addAllocation(workspace, {
        id: `pump-${attempt}`,
        jobId: workspace.jobs[0].id,
        requirementId: 'req-pump',
        sourceId: 'source-van-pump',
        sourceName: 'Van 2',
        kind: 'on_hand',
        quantity: 1,
        unit: 'each',
        updater: 'Test',
        checkedAt: '2026-08-28T10:00:00.000Z',
        createdAt: '2026-08-28T10:00:00.000Z'
      });
      workspace = result.workspace;
      expect(
        availableQuantity(workspace, 'source-van-pump')
      ).toBeGreaterThanOrEqual(0);
    }
  });
});
