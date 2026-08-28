import { createDemoWorkspace, createEmptyWorkspace } from '../domain/fixture';
import type { Workspace } from '../domain/types';

export type WorkspaceMode = 'demo' | 'live';

const DATABASES: Record<WorkspaceMode, string> = {
  demo: 'parts-promise-demo-v1',
  live: 'parts-promise-live-v1'
};
const STORE = 'workspace';
const CURRENT_KEY = 'current';

function openDatabase(mode: WorkspaceMode): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASES[mode], 1);
    request.onerror = () =>
      reject(
        request.error ?? new Error('The browser could not open local storage.')
      );
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE))
        request.result.createObjectStore(STORE);
    };
    request.onsuccess = () => resolve(request.result);
  });
}

async function read(mode: WorkspaceMode): Promise<Workspace | undefined> {
  const db = await openDatabase(mode);
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE, 'readonly');
    const request = transaction.objectStore(STORE).get(CURRENT_KEY);
    request.onerror = () =>
      reject(
        request.error ?? new Error('The browser could not read local storage.')
      );
    request.onsuccess = () => resolve(request.result as Workspace | undefined);
    transaction.oncomplete = () => db.close();
  });
}

export async function loadWorkspace(mode: WorkspaceMode): Promise<Workspace> {
  const stored = await read(mode);
  if (stored) return stored;
  const initial =
    mode === 'demo' ? createDemoWorkspace() : createEmptyWorkspace();
  await saveWorkspace(mode, initial);
  return initial;
}

export async function saveWorkspace(
  mode: WorkspaceMode,
  workspace: Workspace
): Promise<void> {
  const db = await openDatabase(mode);
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE, 'readwrite');
    transaction.objectStore(STORE).put(workspace, CURRENT_KEY);
    transaction.onerror = () =>
      reject(
        transaction.error ??
          new Error('The browser could not save local storage.')
      );
    transaction.oncomplete = () => resolve();
  });
  db.close();
}

export async function resetDemo(): Promise<Workspace> {
  const workspace = createDemoWorkspace();
  await saveWorkspace('demo', workspace);
  return workspace;
}

export function databaseName(mode: WorkspaceMode): string {
  return DATABASES[mode];
}

export async function deleteWorkspace(mode: WorkspaceMode): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase(DATABASES[mode]);
    request.onerror = () =>
      reject(
        request.error ?? new Error('The browser could not clear local storage.')
      );
    request.onsuccess = () => resolve();
    request.onblocked = () =>
      reject(new Error('Close other Parts Promise tabs and try again.'));
  });
}
