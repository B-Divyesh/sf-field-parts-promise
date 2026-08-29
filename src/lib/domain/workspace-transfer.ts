import type {
  Allocation,
  Job,
  PartRequirement,
  SourceType,
  StockSource,
  Workspace
} from './types';

export const BACKUP_FORMAT = 'parts-promise-workspace';
export const BACKUP_VERSION = 1;

export interface WorkspaceBackup {
  format: typeof BACKUP_FORMAT;
  version: typeof BACKUP_VERSION;
  exportedAt: string;
  workspace: Workspace;
}

export interface ImportPreview {
  format: 'csv' | 'json';
  workspace: Workspace | null;
  counts: {
    jobs: number;
    requirements: number;
    sources: number;
    allocations: number;
  };
  errors: string[];
}

const CSV_COLUMNS = [
  'record_type',
  'job_number',
  'site',
  'visit_date',
  'part',
  'unit',
  'quantity',
  'source_name',
  'source_type',
  'minimum',
  'last_checked_at'
] as const;

function counts(workspace: Workspace): ImportPreview['counts'] {
  return {
    jobs: workspace.jobs.length,
    requirements: workspace.requirements.length,
    sources: workspace.sources.length,
    allocations: workspace.allocations.length
  };
}

function emptyPreview(
  format: ImportPreview['format'],
  errors: string[]
): ImportPreview {
  return {
    format,
    workspace: null,
    counts: { jobs: 0, requirements: 0, sources: 0, allocations: 0 },
    errors
  };
}

function isText(value: unknown): value is string {
  return typeof value === 'string';
}

