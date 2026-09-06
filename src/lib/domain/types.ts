export type SourceType = 'van' | 'warehouse' | 'supplier_order';
export type AllocationKind = 'on_hand' | 'supplier_order';
export type SupplierConfidence =
  'Confirmed by supplier' | 'Estimated' | 'Needs a check';
export type AllocationState = 'held' | 'fitted';
export type SupplierOrderStatus = 'open' | 'draft';
export type ConflictReason = 'version_changed' | 'quantity_spent' | 'deleted';

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
  fittedQuantity?: number;
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
    orderId?: string;
    lineId?: string;
    supplierName?: string;
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
  state?: AllocationState;
}

export interface SupplierOrderLine {
  id: string;
  partDescription: string;
  unit: string;
  quantity: number;
  allocatedQuantity: number;
  expectedDate?: string;
  confidence?: SupplierConfidence;
  checkedAt?: string;
  checkedBy?: string;
}

export interface SupplierOrder {
  id: string;
  supplierName: string;
  reference: string;
  status: SupplierOrderStatus;
  createdAt: string;
  lines: SupplierOrderLine[];
}

export interface ReorderDecision {
  id: string;
  sourceId: string;
  action: 'dismissed' | 'drafted';
  reason?: string;
  createdAt: string;
}

export interface WorkspaceConflict {
  id: string;
  reason: ConflictReason;
  jobId?: string;
  sourceId?: string;
  message: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface Workspace {
  schemaVersion: 1;
  jobs: Job[];
  requirements: PartRequirement[];
  sources: StockSource[];
  allocations: Allocation[];
  supplierOrders?: SupplierOrder[];
  reorderDecisions?: ReorderDecision[];
  conflicts?: WorkspaceConflict[];
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
