import { spawn } from 'node:child_process';
import { createHmac } from 'node:crypto';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import { AxeBuilder } from '@axe-core/playwright';
import { chromium, expect, test } from '@playwright/test';

const TEST_AUTH_SECRET = 'playwright-test-secret-at-least-32-bytes';

async function reservePort() {
  return new Promise<number>((resolvePort, reject) => {
    const probe = createServer();
    probe.once('error', reject);
    probe.listen(0, '127.0.0.1', () => {
      const address = probe.address();
      if (!address || typeof address === 'string') {
        probe.close();
        reject(new Error('Could not reserve a local test port.'));
        return;
      }
      probe.close((error) =>
        error ? reject(error) : resolvePort(address.port)
      );
    });
  });
}

async function waitForHealth(baseUrl: string) {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}/health`);
      if (response.ok) return response;
    } catch {
      // The process may still be binding its listener.
    }
    await new Promise((resolveWait) => setTimeout(resolveWait, 50));
  }
  throw new Error(`Server did not become healthy at ${baseUrl}.`);
}

async function stopProcess(process: ReturnType<typeof spawn>) {
  if (process.exitCode !== null) return;
  process.kill('SIGTERM');
  await new Promise<void>((resolveExit) => {
    const timeout = setTimeout(() => {
      process.kill('SIGKILL');
      resolveExit();
    }, 2_000);
    process.once('exit', () => {
      clearTimeout(timeout);
      resolveExit();
    });
  });
}

type TestTokenOverrides = {
  audience?: string;
  issuer?: string;
  tenantId?: string;
  signingSecret?: string;
};

function testToken(
  oid: string,
  expiresInSeconds = 600,
  overrides: TestTokenOverrides = {}
) {
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(
    JSON.stringify({ alg: 'HS256', typ: 'JWT' })
  ).toString('base64url');
  const payload = Buffer.from(
    JSON.stringify({
      aud: overrides.audience ?? '25c704f4-465a-47af-80ab-2c489466b697',
      iss: overrides.issuer ?? 'https://test.parts-promise.invalid',
      tid: overrides.tenantId ?? '35c6fe40-0ec0-46b6-98c6-213ad4de6650',
      oid,
      name: `Test ${oid}`,
      email: `${oid}@example.test`,
      nbf: now - 1,
      exp: now + expiresInSeconds
    })
  ).toString('base64url');
  const unsigned = `${header}.${payload}`;
  const signature = createHmac(
    'sha256',
    overrides.signingSecret ?? TEST_AUTH_SECRET
  )
    .update(unsigned)
    .digest('base64url');
  return `${unsigned}.${signature}`;
}

async function apiOnboard(
  request: import('@playwright/test').APIRequestContext,
  token: string,
  organizationName: string,
  workspace?: unknown,
  forwardedFor = '198.51.100.10'
) {
  const response = await request.post('/api/v1/onboarding', {
    headers: {
      authorization: `Bearer ${token}`,
      'x-forwarded-for': forwardedFor
    },
    data: {
      organization_name: organizationName,
      locale: 'en-US',
      time_zone: 'America/New_York',
      migrate_local_workspace: Boolean(workspace),
      local_item_count: workspace ? 1 : 0,
      workspace: workspace ?? null
    }
  });
  expect(response.ok(), await response.text()).toBe(true);
}

async function setTestBilling(
  request: import('@playwright/test').APIRequestContext,
  token: string,
  state: string,
  forwardedFor = '198.51.100.10'
) {
  const response = await request.post('/api/v1/test/billing', {
    headers: {
      authorization: `Bearer ${token}`,
      'x-forwarded-for': forwardedFor
    },
    data: { state }
  });
  expect(response.ok(), await response.text()).toBe(true);
}

async function openPumpAllocation(page: import('@playwright/test').Page) {
  await page.goto('/?demo=1');
  await expect(page.locator('.status-plate').first()).toContainText(
    'Date at risk'
  );
  await page.getByTestId('allocate-pump').click();
  await page.getByLabel(/Van 2/).check();
  await page.getByLabel('Quantity held').fill('1');
  await page.getByRole('button', { name: 'Allocate this quantity' }).click();
}

async function readWorkspace(
  page: import('@playwright/test').Page,
  name: string
) {
  return page.evaluate(async (databaseName) => {
    const request = indexedDB.open(databaseName, 1);
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    try {
      return await new Promise<unknown>((resolve, reject) => {
        const transaction = database.transaction('workspace', 'readonly');
        const read = transaction.objectStore('workspace').get('current');
        read.onsuccess = () => resolve(read.result);
        read.onerror = () => reject(read.error);
      });
    } finally {
      database.close();
    }
  }, name);
}

async function downloadContents(download: import('@playwright/test').Download) {
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks).toString('utf8');
}

test('@claim:sample-fixture The demo opens Riverside Dental RD-1042 with one missing condensate pump', async ({
  page
}, testInfo) => {
  test.skip(
    testInfo.project.name !== 'chromium',
    'Claim evidence runs once on desktop Chromium.'
  );
  await page.goto('/?demo=1');
  await expect(page.locator('h1')).toHaveText('Riverside Dental parts');
  await expect(page.locator('main')).toContainText('RD-1042');
  const pump = page.getByTestId('part-req-pump');
  await expect(pump).toContainText('Condensate pump');
  await expect(pump).toContainText('0 each held of 1 each');
  await expect(pump).toContainText('1 each still needs a source');
});

test('@claim:promise-status-from-allocation The sample needs every required quantity before it is in hand', async ({
  page
}, testInfo) => {
  test.skip(
    testInfo.project.name !== 'chromium',
    'Claim evidence runs once on desktop Chromium.'
  );
  await openPumpAllocation(page);
  await expect(page.locator('.status-plate').first()).toContainText(
    'Parts in hand'
  );
  await expect(page.locator('.status-plate').first()).toContainText(
    'Every required quantity is held'
  );
});

test('@claim:allocation-keeps-source Allocation evidence survives a reload', async ({
  page
}, testInfo) => {
  test.skip(
    testInfo.project.name !== 'chromium',
    'Claim evidence runs once on desktop Chromium.'
  );
  await openPumpAllocation(page);
  const pumpAllocations = page
    .getByTestId('part-req-pump')
    .locator('.allocation-list');
  await expect(pumpAllocations).toContainText(
    'Held for RD-1042 from Van 2 · 1 each · Field demo · checked'
  );
  await page.reload();
  await expect(
    page.getByTestId('part-req-pump').locator('.allocation-list')
  ).toContainText(
    'Held for RD-1042 from Van 2 · 1 each · Field demo · checked'
  );
  await expect(page.locator('.status-plate').first()).toContainText(
    'Parts in hand'
  );
});

test('@claim:supplier-quantity-conserved One supplier-order unit cannot cover two jobs', async ({
  page
}, testInfo) => {
  test.skip(
    testInfo.project.name !== 'chromium',
    'Claim evidence runs once on desktop Chromium.'
  );
  await page.goto('/?demo=1');
  await page
    .getByTestId('part-req-pump')
    .getByRole('button', { name: 'Check supplier date' })
    .click();
  await page.getByLabel('Supplier order reference').fill('PO-SINGLE-1');
  await page.getByLabel('Expected date').fill('2026-09-01');
  await page.getByLabel('Confidence').selectOption('Confirmed by supplier');
  await page.getByLabel('Quantity held').fill('1');
  await page.getByRole('button', { name: 'Attach supplier evidence' }).click();
  await expect(page.locator('.status-plate').first()).toContainText(
    'Expected before visit'
  );

  await page.goto('/jobs?demo=1');
  await page.getByRole('button', { name: 'Add a job' }).click();
  await page.getByLabel('Job number').fill('SECOND-1');
  await page.getByLabel('Site or customer name').fill('Second Customer');
  await page.getByLabel('Visit date').fill('2026-09-02');
  await page
    .getByRole('textbox', { name: 'Required part', exact: true })
    .fill('Condensate pump');
  await page
    .getByRole('spinbutton', { name: 'Quantity', exact: true })
    .fill('1');
  await page.getByRole('button', { name: 'Save job and part' }).click();
  await page.getByRole('button', { name: 'Allocate part' }).click();

  const consumedOrder = page.getByLabel(/Supplier order PO-SINGLE-1/);
  await expect(consumedOrder).toBeDisabled();
  await expect(consumedOrder.locator('..')).toContainText('0 each available');
  await expect(page.locator('.status-plate').first()).toContainText(
    'Date at risk'
  );

  const supplierState = await page.evaluate(async () => {
    const request = indexedDB.open('parts-promise-demo-v1', 1);
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const workspace = await new Promise<{
      sources: Array<{ id: string; onHand: number; reference?: string }>;
      allocations: Array<{ sourceId: string; quantity: number }>;
    }>((resolve, reject) => {
      const transaction = database.transaction('workspace', 'readonly');
      const read = transaction.objectStore('workspace').get('current');
      read.onsuccess = () => resolve(read.result);
      read.onerror = () => reject(read.error);
    });
    database.close();
    const source = workspace.sources.find(
      (item) => item.id && item.onHand === 1 && item.id !== 'source-van-pump'
    );
    return {
      onHand: source?.onHand,
      allocated: workspace.allocations
        .filter((item) => item.sourceId === source?.id)
        .reduce((total, item) => total + item.quantity, 0)
    };
  });
  expect(supplierState).toEqual({ onHand: 1, allocated: 1 });
});

test('@claim:reorder-after-allocation The last spare suggests review and never orders', async ({
  page
}, testInfo) => {
  test.skip(
    testInfo.project.name !== 'chromium',
    'Claim evidence runs once on desktop Chromium.'
  );
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  await openPumpAllocation(page);
  await expect(page.getByTestId('reorder-suggestion')).toContainText(
    'Van 2 has 0 each of Condensate pump.'
  );
  await expect(page.getByTestId('reorder-suggestion')).toContainText(
    'Minimum: 1 each. No supplier order has been placed.'
  );
  expect(
    requests.every((url) => new URL(url).origin === new URL(page.url()).origin)
  ).toBe(true);
});

test('@claim:demo-reset-isolated Demo reset restores the fixture and leaving preserves live records', async ({
  browser
}, testInfo) => {
  test.skip(
    testInfo.project.name !== 'chromium',
    'Claim evidence runs once on desktop Chromium.'
  );
  const context = await browser.newContext();
  const page = await context.newPage();
  const requests: string[] = [];
  const consoleErrors: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  await page.goto('/jobs');
  await page.getByRole('button', { name: 'Add a job' }).click();
  const liveToken = `LIVE-ONLY-${Date.now()}`;
  const demoToken = `DEMO-ONLY-${Date.now()}`;
  await page.getByLabel('Job number').fill(liveToken);
  await page
    .getByLabel('Site or customer name')
    .fill(`Existing Live Customer ${liveToken}`);
  await page.getByLabel('Visit date').fill('2026-09-20');
  await page.getByLabel('Required part', { exact: true }).fill('Fuse');
  await page.getByLabel('Quantity', { exact: true }).fill('1');
  await page.getByRole('button', { name: 'Save job and part' }).click();
  await expect(page.locator('h1')).toHaveText(
    `Existing Live Customer ${liveToken} parts`
  );
  await expect(page.locator('.toast')).toContainText(liveToken);
  await page.getByRole('link', { name: 'Parts Promise' }).click();
  await page.getByRole('link', { name: 'Try it with sample data' }).click();
  await expect(page).toHaveURL(/\?demo=1$/);
  await expect(page.locator('body')).not.toContainText(liveToken);
  await page
    .getByLabel('Main navigation')
    .getByRole('link', { name: 'Jobs' })
    .click();
  await page.getByRole('button', { name: 'Add a job' }).click();
  await page.getByLabel('Job number').fill(demoToken);
  await page.getByLabel('Site or customer name').fill('Sample Only Customer');
  await page.getByLabel('Visit date').fill('2026-09-21');
  await page.getByLabel('Required part', { exact: true }).fill('Sample Fuse');
  await page.getByLabel('Quantity', { exact: true }).fill('1');
  await page.getByRole('button', { name: 'Save job and part' }).click();
  await expect(page.locator('.toast')).toContainText(demoToken);
  await page.getByRole('link', { name: 'Parts Promise' }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator('body')).not.toContainText(demoToken);
  await expect
    .poll(() =>
      page.evaluate(async () =>
        (await indexedDB.databases()).some(
          (database) => database.name === 'parts-promise-demo-v1'
        )
      )
    )
    .toBe(false);
  await page
    .getByLabel('Main navigation')
    .getByRole('link', { name: 'Demo' })
    .click();
  await expect(page.locator('.status-plate').first()).toContainText(
    'Date at risk'
  );
  await page.getByTestId('allocate-pump').click();
  await page.getByLabel(/Van 2/).check();
  await page.getByRole('button', { name: 'Allocate this quantity' }).click();
  await expect(page.locator('.status-plate').first()).toContainText(
    'Parts in hand'
  );
  await page.goBack();
  await expect(page).toHaveURL(/\/$/);
  await expect
    .poll(() =>
      page.evaluate(async () =>
        (await indexedDB.databases()).some(
          (database) => database.name === 'parts-promise-demo-v1'
        )
      )
    )
    .toBe(false);
  await page.goto('/?demo=1');
  await expect(page.locator('.status-plate').first()).toContainText(
    'Date at risk'
  );
  await page.getByRole('button', { name: 'Reset demo' }).first().click();
  await page
    .locator('dialog')
    .getByRole('button', { name: 'Reset demo' })
    .click();
  await expect(page.locator('.status-plate').first()).toContainText(
    'Date at risk'
  );
  await page.getByRole('button', { name: 'Start for real' }).click();
  await page
    .locator('dialog')
    .getByRole('button', { name: 'Leave demo' })
    .click();
  await expect(page).toHaveURL(/\/jobs$/);
  await expect(
    page.getByRole('heading', {
      name: `Existing Live Customer ${liveToken}`
    })
  ).toBeVisible();
  await expect(page.locator('body')).not.toContainText(demoToken);
  await expect(page.locator('body')).toContainText(liveToken);
  await expect(page.locator('.toast')).toContainText(
    'Your local workspace is open. Sample changes were discarded.'
  );
  expect(
    requests.every((url) => new URL(url).origin === new URL(page.url()).origin)
  ).toBe(true);
  expect(consoleErrors).toEqual([]);
  await context.close();
});

test('@claim:workspace-backup-roundtrip A versioned backup restores every workspace record', async ({
  page
}, testInfo) => {
  test.skip(
    testInfo.project.name !== 'chromium',
    'Claim evidence runs once on desktop Chromium.'
  );
  await page.goto('/jobs?demo=1');
  const originalWorkspace = await readWorkspace(page, 'parts-promise-demo-v1');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export workspace' }).click();
  const download = await downloadPromise;
  const backupText = await downloadContents(download);
  const backup = JSON.parse(backupText);
  expect(backup).toEqual({
    format: 'parts-promise-workspace',
    version: 1,
    exportedAt: expect.any(String),
    workspace: originalWorkspace
  });
  expect(backup.workspace.jobs).toHaveLength(1);
  expect(backup.workspace.requirements).toHaveLength(3);
  expect(backup.workspace.sources).toHaveLength(4);
  expect(backup.workspace.allocations).toHaveLength(3);

  await page.getByRole('link', { name: 'Review parts' }).click();
  await page.getByTestId('allocate-pump').click();
  await page.getByLabel(/Van 2/).check();
  await page.getByRole('button', { name: 'Allocate this quantity' }).click();
  await expect(page.locator('.status-plate').first()).toContainText(
    'Parts in hand'
  );
  await page.goto('/jobs?demo=1');
  await page.getByRole('button', { name: 'Import workspace' }).click();
  await page
    .getByLabel('Choose a CSV or Parts Promise JSON backup')
    .setInputFiles({
      name: 'roundtrip.json',
      mimeType: 'application/json',
      buffer: Buffer.from(backupText)
    });
  await expect(
    page.getByRole('heading', { name: 'Import preview' })
  ).toBeVisible();
  await expect(page.locator('.import-preview')).toContainText(
    '1 jobs · 3 required parts · 4 sources · 3 allocations'
  );
  await page.getByRole('button', { name: 'Import roundtrip.json' }).click();
  await page.getByRole('link', { name: 'Review parts' }).click();
  await expect(page.locator('.status-plate').first()).toContainText(
    'Date at risk'
  );
  const restoredWorkspace = await readWorkspace(page, 'parts-promise-demo-v1');
  expect(restoredWorkspace).toEqual(originalWorkspace);
});

test('@claim:csv-import-validation CSV import previews valid rows and identifies invalid rows', async ({
  page
}, testInfo) => {
  test.skip(
    testInfo.project.name !== 'chromium',
    'Claim evidence runs once on desktop Chromium.'
  );
  const header =
    'record_type,job_number,site,visit_date,part,unit,quantity,source_name,source_type,minimum,last_checked_at\n';
  const valid = `${header}job,CSV-7,Boiler Room,2026-10-04,,,,,,,\nrequired_part,CSV-7,,,Igniter,each,1,,,,\nsource,,,,Igniter,each,2,Van 7,van,1,2026-08-29T09:00:00.000Z\n`;
  await page.goto('/jobs');
  await page.getByRole('button', { name: 'Import workspace' }).click();
  const input = page.getByLabel('Choose a CSV or Parts Promise JSON backup');
  await input.setInputFiles({
    name: 'valid.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from(valid)
  });
  await expect(page.locator('.import-preview')).toContainText(
    '1 jobs · 1 required parts · 1 sources · 0 allocations'
  );
  await page.getByRole('button', { name: 'Import valid.csv' }).click();
  await expect(
    page.getByRole('heading', { name: 'Boiler Room' })
  ).toBeVisible();

  await page.getByRole('button', { name: 'Import workspace' }).click();
  await input.setInputFiles({
    name: 'invalid.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from(valid.replace(',each,1,', ',each,0,'))
  });
  await expect(page.getByRole('alert')).toContainText('Row 3');
  await expect(
    page.getByRole('button', { name: 'Import invalid.csv' })
  ).toHaveCount(0);
});

test('@claim:demo-transfer-isolated Importing or exporting sample data never changes the live workspace', async ({
  page
}, testInfo) => {
  test.skip(
    testInfo.project.name !== 'chromium',
    'Claim evidence runs once on desktop Chromium.'
  );
  const csv =
    'record_type,job_number,site,visit_date,part,unit,quantity,source_name,source_type,minimum,last_checked_at\njob,DEMO-CSV,Demo Import,2026-10-04,,,,,,,\nrequired_part,DEMO-CSV,,,Igniter,each,1,,,,\n';
  await page.goto('/jobs');
  await page.getByRole('button', { name: 'Add a job' }).click();
  await page.getByLabel('Job number').fill('LIVE-SAFE');
  await page.getByLabel('Site or customer name').fill('Live Safe Job');
  await page.getByLabel('Visit date').fill('2026-10-05');
  await page.getByLabel('Required part', { exact: true }).fill('Fuse');
  await page.getByLabel('Quantity', { exact: true }).fill('1');
  await page.getByRole('button', { name: 'Save job and part' }).click();
  const liveWorkspaceBefore = await readWorkspace(
    page,
    'parts-promise-live-v1'
  );
  await page.goto('/jobs?demo=1');
  const demoWorkspaceBefore = await readWorkspace(
    page,
    'parts-promise-demo-v1'
  );
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export workspace' }).click();
  const demoBackup = JSON.parse(await downloadContents(await downloadPromise));
  expect(demoBackup.workspace).toEqual(demoWorkspaceBefore);
  expect(JSON.stringify(demoBackup.workspace)).not.toContain('LIVE-SAFE');
  await page.getByRole('button', { name: 'Import workspace' }).click();
  await page
    .getByLabel('Choose a CSV or Parts Promise JSON backup')
    .setInputFiles({
      name: 'demo.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csv)
    });
  await page.getByRole('button', { name: 'Import demo.csv' }).click();
  await expect(
    page.getByRole('heading', { name: 'Demo Import' })
  ).toBeVisible();
  await page.getByRole('link', { name: 'Parts Promise' }).click();
  await page.goto('/jobs');
  await expect(
    page.getByRole('heading', { name: 'Live Safe Job' })
  ).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Demo Import' })).toHaveCount(
    0
  );
  const liveWorkspaceAfter = await readWorkspace(page, 'parts-promise-live-v1');
  expect(JSON.stringify(liveWorkspaceAfter)).toBe(
    JSON.stringify(liveWorkspaceBefore)
  );
});

test('@claim:csv-template-download The CSV template downloads with a valid import example', async ({
  page
}, testInfo) => {
  test.skip(
    testInfo.project.name !== 'chromium',
    'Claim evidence runs once on desktop Chromium.'
  );
  await page.addInitScript(() => {
    const state = window as unknown as { downloadBlobType?: string };
    const createObjectUrl = URL.createObjectURL.bind(URL);
    URL.createObjectURL = (value: Blob) => {
      state.downloadBlobType = value.type;
      return createObjectUrl(value);
    };
  });
  await page.goto('/jobs');
  await page.getByRole('button', { name: 'Import workspace' }).click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download CSV template' }).click();
  const download = await downloadPromise;
  const template = await downloadContents(download);
  expect(download.suggestedFilename()).toBe(
    'parts-promise-import-template.csv'
  );
  expect(
    await page.evaluate(
      () =>
        (window as unknown as { downloadBlobType?: string }).downloadBlobType
    )
  ).toBe('text/csv');
  expect(template.split('\n')[0]).toBe(
    'record_type,job_number,site,visit_date,part,unit,quantity,source_name,source_type,minimum,last_checked_at'
  );
  expect(template).toContain('job,JOB-101,Riverside Dental,2026-09-02,,,,,,,');
  expect(template).toContain(
    'required_part,JOB-101,,,Condensate pump,each,1,,,,'
  );
  expect(template).toContain(
    'source,,,,Condensate pump,each,2,Van 2,van,1,2026-08-29T09:00:00.000Z'
  );
  await page
    .getByLabel('Choose a CSV or Parts Promise JSON backup')
    .setInputFiles({
      name: download.suggestedFilename(),
      mimeType: 'text/csv',
      buffer: Buffer.from(template)
    });
  await expect(page.locator('.import-preview')).toContainText(
    '1 jobs · 1 required parts · 1 sources · 0 allocations'
  );
  await expect(
    page.getByRole('button', {
      name: 'Import parts-promise-import-template.csv'
    })
  ).toBeVisible();
  await expect(page.getByRole('alert')).toHaveCount(0);
});

test('@claim:offline-reload The sample allocation works after an offline reload', async ({}, testInfo) => {
  test.skip(
    testInfo.project.name !== 'chromium',
    'Claim evidence runs once on desktop Chromium.'
  );
  const isolatedBrowser = await chromium.launch();
  const context = await isolatedBrowser.newContext();
  const page = await context.newPage();
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  const failedRequests: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('requestfailed', (request) => failedRequests.push(request.url()));
  try {
    await page.goto('http://127.0.0.1:4173/?demo=1');
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
      await new Promise<void>((resolve) => {
        if (navigator.serviceWorker.controller) resolve();
        else
          navigator.serviceWorker.addEventListener(
            'controllerchange',
            () => resolve(),
            { once: true }
          );
      });
    });
    await page.waitForFunction(async () => {
      const cache = await caches.open('parts-promise-shell-v5');
      const paths = (await cache.keys()).map(
        (request) => new URL(request.url).pathname
      );
      return (
        paths.includes('/') &&
        paths.includes('/fonts/barlow-condensed-latin.woff2') &&
        paths.includes('/fonts/atkinson-hyperlegible-next-latin.woff2') &&
        paths.some((path) => /\/assets\/index-.*\.js$/.test(path)) &&
        paths.some((path) => /\/assets\/index-.*\.css$/.test(path))
      );
    });
    await context.setOffline(true);
    await page.reload();
    const offlineDiagnostics = await page.evaluate(async () => {
      const cache = await caches.open('parts-promise-shell-v5');
      const entries = await Promise.all(
        (await cache.keys()).map(async (request) => {
          const response = await cache.match(request);
          return {
            path: new URL(request.url).pathname,
            status: response?.status,
            size: (await response?.clone().arrayBuffer())?.byteLength
          };
        })
      );
      return {
        url: location.href,
        title: document.title,
        body: document.body.innerText.slice(0, 120),
        controlled: Boolean(navigator.serviceWorker.controller),
        caches: await caches.keys(),
        entries
      };
    });
    expect(
      offlineDiagnostics.body,
      `offline reload diagnostics: ${JSON.stringify({ ...offlineDiagnostics, consoleErrors, pageErrors, failedRequests })}`
    ).not.toBe('');
    await expect(page.locator('.status-plate').first()).toContainText(
      'Date at risk'
    );
    await page.getByTestId('allocate-pump').click();
    await page.getByLabel(/Van 2/).check();
    await page.getByLabel('Quantity held').fill('1');
    await page.getByRole('button', { name: 'Allocate this quantity' }).click();
    await expect(page.locator('.status-plate').first()).toContainText(
      'Parts in hand'
    );
    expect(consoleErrors).toEqual([]);
    expect(pageErrors).toEqual([]);
    expect(failedRequests).toEqual([]);
  } finally {
    await isolatedBrowser.close();
  }
});

test('@claim:local-workspace-flow A local job can be created, sourced, allocated, and undone', async ({
  page
}, testInfo) => {
  test.skip(
    testInfo.project.name !== 'chromium',
    'Claim evidence runs once on desktop Chromium.'
  );
  await page.goto('/jobs');
  await page.getByRole('button', { name: 'Add a job' }).click();
  await page.getByLabel('Job number').fill('BR-204');
  await page.getByLabel('Site or customer name').fill('North Street Boiler');
  await page.getByLabel('Visit date').fill('2026-09-12');
  await page
    .getByRole('textbox', { name: 'Required part', exact: true })
    .fill('Isolation valve');
  await page
    .getByRole('spinbutton', { name: 'Quantity', exact: true })
    .fill('1');
  await page.getByRole('button', { name: 'Save job and part' }).click();

  await expect(page.locator('h1')).toHaveText('North Street Boiler parts');
  await page.getByRole('button', { name: 'Add a source' }).click();
  await page.getByLabel('Source name').fill('Service van 4');
  await page.getByLabel('Source type').selectOption('van');
  await page.getByLabel('Part description').fill('Isolation valve');
  await page.getByLabel('Available quantity').fill('2');
  await page.getByLabel('Minimum quantity').fill('1');
  await page.getByRole('button', { name: 'Save source' }).click();

  await page.getByRole('button', { name: 'Allocate part' }).click();
  await page.getByLabel(/Service van 4/).check();
  await page.getByLabel('Quantity held').fill('1');
  await page.getByRole('button', { name: 'Allocate this quantity' }).click();
  await expect(page.locator('.status-plate').first()).toContainText(
    'Parts in hand'
  );
  await page.getByTestId('undo-allocation').click();
  await expect(page.locator('.status-plate').first()).toContainText(
    'Date at risk'
  );

  await page.getByRole('button', { name: 'Check supplier date' }).click();
  await page.getByLabel('Supplier order reference').fill('SUP-447');
  await page.getByLabel('Expected date').fill('2026-09-01');
  await page.getByLabel('Confidence').selectOption('Confirmed by supplier');
  await page.getByRole('button', { name: 'Attach supplier evidence' }).click();
  await expect(
    page.locator('.required-part').filter({ hasText: 'Isolation valve' })
  ).toContainText('Supplier order SUP-447');
  await expect(page.locator('.status-plate').first()).toContainText(
    'Expected before visit'
  );
});

test('@claim:demo-feature-boundaries The demo stays account-free and cannot sync, place an order, or pay', async ({
  page
}, testInfo) => {
  test.skip(
    testInfo.project.name !== 'chromium',
    'Claim evidence runs once on desktop Chromium.'
  );
  await page.goto('/');
  await expect(page.locator('.plain-language-section')).toContainText(
    'does not place supplier orders'
  );
  await page.goto('/?demo=1');
  for (const unavailableAction of [
    /^sign in/i,
    /invite (?:a )?technician/i,
    /place (?:a )?supplier order/i,
    /checkout|buy now/i
  ]) {
    await expect(
      page.getByRole('button', { name: unavailableAction })
    ).toHaveCount(0);
    await expect(
      page.getByRole('link', { name: unavailableAction })
    ).toHaveCount(0);
  }
});

test('@claim:indexeddb-local-storage Workspace records are written to the named local databases', async ({
  page
}, testInfo) => {
  test.skip(
    testInfo.project.name !== 'chromium',
    'Claim evidence runs once on desktop Chromium.'
  );
  await openPumpAllocation(page);
  const stored = await page.evaluate(async () => {
    const names = (await indexedDB.databases()).map(
      (database) => database.name
    );
    const request = indexedDB.open('parts-promise-demo-v1', 1);
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const workspace = await new Promise<{
      allocations: Array<{ sourceName: string }>;
    }>((resolve, reject) => {
      const transaction = database.transaction('workspace', 'readonly');
      const read = transaction.objectStore('workspace').get('current');
      read.onsuccess = () => resolve(read.result);
      read.onerror = () => reject(read.error);
    });
    database.close();
    return {
      names,
      sourceNames: workspace.allocations.map((item) => item.sourceName)
    };
  });
  expect(stored.names).toContain('parts-promise-demo-v1');
  expect(stored.sourceNames).toContain('Van 2');

  await page.goto('/jobs');
  await page.waitForLoadState('networkidle');
  expect(
    await page.evaluate(async () =>
      (await indexedDB.databases()).some(
        (database) => database.name === 'parts-promise-live-v1'
      )
    )
  ).toBe(true);
});

test('@claim:demo-network-privacy The normal demo flow stays same-origin and does not request the camera', async ({
  browser
}, testInfo) => {
  test.skip(
    testInfo.project.name !== 'chromium',
    'Claim evidence runs once on desktop Chromium.'
  );
  const context = await browser.newContext();
  await context.addInitScript(() => {
    const state = window as unknown as { cameraRequested: boolean };
    state.cameraRequested = false;
    if (navigator.mediaDevices) {
      Object.defineProperty(navigator.mediaDevices, 'getUserMedia', {
        configurable: true,
        value: () => {
          state.cameraRequested = true;
          return Promise.reject(
            new Error('Camera access is disabled in this test.')
          );
        }
      });
    }
  });
  const page = await context.newPage();
  const requests: Array<{ method: string; url: string }> = [];
  page.on('request', (request) =>
    requests.push({ method: request.method(), url: request.url() })
  );
  await openPumpAllocation(page);
  await page.getByRole('button', { name: 'Reset demo' }).first().click();
  await page
    .locator('dialog')
    .getByRole('button', { name: 'Reset demo' })
    .click();
  await page.goto('/privacy?demo=1');
  await expect(
    page.getByRole('heading', { name: 'Demo requests' })
  ).toBeVisible();

  const origin = new URL(page.url()).origin;
  expect(requests.length).toBeGreaterThan(0);
  expect(
    requests.every((request) => new URL(request.url).origin === origin)
  ).toBe(true);
  expect(
    requests.every((request) => ['GET', 'HEAD'].includes(request.method))
  ).toBe(true);
  expect(
    await page.evaluate(
      () => (window as unknown as { cameraRequested: boolean }).cameraRequested
    )
  ).toBe(false);
  await context.close();
});

test('@claim:manual-barcode-allocation Manual barcode entry finds and allocates a required part', async ({
  page
}, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'Claim evidence runs once.');
  await page.goto('/?demo=1');
  await page.getByRole('button', { name: 'Scan a part' }).click();
  await page.getByRole('button', { name: 'Enter barcode instead' }).click();
  await page.getByLabel('Barcode', { exact: true }).fill('CP-19');
  await page.getByRole('button', { name: 'Find required part' }).click();
  await expect(page.getByRole('status')).toContainText(
    'Condensate pump matches CP-19'
  );
  await page.getByRole('button', { name: 'Allocate matched part' }).click();
  await expect(
    page.getByRole('heading', { name: 'Allocate Condensate pump' })
  ).toBeFocused();
  await page.getByLabel(/Van 2/).check();
  await page.getByLabel('Quantity held').fill('1');
  await page.getByRole('button', { name: 'Allocate this quantity' }).click();
  await expect(page.locator('.status-plate').first()).toContainText(
    'Parts in hand'
  );
});

test('@claim:camera-barcode-privacy Camera starts only on request and frames stay on the device', async ({
  browser
}, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'Claim evidence runs once.');
  const context = await browser.newContext();
  await context.addInitScript(() => {
    const state = window as unknown as {
      cameraCalls: number;
      cameraStops: number;
      BarcodeDetector?: new () => {
        detect: () => Promise<Array<{ rawValue: string }>>;
      };
    };
    state.cameraCalls = 0;
    state.cameraStops = 0;
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getUserMedia: async () => {
          state.cameraCalls += 1;
          const stream = new MediaStream();
          Object.defineProperty(stream, 'getTracks', {
            value: () => [
              {
                stop: () => {
                  state.cameraStops += 1;
                }
              }
            ]
          });
          return stream;
        }
      }
    });
    state.BarcodeDetector = class {
      async detect() {
        return [{ rawValue: 'CP-19' }];
      }
    };
  });
  const page = await context.newPage();
  const requests: Array<{
    method: string;
    url: string;
    body: string | null;
  }> = [];
  page.on('request', (request) =>
    requests.push({
      method: request.method(),
      url: request.url(),
      body: request.postData()
    })
  );
  await page.goto('/?demo=1');
  await page.getByRole('button', { name: 'Scan a part' }).click();
  expect(
    await page.evaluate(
      () => (window as unknown as { cameraCalls: number }).cameraCalls
    )
  ).toBe(0);
  await page.getByRole('button', { name: 'Use camera' }).click();
  await expect(page.getByRole('status')).toContainText(
    'Condensate pump matches CP-19'
  );
  expect(
    await page.evaluate(() => ({
      calls: (window as unknown as { cameraCalls: number }).cameraCalls,
      stops: (window as unknown as { cameraStops: number }).cameraStops
    }))
  ).toEqual({ calls: 1, stops: 1 });
  const origin = new URL(page.url()).origin;
  expect(
    requests.every(
      (request) =>
        new URL(request.url).origin === origin &&
        ['GET', 'HEAD'].includes(request.method) &&
        request.body === null
    )
  ).toBe(true);
  const demoData = JSON.stringify(
    await readWorkspace(page, 'parts-promise-demo-v1')
  );
  expect(demoData).not.toMatch(/camera|frame|image\/|data:image/i);
  await context.close();
});

test('@claim:release-order-boundary The release never places a supplier order', async ({
  page,
  request
}, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'Claim evidence runs once.');
  const requests: Array<{ method: string; url: string }> = [];
  page.on('request', (candidate) =>
    requests.push({ method: candidate.method(), url: candidate.url() })
  );
  await openPumpAllocation(page);
  await expect(page.getByTestId('reorder-suggestion')).toContainText(
    'No supplier order has been placed.'
  );
  await expect(
    page.getByRole('button', { name: /place (?:a )?supplier order/i })
  ).toHaveCount(0);
  await expect(
    page.getByRole('link', { name: /place (?:a )?supplier order/i })
  ).toHaveCount(0);
  for (const route of [
    '/',
    '/jobs',
    '/onboarding',
    '/settings/team',
    '/settings/billing',
    '/settings/data',
    '/privacy',
    '/terms',
    '/not-on-this-drawing'
  ]) {
    await page.goto(route);
    await expect(
      page.getByRole('button', { name: /place (?:a )?supplier order/i })
    ).toHaveCount(0);
    await expect(
      page.getByRole('link', { name: /place (?:a )?supplier order/i })
    ).toHaveCount(0);
  }
  expect(
    requests.filter((entry) => !['GET', 'HEAD'].includes(entry.method))
  ).toEqual([]);
  const missingEndpoint = await request.post('/api/v1/supplier-orders', {
    data: { part: 'CP-19' }
  });
  expect([404, 405]).toContain(missingEndpoint.status());
});

test('@claim:clear-local-records Browser site-data removal clears the live workspace', async ({
  page,
  context
}, testInfo) => {
  test.skip(
    testInfo.project.name !== 'chromium',
    'Claim evidence runs once on desktop Chromium.'
  );
  await page.goto('/jobs');
  await page.getByRole('button', { name: 'Add a job' }).click();
  await page.getByLabel('Job number').fill('CLEAR-1');
  await page.getByLabel('Site or customer name').fill('Clear Data Test');
  await page.getByLabel('Visit date').fill('2026-09-20');
  await page
    .getByRole('textbox', { name: 'Required part', exact: true })
    .fill('Fuse');
  await page
    .getByRole('spinbutton', { name: 'Quantity', exact: true })
    .fill('1');
  await page.getByRole('button', { name: 'Save job and part' }).click();
  await expect(page.locator('h1')).toHaveText('Clear Data Test parts');

  const session = await context.newCDPSession(page);
  await session.send('Storage.clearDataForOrigin', {
    origin: new URL(page.url()).origin,
    storageTypes: 'indexeddb,local_storage'
  });
  await page.goto('/jobs');
  await expect(
    page.getByRole('heading', {
      name: 'Jobs with required parts will appear here'
    })
  ).toBeVisible();
});

test('@claim:entra-sign-in Sign-in uses Sociobot CIAM and rejects every invalid token property', async ({
  page,
  request
}, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'Claim evidence runs once.');
  const suffix = `${Date.now()}-${Math.random()}`;
  const invalidTokens = [
    testToken(`expired-${suffix}`, -120),
    testToken(`wrong-signature-${suffix}`, 600, {
      signingSecret: 'different-playwright-signing-secret'
    }),
    testToken(`wrong-issuer-${suffix}`, 600, {
      issuer: 'https://wrong-issuer.parts-promise.invalid'
    }),
    testToken(`wrong-audience-${suffix}`, 600, {
      audience: 'wrong-client-id'
    }),
    testToken(`wrong-tenant-${suffix}`, 600, {
      tenantId: '00000000-0000-0000-0000-000000000000'
    })
  ];
  for (const [index, token] of invalidTokens.entries()) {
    const rejected = await request.get('/api/v1/bootstrap', {
      headers: {
        authorization: `Bearer ${token}`,
        'x-forwarded-for': `198.51.100.${31 + index}`
      }
    });
    expect(rejected.status()).toBe(401);
    expect(rejected.headers()['www-authenticate']).toBe('Bearer');
  }
  await page.goto('/onboarding');
  const authorization = page.waitForRequest(
    (candidate) =>
      candidate.url().startsWith('https://sociobotcustomers.ciamlogin.com/') &&
      candidate.url().includes('/oauth2/v2.0/authorize'),
    { timeout: 20_000 }
  );
  await page.getByRole('button', { name: 'Sign in with Sociobot' }).click();
  const requestUrl = new URL((await authorization).url());
  expect(requestUrl.searchParams.get('client_id')).toBe(
    '25c704f4-465a-47af-80ab-2c489466b697'
  );
  expect(requestUrl.searchParams.get('redirect_uri')).toBe(
    'http://127.0.0.1:4173/auth/callback'
  );
});

test('@claim:tenant-data-isolation One firm cannot read another firm workspace', async ({
  request
}, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'Claim evidence runs once.');
  const suffix = `${Date.now()}-${Math.random()}`;
  const tokenA = testToken(`tenant-a-${suffix}`);
  const tokenB = testToken(`tenant-b-${suffix}`);
  const workspaceA = {
    schemaVersion: 1,
    jobs: [{ id: 'private-firm-a-job' }],
    requirements: [],
    sources: [],
    allocations: []
  };
  await apiOnboard(
    request,
    tokenA,
    'Isolation Firm A',
    workspaceA,
    '198.51.100.41'
  );
  await apiOnboard(
    request,
    tokenB,
    'Isolation Firm B',
    undefined,
    '198.51.100.42'
  );
  const firmB = await request.get('/api/v1/bootstrap', {
    headers: {
      authorization: `Bearer ${tokenB}`,
      'x-forwarded-for': '198.51.100.42'
    }
  });
  expect(firmB.ok()).toBe(true);
  expect(JSON.stringify((await firmB.json()).workspace)).not.toContain(
    'private-firm-a-job'
  );
});

test('@claim:two-device-sync A saved workspace appears on a second signed-in device', async ({
  browser,
  request
}, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'Claim evidence runs once.');
  const token = testToken(`two-device-${Date.now()}-${Math.random()}`);
  await apiOnboard(
    request,
    token,
    'Two Device Firm',
    undefined,
    '198.51.100.51'
  );
  await setTestBilling(request, token, 'active', '198.51.100.51');
  const firstContext = await browser.newContext();
  const secondContext = await browser.newContext();
  const first = await firstContext.newPage();
  const second = await secondContext.newPage();
  await Promise.all([first.goto('/'), second.goto('/')]);
  const workspace = {
    schemaVersion: 1,
    jobs: [{ id: 'shared-device-job' }],
    requirements: [],
    sources: [],
    allocations: []
  };
  const pushed = await first.evaluate(
    async ({ token, workspace }) => {
      const response = await fetch('/api/v1/sync', {
        method: 'POST',
        headers: {
          authorization: `Bearer ${token}`,
          'content-type': 'application/json',
          'x-forwarded-for': '198.51.100.52'
        },
        body: JSON.stringify({
          idempotency_key: crypto.randomUUID(),
          expected_version: 0,
          workspace
        })
      });
      return { status: response.status, body: await response.json() };
    },
    { token, workspace }
  );
  expect(pushed.status).toBe(200);
  const pulled = await second.evaluate(async (token) => {
    const response = await fetch('/api/v1/bootstrap', {
      headers: {
        authorization: `Bearer ${token}`,
        'x-forwarded-for': '198.51.100.53'
      }
    });
    return response.json();
  }, token);
  expect(JSON.stringify(pulled.workspace)).toContain('shared-device-job');
  await firstContext.close();
  await secondContext.close();
});

test('@claim:idempotent-sync Retrying one sync operation applies it once', async ({
  request
}, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'Claim evidence runs once.');
  const token = testToken(`idempotent-${Date.now()}-${Math.random()}`);
  await apiOnboard(
    request,
    token,
    'Idempotent Firm',
    undefined,
    '198.51.100.61'
  );
  await setTestBilling(request, token, 'active', '198.51.100.61');
  const operation = {
    idempotency_key: crypto.randomUUID(),
    expected_version: 0,
    workspace: {
      schemaVersion: 1,
      jobs: [{ id: 'apply-once' }],
      requirements: [],
      sources: [],
      allocations: []
    }
  };
  const headers = {
    authorization: `Bearer ${token}`,
    'x-forwarded-for': '198.51.100.62'
  };
  const first = await request.post('/api/v1/sync', {
    headers,
    data: operation
  });
  const replay = await request.post('/api/v1/sync', {
    headers,
    data: operation
  });
  expect(first.ok()).toBe(true);
  expect((await first.json()).version).toBe(1);
  expect(replay.ok()).toBe(true);
  expect(await replay.json()).toMatchObject({ version: 1, replayed: true });
});

test('@claim:offline-signed-in-sync A signed-in offline edit survives reload and syncs on reconnect', async ({
  browser,
  request
}, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'Claim evidence runs once.');
  const token = testToken(`offline-sync-${Date.now()}-${Math.random()}`);
  await apiOnboard(
    request,
    token,
    'Offline Sync Firm',
    undefined,
    '198.51.100.111'
  );
  await setTestBilling(request, token, 'active', '198.51.100.112');
  const context = await browser.newContext();
  await context.addInitScript((value) => {
    sessionStorage.setItem('parts-promise-e2e-token', value);
  }, token);
  const page = await context.newPage();
  await page.goto('/jobs');
  await expect(page.getByText('Shared firm jobs')).toBeVisible();
  await page.evaluate(() => navigator.serviceWorker.ready);
  await context.setOffline(true);
  await page.getByRole('button', { name: 'Add a job' }).click();
  await page.getByLabel('Job number').fill('OFFLINE-1');
  await page.getByLabel('Site or customer name').fill('Offline Plant');
  await page.getByLabel('Visit date').fill('2026-10-01');
  await page
    .getByRole('textbox', { name: 'Required part', exact: true })
    .fill('Isolator');
  await page
    .getByRole('spinbutton', { name: 'Quantity', exact: true })
    .fill('1');
  await page.getByRole('button', { name: 'Save job and part' }).click();
  await expect(page.locator('h1')).toHaveText('Offline Plant parts');
  expect(
    await page.evaluate(async () => {
      const request = indexedDB.open('parts-promise-cloud-v1', 1);
      const database = await new Promise<IDBDatabase>((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      const operation = await new Promise<unknown>((resolve, reject) => {
        const transaction = database.transaction('outbox', 'readonly');
        const read = transaction.objectStore('outbox').getAll();
        read.onsuccess = () => resolve(read.result);
        read.onerror = () => reject(read.error);
      });
      database.close();
      return (operation as unknown[]).length;
    })
  ).toBe(1);
  await page.reload();
  await expect(page.locator('h1')).toHaveText('Offline Plant parts');
  await expect(
    page.getByText(/1 change is queued for reconnect/)
  ).toBeVisible();
  await context.setOffline(false);
  await expect(page.getByText('Shared workspace up to date.')).toBeVisible({
    timeout: 15_000
  });
  let transientFailures = 0;
  await page.route('**/api/v1/sync', async (route) => {
    if (transientFailures++ === 0) {
      await route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 'storage_unavailable',
          message: 'The shared workspace is temporarily unavailable.',
          action: 'Try again shortly.'
        })
      });
    } else await route.continue();
  });
  await page.getByRole('link', { name: 'Jobs' }).click();
  await page.getByRole('button', { name: 'Add a job' }).click();
  await page.getByLabel('Job number').fill('RETRY-1');
  await page.getByLabel('Site or customer name').fill('Retry Plant');
  await page.getByLabel('Visit date').fill('2026-10-04');
  await page
    .getByRole('textbox', { name: 'Required part', exact: true })
    .fill('Relay');
  await page
    .getByRole('spinbutton', { name: 'Quantity', exact: true })
    .fill('1');
  await page.getByRole('button', { name: 'Save job and part' }).click();
  await expect(page.getByText(/1 change stays queued/)).toBeVisible();
  await expect(page.getByText('Shared workspace up to date.')).toBeVisible({
    timeout: 10_000
  });
  expect(transientFailures).toBeGreaterThanOrEqual(2);
  const shared = await request.get('/api/v1/bootstrap', {
    headers: {
      authorization: `Bearer ${token}`,
      'x-forwarded-for': '198.51.100.113'
    }
  });
  const sharedWorkspace = JSON.stringify((await shared.json()).workspace);
  expect(sharedWorkspace).toContain('OFFLINE-1');
  expect(sharedWorkspace).toContain('RETRY-1');
  await context.close();
});

test('@claim:sync-conflict-resolution Quantity conflicts cannot overwrite the shared revision', async ({
  browser,
  request
}, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'Claim evidence runs once.');
  const token = testToken(`conflict-${Date.now()}-${Math.random()}`);
  await apiOnboard(
    request,
    token,
    'Conflict Firm',
    undefined,
    '198.51.100.121'
  );
  await setTestBilling(request, token, 'active', '198.51.100.122');
  const context = await browser.newContext();
  await context.addInitScript((value) => {
    sessionStorage.setItem('parts-promise-e2e-token', value);
  }, token);
  const page = await context.newPage();
  await page.goto('/jobs');
  await expect(page.getByText('Shared firm jobs')).toBeVisible();
  await context.setOffline(true);
  await page.getByRole('button', { name: 'Add a job' }).click();
  await page.getByLabel('Job number').fill('DEVICE-1');
  await page.getByLabel('Site or customer name').fill('Device Revision');
  await page.getByLabel('Visit date').fill('2026-10-02');
  await page
    .getByRole('textbox', { name: 'Required part', exact: true })
    .fill('Pump');
  await page
    .getByRole('spinbutton', { name: 'Quantity', exact: true })
    .fill('1');
  await page.getByRole('button', { name: 'Save job and part' }).click();

  const sharedWorkspace = {
    schemaVersion: 1,
    jobs: [
      {
        id: 'shared-job',
        number: 'SHARED-1',
        site: 'Shared Revision',
        visitDate: '2026-10-03',
        notes: '',
        createdAt: '2026-08-29T00:00:00Z',
        updatedAt: '2026-08-29T00:00:00Z'
      }
    ],
    requirements: [],
    sources: [],
    allocations: []
  };
  const sharedWrite = await request.post('/api/v1/sync', {
    headers: {
      authorization: `Bearer ${token}`,
      'x-forwarded-for': '198.51.100.123'
    },
    data: {
      idempotency_key: crypto.randomUUID(),
      expected_version: 0,
      workspace: sharedWorkspace
    }
  });
  expect(sharedWrite.ok(), await sharedWrite.text()).toBe(true);
  await context.setOffline(false);
  await expect(
    page.getByRole('heading', { name: 'Resolve the shared workspace conflict' })
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Send device revision' })
  ).toHaveCount(0);
  await expect(page.getByText(/will not overwrite/)).toBeVisible();
  const conflictAccessibility = await new AxeBuilder({ page }).analyze();
  expect(
    conflictAccessibility.violations.filter((violation) =>
      ['serious', 'critical'].includes(violation.impact ?? '')
    )
  ).toEqual([]);
  await page.getByRole('button', { name: 'Use shared revision' }).click();
  await expect(
    page.getByText('The shared revision is now on this device.')
  ).toBeVisible();
  const shared = await request.get('/api/v1/bootstrap', {
    headers: {
      authorization: `Bearer ${token}`,
      'x-forwarded-for': '198.51.100.124'
    }
  });
  const body = await shared.json();
  expect(JSON.stringify(body.workspace)).toContain('shared-job');
  expect(JSON.stringify(body.workspace)).not.toContain('DEVICE-1');
  await context.close();
});

test('@claim:invitation-email-activation An invitation activates only for its matching verified email', async ({
  request
}, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'Claim evidence runs once.');
  const owner = testToken(`invite-claim-owner-${Date.now()}`);
  const invitedOid = `invite-claim-tech-${Date.now()}`;
  await apiOnboard(
    request,
    owner,
    'Invitation Claim Firm',
    undefined,
    '198.51.100.131'
  );
  const invite = await request.post('/api/v1/members', {
    headers: {
      authorization: `Bearer ${owner}`,
      'x-forwarded-for': '198.51.100.132'
    },
    data: { email: `${invitedOid}@example.test`, role: 'technician' }
  });
  expect(invite.ok(), await invite.text()).toBe(true);
  const unrelated = await request.get('/api/v1/bootstrap', {
    headers: {
      authorization: `Bearer ${testToken(`not-${invitedOid}`)}`,
      'x-forwarded-for': '198.51.100.133'
    }
  });
  expect((await unrelated.json()).onboarding_required).toBe(true);
  const accepted = await request.get('/api/v1/bootstrap', {
    headers: {
      authorization: `Bearer ${testToken(invitedOid)}`,
      'x-forwarded-for': '198.51.100.134'
    }
  });
  expect(await accepted.json()).toMatchObject({
    onboarding_required: false,
    role: 'technician'
  });
});

test('@claim:account-service-boundaries Signed-in data uses this API and sign-in redirects to Microsoft Entra', async ({
  browser,
  request
}, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'Claim evidence runs once.');
  const token = testToken(`network-boundary-${Date.now()}-${Math.random()}`);
  await apiOnboard(
    request,
    token,
    'Network Boundary Firm',
    undefined,
    '198.51.100.136'
  );
  const signedIn = await browser.newContext();
  await signedIn.addInitScript((value) => {
    sessionStorage.setItem('parts-promise-e2e-token', value);
  }, token);
  const accountPage = await signedIn.newPage();
  const accountRequests: string[] = [];
  accountPage.on('request', (candidate) =>
    accountRequests.push(candidate.url())
  );
  await accountPage.goto('/settings/data');
  await expect(
    accountPage.getByRole('heading', { name: 'Export or delete firm data' })
  ).toBeVisible();
  const origin = new URL(accountPage.url()).origin;
  expect(accountRequests.every((url) => new URL(url).origin === origin)).toBe(
    true
  );
  await signedIn.close();

  const signedOut = await browser.newContext();
  const signInPage = await signedOut.newPage();
  await signInPage.goto('/onboarding');
  const authorization = signInPage.waitForRequest((candidate) =>
    candidate.url().startsWith('https://sociobotcustomers.ciamlogin.com/')
  );
  await signInPage
    .getByRole('button', { name: 'Sign in with Sociobot' })
    .click();
  expect(new URL((await authorization).url()).hostname).toBe(
    'sociobotcustomers.ciamlogin.com'
  );
  await signedOut.close();
});

test('@claim:sensitive-input-boundary Parts Promise never asks for a password or card number', async ({
  browser,
  request
}, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'Claim evidence runs once.');
  const token = testToken(`sensitive-input-${Date.now()}-${Math.random()}`);
  await apiOnboard(
    request,
    token,
    'Sensitive Input Firm',
    undefined,
    '198.51.100.137'
  );
  const context = await browser.newContext();
  await context.addInitScript((value) => {
    sessionStorage.setItem('parts-promise-e2e-token', value);
  }, token);
  const page = await context.newPage();
  const requestBodies: string[] = [];
  page.on('request', (candidate) => {
    const body = candidate.postData();
    if (body) requestBodies.push(body);
  });
  for (const route of [
    '/',
    '/jobs',
    '/onboarding',
    '/settings/team',
    '/settings/billing',
    '/settings/data',
    '/privacy',
    '/terms',
    '/not-on-this-drawing'
  ]) {
    await page.goto(route);
    await expect(page.locator('main')).toBeVisible();
    await expect(
      page.locator(
        'input[type="password"], input[autocomplete^="cc-"], input[name*="card"]'
      )
    ).toHaveCount(0);
  }
  await expect(page.locator('body')).not.toContainText(
    /enter (?:your )?(?:password|card number)/i
  );
  expect(requestBodies.join('\n')).not.toMatch(
    /password|card_number|card-number|cvv|cvc/i
  );
  await page.goto('/privacy');
  await expect(page.locator('.legal-copy')).toContainText(
    'You do not enter a password or card number in Parts Promise.'
  );
  await context.close();
});

test('@claim:audit-log-recording Firm export includes auditable onboarding, invitation, and sync events', async ({
  request
}, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'Claim evidence runs once.');
  const token = testToken(`audit-${Date.now()}-${Math.random()}`);
  await apiOnboard(request, token, 'Audit Firm', undefined, '198.51.100.141');
  await setTestBilling(request, token, 'active', '198.51.100.142');
  await request.post('/api/v1/members', {
    headers: {
      authorization: `Bearer ${token}`,
      'x-forwarded-for': '198.51.100.143'
    },
    data: { email: 'audit-tech@example.test', role: 'viewer' }
  });
  const sync = await request.post('/api/v1/sync', {
    headers: {
      authorization: `Bearer ${token}`,
      'x-forwarded-for': '198.51.100.144'
    },
    data: {
      idempotency_key: crypto.randomUUID(),
      expected_version: 0,
      workspace: {
        schemaVersion: 1,
        jobs: [{ id: 'audit-job' }],
        requirements: [],
        sources: [],
        allocations: []
      }
    }
  });
  expect(sync.ok(), await sync.text()).toBe(true);
  const exported = await request.get('/api/v1/export', {
    headers: {
      authorization: `Bearer ${token}`,
      'x-forwarded-for': '198.51.100.145'
    }
  });
  const actions = (await exported.json()).audit_events.map(
    (event: { action: string }) => event.action
  );
  expect(actions).toEqual(
    expect.arrayContaining([
      'organization.created',
      'membership.invited',
      'workspace.synced'
    ])
  );
});

test('@claim:firm-deletion-hold Owners can schedule and cancel a 14-day firm deletion hold', async ({
  browser,
  request
}, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'Claim evidence runs once.');
  const token = testToken(`deletion-${Date.now()}-${Math.random()}`);
  await apiOnboard(
    request,
    token,
    'Delete Claim Firm',
    undefined,
    '198.51.100.151'
  );
  const context = await browser.newContext();
  await context.addInitScript((value) => {
    sessionStorage.setItem('parts-promise-e2e-token', value);
  }, token);
  const page = await context.newPage();
  await page.goto('/settings/data');
  await expect(
    page.getByRole('heading', { name: 'Export or delete firm data' })
  ).toBeVisible();
  const dataControlsAccessibility = await new AxeBuilder({ page }).analyze();
  expect(
    dataControlsAccessibility.violations.filter((violation) =>
      ['serious', 'critical'].includes(violation.impact ?? '')
    )
  ).toEqual([]);
  await page.getByLabel('Firm name').fill('Delete Claim Firm');
  await page.getByRole('button', { name: 'Schedule firm deletion' }).click();
  await expect(page.getByText(/Deletion is scheduled for/)).toBeVisible();
  const scheduled = await request.get('/api/v1/bootstrap', {
    headers: {
      authorization: `Bearer ${token}`,
      'x-forwarded-for': '198.51.100.152'
    }
  });
  const status = (await scheduled.json()).deletion;
  const hold =
    new Date(status.delete_after).getTime() -
    new Date(status.requested_at).getTime();
  expect(hold).toBe(14 * 24 * 60 * 60 * 1000);
  await page.getByRole('button', { name: 'Cancel firm deletion' }).click();
  await expect(page.getByText('Firm deletion was cancelled.')).toBeVisible();
  const bootstrap = await request.get('/api/v1/bootstrap', {
    headers: {
      authorization: `Bearer ${token}`,
      'x-forwarded-for': '198.51.100.154'
    }
  });
  expect((await bootstrap.json()).deletion.scheduled).toBe(false);
  await context.close();
});

test('@claim:response-policy Export allows five requests per minute and metrics expose operations signals', async ({
  request
}, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'Claim evidence runs once.');
  const token = testToken(`response-policy-${Date.now()}-${Math.random()}`);
  await apiOnboard(
    request,
    token,
    'Response Policy Firm',
    undefined,
    '198.51.100.161'
  );
  const responses: import('@playwright/test').APIResponse[] = [];
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const response = await request.get('/api/v1/export', {
      headers: {
        authorization: `Bearer ${token}`,
        'x-forwarded-for': '198.51.100.162'
      }
    });
    responses.push(response);
  }
  expect(responses.slice(0, 5).map((response) => response.status())).toEqual([
    200, 200, 200, 200, 200
  ]);
  expect(responses[5].status()).toBe(429);
  const retryAfter = Number(responses[5].headers()['retry-after']);
  expect(retryAfter).toBeGreaterThanOrEqual(1);
  expect(retryAfter).toBeLessThanOrEqual(60);
  const metrics = await request.get('/metrics', {
    headers: {
      authorization: 'Bearer playwright-metrics-secret',
      'x-forwarded-for': '198.51.100.163'
    }
  });
  expect(metrics.ok(), await metrics.text()).toBe(true);
  const body = await metrics.text();
  for (const metric of [
    'parts_promise_request_latency_ms_total',
    'parts_promise_responses_total{class="4xx"}',
    'parts_promise_sync_conflicts_total',
    'parts_promise_queue_oldest_age_seconds',
    'parts_promise_notification_failures_total'
  ])
    expect(body).toContain(metric);
});

test('@claim:subscription-checkout Checkout is explicit and stops before a charge', async ({
  browser,
  request
}, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'Claim evidence runs once.');
  const token = testToken(`billing-contract-${Date.now()}-${Math.random()}`);
  await apiOnboard(
    request,
    token,
    'Billing Contract Firm',
    undefined,
    '198.51.100.71'
  );
  const context = await browser.newContext();
  await context.addInitScript((value) => {
    sessionStorage.setItem('parts-promise-e2e-token', value);
  }, token);
  const page = await context.newPage();
  const checkoutRequests: import('@playwright/test').Request[] = [];
  page.on('request', (candidate) => {
    if (new URL(candidate.url()).pathname === '/api/v1/billing/checkout')
      checkoutRequests.push(candidate);
  });
  await page.goto('/settings/billing');
  await expect(
    page.getByRole('heading', { name: 'Plan and technician seats' })
  ).toBeVisible();
  expect(checkoutRequests).toHaveLength(0);
  const responsePromise = page.waitForResponse(
    (candidate) =>
      new URL(candidate.url()).pathname === '/api/v1/billing/checkout'
  );
  await page
    .getByRole('button', { name: 'Check checkout availability' })
    .click();
  const response = await responsePromise;
  expect(checkoutRequests).toHaveLength(1);
  expect(checkoutRequests[0].method()).toBe('POST');
  expect(response.status()).toBe(424);
  expect(await response.json()).toMatchObject({
    code: 'billing_acceptance_operator_gated',
    message: 'Checkout is not available yet.',
    action:
      'No charge was made. Try again after Parts Promise announces checkout.',
    checkout_url:
      'https://pilot-api.sociobot.in/api/v1/products/field-parts-promise/checkout'
  });
  await expect(page.getByRole('alert')).toContainText(
    'Checkout is not available yet.'
  );
  await context.close();
});

test('@claim:technician-seat-charge Pricing and the seat total count technicians but exclude the owner', async ({
  page,
  request
}, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'Claim evidence runs once.');
  await page.goto('/');
  await expect(
    page.getByText('The firm plan is $39/month plus $8 per active technician.')
  ).toBeVisible();
  const token = testToken(`seat-count-${Date.now()}-${Math.random()}`);
  const technicianOid = `field-tech-${Date.now()}-${Math.random()}`;
  const technicianToken = testToken(technicianOid);
  await apiOnboard(
    request,
    token,
    'Seat Count Firm',
    undefined,
    '198.51.100.81'
  );
  const invite = await request.post('/api/v1/members', {
    headers: {
      authorization: `Bearer ${token}`,
      'x-forwarded-for': '198.51.100.82'
    },
    data: { email: `${technicianOid}@example.test`, role: 'technician' }
  });
  expect(invite.ok(), await invite.text()).toBe(true);
  const accepted = await request.get('/api/v1/bootstrap', {
    headers: {
      authorization: `Bearer ${technicianToken}`,
      'x-forwarded-for': '198.51.100.85'
    }
  });
  expect(accepted.ok(), await accepted.text()).toBe(true);
  expect((await accepted.json()).role).toBe('technician');
  await setTestBilling(request, token, 'active', '198.51.100.83');
  const billing = await request.get('/api/v1/billing', {
    headers: {
      authorization: `Bearer ${token}`,
      'x-forwarded-for': '198.51.100.84'
    }
  });
  expect(await billing.json()).toMatchObject({
    seat_quantity: 1,
    state: 'active'
  });
});

test('@claim:expired-plan-keeps-export An unpaid firm can export while cloud writes are blocked', async ({
  request
}, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'Claim evidence runs once.');
  const token = testToken(`expired-export-${Date.now()}-${Math.random()}`);
  const workspace = {
    schemaVersion: 1,
    jobs: [{ id: 'export-after-payment' }],
    requirements: [],
    sources: [],
    allocations: []
  };
  await apiOnboard(request, token, 'Export Firm', workspace, '198.51.100.91');
  await setTestBilling(request, token, 'unpaid', '198.51.100.92');
  const write = await request.post('/api/v1/sync', {
    headers: {
      authorization: `Bearer ${token}`,
      'x-forwarded-for': '198.51.100.93'
    },
    data: {
      idempotency_key: crypto.randomUUID(),
      expected_version: 0,
      workspace
    }
  });
  expect(write.status()).toBe(402);
  const exported = await request.get('/api/v1/export', {
    headers: {
      authorization: `Bearer ${token}`,
      'x-forwarded-for': '198.51.100.94'
    }
  });
  expect(exported.ok()).toBe(true);
  expect(JSON.stringify(await exported.json())).toContain(
    'export-after-payment'
  );
});

test('@claim:durable-runtime-storage Runtime files and firm state survive a server restart', async ({}, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'Claim evidence runs once.');
  test.setTimeout(20_000);
  const binary = resolve(
    process.cwd(),
    'server/target/debug/parts-promise-api'
  );
  expect(existsSync(binary)).toBe(true);
  const dataDirectory = mkdtempSync(
    join(tmpdir(), 'parts-promise-runtime-claim-')
  );
  const deploy = JSON.parse(readFileSync('deploy.json', 'utf8'));
  expect(deploy.deploy).toEqual({ data_dir: '/data', replicas: 1 });
  const token = testToken(`restart-${Date.now()}-${Math.random()}`);
  let server: ReturnType<typeof spawn> | undefined;
  const start = async () => {
    const port = await reservePort();
    server = spawn(binary, [], {
      cwd: process.cwd(),
      env: {
        PORT: String(port),
        STATIC_DIR: 'dist',
        DATA_DIR: dataDirectory,
        AUTH_TEST_SECRET: TEST_AUTH_SECRET,
        SOCIOBOT_BILLING_BASE_URL: 'https://pilot-api.sociobot.in'
      },
      stdio: 'pipe'
    });
    const base = `http://127.0.0.1:${port}`;
    await waitForHealth(base);
    return base;
  };
  try {
    const firstBase = await start();
    const created = await fetch(`${firstBase}/api/v1/onboarding`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
        'x-forwarded-for': '198.51.100.201'
      },
      body: JSON.stringify({
        organization_name: 'Restart Evidence Firm',
        locale: 'en-US',
        time_zone: 'UTC',
        migrate_local_workspace: false,
        local_item_count: 0,
        workspace: null
      })
    });
    expect(created.status, await created.text()).toBe(200);
    await stopProcess(server!);
    server = undefined;
    expect(existsSync(join(dataDirectory, 'parts-promise.sqlite3'))).toBe(true);
    expect(existsSync(join(dataDirectory, 'metrics.token'))).toBe(true);

    const secondBase = await start();
    const restored = await fetch(`${secondBase}/api/v1/bootstrap`, {
      headers: {
        authorization: `Bearer ${token}`,
        'x-forwarded-for': '198.51.100.202'
      }
    });
    const restoredBody = await restored.json();
    expect(restored.status, JSON.stringify(restoredBody)).toBe(200);
    expect(restoredBody).toMatchObject({
      onboarding_required: false,
      organization_name: 'Restart Evidence Firm'
    });
  } finally {
    if (server) await stopProcess(server);
    rmSync(dataDirectory, { recursive: true, force: true });
  }
});

