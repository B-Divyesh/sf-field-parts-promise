import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';

import { AxeBuilder } from '@axe-core/playwright';
import { chromium, devices } from '@playwright/test';

const base = 'https://field-parts-promise.sociobot.in';
const output = '.factory/review-artifacts-9';
await mkdir(output, { recursive: true });

const report = {
  checkedAt: new Date().toISOString(),
  base,
  health: null,
  firstRead: {},
  demo: {},
  routes: [],
  links: [],
  requests: [],
  consoleErrors: [],
  pageErrors: [],
  passed: false
};

function watch(page) {
  page.on('request', (request) => {
    report.requests.push({ method: request.method(), url: request.url() });
  });
  page.on('console', (message) => {
    if (message.type() !== 'error') return;
    if (page.url().endsWith('/not-on-this-drawing') && /status of 404/.test(message.text())) return;
    report.consoleErrors.push(`${page.url()}: ${message.text()}`);
  });
  page.on('pageerror', (error) => report.pageErrors.push(`${page.url()}: ${error.message}`));
}

async function databaseNames(page) {
  return page.evaluate(async () =>
    (await indexedDB.databases()).map((entry) => entry.name).filter(Boolean).sort()
  );
}

async function firstRead(page, viewportHeight) {
  const lines = [
    ['job', page.getByRole('heading', { level: 1 })],
    ['audience', page.getByText('For small trade firms that need a parts check before agreeing a visit date.', { exact: true })],
    ['action', page.getByRole('link', { name: 'Try it with sample data' })],
    ['outcome', page.getByText('Opens Riverside Dental with one missing pump.', { exact: true })],
    ['offline', page.getByText('The sample job and allocation work offline after your first visit.', { exact: true })],
    ['privacy', page.getByText('Sample changes stay in this browser.', { exact: true })],
    ['price', page.getByText('The firm plan is $39/month plus $8 per active technician.', { exact: true })]
  ];
  const result = {};
  for (const [name, locator] of lines) {
    const box = await locator.boundingBox();
    assert.ok(box, `${name} must be visible`);
    result[name] = { text: await locator.innerText(), bottom: Math.round(box.y + box.height) };
    assert.ok(box.y + box.height <= viewportHeight, `${name} must fit before scrolling`);
  }
  assert.equal(await page.evaluate(() => scrollY), 0);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  return result;
}

