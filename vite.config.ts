import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [svelte()],
  define: {
    __BUILD_SHA__: JSON.stringify(
      process.env.BUILD_SHA ??
        process.env.GIT_SHA ??
        process.env.SOURCE_COMMIT ??
        'dev'
    )
  },
  server: {
    proxy: {
      '/api': 'http://127.0.0.1:4174',
      '/health': 'http://127.0.0.1:4174',
      '/metrics': 'http://127.0.0.1:4174'
    }
  },
  preview: {
    proxy: {
      '/api': 'http://127.0.0.1:4174',
      '/health': 'http://127.0.0.1:4174',
      '/metrics': 'http://127.0.0.1:4174'
    }
  },
  build: {
    target: 'es2022'
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts']
  }
});
