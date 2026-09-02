import { mount } from 'svelte';
import Landing from './Landing.svelte';

const target = document.getElementById('app');

if (!target) {
  throw new Error('The application mount point is missing.');
}
const mountTarget = target;

let workspaceStarted = false;

async function startWorkspace(path?: string) {
  if (workspaceStarted) return;
  workspaceStarted = true;
  if (path) {
    const previous =
      history.state && typeof history.state === 'object'
        ? (history.state as Record<string, unknown>)
        : {};
    history.replaceState(
      {
        ...previous,
        scrollX: Math.round(window.scrollX),
        scrollY: Math.round(window.scrollY)
      },
      '',
      window.location.href
    );
    history.pushState({ scrollX: 0, scrollY: 0 }, '', path);
  }
  const workspaceReady = new Promise<void>((resolve) => {
    window.addEventListener('parts-promise:workspace-ready', () => resolve(), {
      once: true
    });
  });
  const { default: App } = await import('./app-entry');
  mountTarget.replaceChildren();
  mount(App, { target: mountTarget });
  await workspaceReady;
}

const isPublicLanding =
  window.location.pathname === '/' &&
  new URLSearchParams(window.location.search).get('demo') !== '1' &&
  new URLSearchParams(window.location.search).get('signin') !== '1';

if (isPublicLanding)
  mount(Landing, {
    target: mountTarget,
    props: { openWorkspace: startWorkspace }
  });
else await startWorkspace();

if ('serviceWorker' in navigator) {
  void navigator.serviceWorker.register('/sw.js').then(async (registration) => {
    await navigator.serviceWorker.ready;
    const assets = [
      location.href,
      ...Array.from(
        document.querySelectorAll<HTMLScriptElement>('script[src]')
      ).map((script) => script.src),
      ...Array.from(
        document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')
      ).map((link) => link.href),
      ...performance
        .getEntriesByType('resource')
        .map((entry) => entry.name)
        .filter((asset) => new URL(asset).origin === location.origin)
    ];
    registration.active?.postMessage({ type: 'warm-cache', assets });
  });
}
