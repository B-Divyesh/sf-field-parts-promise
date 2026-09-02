import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';

import { AxeBuilder } from '@axe-core/playwright';
import { chromium } from '@playwright/test';

const base = 'https://field-parts-promise.sociobot.in';
const expectedBuild = '0f05f4d44b88ce3fa69cb3d31133f53b6efb3beb';
const report = {
  checkedAt: new Date().toISOString(),
  base,
  build: '',
  checks: [],
  routes: [],
  newTabs: [],
  requests: [],
  consoleErrors: [],
  pageErrors: []
};

function pass(name, detail = '') {
  report.checks.push({ name, status: 'pass', detail });
}

async function databases(page) {
  return page.evaluate(async () =>
    (await indexedDB.databases())
      .map((database) => database.name)
      .filter(Boolean)
      .sort()
  );
}

function watch(page) {
  page.on('request', (request) => {
    report.requests.push({ method: request.method(), url: request.url() });
  });
  page.on('console', (message) => {
    const expected404Navigation =
      page.url().endsWith('/not-on-this-drawing') &&
      /Failed to load resource: the server responded with a status of 404/.test(
        message.text()
      );
    if (message.type() === 'error' && !expected404Navigation) {
      report.consoleErrors.push(`${page.url()}: ${message.text()}`);
    }
  });
  page.on('pageerror', (error) => {
    report.pageErrors.push(`${page.url()}: ${error.message}`);
  });
}

const browser = await chromium.launch();

