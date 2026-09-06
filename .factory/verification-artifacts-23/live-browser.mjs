import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';

import { AxeBuilder } from '@axe-core/playwright';
import { chromium, devices } from '@playwright/test';

const base = 'https://field-parts-promise.sociobot.in';
const out = '.factory/verification-artifacts-23';
await mkdir(out, { recursive: true });

const report = {
  checkedAt: new Date().toISOString(),
  health: null,
  firstRead: {},
  demo: {},
  m3: {},
  routes: [],
  links: [],
  consoleErrors: [],
  pageErrors: [],
  passed: false
};

function watch(page) {
  page.on('console', (message) => {
    if (message.type() !== 'error') return;
    if (/status of 404/.test(message.text()) && page.url().includes('not-on-this-drawing')) return;
    report.consoleErrors.push(`${page.url()}: ${message.text()}`);
  });
  page.on('pageerror', (error) => report.pageErrors.push(`${page.url()}: ${error.message}`));
}

async function databases(page) {
  return page.evaluate(async () =>
    (await indexedDB.databases()).map((entry) => entry.name).filter(Boolean).sort()
  );
}

async function firstRead(page, height) {
  const checks = [
    ['job', page.getByRole('heading', { level: 1 })],
    ['audience', page.getByText('For small trade firms that need a parts check before agreeing a visit date.', { exact: true })],
    ['action', page.getByRole('link', { name: 'Try it with sample data' })],
    ['outcome', page.getByText('Opens Riverside Dental with one missing pump.', { exact: true })]
  ];
  const result = {};
  assert.equal(await page.evaluate(() => scrollY), 0);
  for (const [name, locator] of checks) {
    const box = await locator.boundingBox();
    assert.ok(box, `${name} must be visible`);
    assert.ok(box.y + box.height <= height, `${name} must be above the fold`);
    result[name] = { text: await locator.innerText(), bottom: Math.round(box.y + box.height) };
  }
  result.noHorizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);
  assert.equal(result.noHorizontalOverflow, true);
  return result;
}

const health = await fetch(`${base}/health`);
assert.equal(health.status, 200);
report.health = await health.json();
assert.equal(report.health.build_sha, '40766071e5464eef46db29bf89eb69e818c86128');
assert.equal(report.health.database, 'sqlite');

