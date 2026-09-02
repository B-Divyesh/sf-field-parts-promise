import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';

import { AxeBuilder } from '@axe-core/playwright';
import { chromium } from '@playwright/test';

const baseUrl = 'https://field-parts-promise.sociobot.in';
const expectedBuild = 'a0d9af536f7a981249123658846e74f2e8f9d28e';
const routes = [
  '/',
  '/?demo=1',
  '/jobs',
  '/onboarding',
  '/settings/team',
  '/settings/billing',
  '/settings/data',
  '/privacy',
  '/terms'
];
const results = {
  checkedAt: new Date().toISOString(),
  baseUrl,
  expectedBuild,
  routeMatrix: [],
  keyboard: {},
  recovery: {},
  privacy: {},
  pwa: {}
};

function absolute(path) {
  return new URL(path, baseUrl).toString();
}

function activeNameScript() {
  const active = document.activeElement;
  if (!active) return { tag: '', name: '' };
  const label = active.labels?.[0]?.innerText ?? '';
  return {
    tag: active.tagName,
    name:
      active.getAttribute('aria-label') ||
      label ||
      active.textContent?.trim() ||
      active.getAttribute('value') ||
      '',
    outline: getComputedStyle(active).outline,
    outlineOffset: getComputedStyle(active).outlineOffset
  };
}

async function tabTo(page, pattern, maximum = 120, occurrence = 1) {
  let matches = 0;
  for (let step = 1; step <= maximum; step += 1) {
    await page.keyboard.press('Tab');
    const active = await page.evaluate(activeNameScript);
    if (pattern.test(active.name)) {
      matches += 1;
      if (matches === occurrence) return { ...active, step, occurrence };
    }
  }
  throw new Error(`Keyboard focus did not reach ${pattern}`);
}

