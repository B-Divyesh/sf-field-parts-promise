import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';

import { chromium } from '@playwright/test';

const base = 'https://field-parts-promise.sociobot.in';
const out = '.factory/verification-artifacts-23';
const results = { checkedAt: new Date().toISOString(), recovery: {}, privacy: {}, keyboard: {}, reducedMotion: {}, pwa: {}, textResize: {}, passed: false };
const browser = await chromium.launch({ headless: true });

async function tabTo(page, pattern, occurrence = 1) {
  let matches = 0;
  for (let step = 1; step <= 140; step += 1) {
    await page.keyboard.press('Tab');
    const name = await page.evaluate(() => {
      const active = document.activeElement;
      return active?.getAttribute('aria-label') || active?.labels?.[0]?.textContent?.trim() || active?.textContent?.trim() || '';
    });
    if (pattern.test(name)) {
      matches += 1;
      if (matches === occurrence) return { name, step };
    }
  }
  throw new Error(`Keyboard focus did not reach ${pattern}`);
}

try {
  const flowContext = await browser.newContext({ viewport: { width: 1440, height: 900 }, serviceWorkers: 'block' });
  await flowContext.addInitScript(() => {
    window.cameraRequested = false;
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia: async () => { window.cameraRequested = true; throw new Error('not granted'); } }
    });
  });
  const flow = await flowContext.newPage();
  const requests = [];
  const consoleErrors = [];
  const pageErrors = [];
  flow.on('request', (request) => requests.push({ method: request.method(), url: request.url(), body: request.postData() }));
  flow.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  flow.on('pageerror', (error) => pageErrors.push(error.message));
  await flow.goto(`${base}/?demo=1`, { waitUntil: 'networkidle' });
  await flow.getByTestId('allocate-pump').click();
  await flow.getByLabel(/Van 2/).check();
  await flow.getByLabel('Quantity held').fill('2');
  await flow.getByRole('button', { name: 'Allocate this quantity' }).click();
  const invalidMessage = await flow.getByRole('alert').innerText();
  assert.match(invalidMessage, /Only 1 each is still needed/);
  await flow.getByLabel('Quantity held').fill('1');
  await flow.getByRole('button', { name: 'Allocate this quantity' }).click();
  await flow.waitForFunction(() => document.querySelector('.status-plate')?.textContent?.includes('Parts in hand'));
  await flow.getByRole('button', { name: 'Reset demo' }).first().click();
  const dialog = flow.getByRole('dialog', { name: 'Reset the sample job?' });
  assert.equal(await dialog.isVisible(), true);
  assert.equal(await flow.evaluate(() => Boolean(document.activeElement?.closest('dialog'))), true);
  await dialog.getByRole('button', { name: 'Reset demo', exact: true }).click();
  await flow.waitForFunction(() => document.querySelector('.status-plate')?.textContent?.includes('Date at risk'));
  const origin = new URL(base).origin;
  const crossOrigin = requests.filter((request) => new URL(request.url).origin !== origin);
  const writes = requests.filter((request) => !['GET', 'HEAD'].includes(request.method) || request.body);
  assert.deepEqual(crossOrigin, []);
  assert.deepEqual(writes, []);
  assert.equal(await flow.evaluate(() => window.cameraRequested), false);
  assert.deepEqual(consoleErrors, []);
  assert.deepEqual(pageErrors, []);
  results.recovery = { invalidMessage, resetStatus: 'Date at risk', dialogFocusContained: true };
  results.privacy = { requestCount: requests.length, crossOriginCount: 0, writeCount: 0, cameraRequested: false };
  await flowContext.close();

  const keyboardContext = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
  const keyboard = await keyboardContext.newPage();
  await keyboard.goto(`${base}/`, { waitUntil: 'networkidle' });
  const skip = await tabTo(keyboard, /^Skip to main content$/);
  const focus = await keyboard.evaluate(() => ({ outline: getComputedStyle(document.activeElement).outline, offset: getComputedStyle(document.activeElement).outlineOffset }));
  assert.notEqual(focus.outline, 'none');
  await keyboard.keyboard.press('Enter');
  assert.equal(await keyboard.evaluate(() => document.activeElement?.id), 'main');
  await keyboard.evaluate(() => document.body.focus());
  const sample = await tabTo(keyboard, /^Try it with sample data$/);
  await keyboard.keyboard.press('Enter');
  await keyboard.waitForURL(/demo=1/);
  const allocate = await tabTo(keyboard, /^Allocate part$/, 3);
  await keyboard.keyboard.press('Enter');
  const van = await tabTo(keyboard, /^Van 2/);
  await keyboard.keyboard.press('Space');
  const submit = await tabTo(keyboard, /^Allocate this quantity$/);
  await keyboard.keyboard.press('Enter');
  await keyboard.waitForFunction(() => document.querySelector('.status-plate')?.textContent?.includes('Parts in hand'));
  results.keyboard = { skip, focus, sample, allocate, van, submit, outcome: 'Parts in hand' };
  await keyboard.screenshot({ path: `${out}/keyboard-mobile.png`, fullPage: true });
  await keyboardContext.close();

  const reducedContext = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce', serviceWorkers: 'block' });
  const reduced = await reducedContext.newPage();
  await reduced.goto(`${base}/?demo=1`, { waitUntil: 'networkidle' });
  results.reducedMotion = await reduced.locator('html').evaluate(() => ({
    fast: getComputedStyle(document.documentElement).getPropertyValue('--motion-fast').trim(),
    row: getComputedStyle(document.documentElement).getPropertyValue('--motion-row').trim(),
    status: getComputedStyle(document.documentElement).getPropertyValue('--motion-status').trim()
  }));
  assert.deepEqual(results.reducedMotion, { fast: '0s', row: '0s', status: '0s' });
  await reducedContext.close();

  const resizeContext = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block', bypassCSP: true });
  const resize = await resizeContext.newPage();
  await resize.goto(`${base}/?demo=1`, { waitUntil: 'networkidle' });
  await resize.addStyleTag({ content: 'html { font-size: 200% !important; }' });
  results.textResize = await resize.evaluate(() => ({
    overflow: document.documentElement.scrollWidth - innerWidth,
    innerWidth,
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    h1Visible: Boolean(document.querySelector('h1')?.getBoundingClientRect().height),
    offenders: [...document.querySelectorAll('body *')].map((element) => ({
      tag: element.tagName,
      className: element.className,
      text: element.textContent?.trim().slice(0, 80),
      left: Math.round(element.getBoundingClientRect().left),
      right: Math.round(element.getBoundingClientRect().right)
    })).filter((item) => item.left < 0 || item.right > innerWidth).slice(0, 20)
  }));
  console.log('textResize', results.textResize);
  assert.ok(results.textResize.overflow <= 10);
  assert.equal(results.textResize.h1Visible, true);
  await resize.screenshot({ path: `${out}/mobile-text-200.png`, fullPage: true });
  await resizeContext.close();

  const pwaContext = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'allow' });
  const pwa = await pwaContext.newPage();
  await pwa.goto(`${base}/?demo=1`, { waitUntil: 'networkidle' });
  const worker = await pwa.evaluate(async () => {
    const registration = await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) await new Promise((resolve) => navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true }));
    await registration.update();
    return { controlled: Boolean(navigator.serviceWorker.controller), installing: Boolean(registration.installing), waiting: Boolean(registration.waiting), caches: await caches.keys() };
  });
  assert.equal(worker.controlled, true);
  assert.equal(worker.installing, false);
  assert.equal(worker.waiting, false);
  await pwaContext.setOffline(true);
  await pwa.reload({ waitUntil: 'domcontentloaded' });
  await pwa.getByTestId('allocate-pump').click();
  await pwa.getByLabel(/Van 2/).check();
  await pwa.getByRole('button', { name: 'Allocate this quantity' }).click();
  await pwa.waitForFunction(() => document.querySelector('.status-plate')?.textContent?.includes('Parts in hand'));
  results.pwa = { ...worker, offlineOutcome: 'Parts in hand' };
  await pwa.screenshot({ path: `${out}/demo-mobile-offline.png`, fullPage: true });
  await pwaContext.close();

  results.passed = true;
} finally {
  await browser.close();
}

await writeFile(`${out}/live-boundaries.json`, `${JSON.stringify(results, null, 2)}\n`);
console.log(JSON.stringify(results, null, 2));
