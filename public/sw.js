const CACHE = 'parts-promise-shell-v5';
const SHELL = [
  '/',
  '/manifest.webmanifest',
  '/assets/blueprint-hero.svg',
  '/assets/favicon.svg',
  '/fonts/barlow-condensed-latin.woff2',
  '/fonts/atkinson-hyperlegible-next-latin.woff2'
];

async function cacheShell() {
  const cache = await caches.open(CACHE);
  const indexResponse = await fetch('/', { credentials: 'same-origin' });
  const indexHtml = await indexResponse.clone().text();
  await cache.put('/', indexResponse);
  const buildAssets = [
    ...indexHtml.matchAll(/(?:src|href)="(\/assets\/[^\"]+)"/g)
  ].map((match) => match[1]);
  await cache.addAll([
    ...new Set([...SHELL.filter((path) => path !== '/'), ...buildAssets])
  ]);
}

self.addEventListener('install', (event) => {
  event.waitUntil(cacheShell());
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))
        )
      )
  );
  self.clients.claim();
});

self.addEventListener('message', (event) => {
  if (event.data?.type !== 'warm-cache' || !Array.isArray(event.data.assets))
    return;
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      Promise.all(
        event.data.assets.map(async (asset) => {
          try {
            const response = await fetch(asset, { credentials: 'same-origin' });
            if (response.ok) await cache.put(asset, response.clone());
          } catch {
            // The shell remains available if a nonessential warm request fails.
          }
        })
      )
    )
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (
    event.request.method !== 'GET' ||
    url.origin !== self.location.origin ||
    url.pathname.startsWith('/api/') ||
    url.pathname === '/metrics' ||
    url.pathname === '/health'
  )
    return;
  event.respondWith(
    caches.open(CACHE).then((cache) => respond(cache, event.request))
  );
});

async function respond(cache, request) {
  const url = new URL(request.url);
  const fingerprintedAsset =
    url.pathname.startsWith('/assets/') &&
    /-[A-Za-z0-9_-]{8,}\.(?:css|js)$/.test(url.pathname);

  if (fingerprintedAsset) {
    const cached = await cache.match(request.url);
    if (cached) return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      await cache.put(
        request.mode === 'navigate' ? '/' : request,
        response.clone()
      );
    }
    return response;
  } catch (error) {
    const cached = await cache.match(
      request.mode === 'navigate' ? '/' : request.url
    );
    if (cached) return cached;
    throw error;
  }
}
