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

test('@claim:demo-reset-isolated Demo reset restores the fixture and leaving starts empty', async ({
  browser
}, testInfo) => {
  test.skip(
    testInfo.project.name !== 'chromium',
    'Claim evidence runs once on desktop Chromium.'
  );
  const context = await browser.newContext();
  const page = await context.newPage();
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  await openPumpAllocation(page);
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
      name: 'Jobs with required parts will appear here'
    })
  ).toBeVisible();
  expect(
    requests.every((url) => new URL(url).origin === new URL(page.url()).origin)
  ).toBe(true);
  await context.close();
});

test('@claim:offline-reload The sample allocation works after an offline reload', async ({}, testInfo) => {
  test.skip(
    testInfo.project.name !== 'chromium',
    'Claim evidence runs once on desktop Chromium.'
  );
  const isolatedBrowser = await chromium.launch();
  const context = await isolatedBrowser.newContext();
  const page = await context.newPage();
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
      const cache = await caches.open('parts-promise-shell-v2');
      return (await cache.keys()).some((request) =>
        /\/assets\/index-.*\.js$/.test(new URL(request.url).pathname)
      );
    });
    await context.setOffline(true);
    await page.reload();
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
  } finally {
    await isolatedBrowser.close();
  }
});
