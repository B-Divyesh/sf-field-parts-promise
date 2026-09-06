import { describe, expect, it } from 'vitest';

import { createDemoWorkspace, DEMO_JOB_ID } from './fixture';
import {
  addAllocation,
  markAllocationFitted,
  moveAllocation,
  recordReorderDecision
} from './workspace';
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

  it('never allocates one supplier-order unit to two jobs', () => {
    const workspace = createDemoWorkspace();
    const checkedAt = '2026-08-28T08:00:00.000Z';
    workspace.jobs.push({
      id: 'job-second',
      number: 'SECOND-1',
      site: 'Second customer',
      visitDate: '2026-09-02',
      notes: '',
      createdAt: checkedAt,
      updatedAt: checkedAt
    });
    workspace.requirements.push({
      id: 'req-second-pump',
      jobId: 'job-second',
      description: 'Condensate pump',
      unit: 'each',
      quantity: 1
    });
    workspace.sources.push({
      id: 'supplier-single-pump',
      name: 'Supplier order PO-SINGLE-1',
      type: 'supplier_order',
      partDescription: 'Condensate pump',
      unit: 'each',
      onHand: 1,
      minimum: 0,
      lastCheckedAt: checkedAt,
      lastCheckedBy: 'Test',
      supplierOrder: {
        reference: 'PO-SINGLE-1',
        expectedDate: '2026-09-01',
        confidence: 'Confirmed by supplier'
      }
    });

    const first = addAllocation(workspace, {
      id: 'supplier-first',
      jobId: workspace.jobs[0].id,
      requirementId: 'req-pump',
      sourceId: 'supplier-single-pump',
      sourceName: 'Supplier order PO-SINGLE-1',
      kind: 'supplier_order',
      quantity: 1,
      unit: 'each',
      updater: 'Test',
      checkedAt,
      createdAt: checkedAt
    });
    const second = addAllocation(first.workspace, {
      id: 'supplier-second',
      jobId: 'job-second',
      requirementId: 'req-second-pump',
      sourceId: 'supplier-single-pump',
      sourceName: 'Supplier order PO-SINGLE-1',
      kind: 'supplier_order',
      quantity: 1,
      unit: 'each',
      updater: 'Test',
      checkedAt,
      createdAt: checkedAt
    });

    expect(first.error).toBeUndefined();
    expect(availableQuantity(first.workspace, 'supplier-single-pump')).toBe(0);
    expect(second.error).toBe(
      'Only 0 each is available at Supplier order PO-SINGLE-1.'
    );
    expect(second.workspace.allocations).toHaveLength(
      first.workspace.allocations.length
    );
    expect(
      promiseStatus(
        second.workspace,
        second.workspace.jobs[0],
        new Date('2026-08-29T08:00:00.000Z')
      ).label
    ).toBe('Expected before visit');
    expect(
      promiseStatus(
        second.workspace,
        second.workspace.jobs[1],
        new Date('2026-08-29T08:00:00.000Z')
      ).label
    ).toBe('Date at risk');
  });

  it('marks a supplier date after the visit as at risk and stale evidence as needing a check', () => {
    const workspace = createDemoWorkspace();
    workspace.sources.push({
      id: 'late-supplier',
      name: 'Supplier order LATE-1',
      type: 'supplier_order',
      partDescription: 'Condensate pump',
      unit: 'each',
      onHand: 1,
      minimum: 0,
      lastCheckedAt: '2026-08-28T08:00:00.000Z',
      lastCheckedBy: 'Test',
      supplierOrder: {
        reference: 'LATE-1',
        expectedDate: '2026-09-03',
        confidence: 'Estimated'
      }
    });
    const allocation = addAllocation(workspace, {
      id: 'late-allocation',
      jobId: DEMO_JOB_ID,
      requirementId: 'req-pump',
      sourceId: 'late-supplier',
      sourceName: 'Supplier order LATE-1',
      kind: 'supplier_order',
      quantity: 1,
      unit: 'each',
      updater: 'Test',
      checkedAt: '2026-08-28T08:00:00.000Z',
      createdAt: '2026-08-28T08:00:00.000Z'
    });
    expect(
      promiseStatus(
        allocation.workspace,
        allocation.workspace.jobs[0],
        new Date('2026-08-29')
      ).label
    ).toBe('Date at risk');
    allocation.workspace.sources[4].supplierOrder!.expectedDate = '2026-09-01';
    expect(
      promiseStatus(
        allocation.workspace,
        allocation.workspace.jobs[0],
        new Date('2026-09-02T12:00:00Z')
      ).label
    ).toBe('Needs a check');
  });

  it('records fitted and moved quantities without making source availability negative', () => {
    const workspace = createDemoWorkspace();
    const added = addAllocation(workspace, {
      id: 'pump-allocation',
      jobId: DEMO_JOB_ID,
      requirementId: 'req-pump',
      sourceId: 'source-van-pump',
      sourceName: 'Van 2',
      kind: 'on_hand',
      quantity: 1,
      unit: 'each',
      updater: 'Test',
      checkedAt: '2026-08-28T08:05:00.000Z',
      createdAt: '2026-08-28T10:00:00.000Z'
    });
    const fitted = markAllocationFitted(added.workspace, 'pump-allocation');
    expect(fitted.error).toBeUndefined();
    expect(
      fitted.workspace.requirements.find((item) => item.id === 'req-pump')
        ?.fittedQuantity
    ).toBe(1);
    expect(fitted.workspace.allocations.at(-1)?.state).toBe('fitted');
    const moveFitted = moveAllocation(
      fitted.workspace,
      'pump-allocation',
      'source-warehouse-contactor',
      '2026-08-28T10:01:00.000Z'
    );
    expect(moveFitted.error).toBe('A fitted quantity cannot be moved.');
    const decision = recordReorderDecision(fitted.workspace, {
      id: 'draft-pump',
      sourceId: 'source-van-pump',
      action: 'drafted',
      reason: 'Confirm supplier lead time first.',
      createdAt: '2026-08-28T10:02:00.000Z'
    });
    expect(decision.reorderDecisions?.[0]).toMatchObject({ action: 'drafted' });
    expect(availableQuantity(decision, 'source-van-pump')).toBe(0);
  });

  it('refuses to move a held quantity to a different part', () => {
    const workspace = createDemoWorkspace();
    const added = addAllocation(workspace, {
      id: 'pump-allocation',
      jobId: DEMO_JOB_ID,
      requirementId: 'req-pump',
      sourceId: 'source-van-pump',
      sourceName: 'Van 2',
      kind: 'on_hand',
      quantity: 1,
      unit: 'each',
      updater: 'Test',
      checkedAt: '2026-08-28T08:05:00.000Z',
      createdAt: '2026-08-28T10:00:00.000Z'
    });
    const moved = moveAllocation(
      added.workspace,
      'pump-allocation',
      'source-warehouse-contactor',
      '2026-08-28T10:01:00.000Z'
    );
    expect(moved.error).toBe(
      'Move this quantity only to a source for the same job part.'
    );
    expect(moved.workspace.allocations).toHaveLength(
      added.workspace.allocations.length
    );
  });
});
