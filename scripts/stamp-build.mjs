import { readFile, writeFile } from 'node:fs/promises';

const rawBuild =
  process.env.BUILD_SHA ??
  process.env.GIT_SHA ??
  process.env.SOURCE_COMMIT ??
  'dev';
const build = /^[A-Za-z0-9._-]+$/.test(rawBuild) ? rawBuild : 'dev';
const path = new URL('../dist/404.html', import.meta.url);
const html = await readFile(path, 'utf8');

await writeFile(
  path,
  html
    .replaceAll('__BUILD_SHORT_SHA__', build.slice(0, 8))
    .replaceAll('__BUILD_SHA__', build)
);