const browser = await chromium.launch({ headless: true });
try {
  for (const viewport of [
    { name: 'desktop', width: 1440, height: 900 },
    { name: 'mobile', width: 390, height: 844 }
  ]) {
    for (const theme of ['light', 'dark']) {
      const context = await browser.newContext({
        viewport,
        serviceWorkers: 'block'
      });
      await context.addInitScript((selectedTheme) => {
        localStorage.setItem('parts-promise-theme', selectedTheme);
      }, theme);
      const page = await context.newPage();
      const consoleErrors = [];
      const pageErrors = [];
      page.on('console', (message) => {
        if (message.type() === 'error') consoleErrors.push(message.text());
      });
      page.on('pageerror', (error) => pageErrors.push(error.message));

      for (const route of routes) {
        const response = await page.goto(absolute(route), {
          waitUntil: 'networkidle'
        });
        await page.locator('main h1').waitFor();
        const axe = await new AxeBuilder({ page }).analyze();
        const serious = axe.violations.filter((violation) =>
          ['serious', 'critical'].includes(violation.impact ?? '')
        );
        const metrics = await page.evaluate(() => ({
          lang: document.documentElement.lang,
          theme: document.documentElement.dataset.theme,
          h1: document.querySelectorAll('main h1').length,
          main: document.querySelectorAll('main').length,
          overflow: document.documentElement.scrollWidth - window.innerWidth,
          title: document.title
        }));
        const targetSizes = await page
          .locator('a[href]:visible, button:visible')
          .evaluateAll((elements) =>
            elements.map((element) => {
              const box = element.getBoundingClientRect();
              return {
                name:
                  element.textContent?.trim() ||
                  element.getAttribute('aria-label') ||
                  element.tagName,
                width: box.width,
                height: box.height
              };
            })
          );
        const undersized = targetSizes.filter(
          (target) => target.width < 44 || target.height < 44
        );
        assert.equal(response?.status(), 200, `${route} status`);
        assert.equal(metrics.lang, 'en', `${route} lang`);
        assert.equal(metrics.theme, theme, `${route} theme`);
        assert.equal(metrics.h1, 1, `${route} H1 count`);
        assert.equal(metrics.main, 1, `${route} main count`);
        assert.ok(metrics.overflow <= 0.5, `${route} horizontal overflow`);
        assert.deepEqual(serious, [], `${route} serious/critical Axe findings`);
        if (viewport.name === 'mobile') {
          assert.deepEqual(undersized, [], `${route} undersized targets`);
        }
        results.routeMatrix.push({
          viewport: viewport.name,
          theme,
          route,
          status: response?.status(),
          ...metrics,
          axeSeriousCritical: serious.length,
          targetCount: targetSizes.length,
          undersized
        });
      }
      assert.deepEqual(consoleErrors, [], `${viewport.name}/${theme} console`);
      assert.deepEqual(pageErrors, [], `${viewport.name}/${theme} page errors`);
      await context.close();
    }
  }

  const keyboardContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    serviceWorkers: 'block'
  });
  const keyboardPage = await keyboardContext.newPage();
  await keyboardPage.goto(absolute('/'), { waitUntil: 'networkidle' });
  const skip = await tabTo(keyboardPage, /^Skip to main content$/);
  assert.match(skip.outline, /^rgb\(.+\) solid 3px$/);
  assert.equal(skip.outlineOffset, '3px');
  await keyboardPage.keyboard.press('Enter');
  assert.ok(
    await keyboardPage.evaluate(() =>
      document.querySelector('main')?.contains(document.activeElement)
    )
  );
  await keyboardPage.locator('body').press('Home');
  await keyboardPage.evaluate(() => document.body.focus());
  const sampleAction = await tabTo(
    keyboardPage,
    /^Try it with sample data$/
  );
  await keyboardPage.keyboard.press('Enter');
  await keyboardPage.waitForURL(/\?demo=1$/);
  await keyboardPage
    .getByRole('heading', { name: 'Riverside Dental parts' })
    .waitFor();
  const allocate = await tabTo(keyboardPage, /^Allocate part$/, 120, 3);
  await keyboardPage.keyboard.press('Enter');
  const van = await tabTo(keyboardPage, /^Van 2/);
  await keyboardPage.keyboard.press('Space');
  const submit = await tabTo(keyboardPage, /^Allocate this quantity$/);
  await keyboardPage.keyboard.press('Enter');
  await keyboardPage
    .locator('.status-plate')
    .first()
    .getByText('Parts in hand', { exact: true })
    .waitFor();
  results.keyboard = {
    skip,
    sampleAction,
    allocate,
    van,
    submit,
    outcome: 'Parts in hand'
  };
  await keyboardPage.screenshot({
    path: '.factory/verification-artifacts-19/live-keyboard-mobile.png',
    fullPage: true
  });
  await keyboardContext.close();

  const flowContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    serviceWorkers: 'block'
  });
  const flowPage = await flowContext.newPage();
  const requests = [];
  const flowConsole = [];
  const flowErrors = [];
  flowPage.on('request', (request) => {
    requests.push({
      method: request.method(),
      url: request.url(),
      body: request.postData()
    });
  });
  flowPage.on('console', (message) => {
    if (message.type() === 'error') flowConsole.push(message.text());
  });
  flowPage.on('pageerror', (error) => flowErrors.push(error.message));
  await flowPage.goto(absolute('/'), { waitUntil: 'networkidle' });
  await flowPage.getByRole('link', { name: 'Try it with sample data' }).click();
  await flowPage
    .getByRole('heading', { name: 'Riverside Dental parts' })
    .waitFor();
  await flowPage.getByTestId('allocate-pump').click();
  await flowPage.getByLabel(/Van 2/).check();
  await flowPage.getByLabel('Quantity held').fill('2');
  await flowPage
    .getByRole('button', { name: 'Allocate this quantity' })
    .click();
  const invalidMessage = await flowPage.getByRole('alert').innerText();
  assert.match(invalidMessage, /Only 1 each is still needed/);
  await flowPage.getByLabel('Quantity held').fill('1');
  await flowPage
    .getByRole('button', { name: 'Allocate this quantity' })
    .click();
  await flowPage
    .locator('.status-plate')
    .first()
    .getByText('Parts in hand', { exact: true })
    .waitFor();
  const reorderText = await flowPage.getByTestId('reorder-suggestion').innerText();
  assert.match(reorderText, /No supplier order has been placed/);
  const reset = flowPage.getByRole('button', { name: 'Reset demo' }).first();
  await reset.click();
  const resetDialog = flowPage.getByRole('dialog', {
    name: 'Reset the sample job?'
  });
  assert.ok(await resetDialog.isVisible());
  assert.ok(
    await flowPage.evaluate(
      () => document.activeElement?.closest('dialog') !== null
    )
  );
  await resetDialog
    .getByRole('button', { name: 'Reset demo', exact: true })
    .click();
  await flowPage
    .locator('.status-plate')
    .first()
    .getByText('Date at risk', { exact: true })
    .waitFor();
  assert.deepEqual(flowConsole, [], 'flow console errors');
  assert.deepEqual(flowErrors, [], 'flow page errors');
  const crossOrigin = requests.filter(
    (request) => new URL(request.url).origin !== new URL(baseUrl).origin
  );
  const writes = requests.filter(
    (request) => !['GET', 'HEAD'].includes(request.method) || request.body
  );
  assert.deepEqual(crossOrigin, [], 'cross-origin demo requests');
  assert.deepEqual(writes, [], 'demo writes');
  results.recovery = {
    invalidMessage,
    finalStatus: 'Parts in hand',
    reorderText,
    resetStatus: 'Date at risk'
  };
  results.privacy = {
    requests,
    crossOriginCount: crossOrigin.length,
    writeCount: writes.length,
    consoleErrors: flowConsole,
    pageErrors: flowErrors
  };
  await flowPage.screenshot({
    path: '.factory/verification-artifacts-19/live-demo-after-recovery.png',
    fullPage: true
  });
  await flowContext.close();

  const reducedContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    reducedMotion: 'reduce',
    serviceWorkers: 'block'
  });
  const reducedPage = await reducedContext.newPage();
  await reducedPage.goto(absolute('/?demo=1'));
  results.reducedMotion = await reducedPage.locator('html').evaluate(() => ({
    fast: getComputedStyle(document.documentElement)
      .getPropertyValue('--motion-fast')
      .trim(),
    row: getComputedStyle(document.documentElement)
      .getPropertyValue('--motion-row')
      .trim(),
    status: getComputedStyle(document.documentElement)
      .getPropertyValue('--motion-status')
      .trim()
  }));
  assert.equal(results.reducedMotion.fast, '0s');
  assert.equal(results.reducedMotion.row, '0s');
  assert.equal(results.reducedMotion.status, '0s');
  await reducedContext.close();

  const pwaContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    serviceWorkers: 'allow'
  });
  const pwaPage = await pwaContext.newPage();
  await pwaPage.goto(absolute('/?demo=1'), { waitUntil: 'networkidle' });
  await pwaPage
    .getByRole('heading', { name: 'Riverside Dental parts' })
    .waitFor();
  const workerState = await pwaPage.evaluate(async () => {
    const registration = await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) {
      await new Promise((resolve) =>
        navigator.serviceWorker.addEventListener('controllerchange', resolve, {
          once: true
        })
      );
    }
    await registration.update();
    return {
      controlled: Boolean(navigator.serviceWorker.controller),
      installing: Boolean(registration.installing),
      waiting: Boolean(registration.waiting),
      caches: await caches.keys()
    };
  });
  assert.deepEqual(workerState, {
    controlled: true,
    installing: false,
    waiting: false,
    caches: ['parts-promise-shell-v6']
  });
  await pwaContext.setOffline(true);
  await pwaPage.reload({ waitUntil: 'domcontentloaded' });
  await pwaPage
    .getByRole('heading', { name: 'Riverside Dental parts' })
    .waitFor();
  await pwaPage.getByTestId('allocate-pump').click();
  await pwaPage.getByLabel(/Van 2/).check();
  await pwaPage
    .getByRole('button', { name: 'Allocate this quantity' })
    .click();
  await pwaPage
    .locator('.status-plate')
    .first()
    .getByText('Parts in hand', { exact: true })
    .waitFor();
  results.pwa = { ...workerState, offlineOutcome: 'Parts in hand' };
  await pwaPage.screenshot({
    path: '.factory/verification-artifacts-19/live-demo-mobile-offline.png',
    fullPage: true
  });
  await pwaContext.close();

  await writeFile(
    '.factory/verification-artifacts-19/live-browser.json',
    `${JSON.stringify(results, null, 2)}\n`
  );
  console.log(
    JSON.stringify({
      routeChecks: results.routeMatrix.length,
      keyboard: results.keyboard.outcome,
      privacyRequests: results.privacy.requests.length,
      reducedMotion: results.reducedMotion,
      pwa: results.pwa
    })
  );
} finally {
  await browser.close();
}
