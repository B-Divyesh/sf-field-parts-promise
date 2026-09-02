import { AxeBuilder } from '@axe-core/playwright';
import { chromium } from 'playwright';

const baseUrl = 'https://field-parts-promise.sociobot.in';
const routes = [
  '/',
  '/?demo=1',
  '/jobs',
  '/auth/callback',
  '/onboarding',
  '/settings/team',
  '/settings/billing',
  '/settings/data',
  '/privacy',
  '/terms',
  '/not-on-this-drawing'
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function waitForText(locator, text) {
  await locator.waitFor({ state: 'visible' });
  for (let attempt = 0; attempt < 100; attempt += 1) {
    if ((await locator.innerText()).includes(text)) return;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error(`Expected ${JSON.stringify(text)} in ${await locator.innerText()}`);
}

const browser = await chromium.launch({ headless: true });
const evidence = {
  baseUrl,
  desktop: {},
  mobile: {},
  offline: {},
  axe: { analyses: 0, seriousOrCritical: [] },
  consoleErrors: [],
  pageErrors: []
};

try {
  const desktopContext = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await desktopContext.newPage();
  const demoRequests = [];
  page.on('request', (request) =>
    demoRequests.push({ method: request.method(), url: request.url() })
  );
  page.on('console', (message) => {
    if (message.type() === 'error') evidence.consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => evidence.pageErrors.push(error.message));

  await page.goto(baseUrl, { waitUntil: 'networkidle' });
  const heading = await page.locator('h1').innerText();
  const audience = await page
    .getByText(
      'For small trade firms that need a parts check before agreeing a visit date.',
      { exact: true }
    )
    .innerText();
  const demoAction = page.getByRole('link', {
    name: 'Try it with sample data'
  });
  await demoAction.focus();
  const focus = await demoAction.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      active: document.activeElement === element,
      outlineColor: style.outlineColor,
      outlineStyle: style.outlineStyle,
      outlineWidth: style.outlineWidth
    };
  });
  await demoAction.press('Enter');
  await waitForText(page.locator('h1'), 'Riverside Dental parts');
  await waitForText(page.locator('.status-plate').first(), 'Date at risk');
  assert(
    (await page.locator('body').innerText()).includes(
      'Demo — sample data; nothing is saved to your local workspace.'
    ),
    'The persistent demo banner is missing.'
  );

  await page.getByTestId('allocate-pump').focus();
  await page.getByTestId('allocate-pump').press('Enter');
  const van = page.getByLabel(/Van 2/);
  await van.focus();
  await van.press('Space');
  const quantity = page.getByLabel('Quantity held');
  await quantity.fill('0');
  const invalidQuantity = await quantity.evaluate((element) => ({
    valid: element.checkValidity(),
    validationMessage: element.validationMessage,
    min: element.getAttribute('min')
  }));
  assert(!invalidQuantity.valid, 'A zero held quantity was accepted.');
  await quantity.fill('1');
  const submit = page.getByRole('button', { name: 'Allocate this quantity' });
  await submit.focus();
  await submit.press('Enter');
  await waitForText(page.locator('.status-plate').first(), 'Parts in hand');
  await page.screenshot({
    path: '.factory/evidence/verification-21/demo-allocated-desktop.png',
    fullPage: true
  });

  await page.getByRole('button', { name: 'Reset demo' }).first().click();
  await page
    .getByRole('dialog', { name: 'Reset the sample job?' })
    .getByRole('button', { name: 'Reset demo' })
    .click();
  await waitForText(page.locator('.status-plate').first(), 'Date at risk');

  const origin = new URL(baseUrl).origin;
  const crossOrigin = demoRequests.filter(
    (request) => new URL(request.url).origin !== origin
  );
  const writes = demoRequests.filter(
    (request) => !['GET', 'HEAD'].includes(request.method)
  );
  assert(crossOrigin.length === 0, `Cross-origin demo requests: ${JSON.stringify(crossOrigin)}`);
  assert(writes.length === 0, `Demo write requests: ${JSON.stringify(writes)}`);
  evidence.desktop = {
    heading,
    audience,
    firstAction: 'Try it with sample data',
    focus,
    invalidQuantity,
    finalStatus: 'Parts in hand',
    resetStatus: 'Date at risk',
    requestCount: demoRequests.length,
    crossOriginRequests: crossOrigin,
    nonReadRequests: writes
  };
  await desktopContext.close();

  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 }
  });
  const mobile = await mobileContext.newPage();
  mobile.on('console', (message) => {
    if (message.type() === 'error') evidence.consoleErrors.push(message.text());
  });
  mobile.on('pageerror', (error) => evidence.pageErrors.push(error.message));
  await mobile.goto(baseUrl, { waitUntil: 'networkidle' });
  const lastFact = mobile.getByText(
    'The firm plan is $39/month plus $8 per active technician.',
    { exact: true }
  );
  const lastFactBox = await lastFact.boundingBox();
  const noHorizontalOverflow = await mobile.evaluate(
    () => document.documentElement.scrollWidth <= window.innerWidth
  );
  assert(lastFactBox && lastFactBox.y + lastFactBox.height <= 844, 'First-screen facts do not fit at 390x844.');
  assert(noHorizontalOverflow, 'The 390px landing page scrolls horizontally.');
  await mobile.screenshot({
    path: '.factory/evidence/verification-21/first-read-mobile.png',
    fullPage: false
  });
  const mobileAction = mobile.getByRole('link', {
    name: 'Try it with sample data'
  });
  await mobileAction.focus();
  await mobileAction.press('Enter');
  await waitForText(mobile.locator('h1'), 'Riverside Dental parts');
  await mobile.getByTestId('allocate-pump').focus();
  await mobile.getByTestId('allocate-pump').press('Enter');
  await mobile.getByLabel(/Van 2/).focus();
  await mobile.getByLabel(/Van 2/).press('Space');
  await mobile.getByLabel('Quantity held').fill('1');
  await mobile.getByRole('button', { name: 'Allocate this quantity' }).focus();
  await mobile.getByRole('button', { name: 'Allocate this quantity' }).press('Enter');
  await waitForText(mobile.locator('.status-plate').first(), 'Parts in hand');
  await mobile.screenshot({
    path: '.factory/evidence/verification-21/demo-allocated-mobile.png',
    fullPage: true
  });
  const smallTargets = await mobile.locator('a:visible, button:visible, input:visible').evaluateAll((items) =>
    items
      .map((item) => {
        const box = item.getBoundingClientRect();
        return { label: item.textContent?.trim() || item.getAttribute('aria-label') || item.getAttribute('name') || item.tagName, width: box.width, height: box.height };
      })
      .filter((item) => item.width < 44 || item.height < 44)
  );
  evidence.mobile = {
    viewport: '390x844',
    firstScreenBottom: lastFactBox.y + lastFactBox.height,
    noHorizontalOverflow,
    keyboardFinalStatus: 'Parts in hand',
    visibleTargetsBelow44px: smallTargets
  };
  await mobileContext.close();

  const offlineContext = await browser.newContext({
    viewport: { width: 390, height: 844 }
  });
  const offlinePage = await offlineContext.newPage();
  await offlinePage.goto(`${baseUrl}/?demo=1`, { waitUntil: 'networkidle' });
  const swBefore = await offlinePage.evaluate(async () => {
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
  await offlineContext.setOffline(true);
  await offlinePage.reload({ waitUntil: 'domcontentloaded' });
  await waitForText(offlinePage.locator('h1'), 'Riverside Dental parts');
  await offlinePage.getByTestId('allocate-pump').click();
  await offlinePage.getByLabel(/Van 2/).check();
  await offlinePage.getByLabel('Quantity held').fill('1');
  await offlinePage.getByRole('button', { name: 'Allocate this quantity' }).click();
  await waitForText(offlinePage.locator('.status-plate').first(), 'Parts in hand');
  evidence.offline = { ...swBefore, reload: true, finalStatus: 'Parts in hand' };
  await offlineContext.close();

  for (const viewport of [
    { name: 'desktop', width: 1440, height: 900 },
    { name: 'mobile', width: 390, height: 844 }
  ]) {
    const context = await browser.newContext({ viewport });
    const scanPage = await context.newPage();
    scanPage.on('console', (message) => {
      if (
        message.type() === 'error' &&
        new URL(scanPage.url()).pathname !== '/not-on-this-drawing'
      )
        evidence.consoleErrors.push(`${viewport.name}: ${message.text()}`);
    });
    scanPage.on('pageerror', (error) => evidence.pageErrors.push(`${viewport.name}: ${error.message}`));
    for (const theme of ['light', 'dark']) {
      for (const route of routes) {
        await scanPage.goto(`${baseUrl}${route}`, { waitUntil: 'domcontentloaded' });
        await scanPage.evaluate((nextTheme) => {
          localStorage.setItem('parts-promise-theme', nextTheme);
        }, theme);
        await scanPage.reload({ waitUntil: 'networkidle' });
        assert((await scanPage.locator('h1').count()) === 1, `${viewport.name} ${theme} ${route}: h1 count`);
        assert((await scanPage.locator('main').count()) === 1, `${viewport.name} ${theme} ${route}: main count`);
        const result = await new AxeBuilder({ page: scanPage }).analyze();
        evidence.axe.analyses += 1;
        for (const issue of result.violations) {
          if (['serious', 'critical'].includes(issue.impact ?? '')) {
            evidence.axe.seriousOrCritical.push({ viewport: viewport.name, theme, route, id: issue.id, impact: issue.impact });
          }
        }
      }
    }
    await context.close();
  }

  const reducedContext = await browser.newContext({ reducedMotion: 'reduce' });
  const reducedPage = await reducedContext.newPage();
  await reducedPage.goto(`${baseUrl}/?demo=1`);
  evidence.reducedMotion = await reducedPage.locator('html').evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue('--motion-row').trim()
  );
  await reducedContext.close();

  assert(evidence.axe.seriousOrCritical.length === 0, 'Axe serious/critical findings exist.');
  assert(
    evidence.mobile.visibleTargetsBelow44px.length === 0,
    `Mobile targets below 44px: ${JSON.stringify(evidence.mobile.visibleTargetsBelow44px)}`
  );
  assert(evidence.consoleErrors.length === 0, `Console errors: ${JSON.stringify(evidence.consoleErrors)}`);
  assert(evidence.pageErrors.length === 0, `Page errors: ${JSON.stringify(evidence.pageErrors)}`);
  assert(evidence.reducedMotion === '0s', 'Reduced motion is not instant.');
  console.log(JSON.stringify(evidence, null, 2));
} finally {
  await browser.close();
}