try {
  const health = await fetch(`${base}/health`).then((response) => {
    assert.equal(response.status, 200);
    return response.json();
  });
  assert.equal(health.status, 'ok');
  assert.equal(health.database, 'sqlite');
  assert.equal(health.build_sha, expectedBuild);
  report.build = health.build_sha;
  pass('deployed build identity', health.build_sha);

  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    serviceWorkers: 'allow'
  });
  const mobile = await mobileContext.newPage();
  watch(mobile);
  await mobile.goto(`${base}/`, { waitUntil: 'networkidle' });
  assert.equal(await mobile.title(), 'Parts Promise — Allocate parts to each job');
  assert.equal(
    await mobile.locator('h1').innerText(),
    'Promise dates from parts held for the job'
  );
  assert.equal(
    await mobile.getByRole('link', { name: 'Try it with sample data' }).isVisible(),
    true
  );
  assert.equal(
    await mobile.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    true
  );
  await mobile.screenshot({ path: '.factory/evidence/polish-8/live/cold-mobile.png' });
  pass('cold 390 px first screen', 'headline, audience, sample action, facts, and no horizontal overflow');

  await mobile
    .getByLabel('Main navigation')
    .getByRole('link', { name: 'Privacy' })
    .click();
  await mobile.waitForURL(`${base}/privacy`);
  await mobile.waitForFunction(
    () => document.title === 'Privacy — Parts Promise'
  );
  assert.equal(await mobile.title(), 'Privacy — Parts Promise');
  assert.equal(
    await mobile.locator('h1').evaluate((heading) => document.activeElement === heading),
    true
  );
  await mobile.goBack();
  await mobile.waitForFunction(
    () => document.title === 'Parts Promise — Allocate parts to each job'
  );
  assert.equal(await mobile.title(), 'Parts Promise — Allocate parts to each job');
  assert.equal(
    await mobile.locator('h1').evaluate((heading) => document.activeElement === heading),
    true
  );
  pass('live route focus and browser history', 'Privacy and Back focus the destination H1');
  await mobileContext.close();

  const demoContext = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    serviceWorkers: 'allow'
  });
  const demo = await demoContext.newPage();
  watch(demo);
  await demo.goto(`${base}/demo`, { waitUntil: 'networkidle' });
  await demo.waitForFunction(
    () => document.documentElement.dataset.workspaceReady === 'true'
  );
  assert.equal(await demo.title(), 'Demo — Parts Promise');
  assert.match(await demo.getByLabel('Demo workspace').innerText(), /nothing is saved/i);
  assert.deepEqual(await databases(demo), ['parts-promise-demo-v1']);
  pass('direct demo entry', 'banner shown and only parts-promise-demo-v1 exists');

  const demoLinks = [
    {
      name: 'header Jobs',
      link: demo.getByLabel('Main navigation').getByRole('link', { name: 'Jobs' }),
      path: '/jobs?demo=1'
    },
    {
      name: 'header Privacy',
      link: demo.getByLabel('Main navigation').getByRole('link', { name: 'Privacy' }),
      path: '/privacy?demo=1'
    },
    {
      name: 'footer Privacy',
      link: demo.locator('.site-footer').getByRole('link', { name: 'Privacy' }),
      path: '/privacy?demo=1'
    },
    {
      name: 'footer Terms',
      link: demo.locator('.site-footer').getByRole('link', { name: 'Terms' }),
      path: '/terms?demo=1'
    }
  ];

  for (const item of demoLinks) {
    assert.equal(await item.link.getAttribute('href'), item.path);
    const openedPage = demoContext.waitForEvent('page');
    await item.link.click({ modifiers: ['Control'] });
    const tab = await openedPage;
    watch(tab);
    await tab.waitForLoadState('domcontentloaded');
    await tab.waitForFunction(
      () => document.documentElement.dataset.workspaceReady === 'true'
    );
    assert.equal(new URL(tab.url()).pathname + new URL(tab.url()).search, item.path);
    assert.equal(await tab.getByLabel('Demo workspace').isVisible(), true);
    assert.deepEqual(await databases(tab), ['parts-promise-demo-v1']);
    report.newTabs.push({
      link: item.name,
      href: item.path,
      banner: true,
      databases: await databases(tab)
    });
    if (item.name === 'header Jobs') {
      await tab.screenshot({
        path: '.factory/evidence/polish-8/live/demo-new-tab.png',
        fullPage: true
      });
    }
    await tab.close();
    await demo.bringToFront();
  }
  pass('demo internal hrefs are reactive', 'all four rendered hrefs include demo=1');
  pass('native new-tab demo isolation', 'all four new tabs retain the banner and only the demo database');

  for (const path of [
    '/demo',
    '/jobs?demo=1',
    '/privacy?demo=1',
    '/terms?demo=1'
  ]) {
    await demo.goto(`${base}${path}`);
    await demo.waitForFunction(
      () => document.documentElement.dataset.workspaceReady === 'true'
    );
    assert.equal(await demo.getByLabel('Demo workspace').isVisible(), true);
    const unsafe = await demo.locator('a[href]:not(.wordmark)').evaluateAll((links) =>
      links
        .map((link) => link.href)
        .filter((target) => {
          const url = new URL(target);
          return (
            url.origin === window.location.origin &&
            url.pathname !== '/demo' &&
            url.searchParams.get('demo') !== '1'
          );
        })
    );
    assert.deepEqual(unsafe, []);
    assert.deepEqual(await databases(demo), ['parts-promise-demo-v1']);
  }
  pass('every rendered demo internal link is safe', 'demo, jobs, privacy, and terms contain no real-mode internal href');

  await demo.goto(`${base}/demo`);
  await demo.evaluate(() => navigator.serviceWorker.ready);
  await demo.reload({ waitUntil: 'networkidle' });
  await demoContext.setOffline(true);
  await demo.reload({ waitUntil: 'domcontentloaded' });
  assert.equal(await demo.getByLabel('Demo workspace').isVisible(), true);
  assert.equal(await demo.locator('h1').innerText(), 'Riverside Dental parts');
  assert.deepEqual(await databases(demo), ['parts-promise-demo-v1']);
  await demo.screenshot({
    path: '.factory/evidence/polish-8/live/demo-offline.png',
    fullPage: true
  });
  pass('live offline demo reload', 'sample, banner, and isolated demo database remain available');
  await demoContext.setOffline(false);
  await demoContext.close();

  const routeContext = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    colorScheme: 'light'
  });
  const routePage = await routeContext.newPage();
  watch(routePage);
  const routes = [
    ['/', 'Parts Promise — Allocate parts to each job', 200],
    ['/demo', 'Demo — Parts Promise', 200],
    ['/jobs', 'Jobs — Parts Promise', 200],
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
    const legalSuffix = path === '/demo' ? '?demo=1' : '';
    assert.equal(
      await routePage
        .locator(`.site-footer a[href="/privacy${legalSuffix}"]`)
        .count() > 0,
      true
    );
    assert.equal(
      await routePage
        .locator(`.site-footer a[href="/terms${legalSuffix}"]`)
        .count() > 0,
      true
    );
    const axe = await new AxeBuilder({ page: routePage }).analyze();
    const serious = axe.violations.filter((violation) =>
      ['serious', 'critical'].includes(violation.impact ?? '')
    );
    assert.deepEqual(serious, []);
    report.routes.push({ path, title, status, axeSeriousCritical: 0 });
  }
  pass('live route, title, landmark, legal-link, 404, and Axe sweep', '10 routes, no serious or critical Axe violations');

  await routePage.goto(`${base}/`);
  await routePage.evaluate(() => localStorage.setItem('parts-promise-theme', 'dark'));
  await routePage.reload({ waitUntil: 'networkidle' });
  const darkAxe = await new AxeBuilder({ page: routePage }).analyze();
  assert.deepEqual(
    darkAxe.violations.filter((violation) =>
      ['serious', 'critical'].includes(violation.impact ?? '')
    ),
    []
  );
  await routePage.screenshot({
    path: '.factory/evidence/polish-8/live/home-desktop-dark.png',
    fullPage: true
  });
  pass('dark theme Axe sweep', 'no serious or critical violations');
  await routeContext.close();

  const externalRequests = report.requests.filter(
    (request) => new URL(request.url).origin !== new URL(base).origin
  );
  const stateChangingRequests = report.requests.filter(
    (request) => !['GET', 'HEAD'].includes(request.method)
  );
  assert.deepEqual(externalRequests, []);
  assert.deepEqual(stateChangingRequests, []);
  assert.deepEqual(report.consoleErrors, []);
  assert.deepEqual(report.pageErrors, []);
  pass('live privacy and console boundary', 'same-origin GET/HEAD only; no console or page errors');
} finally {
  await browser.close();
}

await writeFile(
  '.factory/evidence/polish-8/live/audit.json',
  `${JSON.stringify(report, null, 2)}\n`
);
console.log(JSON.stringify(report, null, 2));
