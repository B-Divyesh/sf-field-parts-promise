import { writeFileSync } from 'node:fs';

import AxeBuilder from '@axe-core/playwright';
import { chromium } from '@playwright/test';

const base = 'https://field-parts-promise.sociobot.in';
const output = '.factory/repair-4-artifacts/live-qa.json';
const browser = await chromium.launch();
const report = { base, generatedAt: new Date().toISOString() };

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

try {
  const context = await browser.newContext();
  const page = await context.newPage();
  const requests = [];
  const consoleErrors = [];
  const pageErrors = [];
  page.on('request', (request) =>
    requests.push({ method: request.method(), url: request.url() })
  );
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => pageErrors.push(error.message));

  await page.goto(`${base}/?demo=1`, { waitUntil: 'networkidle' });
  await page
    .getByTestId('part-req-pump')
    .getByRole('button', { name: 'Check supplier date' })
    .click();
  await page.getByLabel('Supplier order reference').fill('PO-LIVE-REPAIR');
  await page.getByLabel('Expected date').fill('2026-09-01');
  await page.getByLabel('Confidence').selectOption('Confirmed by supplier');
  await page.getByLabel('Quantity held').fill('1');
  await page.getByRole('button', { name: 'Attach supplier evidence' }).click();
  assert(
    (await page.locator('.status-plate').first().innerText()).includes(
      'Expected before visit'
    ),
    'The first supplier-backed job did not become expected.'
  );

  await page.goto(`${base}/jobs?demo=1`);
  await page.getByRole('button', { name: 'Add a job' }).click();
  await page.getByLabel('Job number').fill('LIVE-SECOND');
  await page.getByLabel('Site or customer name').fill('Second Live Customer');
  await page.getByLabel('Visit date').fill('2026-09-02');
  await page
    .getByRole('textbox', { name: 'Required part', exact: true })
    .fill('Condensate pump');
  await page
    .getByRole('spinbutton', { name: 'Quantity', exact: true })
    .fill('1');
  await page.getByRole('button', { name: 'Save job and part' }).click();
  await page.getByRole('button', { name: 'Allocate part' }).click();
  const consumedOrder = page.getByLabel(/Supplier order PO-LIVE-REPAIR/);
  assert(await consumedOrder.isDisabled(), 'Consumed supplier order is enabled.');
  assert(
    (await consumedOrder.locator('..').innerText()).includes('0 each available'),
    'Consumed supplier order does not show zero remaining.'
  );
  const secondStatus = await page.locator('.status-plate').first().innerText();
  assert(secondStatus.includes('Date at risk'), 'Second job is falsely covered.');
  const supplierState = await page.evaluate(async () => {
    const request = indexedDB.open('parts-promise-demo-v1', 1);
    const database = await new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const workspace = await new Promise((resolve, reject) => {
      const transaction = database.transaction('workspace', 'readonly');
      const read = transaction.objectStore('workspace').get('current');
      read.onsuccess = () => resolve(read.result);
      read.onerror = () => reject(read.error);
    });
    database.close();
    const source = workspace.sources.find(
      (item) => item.supplierOrder?.reference === 'PO-LIVE-REPAIR'
    );
    return {
      onHand: source?.onHand,
      allocated: workspace.allocations
        .filter((item) => item.sourceId === source?.id)
        .reduce((total, item) => total + item.quantity, 0)
    };
  });
  assert(
    supplierState.onHand === 1 && supplierState.allocated === 1,
    'Stored supplier allocation exceeds the source quantity.'
  );
  report.supplierConservation = { secondStatus, supplierState };

  await page.goto(`${base}/?demo=1`);
  const dialogStates = [];
  for (const item of [
    ['Reset demo', 'Reset the sample job?', 'Keep changes'],
    ['Start for real', 'Leave the sample workspace?', 'Stay in demo']
  ]) {
    const trigger = page.getByRole('button', { name: item[0] }).first();
    await trigger.focus();
    await trigger.press('Enter');
    const dialog = page.getByRole('dialog', { name: item[1] });
    await dialog.waitFor();
    const focusStayedInside = [];
    for (let step = 0; step < 5; step += 1) {
      focusStayedInside.push(
        await page.evaluate(() =>
          Boolean(document.activeElement?.closest('dialog'))
        )
      );
      await page.keyboard.press('Tab');
    }
    await dialog.getByRole('button', { name: item[2] }).click();
    const restored = await trigger.evaluate(
      (element) => document.activeElement === element
    );
    assert(
      focusStayedInside.every(Boolean) && restored,
      `${item[1]} did not contain and restore focus.`
    );
    dialogStates.push({ dialog: item[1], focusStayedInside, restored });
  }
  report.dialogs = dialogStates;
  report.privacy = {
    requests: requests.length,
    allSameOrigin: requests.every(
      (request) => new URL(request.url).origin === new URL(base).origin
    ),
    allReadOnly: requests.every((request) =>
      ['GET', 'HEAD'].includes(request.method)
    ),
    consoleErrors,
    pageErrors
  };
  assert(report.privacy.allSameOrigin, 'A cross-origin request was made.');
  assert(report.privacy.allReadOnly, 'A browser flow made a write request.');
  assert(consoleErrors.length === 0, 'The live flow logged a console error.');
  assert(pageErrors.length === 0, 'The live flow raised a page error.');
  await context.close();

  const realContext = await browser.newContext();
  const realPage = await realContext.newPage();
  await realPage.goto(`${base}/jobs`);
  await realPage.getByRole('button', { name: 'Add a job' }).click();
  await realPage.getByLabel('Job number').fill('QA-SUP-REAL');
  await realPage
    .getByLabel('Site or customer name')
    .fill('Real Customer Job');
  await realPage.getByLabel('Visit date').fill('2026-09-12');
  await realPage
    .getByRole('textbox', { name: 'Required part', exact: true })
    .fill('Isolation valve');
  await realPage
    .getByRole('spinbutton', { name: 'Quantity', exact: true })
    .fill('1');
  await realPage
    .getByRole('button', { name: 'Save job and part' })
    .click();
  const supplierAction = realPage.getByRole('button', {
    name: 'Check supplier date'
  });
  const supplierActionCount = await supplierAction.count();
  assert(
    supplierActionCount === 1,
    `Real part lacks supplier evidence: ${JSON.stringify({ url: realPage.url(), buttons: await realPage.getByRole('button').allTextContents() })}`
  );
  await supplierAction.click();
  await realPage.getByLabel('Supplier order reference').fill('SUP-REAL-1');
  await realPage.getByLabel('Expected date').fill('2026-09-01');
  await realPage
    .getByLabel('Confidence')
    .selectOption('Confirmed by supplier');
  await realPage
    .getByRole('button', { name: 'Attach supplier evidence' })
    .click();
  const realStatus = await realPage.locator('.status-plate').first().innerText();
  assert(
    realStatus.includes('Expected before visit'),
    'Real supplier-backed job did not become expected.'
  );
  report.realSupplierEvidence = {
    actionCount: supplierActionCount,
    status: realStatus
  };
  await realContext.close();

  const axe = [];
  for (const theme of ['light', 'dark']) {
    const axeContext = await browser.newContext();
    const axePage = await axeContext.newPage();
    if (theme === 'dark') {
      await axePage.addInitScript(() =>
        localStorage.setItem('parts-promise-theme', 'dark')
      );
    }
    for (const route of [
      '/',
      '/?demo=1',
      '/jobs',
      '/privacy',
      '/terms',
      '/not-on-this-drawing'
    ]) {
      await axePage.goto(`${base}${route}`);
      const results = await new AxeBuilder({ page: axePage }).analyze();
      const serious = results.violations.filter((issue) =>
        ['serious', 'critical'].includes(issue.impact ?? '')
      );
      assert(serious.length === 0, `${theme} ${route} has serious axe issues.`);
      axe.push({ theme, route, serious: serious.length });
    }
    await axeContext.close();
  }
  report.axe = axe;

  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true
  });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto(`${base}/?demo=1`, { waitUntil: 'networkidle' });
  const mobile = await mobilePage.evaluate(() => ({
    viewport: innerWidth,
    documentWidth: document.documentElement.scrollWidth,
    minimumButtonHeight: Math.min(
      ...Array.from(document.querySelectorAll('button'))
        .filter((button) => button.getClientRects().length > 0)
        .map((button) => button.getBoundingClientRect().height)
    )
  }));
  await mobilePage.screenshot({
    path: '.factory/repair-4-artifacts/live-mobile-390.png',
    fullPage: true
  });
  await mobilePage.evaluate(() => {
    document.documentElement.style.fontSize = '200%';
  });
  const zoom = await mobilePage.evaluate(() => ({
    viewport: innerWidth,
    documentWidth: document.documentElement.scrollWidth
  }));
  await mobilePage.screenshot({
    path: '.factory/repair-4-artifacts/live-mobile-200pct.png',
    fullPage: true
  });
  assert(mobile.documentWidth <= mobile.viewport, 'Mobile page overflows.');
  assert(mobile.minimumButtonHeight >= 44, 'A mobile button is under 44px.');
  assert(zoom.documentWidth <= zoom.viewport, 'Page overflows at 200% text.');
  report.mobile = { ...mobile, text200Percent: zoom };
  await mobileContext.close();

  const offlineContext = await browser.newContext();
  const offlinePage = await offlineContext.newPage();
  const offlineErrors = [];
  offlinePage.on('console', (message) => {
    if (message.type() === 'error') offlineErrors.push(message.text());
  });
  await offlinePage.goto(`${base}/?demo=1`);
  await offlinePage.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) {
      await new Promise((resolve) =>
        navigator.serviceWorker.addEventListener('controllerchange', resolve, {
          once: true
        })
      );
    }
  });
  await offlinePage.waitForFunction(async () => {
    const cache = await caches.open('parts-promise-shell-v3');
    const paths = (await cache.keys()).map(
      (request) => new URL(request.url).pathname
    );
    return (
      paths.includes('/') &&
      paths.some((path) => /\/assets\/index-.*\.js$/.test(path)) &&
      paths.some((path) => /\/assets\/index-.*\.css$/.test(path))
    );
  });
  await offlineContext.setOffline(true);
  await offlinePage.reload();
  await offlinePage.getByTestId('allocate-pump').click();
  await offlinePage.getByLabel(/Van 2/).check();
  await offlinePage.getByRole('button', { name: 'Hold this quantity' }).click();
  const offlineStatus = await offlinePage.locator('.status-plate').first().innerText();
  assert(offlineStatus.includes('Parts in hand'), 'Offline allocation failed.');
  assert(offlineErrors.length === 0, 'Offline reload logged a console error.');
  report.offline = {
    status: offlineStatus,
    errors: offlineErrors,
    caches: await offlinePage.evaluate(() => caches.keys())
  };
  await offlineContext.close();

  writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify(report));
} finally {
  await browser.close();
}
