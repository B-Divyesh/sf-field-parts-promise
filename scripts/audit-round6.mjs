import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { AxeBuilder } from '@axe-core/playwright';
import { chromium } from '@playwright/test';

const baseUrl = process.env.BASE_URL ?? 'http://127.0.0.1:4173';
const expectedBuildSha = process.env.EXPECTED_BUILD_SHA;
const evidenceDir = resolve(
  process.env.EVIDENCE_DIR ?? '.factory/evidence/polish-6/live'
);
const origin = new URL(baseUrl).origin;
const checks = [];

function check(name, condition, detail = '') {
  assert.ok(condition, `${name}${detail ? `: ${detail}` : ''}`);
  checks.push({ name, status: 'pass', detail });
}

await mkdir(evidenceDir, { recursive: true });
const browser = await chromium.launch({ headless: true });

try {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    serviceWorkers: 'block'
  });
  const page = await context.newPage();
  const normalConsoleErrors = [];
  const pageErrors = [];
  let collectConsole = true;
  page.on('console', (message) => {
    if (collectConsole && message.type() === 'error')
      normalConsoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => pageErrors.push(error.message));

  await page.goto(new URL('/', baseUrl).toString(), {
    waitUntil: 'networkidle'
  });
  check(
    'home title',
    (await page.title()) === 'Parts Promise — Allocate parts to each job'
  );
  check(
    'first-screen headline',
    await page
      .getByRole('heading', {
        level: 1,
        name: 'Promise dates from parts held for the job'
      })
      .isVisible()
  );
  check(
    'plain pricing heading',
    await page
      .getByRole('heading', { level: 2, name: 'Firm plan pricing' })
      .isVisible()
  );
  check(
    'unavailable checkout wording',
    (await page.locator('body').innerText()).includes(
      'Checkout is not available yet. No charge will start.'
    )
  );
  check(
    'no unavailable payment action heading',
    !(await page.locator('body').innerText()).includes('Pay for the firm plan')
  );
  await page.screenshot({
    path: resolve(evidenceDir, 'cold-mobile.png'),
    fullPage: true
  });

  const unique = Date.now();
  const liveToken = `LIVE-ONLY-${unique}`;
  const demoToken = `DEMO-ONLY-${unique}`;
  await page.goto(new URL('/jobs', baseUrl).toString());
  await page.getByRole('button', { name: 'Add a job' }).click();
  await page.getByLabel('Job number').fill(liveToken);
  await page
    .getByLabel('Site or customer name')
    .fill(`Round Six Live ${liveToken}`);
  await page.getByLabel('Visit date').fill('2026-09-24');
  await page.getByLabel('Required part', { exact: true }).fill('Live Fuse');
  await page.getByLabel('Quantity', { exact: true }).fill('1');
  await page.getByRole('button', { name: 'Save job and part' }).click();
  await page.getByRole('link', { name: 'Parts Promise' }).click();
  await page.getByRole('link', { name: 'Try it with sample data' }).click();
  await page.waitForURL(/\?demo=1$/);
  await page
    .getByRole('heading', { level: 1, name: 'Riverside Dental parts' })
    .waitFor();
  const demoBody = await page.locator('body').innerText();
  check('live identifier absent from demo DOM', !demoBody.includes(liveToken));
  check(
    'demo banner',
    demoBody.includes(
      'Demo — sample data; nothing is saved to your local workspace.'
    )
  );
  check('demo sample is ready', demoBody.includes('Riverside Dental parts'));
  await page.screenshot({
    path: resolve(evidenceDir, 'demo-isolation-mobile.png'),
    fullPage: true
  });

  await page
    .getByLabel('Main navigation')
    .getByRole('link', { name: 'Jobs' })
    .click();
  await page.getByRole('button', { name: 'Add a job' }).click();
  await page.getByLabel('Job number').fill(demoToken);
  await page.getByLabel('Site or customer name').fill('Round Six Sample');
  await page.getByLabel('Visit date').fill('2026-09-25');
  await page.getByLabel('Required part', { exact: true }).fill('Sample Fuse');
  await page.getByLabel('Quantity', { exact: true }).fill('1');
  await page.getByRole('button', { name: 'Save job and part' }).click();
  await page.getByRole('button', { name: 'Start for real' }).click();
  await page
    .locator('dialog')
    .getByRole('button', { name: 'Leave demo' })
    .click();
  await page.waitForURL(/\/jobs$/);
  await page
    .getByRole('heading', { name: `Round Six Live ${liveToken}` })
    .waitFor();
  const liveBody = await page.locator('body').innerText();
  check(
    'demo identifier absent from live DOM',
    !liveBody.includes(demoToken),
    liveBody.includes(demoToken) ? `found ${demoToken}` : ''
  );
  check('live workspace preserved', liveBody.includes(liveToken));

  const routes = [
    ['/', 'Parts Promise — Allocate parts to each job'],
    ['/demo', 'Demo — Parts Promise'],
    ['/jobs', 'Jobs — Parts Promise'],
    ['/onboarding', 'Set up your firm — Parts Promise'],
    ['/settings/team', 'Team — Parts Promise'],
    ['/settings/billing', 'Billing — Parts Promise'],
    ['/settings/data', 'Data controls — Parts Promise'],
    ['/privacy', 'Privacy — Parts Promise'],
    ['/terms', 'Terms — Parts Promise']
  ];
  for (const [path, title] of routes) {
    await page.goto(new URL(path, baseUrl).toString());
    check(`${path} status`, page.url().startsWith(origin));
    check(`${path} title`, (await page.title()) === title);
    check(`${path} one H1`, (await page.locator('main h1').count()) === 1);
    check(`${path} one main`, (await page.locator('main').count()) === 1);
    check(
      `${path} legal links`,
      (await page.locator('footer a').allTextContents()).some(
        (text) => text.trim() === 'Privacy'
      ) &&
        (await page.locator('footer a').allTextContents()).some(
          (text) => text.trim() === 'Terms'
        )
    );
    const axe = await new AxeBuilder({ page }).analyze();
    check(
      `${path} axe serious/critical`,
      axe.violations.every(
        (violation) => !['serious', 'critical'].includes(violation.impact ?? '')
      )
    );
  }

  check(
    'normal route console errors',
    normalConsoleErrors.length === 0,
    normalConsoleErrors.join(' | ')
  );
  check(
    'normal route page errors',
    pageErrors.length === 0,
    pageErrors.join(' | ')
  );
  collectConsole = false;
  const notFound = await page.goto(
    new URL('/round-6-not-found-check', baseUrl).toString()
  );
  check('unknown route HTTP 404', notFound?.status() === 404);
  check('404 title', (await page.title()) === 'Page not found — Parts Promise');
  check(
    '404 recovery',
    await page.getByRole('link', { name: 'Go to home' }).isVisible()
  );

  const health = await context.request.get(
    new URL('/health', baseUrl).toString()
  );
  check('health status', health.status() === 200);
  const healthBody = await health.json();
  check('health database', healthBody.database === 'sqlite');
  check(
    'health build identity',
    typeof healthBody.build_sha === 'string' &&
      healthBody.build_sha.length > 0 &&
      (!expectedBuildSha || healthBody.build_sha === expectedBuildSha)
  );

  await writeFile(
    resolve(evidenceDir, 'audit.json'),
    `${JSON.stringify(
      {
        checkedAt: new Date().toISOString(),
        baseUrl,
        health: healthBody,
        checks
      },
      null,
      2
    )}\n`
  );
  process.stdout.write(
    `${checks.length} round-6 checks passed at ${baseUrl}\n`
  );
} finally {
  await browser.close();
}
