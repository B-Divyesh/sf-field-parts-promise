import { AxeBuilder } from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('public and app routes have no serious accessibility findings', async ({
  page
}) => {
  for (const theme of ['light', 'dark']) {
    for (const route of [
      '/',
      '/?demo=1',
      '/jobs',
      '/privacy',
      '/terms',
      '/not-on-this-drawing'
    ]) {
      await page.goto(route);
      await page.evaluate((nextTheme) => {
        localStorage.setItem('parts-promise-theme', nextTheme);
      }, theme);
      await page.reload();
      await expect(page.locator('main')).toBeVisible();
      await expect(page.locator('h1')).toHaveCount(1);
      const results = await new AxeBuilder({ page }).analyze();
      expect(
        results.violations
          .filter((issue) =>
            ['serious', 'critical'].includes(issue.impact ?? '')
          )
          .map((issue) => `${theme}:${route}:${issue.id}`)
      ).toEqual([]);
    }
  }
});

test('public routes load without console errors and internal links resolve', async ({
  page,
  request
}) => {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  const links = await page
    .locator('a[href]')
    .evaluateAll((anchors) =>
      anchors.map((anchor) => (anchor as HTMLAnchorElement).href)
    );
  const origin = new URL(page.url()).origin;
  for (const link of links.filter((link) => new URL(link).origin === origin)) {
    const response = await request.get(link);
    expect(response.ok(), link).toBe(true);
  }
  expect(consoleErrors).toEqual([]);
  expect(pageErrors).toEqual([]);
});

test('each route owns one correct metadata set', async ({ page }) => {
  const routes = [
    {
      path: '/',
      title: 'Parts Promise — Hold parts for each job',
      description: 'Promise job dates from parts held for the job.',
      canonical: 'https://field-parts-promise.sociobot.in/'
    },
    {
      path: '/privacy',
      title: 'Privacy — Parts Promise',
      description: 'How Parts Promise handles local data.',
      canonical: 'https://field-parts-promise.sociobot.in/privacy'
    },
    {
      path: '/demo',
      title: 'Demo — Parts Promise',
      description: 'Sample job card for Parts Promise.',
      canonical: 'https://field-parts-promise.sociobot.in/demo'
    }
  ];
  for (const route of routes) {
    await page.goto(route.path);
    await expect(page).toHaveTitle(route.title);
    for (const selector of [
      'meta[name="description"]',
      'link[rel="canonical"]',
      'meta[property="og:title"]',
      'meta[property="og:description"]',
      'meta[name="twitter:title"]',
      'meta[name="twitter:description"]'
    ]) {
      await expect(page.locator(selector)).toHaveCount(1);
    }
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      'content',
      route.description
    );
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      route.canonical
    );
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
      'content',
      route.title
    );
    await expect(
      page.locator('meta[name="twitter:description"]')
    ).toHaveAttribute('content', route.description);
  }

  await page.goto('/jobs/not-a-real-job');
  await expect(
    page.getByRole('heading', { name: 'Page not found' })
  ).toBeVisible();
  await expect(page).toHaveTitle('Page not found — Parts Promise');
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
    'content',
    'Page not found — Parts Promise'
  );
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    'content',
    'The requested Parts Promise page is not available.'
  );
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    'https://field-parts-promise.sociobot.in/'
  );
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    'content',
    'noindex'
  );
});

test('each work form expands, becomes visible, receives focus, and restores its trigger', async ({
  page
}, testInfo) => {
  test.skip(
    testInfo.project.name !== 'mobile-chromium',
    'Disclosure geometry runs at the phone viewport.'
  );

  const checkDisclosure = async (
    trigger: import('@playwright/test').Locator,
    sheetId: string,
    heading: string
  ) => {
    await trigger.click();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    const sheet = page.locator(`#${sheetId}`);
    const title = sheet.getByRole('heading', { name: heading });
    await expect(title).toBeFocused();
    await expect
      .poll(async () => {
        const box = await title.boundingBox();
        return (
          box !== null && box.y >= 0 && box.y < 422 && box.y + box.height <= 844
        );
      })
      .toBe(true);
    await sheet.getByRole('button', { name: 'Close' }).click();
    await expect(trigger).toBeFocused();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  };

  await page.goto('/jobs?demo=1');
  await checkDisclosure(
    page.getByRole('button', { name: 'Add a job' }),
    'add-job-sheet',
    'Add a job and its first required part'
  );
  await page.getByRole('link', { name: 'Review parts' }).click();
  await checkDisclosure(
    page.getByRole('button', { name: 'Edit job' }),
    'edit-job-sheet',
    'Edit this job'
  );
  await checkDisclosure(
    page
      .getByLabel('Parts held for this job')
      .getByRole('button', { name: 'Add required part' }),
    'add-part-sheet',
    'Add a required part'
  );
  await checkDisclosure(
    page.getByTestId('allocate-pump'),
    'allocation-sheet',
    'Allocate Condensate pump'
  );
  await checkDisclosure(
    page
      .getByTestId('part-req-pump')
      .getByRole('button', { name: 'Check supplier date' }),
    'supplier-sheet',
    'Attach supplier order evidence'
  );
  await checkDisclosure(
    page.getByRole('button', { name: 'Add a source' }),
    'source-sheet',
    'Add a source'
  );
});

