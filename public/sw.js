const CACHE = 'parts-promise-shell-v2';
const SHELL = [
  '/',
  '/manifest.webmanifest',
  '/assets/blueprint-hero.svg',
  '/assets/favicon.svg'
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
  if (
    event.request.method !== 'GET' ||
    new URL(event.request.url).origin !== self.location.origin
  )
    return;
  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(event.request.url);
      if (cached) return cached;
      try {
        const response = await fetch(event.request);
        if (response.ok) {
          await cache.put(event.request, response.clone());
        }
        return response;
      } catch (error) {
        if (event.request.mode === 'navigate') {
          const shell = await cache.match('/');
          if (shell) return shell;
        }
        throw error;
      }
    })
  );
});
