import type {
  Allocation,
  Job,
  PartRequirement,
  PromiseStatus,
  ReorderSuggestion,
  StockSource,
  Workspace
} from './types';

const DAY_MS = 24 * 60 * 60 * 1000;

export function allocationsForRequirement(
  workspace: Workspace,
  requirementId: string
): Allocation[] {
  return workspace.allocations.filter(
    (allocation) => allocation.requirementId === requirementId
  );
}

export function coveredQuantity(
  workspace: Workspace,
  requirementId: string
): number {
  return allocationsForRequirement(workspace, requirementId).reduce(
    (total, allocation) => total + allocation.quantity,
    0
  );
}

export function availableQuantity(
  workspace: Workspace,
  sourceId: string
): number {
  const source = workspace.sources.find((item) => item.id === sourceId);
  if (!source) return 0;
  const used = workspace.allocations
    .filter((allocation) => allocation.sourceId === sourceId)
    .reduce((total, allocation) => total + allocation.quantity, 0);
  return Math.max(0, source.onHand - used);
}

export function sourcesForRequirement(
  workspace: Workspace,
  requirement: PartRequirement
): StockSource[] {
  return workspace.sources.filter(
    (source) =>
      source.partDescription === requirement.description &&
      source.unit === requirement.unit
  );
}

export function promiseStatus(
  workspace: Workspace,
  job: Job,
  now = new Date(),
  bufferDays = 0,
  staleHours = 72
): PromiseStatus {
  const requirements = workspace.requirements.filter(
    (requirement) => requirement.jobId === job.id
  );
  const uncovered = requirements.find(
    (requirement) =>
      coveredQuantity(workspace, requirement.id) < requirement.quantity
  );

  if (uncovered) {
    const missing =
      uncovered.quantity - coveredQuantity(workspace, uncovered.id);
    return {
      code: 'at-risk',
      label: 'Date at risk',
      reason: `${uncovered.description} needs ${formatQuantity(missing, uncovered.unit)}.`
    };
  }

  const allocations = workspace.allocations.filter(
    (allocation) => allocation.jobId === job.id
  );
  const supplierAllocation = allocations.find(
    (allocation) => allocation.kind === 'supplier_order'
  );

  if (!supplierAllocation) {
    return {
      code: 'in-hand',
      label: 'Parts in hand',
      reason: 'Every required quantity is held from a van or warehouse.'
    };
  }

  const source = workspace.sources.find(
    (item) => item.id === supplierAllocation.sourceId
  );
  const evidence = source?.supplierOrder;
  const checkedAt = source
    ? new Date(source.lastCheckedAt).getTime()
    : Number.NaN;
  if (
    !source ||
    !evidence ||
    evidence.confidence === 'Needs a check' ||
    !Number.isFinite(checkedAt) ||
    now.getTime() - checkedAt > staleHours * 60 * 60 * 1000
  ) {
    return {
      code: 'check',
      label: 'Needs a check',
      reason:
        'Supplier evidence needs a current check before the visit date is promised.'
    };
  }

  const cutoff =
    new Date(`${job.visitDate}T12:00:00.000Z`).getTime() - bufferDays * DAY_MS;
  const expected = new Date(`${evidence.expectedDate}T12:00:00.000Z`).getTime();
  if (!Number.isFinite(expected) || expected > cutoff) {
    return {
      code: 'at-risk',
      label: 'Date at risk',
      reason: `Supplier order ${evidence.reference} is not expected before the visit buffer.`
    };
  }

  return {
    code: 'expected',
    label: 'Expected before visit',
    reason: `${evidence.reference} is ${evidence.confidence.toLowerCase()} for ${evidence.expectedDate}.`
  };
}

export function reorderSuggestions(workspace: Workspace): ReorderSuggestion[] {
  return workspace.sources
    .filter((source) => source.type !== 'supplier_order')
    .map((source) => ({
      sourceId: source.id,
      sourceName: source.name,
      partDescription: source.partDescription,
      remaining: availableQuantity(workspace, source.id),
      minimum: source.minimum,
      unit: source.unit
    }))
    .filter((suggestion) => suggestion.remaining < suggestion.minimum);
}

export function formatQuantity(quantity: number, unit: string): string {
  return `${quantity} ${unit}`;
}

export function copyWorkspace(workspace: Workspace): Workspace {
  return structuredClone(workspace);
}
