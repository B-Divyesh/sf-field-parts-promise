import { mount } from 'svelte';
import App from './App.svelte';
import './app.css';

const target = document.getElementById('app');

if (!target) {
  throw new Error('The application mount point is missing.');
}

mount(App, { target });

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