const browser = await chromium.launch({ headless: true });
try {
  const desktopContext = await browser.newContext({
    ...devices['Desktop Chrome'],
    viewport: { width: 1440, height: 900 },
    serviceWorkers: 'allow'
  });
  const desktop = await desktopContext.newPage();
  watch(desktop);
  await desktop.goto(`${base}/`, { waitUntil: 'networkidle' });
  report.firstRead.desktop = await firstRead(desktop, 900);
  await desktop.screenshot({ path: `${out}/first-read-desktop.png` });

  await desktop.keyboard.press('Tab');
  assert.equal(await desktop.evaluate(() => document.activeElement?.textContent?.trim()), 'Skip to main content');
  assert.notEqual(await desktop.evaluate(() => getComputedStyle(document.activeElement).outlineStyle), 'none');
  await desktop.keyboard.press('Enter');
  assert.equal(await desktop.evaluate(() => document.activeElement?.id), 'main');

  await desktop.getByRole('link', { name: 'Try it with sample data' }).click();
  await desktop.waitForFunction(() => document.documentElement.dataset.workspaceReady === 'true');
  assert.equal(await desktop.getByLabel('Demo workspace').isVisible(), true);
  assert.deepEqual(await databases(desktop), ['parts-promise-demo-v1']);
  assert.match(await desktop.locator('main').innerText(), /Riverside Dental/);
  assert.match(await desktop.locator('main').innerText(), /RD-1042/);
  assert.match(await desktop.getByTestId('part-req-pump').innerText(), /0 each held of 1 each/);
  const initialStatus = await desktop.locator('.status-plate').first().innerText();
  assert.match(initialStatus, /Date at risk/);

  const demoLinks = await desktop.locator('a[href]').evaluateAll((links) =>
    links.map((link) => ({ text: link.textContent?.trim() ?? '', href: link.getAttribute('href') }))
      .filter((link) => ['Jobs', 'Privacy', 'Terms'].includes(link.text))
  );
  assert.ok(demoLinks.length >= 4);
  assert.equal(demoLinks.every((link) => link.href?.includes('demo=1')), true);

  const demoTab = await desktopContext.newPage();
  watch(demoTab);
  await demoTab.goto(`${base}/privacy?demo=1`, { waitUntil: 'networkidle' });
  assert.equal(await demoTab.getByLabel('Demo workspace').isVisible(), true);
  assert.deepEqual(await databases(demoTab), ['parts-promise-demo-v1']);
  await demoTab.close();

  await desktop.getByRole('button', { name: 'Scan a part' }).click();
  await desktop.getByRole('button', { name: 'Enter barcode instead' }).click();
  await desktop.getByLabel('Barcode', { exact: true }).fill('CP-19');
  await desktop.getByRole('button', { name: 'Find required part' }).click();
  assert.match(await desktop.getByRole('status').innerText(), /Condensate pump matches CP-19/);
  await desktop.getByRole('button', { name: 'Allocate matched part' }).click();
  await desktop.getByLabel(/Van 2/).check();
  await desktop.getByLabel('Quantity held').fill('1');
  await desktop.getByRole('button', { name: 'Allocate this quantity' }).click();
  const allocatedStatus = await desktop.locator('.status-plate').first().innerText();
  assert.match(allocatedStatus, /Parts in hand/);
  assert.match(await desktop.getByTestId('part-req-pump').innerText(), /Van 2/);
  assert.match(await desktop.getByTestId('reorder-suggestion').innerText(), /No supplier order has been placed/);
  await desktop.screenshot({ path: `${out}/demo-allocated-desktop.png` });

  await desktop.getByRole('button', { name: 'Reset demo' }).first().click();
  await desktop.locator('dialog').getByRole('button', { name: 'Reset demo' }).click();
  await desktop.waitForFunction(() => document.querySelector('.status-plate')?.textContent?.includes('Date at risk'));
  assert.match(await desktop.locator('.status-plate').first().innerText(), /Date at risk/);
  assert.match(await desktop.getByTestId('part-req-pump').innerText(), /0 each held of 1 each/);
  assert.deepEqual(await databases(desktop), ['parts-promise-demo-v1']);

  await desktop.getByTestId('part-req-pump').getByRole('button', { name: 'Check supplier date' }).click();
  await desktop.getByLabel('Supplier order reference').fill('QA-LATE-23');
  await desktop.getByLabel('Expected date').fill('2026-09-03');
  await desktop.getByLabel('Confidence').selectOption('Estimated');
  await desktop.getByRole('button', { name: 'Attach supplier evidence' }).click();
  assert.match(await desktop.locator('.status-plate').first().innerText(), /Date at risk/);
  await desktop.getByRole('link', { name: 'Suppliers' }).click();
  assert.equal(await desktop.locator('h1').innerText(), 'Supplier dates to check');
  assert.match(await desktop.locator('main').innerText(), /RD-1042 · Riverside Dental/);
  assert.match(await desktop.locator('main').innerText(), /Date at risk/);
  report.m3 = { barcode: 'CP-19 matched Condensate pump', allocatedStatus, supplierWarning: 'Date at risk' };

  await desktop.goto(`${base}/?demo=1`, { waitUntil: 'networkidle' });
  await desktop.getByRole('button', { name: 'Reset demo' }).first().click();
  await desktop.locator('dialog').getByRole('button', { name: 'Reset demo' }).click();
  await desktop.waitForFunction(() => document.querySelector('.status-plate')?.textContent?.includes('Date at risk'));
  report.demo = {
    initialStatus,
    allocatedStatus,
    resetStatus: await desktop.locator('.status-plate').first().innerText(),
    demoLinks,
    databases: await databases(desktop)
  };
  await desktopContext.close();

  const mobileContext = await browser.newContext({
    ...devices['Pixel 5'],
    viewport: { width: 390, height: 844 },
    reducedMotion: 'reduce',
    serviceWorkers: 'allow'
  });
  const mobile = await mobileContext.newPage();
  watch(mobile);
  await mobile.goto(`${base}/`, { waitUntil: 'networkidle' });
  report.firstRead.mobile = await firstRead(mobile, 844);
  report.firstRead.mobile.reducedMotion = await mobile.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
  await mobile.screenshot({ path: `${out}/first-read-mobile.png` });
  await mobile.getByRole('link', { name: 'Try it with sample data' }).click();
  await mobile.waitForFunction(() => document.documentElement.dataset.workspaceReady === 'true');
  assert.equal(await mobile.getByLabel('Demo workspace').isVisible(), true);
  assert.match(await mobile.locator('.status-plate').first().innerText(), /Date at risk/);
  assert.equal(await mobile.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  await mobile.screenshot({ path: `${out}/demo-mobile.png` });
  await mobileContext.close();

  const routeContext = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const routePage = await routeContext.newPage();
  watch(routePage);
  const routes = [
    ['/', 'Parts Promise — Allocate parts to each job', 200],
    ['/demo', 'Demo — Parts Promise', 200],
    ['/jobs', 'Jobs — Parts Promise', 200],
    ['/scan?demo=1', 'Scan a part — Parts Promise', 200],
    ['/suppliers?demo=1', 'Supplier dates — Parts Promise', 200],
    ['/conflicts?demo=1', 'Sync conflicts — Parts Promise', 200],
    ['/auth/callback', 'Sign-in return — Parts Promise', 200],
    ['/onboarding', 'Set up your firm — Parts Promise', 200],
    ['/settings/team', 'Team — Parts Promise', 200],
    ['/settings/billing', 'Billing — Parts Promise', 200],
    ['/settings/data', 'Data controls — Parts Promise', 200],
    ['/privacy', 'Privacy — Parts Promise', 200],
    ['/terms', 'Terms — Parts Promise', 200],
    ['/not-on-this-drawing', 'Page not found — Parts Promise', 404]
  ];
  for (const [path, title, status] of routes) {
    const response = await routePage.goto(`${base}${path}`, { waitUntil: 'networkidle' });
    assert.equal(response?.status(), status);
    assert.equal(await routePage.title(), title);
    assert.equal(await routePage.locator('html').getAttribute('lang'), 'en');
    assert.equal(await routePage.locator('main').count(), 1);
    assert.equal(await routePage.locator('h1').count(), 1);
    assert.equal(await routePage.locator('link[rel="canonical"]').count(), 1);
    const axe = await new AxeBuilder({ page: routePage }).analyze();
    const serious = axe.violations.filter((item) => ['serious', 'critical'].includes(item.impact ?? ''));
    assert.deepEqual(serious, []);
    report.routes.push({ path, title, status, axeSeriousCritical: 0 });
  }

  await routePage.goto(`${base}/`, { waitUntil: 'networkidle' });
  const hrefs = await routePage.locator('a[href]').evaluateAll((links) => [...new Set(links.map((link) => link.href))]);
  for (const href of hrefs) {
    const url = new URL(href);
    if (url.origin !== new URL(base).origin) continue;
    const response = await routeContext.request.get(href);
    report.links.push({ href, status: response.status() });
    assert.equal(response.status(), 200);
  }
  await routeContext.close();

  assert.deepEqual(report.consoleErrors, []);
  assert.deepEqual(report.pageErrors, []);
  report.passed = true;
} finally {
  await browser.close();
}

await writeFile(`${out}/live-browser.json`, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
