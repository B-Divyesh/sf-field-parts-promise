import { createDemoWorkspace, createEmptyWorkspace } from './fixture';
import { availableQuantity, copyWorkspace } from './rules';
import type {
  Allocation,
  PartRequirement,
  ReorderDecision,
  StockSource,
  SupplierOrder,
  Workspace
} from './types';

export function addAllocation(
  workspace: Workspace,
  allocation: Allocation
): { workspace: Workspace; error?: string } {
  const requirement = workspace.requirements.find(
    (item) => item.id === allocation.requirementId
  );
  const source = workspace.sources.find(
    (item) => item.id === allocation.sourceId
  );
  if (!requirement || !source)
    return { workspace, error: 'The part or source no longer exists.' };
  if (allocation.quantity <= 0 || !Number.isFinite(allocation.quantity)) {
    return { workspace, error: 'Enter a quantity greater than zero.' };
  }
  if (
    allocation.unit !== requirement.unit ||
    source.unit !== requirement.unit
  ) {
    return {
      workspace,
      error: 'The source and required part must use the same unit.'
    };
  }
  const missing = Math.max(
    0,
    requirement.quantity -
      workspace.allocations
        .filter((item) => item.requirementId === requirement.id)
        .reduce((total, item) => total + item.quantity, 0)
  );
  if (allocation.quantity > missing) {
    return {
      workspace,
      error: `Only ${missing} ${requirement.unit} is still needed for this job.`
    };
  }
  if (allocation.quantity > availableQuantity(workspace, source.id)) {
    return {
      workspace,
      error: `Only ${availableQuantity(workspace, source.id)} ${source.unit} is available at ${source.name}.`
    };
  }

  const next = copyWorkspace(workspace);
  next.allocations.push(allocation);
  next.lastActionAllocationId = allocation.id;
  return { workspace: next };
}

export function removeAllocation(
  workspace: Workspace,
  allocationId: string
): Workspace {
  const next = copyWorkspace(workspace);
  next.allocations = next.allocations.filter(
    (allocation) => allocation.id !== allocationId
  );
  if (next.lastActionAllocationId === allocationId)
    delete next.lastActionAllocationId;
  return next;
}

export function markAllocationFitted(
  workspace: Workspace,
  allocationId: string
): { workspace: Workspace; error?: string } {
  const allocation = workspace.allocations.find(
    (item) => item.id === allocationId
  );
  if (!allocation)
    return { workspace, error: 'That allocation no longer exists.' };
  if (allocation.state === 'fitted')
    return { workspace, error: 'This quantity is already marked fitted.' };
  const next = copyWorkspace(workspace);
  const nextAllocation = next.allocations.find(
    (item) => item.id === allocationId
  );
  const requirement = next.requirements.find(
    (item) => item.id === allocation.requirementId
  );
  if (!nextAllocation || !requirement)
    return { workspace, error: 'The allocation needs a current job part.' };
  nextAllocation.state = 'fitted';
  requirement.fittedQuantity =
    (requirement.fittedQuantity ?? 0) + allocation.quantity;
  return { workspace: next };
}

export function moveAllocation(
  workspace: Workspace,
  allocationId: string,
  targetSourceId: string,
  movedAt: string
): { workspace: Workspace; error?: string } {
  const allocation = workspace.allocations.find(
    (item) => item.id === allocationId
  );
  if (!allocation)
    return { workspace, error: 'That allocation no longer exists.' };
  if (allocation.state === 'fitted')
    return { workspace, error: 'A fitted quantity cannot be moved.' };
  const target = workspace.sources.find((item) => item.id === targetSourceId);
  if (!target)
    return { workspace, error: 'Choose the source receiving this quantity.' };
  const requirement = workspace.requirements.find(
    (item) => item.id === allocation.requirementId
  );
  if (!requirement)
    return { workspace, error: 'The allocation needs a current job part.' };
  if (
    target.partDescription !== requirement.description ||
    target.unit !== requirement.unit
  )
    return {
      workspace,
      error: 'Move this quantity only to a source for the same job part.'
    };
  if (target.id === allocation.sourceId)
    return { workspace, error: 'Choose a different source for this move.' };
  const withoutOriginal = removeAllocation(workspace, allocationId);
  return addAllocation(withoutOriginal, {
    ...allocation,
    id: crypto.randomUUID(),
    sourceId: target.id,
    sourceName: target.name,
    kind: target.type === 'supplier_order' ? 'supplier_order' : 'on_hand',
    checkedAt: target.lastCheckedAt,
    createdAt: movedAt,
    state: 'held'
  });
}

export function addRequirement(
  workspace: Workspace,
  requirement: PartRequirement
): Workspace {
  const next = copyWorkspace(workspace);
  next.requirements.push(requirement);
  return next;
}

export function addSource(
  workspace: Workspace,
  source: StockSource
): Workspace {
  const next = copyWorkspace(workspace);
  next.sources.push(source);
  return next;
}

export function addSupplierOrder(
  workspace: Workspace,
  order: SupplierOrder
): Workspace {
  const next = copyWorkspace(workspace);
  next.supplierOrders = [...(next.supplierOrders ?? []), order];
  return next;
}

export function recordReorderDecision(
  workspace: Workspace,
  decision: ReorderDecision
): Workspace {
  const next = copyWorkspace(workspace);
  next.reorderDecisions = [
    ...(next.reorderDecisions ?? []).filter(
      (item) => item.sourceId !== decision.sourceId
    ),
    decision
  ];
  return next;
}

export function demoWorkspace(): Workspace {
  return createDemoWorkspace();
}

export function emptyWorkspace(): Workspace {
  return createEmptyWorkspace();
}