const browser = await chromium.launch({ headless: true });
try {
  const healthResponse = await fetch(`${base}/health`);
  assert.equal(healthResponse.status, 200);
  report.health = await healthResponse.json();
  assert.equal(report.health.status, 'ok');
  assert.equal(report.health.database, 'sqlite');

  const desktopContext = await browser.newContext({
    ...devices['Desktop Chrome'],
    viewport: { width: 1440, height: 900 },
    serviceWorkers: 'allow'
  });
  const desktop = await desktopContext.newPage();
  watch(desktop);
  await desktop.goto(`${base}/`, { waitUntil: 'networkidle' });
  assert.equal(await desktop.title(), 'Parts Promise — Allocate parts to each job');
  report.firstRead.desktop = await firstRead(desktop, 900);
  await desktop.screenshot({ path: `${output}/first-read-desktop.png` });

  await desktop.keyboard.press('Tab');
  assert.equal(await desktop.evaluate(() => document.activeElement?.textContent?.trim()), 'Skip to main content');
  assert.equal(await desktop.evaluate(() => getComputedStyle(document.activeElement).outlineStyle !== 'none'), true);
  await desktop.keyboard.press('Enter');
  assert.equal(await desktop.evaluate(() => document.activeElement?.id), 'main');

  await desktop.getByRole('link', { name: 'Try it with sample data' }).click();
  await desktop.waitForFunction(() => document.documentElement.dataset.workspaceReady === 'true');
  assert.match(desktop.url(), /demo=1/);
  assert.equal(await desktop.getByLabel('Demo workspace').isVisible(), true);
  assert.deepEqual(await databaseNames(desktop), ['parts-promise-demo-v1']);
  const initialStatus = await desktop.locator('.status-plate').first().innerText();
  assert.match(initialStatus, /Date at risk/);
  assert.match(await desktop.locator('main').innerText(), /Riverside Dental/);
  assert.match(await desktop.locator('main').innerText(), /RD-1042/);
  assert.match(await desktop.locator('main').innerText(), /Condensate pump/);

  const demoLinks = await desktop.locator('a[href]').evaluateAll((links) =>
    links
      .map((link) => ({ text: link.textContent?.trim() ?? '', href: link.getAttribute('href') }))
      .filter((link) => ['Jobs', 'Privacy', 'Terms'].includes(link.text))
  );
  assert.ok(demoLinks.length >= 4);
  assert.equal(demoLinks.every((link) => link.href?.includes('demo=1')), true);

  const newTab = await desktopContext.newPage();
  watch(newTab);
  await newTab.goto(`${base}/jobs?demo=1`, { waitUntil: 'networkidle' });
  await newTab.waitForFunction(() => document.documentElement.dataset.workspaceReady === 'true');
  assert.equal(await newTab.getByLabel('Demo workspace').isVisible(), true);
  assert.deepEqual(await databaseNames(newTab), ['parts-promise-demo-v1']);
  await newTab.close();

  await desktop.getByTestId('allocate-pump').click();
  await desktop.getByLabel(/Van 2/).check();
  await desktop.getByLabel('Quantity held').fill('1');
  await desktop.getByRole('button', { name: 'Allocate this quantity' }).click();
  const allocatedStatus = await desktop.locator('.status-plate').first().innerText();
  const allocation = await desktop.getByTestId('part-req-pump').locator('.allocation-list').innerText();
  assert.match(allocatedStatus, /Parts in hand/);
  assert.match(allocation, /Van 2/);
  assert.match(allocation, /1 each/);
  assert.match(allocation, /Field demo/);
  assert.match(allocation, /checked/i);
  await desktop.screenshot({ path: `${output}/demo-allocated-desktop.png` });

  await desktop.getByRole('button', { name: 'Reset demo' }).click();
  const resetConfirm = desktop.getByRole('button', { name: /Reset sample|Reset demo|Confirm reset/i }).last();
  if (await resetConfirm.isVisible().catch(() => false)) await resetConfirm.click();
  await desktop.waitForTimeout(200);
  const resetStatus = await desktop.locator('.status-plate').first().innerText();
  assert.match(resetStatus, /Date at risk/);
  assert.match(await desktop.getByTestId('part-req-pump').innerText(), /0 each held of 1 each/);
  assert.deepEqual(await databaseNames(desktop), ['parts-promise-demo-v1']);
  report.demo = { initialStatus, allocatedStatus, allocation, resetStatus, demoLinks, databases: await databaseNames(desktop) };

  const offlineContext = await browser.newContext({ ...devices['Desktop Chrome'], serviceWorkers: 'allow' });
  const offlinePage = await offlineContext.newPage();
  await offlinePage.goto(`${base}/?demo=1`, { waitUntil: 'networkidle' });
  await offlinePage.evaluate(() => navigator.serviceWorker.ready);
  await offlineContext.setOffline(true);
  await offlinePage.reload({ waitUntil: 'domcontentloaded' });
  assert.equal(await offlinePage.getByLabel('Demo workspace').isVisible(), true);
  assert.match(await offlinePage.locator('h1').innerText(), /Riverside Dental/);
  await offlineContext.close();
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
  assert.equal(await mobile.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches), true);
  report.firstRead.mobile = await firstRead(mobile, 844);
  await mobile.screenshot({ path: `${output}/first-read-mobile.png` });
  await mobile.getByRole('link', { name: 'Try it with sample data' }).click();
  await mobile.waitForFunction(() => document.documentElement.dataset.workspaceReady === 'true');
  assert.equal(await mobile.getByLabel('Demo workspace').isVisible(), true);
  assert.equal(await mobile.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  await mobile.screenshot({ path: `${output}/demo-mobile.png` });
  await mobileContext.close();

  const routeContext = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const routePage = await routeContext.newPage();
  watch(routePage);
  const routes = [
    ['/', 'Parts Promise — Allocate parts to each job', 200],
    ['/demo', 'Demo — Parts Promise', 200],
    ['/jobs', 'Jobs — Parts Promise', 200],
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
    assert.equal(await routePage.locator('.site-footer a[href^="/privacy"]').count() > 0, true);
    assert.equal(await routePage.locator('.site-footer a[href^="/terms"]').count() > 0, true);
    const axe = await new AxeBuilder({ page: routePage }).analyze();
    const serious = axe.violations.filter((item) => ['serious', 'critical'].includes(item.impact ?? ''));
    assert.deepEqual(serious, []);
    report.routes.push({ path, title, status, axeSeriousCritical: serious.length });
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

  const external = report.requests.filter(({ url }) => new URL(url).origin !== new URL(base).origin);
  const writes = report.requests.filter(({ method }) => !['GET', 'HEAD'].includes(method));
  assert.deepEqual(external, []);
  assert.deepEqual(writes, []);
  assert.deepEqual(report.consoleErrors, []);
  assert.deepEqual(report.pageErrors, []);
  report.passed = true;
} finally {
  await browser.close();
}

await writeFile(`${output}/live-review.json`, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
