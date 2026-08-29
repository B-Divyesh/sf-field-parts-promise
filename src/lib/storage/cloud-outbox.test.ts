import { describe, expect, it } from 'vitest';

import { createEmptyWorkspace } from '../domain/fixture';
import { hasQuantityConflict } from './cloud-outbox';

describe('cloud conflict safety', () => {
  it('allows an explicit rebase only when quantity evidence is unchanged', () => {
    const shared = createEmptyWorkspace();
    const renamed = structuredClone(shared);
    renamed.jobs.push({
      id: 'job-1',
      number: 'JOB-1',
      site: 'North plant',
      visitDate: '2026-09-30',
      notes: '',
      createdAt: '2026-08-29T00:00:00Z',
      updatedAt: '2026-08-29T00:00:00Z'
    });
    expect(hasQuantityConflict(renamed, shared)).toBe(false);

    const quantityEdit = structuredClone(renamed);
    quantityEdit.requirements.push({
      id: 'requirement-1',
      jobId: 'job-1',
      description: 'Contactor',
      unit: 'each',
      quantity: 1
    });
    expect(hasQuantityConflict(quantityEdit, shared)).toBe(true);
  });
});
