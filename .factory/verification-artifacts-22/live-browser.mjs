import { chromium, devices } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';

const base = 'https://field-parts-promise.sociobot.in';
const result = {
  base,
  desktop: {},
  mobile: {},
  routes: [],
  axe: [],
  consoleErrors: [],
  pageErrors: [],
  requests: [],
  passed: false
};

const browser = await chromium.launch({ headless: true });
try {
  const context = await browser.newContext({ ...devices['Desktop Chrome'] });
  const page = await context.newPage();
  page.on('console', (message) => {
    if (message.type() === 'error') result.consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => result.pageErrors.push(error.message));
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (url.origin === base) {
      result.requests.push({ path: `${url.pathname}${url.search}`, method: request.method() });
    }
  });

  await page.goto(`${base}/`, { waitUntil: 'networkidle' });
  result.desktop.firstRead = {
    title: await page.title(),
    h1: await page.locator('h1').innerText(),
    audience: await page.getByText('For small trade firms that need a parts check before agreeing a visit date.', { exact: true }).isVisible(),
    action: await page.getByRole('link', { name: 'Try it with sample data' }).isVisible(),
    actionOutcome: await page.getByText('Opens Riverside Dental with one missing pump.', { exact: true }).isVisible()
  };
  await page.screenshot({ path: '.factory/verification-artifacts-22/live/first-read-desktop.png', fullPage: false });

  await page.getByRole('link', { name: 'Try it with sample data' }).click();
  await page.waitForLoadState('networkidle');
  result.desktop.demo = {
    url: page.url(),
    h1: await page.locator('h1').innerText(),
    banner: await page.getByText(/Demo.*sample data.*nothing is saved/i).first().innerText(),
    initialStatus: await page.locator('.status-plate').first().innerText(),
    demoDatabases: await page.evaluate(() => indexedDB.databases().then((dbs) => dbs.map((db) => db.name).filter(Boolean)))
  };
  const demoLinks = await page.locator('a[href]').evaluateAll((anchors) => anchors
    .map((a) => ({ text: a.textContent?.trim(), href: a.getAttribute('href') }))
    .filter((a) => ['Jobs', 'Privacy', 'Terms'].includes(a.text ?? '')));
  result.desktop.demoLinks = demoLinks;

  const newTab = await context.newPage();
  await newTab.goto(`${base}/jobs?demo=1`, { waitUntil: 'networkidle' });
  result.desktop.newTabDemo = {
    h1: await newTab.locator('h1').innerText(),
    banner: await newTab.getByText(/Demo.*sample data.*nothing is saved/i).first().isVisible(),
    demoDatabases: await newTab.evaluate(() => indexedDB.databases().then((dbs) => dbs.map((db) => db.name).filter(Boolean)))
  };
  await newTab.close();

  await page.getByTestId('allocate-pump').click();
  await page.getByLabel(/Van 2/).check();
  await page.getByLabel('Quantity held').fill('1');
  await page.getByRole('button', { name: 'Allocate this quantity' }).click();
  await page.waitForTimeout(200);
  result.desktop.allocation = {
    status: await page.locator('.status-plate').first().innerText(),
    allocation: await page.getByTestId('part-req-pump').locator('.allocation-list').innerText()
  };
  await page.screenshot({ path: '.factory/verification-artifacts-22/live/demo-allocated-desktop.png', fullPage: false });

  await page.getByRole('button', { name: 'Reset demo' }).click();
  const resetConfirm = page.getByRole('button', { name: /Reset sample|Reset demo|Confirm reset/i }).last();
  if (await resetConfirm.isVisible().catch(() => false)) await resetConfirm.click();
  await page.waitForTimeout(200);
  result.desktop.reset = {
    status: await page.locator('.status-plate').first().innerText(),
    databases: await page.evaluate(() => indexedDB.databases().then((dbs) => dbs.map((db) => db.name).filter(Boolean)))
  };

  const offline = await browser.newContext({ ...devices['Desktop Chrome'] });
  const offlinePage = await offline.newPage();
  await offlinePage.goto(`${base}/?demo=1`, { waitUntil: 'networkidle' });
  await offline.setOffline(true);
  await offlinePage.reload({ waitUntil: 'domcontentloaded' });
  result.desktop.offline = {
    h1: await offlinePage.locator('h1').innerText(),
    banner: await offlinePage.getByText(/Demo.*sample data.*nothing is saved/i).first().isVisible(),
    status: await offlinePage.locator('.status-plate').first().innerText()
  };
  await offline.close();

  await page.goto(`${base}/?demo=1`, { waitUntil: 'networkidle' });
  await page.keyboard.press('Tab');
  result.desktop.keyboard = {
    firstFocusText: await page.evaluate(() => document.activeElement?.textContent?.trim()),
    focusVisible: await page.evaluate(() => {
      const e = document.activeElement;
      return e ? getComputedStyle(e).outlineStyle !== 'none' || getComputedStyle(e).boxShadow !== 'none' : false;
    })
  };

  for (const path of ['/', '/demo', '/jobs?demo=1', '/privacy?demo=1', '/terms?demo=1', '/not-on-this-drawing']) {
    await page.goto(`${base}${path}`, { waitUntil: 'networkidle' });
    const axe = await new AxeBuilder({ page }).analyze();
    const serious = axe.violations.filter((v) => ['serious', 'critical'].includes(v.impact ?? '')).map((v) => v.id);
    result.axe.push({ path, serious });
    result.routes.push({
      path,
      title: await page.title(),
      h1Count: await page.locator('h1').count(),
      mainCount: await page.locator('main').count(),
      lang: await page.locator('html').getAttribute('lang')
    });
  }
  await context.close();

  const mobile = await browser.newContext({ ...devices['Pixel 5'], viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  const mobilePage = await mobile.newPage();
  await mobilePage.goto(`${base}/`, { waitUntil: 'networkidle' });
  const facts = [
    'Promise dates from parts held for the job',
    'For small trade firms that need a parts check before agreeing a visit date.',
    'Try it with sample data',
    'Opens Riverside Dental with one missing pump.',
    'The sample job and allocation work offline after your first visit.',
    'Sample changes stay in this browser.',
    'The firm plan is $39/month plus $8 per active technician.'
  ];
  const visibility = {};
  for (const fact of facts) visibility[fact] = await mobilePage.getByText(fact, { exact: true }).isVisible();
  result.mobile.firstRead = {
    visibility,
    noHorizontalOverflow: await mobilePage.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    reducedMotion: await mobilePage.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)
  };
  await mobilePage.screenshot({ path: '.factory/verification-artifacts-22/live/first-read-mobile-390.png', fullPage: false });
  await mobilePage.getByRole('link', { name: 'Try it with sample data' }).click();
  await mobilePage.waitForLoadState('networkidle');
  result.mobile.demo = {
    h1: await mobilePage.locator('h1').innerText(),
    status: await mobilePage.locator('.status-plate').first().innerText(),
    banner: await mobilePage.getByText(/Demo.*sample data.*nothing is saved/i).first().isVisible()
  };
  await mobilePage.screenshot({ path: '.factory/verification-artifacts-22/live/demo-mobile-390.png', fullPage: false });
  await mobile.close();

  result.passed = result.consoleErrors.length === 0 && result.pageErrors.length === 0 && result.axe.every((entry) => entry.serious.length === 0);
} finally {
  await browser.close();
}
console.log(JSON.stringify(result, null, 2));
