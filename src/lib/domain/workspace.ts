import { createDemoWorkspace, createEmptyWorkspace } from './fixture';
import { availableQuantity, copyWorkspace } from './rules';
import type {
  Allocation,
  PartRequirement,
  StockSource,
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
  if (
    allocation.kind === 'on_hand' &&
    allocation.quantity > availableQuantity(workspace, source.id)
  ) {
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

export function demoWorkspace(): Workspace {
  return createDemoWorkspace();
}

export function emptyWorkspace(): Workspace {
  return createEmptyWorkspace();
}
