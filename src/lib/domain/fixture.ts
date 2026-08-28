import type { Workspace } from './types';

export const DEMO_JOB_ID = 'job-rd-1042';

export function createDemoWorkspace(): Workspace {
  return {
    schemaVersion: 1,
    jobs: [
      {
        id: DEMO_JOB_ID,
        number: 'RD-1042',
        site: 'Riverside Dental',
        visitDate: '2026-09-02',
        notes: 'Replace the failed condensate pump before the visit.',
        createdAt: '2026-08-28T08:30:00.000Z',
        updatedAt: '2026-08-28T08:30:00.000Z'
      }
    ],
    requirements: [
      {
        id: 'req-contactor',
        jobId: DEMO_JOB_ID,
        description: 'Contactor 24V',
        sku: 'CT-24',
        unit: 'each',
        quantity: 1
      },
      {
        id: 'req-filter',
        jobId: DEMO_JOB_ID,
        description: 'Return air filter 20×25',
        sku: 'AF-2025',
        unit: 'each',
        quantity: 4
      },
      {
        id: 'req-pump',
        jobId: DEMO_JOB_ID,
        description: 'Condensate pump',
        sku: 'CP-19',
        unit: 'each',
        quantity: 1
      }
    ],
    sources: [
      {
        id: 'source-warehouse-contactor',
        name: 'Warehouse A',
        type: 'warehouse',
        partDescription: 'Contactor 24V',
        unit: 'each',
        onHand: 3,
        minimum: 1,
        lastCheckedAt: '2026-08-28T07:40:00.000Z',
        lastCheckedBy: 'Morgan Lee'
      },
      {
        id: 'source-warehouse-filter',
        name: 'Warehouse A',
        type: 'warehouse',
        partDescription: 'Return air filter 20×25',
        unit: 'each',
        onHand: 5,
        minimum: 2,
        lastCheckedAt: '2026-08-28T07:40:00.000Z',
        lastCheckedBy: 'Morgan Lee'
      },
      {
        id: 'source-van-filter',
        name: 'Van 2',
        type: 'van',
        partDescription: 'Return air filter 20×25',
        unit: 'each',
        onHand: 4,
        minimum: 1,
        lastCheckedAt: '2026-08-28T08:05:00.000Z',
        lastCheckedBy: 'Avery Cole'
      },
      {
        id: 'source-van-pump',
        name: 'Van 2',
        type: 'van',
        partDescription: 'Condensate pump',
        unit: 'each',
        onHand: 1,
        minimum: 1,
        lastCheckedAt: '2026-08-28T08:05:00.000Z',
        lastCheckedBy: 'Avery Cole'
      }
    ],
    allocations: [
      {
        id: 'allocation-contactor',
        jobId: DEMO_JOB_ID,
        requirementId: 'req-contactor',
        sourceId: 'source-warehouse-contactor',
        sourceName: 'Warehouse A',
        kind: 'on_hand',
        quantity: 1,
        unit: 'each',
        updater: 'Morgan Lee',
        checkedAt: '2026-08-28T07:40:00.000Z',
        createdAt: '2026-08-28T08:15:00.000Z'
      },
      {
        id: 'allocation-filter-warehouse',
        jobId: DEMO_JOB_ID,
        requirementId: 'req-filter',
        sourceId: 'source-warehouse-filter',
        sourceName: 'Warehouse A',
        kind: 'on_hand',
        quantity: 3,
        unit: 'each',
        updater: 'Morgan Lee',
        checkedAt: '2026-08-28T07:40:00.000Z',
        createdAt: '2026-08-28T08:15:00.000Z'
      },
      {
        id: 'allocation-filter-van',
        jobId: DEMO_JOB_ID,
        requirementId: 'req-filter',
        sourceId: 'source-van-filter',
        sourceName: 'Van 2',
        kind: 'on_hand',
        quantity: 1,
        unit: 'each',
        updater: 'Avery Cole',
        checkedAt: '2026-08-28T08:05:00.000Z',
        createdAt: '2026-08-28T08:16:00.000Z'
      }
    ]
  };
}

export function createEmptyWorkspace(): Workspace {
  return {
    schemaVersion: 1,
    jobs: [],
    requirements: [],
    sources: [],
    allocations: []
  };
}
