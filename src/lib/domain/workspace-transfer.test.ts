import { describe, expect, it } from 'vitest';

import { createDemoWorkspace } from './fixture';
import {
  BACKUP_FORMAT,
  CSV_TEMPLATE,
  createWorkspaceBackup,
  parseWorkspaceBackup,
  parseWorkspaceCsv
} from './workspace-transfer';

describe('workspace transfer', () => {
  it('round-trips every workspace record through the versioned backup', () => {
    const workspace = createDemoWorkspace();
    const backup = createWorkspaceBackup(workspace, '2026-08-29T12:00:00.000Z');
    expect(backup.format).toBe(BACKUP_FORMAT);
    expect(parseWorkspaceBackup(JSON.stringify(backup)).workspace).toEqual(
      workspace
    );
  });

  it('imports the documented CSV rows', () => {
    const preview = parseWorkspaceCsv(CSV_TEMPLATE, '2026-08-29T12:00:00.000Z');
    expect(preview.errors).toEqual([]);
    expect(preview.counts).toEqual({
      jobs: 1,
      requirements: 1,
      sources: 1,
      allocations: 0
    });
  });

  it('reports row numbers and refuses a partial invalid CSV import', () => {
    const preview = parseWorkspaceCsv(
      CSV_TEMPLATE.replace(',each,1,', ',each,0,')
    );
    expect(preview.workspace).toBeNull();
    expect(preview.errors.join(' ')).toContain('Row 3');
  });
});
