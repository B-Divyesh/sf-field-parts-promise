import { AxeBuilder } from '@axe-core/playwright';
import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';

const base = 'https://field-parts-promise.sociobot.in';
const browser = await chromium.launch();
const report = {
  checkedAt: new Date().toISOString(),
  base,
  findings: {},
  axe: [],
  consoleErrors: []
};

async function freshPage(viewport = { width: 390, height: 844 }) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  page.on('console', (message) => {
    if (message.type() === 'error' && !/Failed to load resource: the server responded with a status of 404/.test(message.text()))
      report.consoleErrors.push(`${page.url()}: ${message.text()}`);
  });
  page.on('pageerror', (error) => report.consoleErrors.push(`${page.url()}: ${error.message}`));
  return { context, page };
}

async function allocatePump(page) {
  await page.getByTestId('allocate-pump').click();
  await page.getByLabel(/Van 2/).check();
  await page.getByRole('button', { name: 'Hold this quantity' }).click();
  await page.locator('.status-plate').first().filter({ hasText: 'Parts in hand' }).waitFor();
}

async function demoDatabaseExists(page) {
  return page.evaluate(async () =>
    (await indexedDB.databases()).some(
      (database) => database.name === 'parts-promise-demo-v1'
    )
  );
}

{
  const { context, page } = await freshPage();
  await page.goto(`${base}/`, { waitUntil: 'networkidle' });
  assert.equal(await page.title(), 'Parts Promise — Hold parts for each job');
  assert.equal(await page.locator('h1').innerText(), 'Promise dates from parts held for the job');
  assert.equal(await page.getByRole('link', { name: 'Try it with sample data' }).isVisible(), true);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  await page.screenshot({ path: '.factory/evidence/polish-2/cold-mobile.png', fullPage: true });

  await page.getByRole('link', { name: 'Try it with sample data' }).click();
  assert.match(await page.locator('.demo-banner').innerText(), /nothing is saved to a firm/i);
  await allocatePump(page);
  await page.getByRole('link', { name: 'Parts Promise' }).click();
  assert.equal(await demoDatabaseExists(page), false);
  await page.getByLabel('Main navigation').getByRole('link', { name: 'Demo' }).click();
  assert.match(await page.locator('.status-plate').first().innerText(), /Date at risk/);
  await allocatePump(page);
  await page.goBack();
  assert.equal(new URL(page.url()).pathname, '/');
  await page.waitForFunction(async () =>
    (await indexedDB.databases()).every(
      (database) => database.name !== 'parts-promise-demo-v1'
    )
  );
  assert.equal(await demoDatabaseExists(page), false);
  report.findings['F-2-1'] = 'wordmark and browser Back deleted demo IndexedDB; re-entry restored Date at risk';
  await context.close();
}

{
  const { context, page } = await freshPage();
  await page.goto(`${base}/jobs?demo=1`);
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export workspace' }).click();
  const download = await downloadPromise;
  assert.match(download.suggestedFilename(), /^parts-promise-backup-\d{4}-\d{2}-\d{2}\.json$/);
  await page.getByRole('button', { name: 'Import workspace' }).click();
  const invalid = 'record_type,job_number,site,visit_date,part,unit,quantity,source_name,source_type,minimum,last_checked_at\njob,LIVE-7,Boiler room,2026-10-02,,,,,,,\nrequired_part,LIVE-7,,,Igniter,each,0,,,,\n';
  await page.getByLabel('Choose a CSV or Parts Promise JSON backup').setInputFiles({
    name: 'invalid.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from(invalid)
  });
  assert.match(await page.getByRole('alert').innerText(), /Row 3/);
  assert.equal(await page.getByRole('button', { name: 'Import invalid.csv' }).count(), 0);
  await page.screenshot({ path: '.factory/evidence/polish-2/import-validation-mobile.png', fullPage: true });
  report.findings['F-2-2'] = 'versioned JSON downloaded; invalid CSV preview named row 3 and blocked import';
  await context.close();
}

{
  const { context, page } = await freshPage({ width: 1440, height: 900 });
  const response = await page.goto(`${base}/jobs/not-a-real-job`, { waitUntil: 'networkidle' });
  assert.equal(response?.status(), 200);
  assert.equal(await page.title(), 'Page not found — Parts Promise');
  assert.equal(await page.locator('h1').innerText(), 'Page not found');
  assert.equal(await page.locator('meta[property="og:title"]').getAttribute('content'), 'Page not found — Parts Promise');
  assert.equal(await page.locator('meta[name="robots"]').getAttribute('content'), 'noindex');
  await page.screenshot({ path: '.factory/evidence/polish-2/missing-job-desktop.png', fullPage: true });
  report.findings['F-2-3'] = 'missing local job rendered Page not found title/H1/OG metadata and noindex';
  await context.close();
}

{
  const { context, page } = await freshPage();
  await page.goto(`${base}/jobs?demo=1`);
  const trigger = page.getByRole('button', { name: 'Add a job' });
  await trigger.click();
  const heading = page.getByRole('heading', { name: 'Add a job and its first required part' });
  assert.equal(await heading.evaluate((element) => document.activeElement === element), true);
  await page.waitForFunction(() => {
    const element = document.querySelector('#add-job-title');
    const box = element?.getBoundingClientRect();
    return Boolean(
      box && box.top >= 0 && box.top < innerHeight / 2 && box.bottom <= innerHeight
    );
  });
  const box = await heading.boundingBox();
  assert.ok(box && box.y >= 0 && box.y < 844);
  assert.equal(await trigger.getAttribute('aria-expanded'), 'true');
  await page.screenshot({ path: '.factory/evidence/polish-2/form-focus-mobile.png' });
  await page.locator('#add-job-sheet').getByRole('button', { name: 'Close' }).click();
  assert.equal(await trigger.evaluate((element) => document.activeElement === element), true);
  report.findings['F-2-4'] = 'mobile sheet scrolled into view, focused its heading, exposed state, and restored trigger focus';
  await context.close();
}

{
  const { context, page } = await freshPage({ width: 1280, height: 900 });
  for (const theme of ['light', 'dark']) {
    for (const path of ['/', '/demo', '/jobs', '/privacy', '/terms', '/not-on-this-drawing']) {
      await page.goto(`${base}${path}`);
      if (path !== '/not-on-this-drawing') {
        await page.evaluate((value) => localStorage.setItem('parts-promise-theme', value), theme);
        await page.reload();
      }
      const results = await new AxeBuilder({ page }).analyze();
      const serious = results.violations.filter((item) => ['serious', 'critical'].includes(item.impact ?? ''));
      report.axe.push({ theme, path, serious: serious.map((item) => item.id) });
      assert.deepEqual(serious, []);
    }
  }
  await context.close();
}

assert.deepEqual(report.consoleErrors, []);
await writeFile(
  '.factory/evidence/polish-2/live-check.json',
  `${JSON.stringify(report, null, 2)}\n`
);
await browser.close();
console.log(JSON.stringify(report, null, 2));