test('@claim:visible-build-identity Every app route shows the server build identity', async ({
  page,
  request
}, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'Claim evidence runs once.');
  const health = await request.get('/health');
  expect(health.ok(), await health.text()).toBe(true);
  const buildSha = (await health.json()).build_sha as string;
  for (const route of [
    '/',
    '/demo',
    '/jobs',
    '/auth/callback',
    '/onboarding',
    '/settings/team',
    '/settings/billing',
    '/settings/data',
    '/privacy',
    '/terms',
    '/not-on-this-drawing'
  ]) {
    await page.goto(route);
    const build = page.locator('.site-footer small');
    await expect(build).toHaveText(`Build ${buildSha.slice(0, 8)}`);
    await expect(build).toHaveAttribute('title', buildSha);
  }
});

test('@claim:container-runtime The production server starts with only PORT and serves its identity and app', async ({}, testInfo) => {
  test.skip(
    testInfo.project.name !== 'chromium',
    'Claim evidence runs once on desktop Chromium.'
  );
  // This deliberately stays below Playwright's default 30-second timeout.
  // Compilation belongs in global setup; this claim covers only the built
  // server's startup and HTTP contract.
  test.setTimeout(15_000);
  const port = await new Promise<number>((resolvePort, reject) => {
    const probe = createServer();
    probe.once('error', reject);
    probe.listen(0, '127.0.0.1', () => {
      const address = probe.address();
      if (!address || typeof address === 'string') {
        probe.close();
        reject(new Error('Could not reserve a local test port.'));
        return;
      }
      const selected = address.port;
      probe.close((error) => (error ? reject(error) : resolvePort(selected)));
    });
  });
  const binary = resolve(
    process.cwd(),
    'server/target/debug/parts-promise-api'
  );
  expect(existsSync(binary)).toBe(true);
  const server = spawn(binary, [], {
    cwd: process.cwd(),
    env: { PORT: String(port) },
    stdio: 'pipe'
  });
  try {
    const base = `http://127.0.0.1:${port}`;
    let health: Response | undefined;
    for (let attempt = 0; attempt < 50; attempt += 1) {
      try {
        health = await fetch(`${base}/health`);
        break;
      } catch {
        await new Promise((resolveWait) => setTimeout(resolveWait, 50));
      }
    }
    expect(health?.status).toBe(200);
    expect(await health?.json()).toMatchObject({
      status: 'ok',
      build_sha: process.env.BUILD_SHA ?? 'dev',
      database: 'sqlite'
    });
    expect((await fetch(base)).status).toBe(200);
    expect(
      (
        await fetch(`${base}/api/v1/jobs`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: '{}'
        })
      ).ok
    ).toBe(false);
    expect((await fetch(`${base}/not-on-this-drawing`)).status).toBe(404);

    let limited: Response | undefined;
    for (let attempt = 0; attempt < 45; attempt += 1) {
      const response = await fetch(`${base}/api/v1/bootstrap`, {
        headers: { 'x-forwarded-for': '203.0.113.200' }
      });
      if (response.status === 429) {
        limited = response;
        break;
      }
    }
    expect(limited?.headers.get('retry-after')).toBeTruthy();

    const dockerfile = readFileSync('Dockerfile', 'utf8');
    expect(dockerfile).toContain('FROM rust:1-slim AS api-builder');
    expect(dockerfile).toContain('USER nonroot:nonroot');
    expect(dockerfile).toContain('ENV PORT=8080');
  } finally {
    server.kill('SIGTERM');
  }
});
