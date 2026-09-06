import { spawnSync } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const cleanCheckout = process.argv[2];
if (!cleanCheckout) throw new Error('Pass the clean checkout path.');

const output = path.resolve('/work/repo/.factory/review-artifacts-9/claims');
await mkdir(output, { recursive: true });
const claims = JSON.parse(await readFile(path.join(cleanCheckout, '.factory/claims.json'), 'utf8'));
const summary = [];

for (const claim of claims) {
  const started = Date.now();
  const result = spawnSync(claim.test, {
    cwd: cleanCheckout,
    encoding: 'utf8',
    shell: true,
    env: { ...process.env, CI: '0' },
    maxBuffer: 20 * 1024 * 1024
  });
  const status = result.status === 0 ? 'PASS' : 'FAIL';
  const log = [
    `claim: ${claim.id}`,
    `command: ${claim.test}`,
    `status: ${status}`,
    `exit: ${result.status}`,
    `duration_ms: ${Date.now() - started}`,
    '',
    result.stdout ?? '',
    result.stderr ?? ''
  ].join('\n');
  await writeFile(path.join(output, `${claim.id}.log`), log);
  summary.push({ id: claim.id, command: claim.test, status, exit: result.status, durationMs: Date.now() - started });
  console.log(`${status}\t${claim.id}\t${summary.at(-1).durationMs}ms`);
}

await writeFile(
  path.resolve('/work/repo/.factory/review-artifacts-9/claims-summary.json'),
  `${JSON.stringify(summary, null, 2)}\n`
);

if (summary.some((item) => item.status !== 'PASS')) process.exitCode = 1;