function positive(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

function nonNegative(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

function validDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T12:00:00Z`);
  return (
    !Number.isNaN(parsed.valueOf()) &&
    parsed.toISOString().slice(0, 10) === value
  );
}

function validTimestamp(value: string): boolean {
  return value.length > 0 && !Number.isNaN(Date.parse(value));
}

function validateWorkspace(value: unknown): string[] {
  if (!value || typeof value !== 'object')
    return ['The backup has no workspace object.'];
  const workspace = value as Partial<Workspace>;
  const errors: string[] = [];
  if (workspace.schemaVersion !== 1)
    errors.push('The workspace schema version must be 1.');
  for (const key of [
    'jobs',
    'requirements',
    'sources',
    'allocations'
  ] as const) {
    if (!Array.isArray(workspace[key]))
      errors.push(`The workspace ${key} list is missing.`);
  }
  if (errors.length) return errors;

  const jobs = workspace.jobs as Job[];
  const requirements = workspace.requirements as PartRequirement[];
  const sources = workspace.sources as StockSource[];
  const allocations = workspace.allocations as Allocation[];
  const jobIds = new Set<string>();
  const requirementIds = new Set<string>();
  const sourceIds = new Set<string>();

  jobs.forEach((job, index) => {
    if (
      !job ||
      !isText(job.id) ||
      !isText(job.number) ||
      !isText(job.site) ||
      !validDate(job.visitDate)
    )
      errors.push(
        `Job ${index + 1} is missing an id, number, site, or valid visit date.`
      );
    else if (jobIds.has(job.id))
      errors.push(`Job ${index + 1} repeats id ${job.id}.`);
    else jobIds.add(job.id);
    if (
      !isText(job.createdAt) ||
      !validTimestamp(job.createdAt) ||
      !isText(job.updatedAt) ||
      !validTimestamp(job.updatedAt)
    )
      errors.push(`Job ${index + 1} needs valid created and updated times.`);
  });
  requirements.forEach((item, index) => {
    if (
      !item ||
      !isText(item.id) ||
      !isText(item.jobId) ||
      !isText(item.description) ||
      !isText(item.unit) ||
      !positive(item.quantity)
    )
      errors.push(`Required part ${index + 1} is incomplete.`);
    else {
      if (requirementIds.has(item.id))
        errors.push(`Required part ${index + 1} repeats id ${item.id}.`);
      requirementIds.add(item.id);
      if (!jobIds.has(item.jobId))
        errors.push(
          `Required part ${index + 1} names a job that is not in the backup.`
        );
    }
  });
  sources.forEach((item, index) => {
    if (
      !item ||
      !isText(item.id) ||
      !isText(item.name) ||
      !['van', 'warehouse', 'supplier_order'].includes(item.type) ||
      !isText(item.partDescription) ||
      !isText(item.unit) ||
      !nonNegative(item.onHand) ||
      !nonNegative(item.minimum) ||
      !isText(item.lastCheckedAt) ||
      !validTimestamp(item.lastCheckedAt) ||
      !isText(item.lastCheckedBy)
    )
      errors.push(`Source ${index + 1} is incomplete.`);
    else if (sourceIds.has(item.id))
      errors.push(`Source ${index + 1} repeats id ${item.id}.`);
    else sourceIds.add(item.id);
  });
  allocations.forEach((item, index) => {
    if (
      !item ||
      !isText(item.id) ||
      !jobIds.has(item.jobId) ||
      !requirementIds.has(item.requirementId) ||
      !sourceIds.has(item.sourceId) ||
      !positive(item.quantity) ||
      !isText(item.unit) ||
      !isText(item.updater) ||
      !validTimestamp(item.checkedAt) ||
      !validTimestamp(item.createdAt)
    )
      errors.push(
        `Allocation ${index + 1} is incomplete or names a missing record.`
      );
  });
  return errors;
}

export function createWorkspaceBackup(
  workspace: Workspace,
  exportedAt = new Date().toISOString()
): WorkspaceBackup {
  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt,
    workspace: structuredClone(workspace)
  };
}

export function parseWorkspaceBackup(text: string): ImportPreview {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return emptyPreview('json', [
      'The JSON file could not be read. Choose a Parts Promise backup.'
    ]);
  }
  if (!parsed || typeof parsed !== 'object')
    return emptyPreview('json', [
      'The JSON file is not a Parts Promise backup.'
    ]);
  const backup = parsed as Partial<WorkspaceBackup>;
  if (backup.format !== BACKUP_FORMAT || backup.version !== BACKUP_VERSION)
    return emptyPreview('json', [
      'The backup format or version is not supported.'
    ]);
  const errors = validateWorkspace(backup.workspace);
  if (errors.length) return emptyPreview('json', errors);
  const workspace = structuredClone(backup.workspace as Workspace);
  return { format: 'json', workspace, counts: counts(workspace), errors: [] };
}

function parseCsvRows(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') quoted = false;
      else field += character;
    } else if (character === '"') quoted = true;
    else if (character === ',') {
      row.push(field.trim());
      field = '';
    } else if (character === '\n') {
      row.push(field.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      field = '';
    } else if (character !== '\r') field += character;
  }
  if (quoted) throw new Error('A quoted CSV field is not closed.');
  row.push(field.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

export function parseWorkspaceCsv(
  text: string,
  now = new Date().toISOString()
): ImportPreview {
  let rows: string[][];
  try {
    rows = parseCsvRows(text);
  } catch (error) {
    return emptyPreview('csv', [
      error instanceof Error ? error.message : 'The CSV file could not be read.'
    ]);
  }
  if (rows.length < 2)
    return emptyPreview('csv', [
      'The CSV needs a header and at least one data row.'
    ]);
  const headers = rows[0].map((cell, index) =>
    (index === 0 ? cell.replace(/^\uFEFF/, '') : cell).toLowerCase()
  );
  const missing = CSV_COLUMNS.filter((column) => !headers.includes(column));
  if (missing.length)
    return emptyPreview('csv', [
      `The CSV is missing columns: ${missing.join(', ')}.`
    ]);
  const value = (row: string[], column: (typeof CSV_COLUMNS)[number]) =>
    row[headers.indexOf(column)] ?? '';
  const workspace: Workspace = {
    schemaVersion: 1,
    jobs: [],
    requirements: [],
    sources: [],
    allocations: []
  };
  const errors: string[] = [];
  const jobsByNumber = new Map<string, Job>();

  rows.slice(1).forEach((row, offset) => {
    const line = offset + 2;
    const recordType = value(row, 'record_type').toLowerCase();
    if (recordType !== 'job') return;
    const number = value(row, 'job_number');
    const site = value(row, 'site');
    const visitDate = value(row, 'visit_date');
    if (!number || !site || !validDate(visitDate)) {
      errors.push(
        `Row ${line}: a job needs job_number, site, and visit_date in YYYY-MM-DD form.`
      );
      return;
    }
    if (jobsByNumber.has(number)) {
      errors.push(`Row ${line}: job_number ${number} is repeated.`);
      return;
    }
    const job: Job = {
      id: crypto.randomUUID(),
      number,
      site,
      visitDate,
      notes: '',
      createdAt: now,
      updatedAt: now
    };
    jobsByNumber.set(number, job);
    workspace.jobs.push(job);
  });

  rows.slice(1).forEach((row, offset) => {
    const line = offset + 2;
    const recordType = value(row, 'record_type').toLowerCase();
    if (recordType === 'job') return;
    if (recordType === 'required_part') {
      const job = jobsByNumber.get(value(row, 'job_number'));
      const part = value(row, 'part');
      const unit = value(row, 'unit');
      const quantity = Number(value(row, 'quantity'));
      if (!job || !part || !unit || !positive(quantity)) {
        errors.push(
          `Row ${line}: a required_part needs an imported job_number, part, unit, and quantity above zero.`
        );
        return;
      }
      workspace.requirements.push({
        id: crypto.randomUUID(),
        jobId: job.id,
        description: part,
        unit,
        quantity
      });
      return;
    }
    if (recordType === 'source') {
      const name = value(row, 'source_name');
      const part = value(row, 'part');
      const unit = value(row, 'unit');
      const sourceType = value(row, 'source_type') as SourceType;
      const quantity = Number(value(row, 'quantity'));
      const minimum = Number(value(row, 'minimum'));
      const checkedAt = value(row, 'last_checked_at') || now;
      if (
        !name ||
        !part ||
        !unit ||
        !['van', 'warehouse'].includes(sourceType) ||
        !nonNegative(quantity) ||
        !nonNegative(minimum) ||
        !validTimestamp(checkedAt)
      ) {
        errors.push(
          `Row ${line}: a source needs source_name, van or warehouse source_type, part, unit, non-negative quantity/minimum, and a valid last_checked_at.`
        );
        return;
      }
      workspace.sources.push({
        id: crypto.randomUUID(),
        name,
        type: sourceType,
        partDescription: part,
        unit,
        onHand: quantity,
        minimum,
        lastCheckedAt: checkedAt,
        lastCheckedBy: 'CSV import'
      });
      return;
    }
    errors.push(
      `Row ${line}: record_type must be job, required_part, or source.`
    );
  });
  if (!workspace.jobs.length)
    errors.push('The CSV needs at least one valid job row.');
  if (errors.length)
    return {
      format: 'csv',
      workspace: null,
      counts: counts(workspace),
      errors
    };
  return { format: 'csv', workspace, counts: counts(workspace), errors: [] };
}

export const CSV_TEMPLATE = `${CSV_COLUMNS.join(',')}\njob,JOB-101,Riverside Dental,2026-09-02,,,,,,,\nrequired_part,JOB-101,,,Condensate pump,each,1,,,,\nsource,,,,Condensate pump,each,2,Van 2,van,1,2026-08-29T09:00:00.000Z\n`;

export function backupFilename(date = new Date()): string {
  return `parts-promise-backup-${date.toISOString().slice(0, 10)}.json`;
}