test('forward and browser-history route changes focus the new heading', async ({
  page
}) => {
  const headingHasFocus = () =>
    page.evaluate(
      () => document.activeElement === document.querySelector('main h1')
    );
  await page.goto('/');
  await page
    .getByLabel('Main navigation')
    .getByRole('link', { name: 'Privacy' })
    .click();
  await expect(page.locator('h1')).toHaveText('How Parts Promise handles data');
  await expect.poll(headingHasFocus).toBe(true);
  await page.goBack();
  await expect(page.locator('h1')).toHaveText(
    'Promise dates from parts held for the job'
  );
  await expect.poll(headingHasFocus).toBe(true);
  await page
    .getByLabel('Main navigation')
    .getByRole('link', { name: 'Demo' })
    .click();
  await expect(page.locator('h1')).toHaveText('Riverside Dental parts');
  await expect.poll(headingHasFocus).toBe(true);
  await page
    .getByLabel('Main navigation')
    .getByRole('link', { name: 'Jobs' })
    .click();
  await page.getByRole('link', { name: 'Review parts' }).click();
  await expect.poll(headingHasFocus).toBe(true);
  await page.goBack();
  await expect(page.locator('h1')).toHaveText('Jobs and their parts status');
  await expect.poll(headingHasFocus).toBe(true);
});

test('demo deep link, history focus, keyboard allocation, and reset work on a phone', async ({
  page
}, testInfo) => {
  test.skip(
    testInfo.project.name !== 'mobile-chromium',
    'Phone behavior runs on the mobile project.'
  );
  await page.goto('/jobs?demo=1');
  await expect(
    page.getByRole('heading', { name: 'Jobs and their parts status' })
  ).toBeVisible();
  await page.getByRole('link', { name: 'Review parts' }).click();
  await expect(page.locator('h1')).toHaveText('Riverside Dental parts');
  expect(
    await page.evaluate(
      () => document.activeElement === document.querySelector('main h1')
    )
  ).toBe(true);
  await page.goBack();
  await expect(page.locator('h1')).toHaveText('Jobs and their parts status');
  expect(
    await page.evaluate(
      () => document.activeElement === document.querySelector('main h1')
    )
  ).toBe(true);
  await page.getByRole('link', { name: 'Review parts' }).press('Enter');
  await page.getByTestId('allocate-pump').press('Enter');
  await page.getByLabel(/Van 2/).check();
  await page.getByRole('button', { name: 'Hold this quantity' }).press('Enter');
  await expect(page.locator('.status-plate').first()).toContainText(
    'Parts in hand'
  );
});

test('demo confirmation dialogs are modal and restore keyboard focus', async ({
  page
}) => {
  await page.goto('/?demo=1');

  for (const confirmation of [
    {
      trigger: 'Reset demo',
      heading: 'Reset the sample job?',
      cancel: 'Keep changes'
    },
    {
      trigger: 'Start for real',
      heading: 'Leave the sample workspace?',
      cancel: 'Stay in demo'
    }
  ]) {
    const trigger = page
      .getByRole('button', { name: confirmation.trigger })
      .first();
    await trigger.focus();
    await trigger.press('Enter');
    const dialog = page.getByRole('dialog', { name: confirmation.heading });
    await expect(dialog).toBeVisible();
    await expect
      .poll(() =>
        page.evaluate(() => document.activeElement?.closest('dialog') !== null)
      )
      .toBe(true);
    for (let step = 0; step < 5; step += 1) {
      await page.keyboard.press('Tab');
      expect(
        await page.evaluate(
          () => document.activeElement?.closest('dialog') !== null
        )
      ).toBe(true);
    }
    await dialog.getByRole('button', { name: confirmation.cancel }).click();
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  }
});

