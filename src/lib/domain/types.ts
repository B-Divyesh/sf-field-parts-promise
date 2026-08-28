export type SourceType = 'van' | 'warehouse' | 'supplier_order';
export type AllocationKind = 'on_hand' | 'supplier_order';
export type SupplierConfidence =
  'Confirmed by supplier' | 'Estimated' | 'Needs a check';

export interface Job {
  id: string;
  number: string;
  site: string;
  visitDate: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface PartRequirement {
  id: string;
  jobId: string;
  description: string;
  sku?: string;
  unit: string;
  quantity: number;
}

export interface StockSource {
  id: string;
  name: string;
  type: SourceType;
  partDescription: string;
  unit: string;
  onHand: number;
  minimum: number;
  lastCheckedAt: string;
  lastCheckedBy: string;
  supplierOrder?: {
    reference: string;
    expectedDate: string;
    confidence: SupplierConfidence;
  };
}

export interface Allocation {
  id: string;
  jobId: string;
  requirementId: string;
  sourceId: string;
  sourceName: string;
  kind: AllocationKind;
  quantity: number;
  unit: string;
  updater: string;
  checkedAt: string;
  createdAt: string;
}

export interface Workspace {
  schemaVersion: 1;
  jobs: Job[];
  requirements: PartRequirement[];
  sources: StockSource[];
  allocations: Allocation[];
  lastActionAllocationId?: string;
}

export type PromiseStatusCode = 'in-hand' | 'expected' | 'at-risk' | 'check';

export interface PromiseStatus {
  code: PromiseStatusCode;
  label:
    | 'Parts in hand'
    | 'Expected before visit'
    | 'Date at risk'
    | 'Needs a check';
  reason: string;
}

export interface ReorderSuggestion {
  sourceId: string;
  sourceName: string;
  partDescription: string;
  remaining: number;
  minimum: number;
  unit: string;
}

export function newId(prefix: string): string {
  const random =
    globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2);
  return `${prefix}-${random}`;
}
