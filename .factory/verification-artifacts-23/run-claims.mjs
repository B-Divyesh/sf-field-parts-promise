import { spawnSync } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const checkout = process.argv[2];
if (!checkout) throw new Error('Pass the clean checkout path.');
const output = '/work/repo/.factory/verification-artifacts-23/claims';
await mkdir(output, { recursive: true });
const claims = JSON.parse(await readFile(path.join(checkout, '.factory/claims.json'), 'utf8'));
const summary = [];

for (const claim of claims) {
  const started = Date.now();
  const result = spawnSync(claim.test, {
    cwd: checkout,
    encoding: 'utf8',
    shell: true,
    env: { ...process.env, CI: '0' },
    maxBuffer: 30 * 1024 * 1024
  });
  const item = {
    id: claim.id,
    command: claim.test,
    status: result.status === 0 ? 'PASS' : 'FAIL',
    exit: result.status,
    durationMs: Date.now() - started
  };
  await writeFile(
    path.join(output, `${claim.id}.log`),
    [`claim: ${claim.id}`, `command: ${claim.test}`, `status: ${item.status}`, `exit: ${item.exit}`, `duration_ms: ${item.durationMs}`, '', result.stdout ?? '', result.stderr ?? ''].join('\n')
  );
  summary.push(item);
  console.log(`${item.status}\t${claim.id}\t${item.durationMs}ms`);
}

await writeFile('/work/repo/.factory/verification-artifacts-23/claims-summary.json', `${JSON.stringify(summary, null, 2)}\n`);
if (summary.some((item) => item.status !== 'PASS')) process.exitCode = 1;
