import type { Workspace } from '../domain/types';

export type CloudOperation = {
  organizationId: string;
  idempotencyKey: string;
  expectedVersion: number;
  workspace: Workspace;
  createdAt: string;
  updatedAt: string;
};

const DATABASE = 'parts-promise-cloud-v1';
const STORE = 'outbox';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE, 1);
    request.onerror = () =>
      reject(
        request.error ?? new Error('The sync outbox could not be opened.')
      );
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE))
        request.result.createObjectStore(STORE);
    };
    request.onsuccess = () => resolve(request.result);
  });
}

async function write(operation: CloudOperation): Promise<void> {
  const database = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE, 'readwrite');
    transaction.objectStore(STORE).put(operation, operation.organizationId);
    transaction.onerror = () =>
      reject(
        transaction.error ?? new Error('The sync outbox could not be saved.')
      );
    transaction.oncomplete = () => resolve();
  });
  database.close();
}

export async function readCloudOperation(
  organizationId: string
): Promise<CloudOperation | undefined> {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE, 'readonly');
    const request = transaction.objectStore(STORE).get(organizationId);
    let result: CloudOperation | undefined;
    request.onsuccess = () => (result = request.result as CloudOperation);
    request.onerror = () => reject(request.error);
    transaction.onerror = () => reject(transaction.error);
    transaction.oncomplete = () => {
      database.close();
      resolve(result);
    };
  });
}

export async function readLatestCloudOperation(): Promise<
  CloudOperation | undefined
> {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE, 'readonly');
    const request = transaction.objectStore(STORE).getAll();
    let result: CloudOperation | undefined;
    request.onsuccess = () => {
      result = (request.result as CloudOperation[]).sort((left, right) =>
        right.updatedAt.localeCompare(left.updatedAt)
      )[0];
    };
    request.onerror = () => reject(request.error);
    transaction.onerror = () => reject(transaction.error);
    transaction.oncomplete = () => {
      database.close();
      resolve(result);
    };
  });
}

export async function queueCloudWorkspace(
  organizationId: string,
  expectedVersion: number,
  workspace: Workspace
): Promise<CloudOperation> {
  const pending = await readCloudOperation(organizationId);
  const now = new Date().toISOString();
  const operation: CloudOperation = pending
    ? { ...pending, workspace: structuredClone(workspace), updatedAt: now }
    : {
        organizationId,
        idempotencyKey: crypto.randomUUID(),
        expectedVersion,
        workspace: structuredClone(workspace),
        createdAt: now,
        updatedAt: now
      };
  await write(operation);
  return operation;
}

export async function rebaseCloudOperation(
  operation: CloudOperation,
  expectedVersion: number
): Promise<CloudOperation> {
  const rebased = {
    ...operation,
    expectedVersion,
    updatedAt: new Date().toISOString()
  };
  await write(rebased);
  return rebased;
}

export async function clearCloudOperation(
  organizationId: string
): Promise<void> {
  const database = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE, 'readwrite');
    transaction.objectStore(STORE).delete(organizationId);
    transaction.onerror = () => reject(transaction.error);
    transaction.oncomplete = () => resolve();
  });
  database.close();
}

function quantityRevision(workspace: Workspace) {
  return {
    requirements: workspace.requirements
      .map(({ id, jobId, unit, quantity }) => ({ id, jobId, unit, quantity }))
      .sort((left, right) => left.id.localeCompare(right.id)),
    sources: workspace.sources
      .map(({ id, unit, onHand }) => ({ id, unit, onHand }))
      .sort((left, right) => left.id.localeCompare(right.id)),
    allocations: workspace.allocations
      .map(({ id, jobId, requirementId, sourceId, unit, quantity }) => ({
        id,
        jobId,
        requirementId,
        sourceId,
        unit,
        quantity
      }))
      .sort((left, right) => left.id.localeCompare(right.id))
  };
}

export function hasQuantityConflict(
  device: Workspace,
  shared: Workspace
): boolean {
  return (
    JSON.stringify(quantityRevision(device)) !==
    JSON.stringify(quantityRevision(shared))
  );
}
