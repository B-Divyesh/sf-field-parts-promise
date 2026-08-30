import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const playwrightPackage = resolve('node_modules/@playwright/test/package.json');

if (!existsSync(playwrightPackage)) {
  process.stderr.write(
    'Browser test dependencies are missing; installing the locked dependency set with npm ci.\n'
  );
  const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const install = spawnSync(npm, ['ci'], { stdio: 'inherit' });
  if (install.status !== 0) process.exit(install.status ?? 1);
}
