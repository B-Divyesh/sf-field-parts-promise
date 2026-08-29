import { spawn } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { createServer } from 'node:net';
import { resolve } from 'node:path';

import { chromium, expect, test } from '@playwright/test';

async function openPumpAllocation(page: import('@playwright/test').Page) {
  await page.goto('/?demo=1');
  await expect(page.locator('.status-plate').first()).toContainText(
    'Date at risk'
  );
  await page.getByTestId('allocate-pump').click();
  await page.getByLabel(/Van 2/).check();
  await page.getByLabel('Quantity held').fill('1');
  await page.getByRole('button', { name: 'Hold this quantity' }).click();
}

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
  await page.getByLabel('Job number').fill('LIVE-1');
  await page.getByLabel('Site or customer name').fill('Existing Live Customer');
  await page.getByLabel('Visit date').fill('2026-09-20');
  await page.getByLabel('Required part', { exact: true }).fill('Fuse');
  await page.getByLabel('Quantity', { exact: true }).fill('1');
  await page.getByRole('button', { name: 'Save job and part' }).click();
  await expect(page.locator('h1')).toHaveText('Existing Live Customer parts');
  await openPumpAllocation(page);
  await page.getByRole('link', { name: 'Parts Promise' }).click();
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
  await page
    .getByLabel('Main navigation')
    .getByRole('link', { name: 'Demo' })
    .click();
  await expect(page.locator('.status-plate').first()).toContainText(
    'Date at risk'
  );
  await page.getByTestId('allocate-pump').click();
  await page.getByLabel(/Van 2/).check();
  await page.getByRole('button', { name: 'Hold this quantity' }).click();
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
    page.getByRole('heading', { name: 'Existing Live Customer' })
  ).toBeVisible();
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
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export workspace' }).click();
  const download = await downloadPromise;
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(Buffer.from(chunk));
  const backupText = Buffer.concat(chunks).toString('utf8');
  const backup = JSON.parse(backupText);
  expect(backup).toMatchObject({
    format: 'parts-promise-workspace',
    version: 1,
    workspace: {
      schemaVersion: 1,
      jobs: expect.any(Array),
      requirements: expect.any(Array),
      sources: expect.any(Array),
      allocations: expect.any(Array)
    }
  });
  expect(backup.workspace.allocations.length).toBeGreaterThan(0);

  await page.getByRole('link', { name: 'Review parts' }).click();
  await page.getByTestId('allocate-pump').click();
  await page.getByLabel(/Van 2/).check();
  await page.getByRole('button', { name: 'Hold this quantity' }).click();
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

test('@claim:demo-transfer-isolated Importing sample data never changes the live workspace', async ({
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
  await page.goto('/jobs?demo=1');
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
      const cache = await caches.open('parts-promise-shell-v3');
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
      const cache = await caches.open('parts-promise-shell-v3');
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
    await page.getByRole('button', { name: 'Hold this quantity' }).click();
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
  await page.getByRole('button', { name: 'Hold this quantity' }).click();
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

test('@claim:m1-feature-boundaries This browser-only release has no account, sync, scan, ordering, or checkout action', async ({
  page
}, testInfo) => {
  test.skip(
    testInfo.project.name !== 'chromium',
    'Claim evidence runs once on desktop Chromium.'
  );
  await page.goto('/');
  await expect(page.locator('.plain-language-section')).toContainText(
    'does not sync between people, scan barcodes, place supplier orders, or take payment'
  );
  await page.goto('/?demo=1');
  for (const unavailableAction of [
    /sign in/i,
    /invite (?:a )?technician/i,
    /scan (?:a )?barcode/i,
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

test('@claim:free-browser-release The browser-only release is visibly free and has no payment action', async ({
  page
}, testInfo) => {
  test.skip(
    testInfo.project.name !== 'chromium',
    'Claim evidence runs once on desktop Chromium.'
  );
  await page.goto('/');
  await expect(
    page.getByText('Free for one browser in this release.')
  ).toBeVisible();
  await expect(page.getByRole('button', { name: /checkout|buy/i })).toHaveCount(
    0
  );
  await expect(page.getByRole('link', { name: /checkout|buy/i })).toHaveCount(
    0
  );
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

test('@claim:demo-network-privacy The demo uses same-origin GET requests and never asks for camera access', async ({
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
    expect(await health?.json()).toEqual({ status: 'ok', build_sha: 'dev' });
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

    const dockerfile = readFileSync('Dockerfile', 'utf8');
    expect(dockerfile).toContain('FROM rust:1-slim AS api-builder');
    expect(dockerfile).toContain('USER nonroot:nonroot');
    expect(dockerfile).toContain('ENV PORT=8080');
  } finally {
    server.kill('SIGTERM');
  }
});