test('all phone links and verifier-reported controls provide separated 44px touch targets', async ({
  page
}, testInfo) => {
  test.skip(
    testInfo.project.name !== 'mobile-chromium',
    'Touch geometry runs at the phone viewport.'
  );
  const assertTouchTarget = async (
    locator: import('@playwright/test').Locator,
    name: string
  ) => {
    const box = await locator.boundingBox();
    expect(box, `${name} is visible`).not.toBeNull();
    expect(box!.width, `${name} width`).toBeGreaterThanOrEqual(44);
    expect(box!.height, `${name} height`).toBeGreaterThanOrEqual(44);
  };

  for (const theme of ['light', 'dark']) {
    await page.goto('/');
    await page.evaluate((nextTheme) => {
      localStorage.setItem('parts-promise-theme', nextTheme);
    }, theme);
    for (const route of [
      '/',
      '/?demo=1',
      '/jobs',
      '/privacy',
      '/terms',
      '/not-on-this-drawing'
    ]) {
      await page.goto(route);
      await expect(page.locator('main')).toBeVisible();
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme);

      for (const [index, link] of (
        await page.locator('a[href]:visible').all()
      ).entries()) {
        const label = (await link.textContent())?.trim() || `link ${index + 1}`;
        await assertTouchTarget(link, `${theme} ${route} ${label}`);
      }

      for (const group of await page
        .locator('.site-header, .site-footer div, .hero-actions')
        .all()) {
        const targets = await group
          .locator('a[href], button')
          .evaluateAll((items) =>
            items.map((item) => {
              const rect = item.getBoundingClientRect();
              return {
                label:
                  item.textContent?.trim() ||
                  item.getAttribute('aria-label') ||
                  'control',
                left: rect.left,
                right: rect.right,
                top: rect.top,
                bottom: rect.bottom
              };
            })
          );
        for (let first = 0; first < targets.length; first += 1) {
          for (let second = first + 1; second < targets.length; second += 1) {
            const horizontalGap = Math.max(
              targets[first].left - targets[second].right,
              targets[second].left - targets[first].right,
              0
            );
            const verticalGap = Math.max(
              targets[first].top - targets[second].bottom,
              targets[second].top - targets[first].bottom,
              0
            );
            expect(
              Math.hypot(horizontalGap, verticalGap),
              `${theme} ${route} ${targets[first].label} and ${targets[second].label} spacing`
            ).toBeGreaterThanOrEqual(8);
          }
        }
      }
    }
  }

  await page.goto('/?demo=1');
  await assertTouchTarget(page.locator('.theme-toggle'), 'theme');
  await assertTouchTarget(
    page.getByRole('button', { name: 'Reset demo' }).first(),
    'Reset demo'
  );
  await assertTouchTarget(
    page.getByRole('button', { name: 'Start for real' }),
    'Start for real'
  );
  for (const [index, control] of (
    await page.getByRole('button', { name: 'Remove allocation' }).all()
  ).entries()) {
    await assertTouchTarget(control, `Remove allocation ${index + 1}`);
  }

  await page.getByTestId('allocate-pump').click();
  await page.getByLabel(/Van 2/).check();
  await page.getByRole('button', { name: 'Hold this quantity' }).click();
  await assertTouchTarget(page.locator('.toast button'), 'toast dismiss');
});

test('how-it-works descriptions use the mobile card width', async ({
  page
}, testInfo) => {
  test.skip(
    testInfo.project.name !== 'mobile-chromium',
    'Mobile layout geometry runs at 390px.'
  );
  await page.goto('/');
  for (const card of await page.locator('.how-section li').all()) {
    const cardBox = await card.boundingBox();
    const descriptionBox = await card.locator('span').boundingBox();
    expect(cardBox).not.toBeNull();
    expect(descriptionBox).not.toBeNull();
    expect(descriptionBox!.width).toBeGreaterThan(cardBox!.width * 0.75);
  }
});

test('privacy copy states the registered network and camera behavior', async ({
  page
}) => {
  await page.goto('/privacy');
  await expect(
    page.getByRole('heading', { name: 'Demo requests' })
  ).toBeVisible();
  await expect(page.locator('.legal-copy')).toContainText(
    'The demo makes only same-origin GET requests'
  );
  await expect(page.locator('.legal-copy')).toContainText(
    'never asks for camera access'
  );
});

test('reduced motion declares an instant transition path', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/?demo=1');
  await expect(page.locator('h1')).toBeVisible();
  expect(
    await page
      .locator('html')
      .evaluate(() =>
        getComputedStyle(document.documentElement)
          .getPropertyValue('--motion-row')
          .trim()
      )
  ).toBe('0s');
});

test('the current service worker controls the app without a pending update', async ({
  page
}, testInfo) => {
  test.skip(
    testInfo.project.name !== 'chromium',
    'Service-worker update evidence runs once on desktop Chromium.'
  );
  await page.goto('/?demo=1');
  const state = await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) {
      await new Promise<void>((resolve) =>
        navigator.serviceWorker.addEventListener(
          'controllerchange',
          () => resolve(),
          {
            once: true
          }
        )
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
  expect(state.controlled).toBe(true);
  expect(state.installing).toBe(false);
  expect(state.waiting).toBe(false);
  expect(state.caches).toEqual(['parts-promise-shell-v3']);
});
