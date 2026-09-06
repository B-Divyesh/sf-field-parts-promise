import { spawnSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const cleanCheckout = process.argv[2];
if (!cleanCheckout) throw new Error('Pass the clean checkout path.');

const output = path.resolve('/work/repo/.factory/review-artifacts-9/gates');
await mkdir(output, { recursive: true });
const gates = [
  ['npm-test', 'npm test'],
  ['check', 'npm run check'],
  ['format-check', 'npm run format:check'],
  ['clippy', 'cargo clippy --manifest-path server/Cargo.toml --locked --all-targets -- -D warnings'],
  ['npm-audit', 'npm audit --audit-level=high'],
  ['build', 'BUILD_SHA=0f05f4d44b88ce3fa69cb3d31133f53b6efb3beb npm run build'],
  ['e2e-full', 'BUILD_SHA=0f05f4d44b88ce3fa69cb3d31133f53b6efb3beb npm run test:e2e -- --retries=0']
];
const summary = [];

for (const [id, command] of gates) {
  const started = Date.now();
  const result = spawnSync(command, {
    cwd: cleanCheckout,
    encoding: 'utf8',
    shell: true,
    env: { ...process.env, CI: '0' },
    maxBuffer: 30 * 1024 * 1024
  });
  const status = result.status === 0 ? 'PASS' : 'FAIL';
  const durationMs = Date.now() - started;
  await writeFile(
    path.join(output, `${id}.log`),
    [`command: ${command}`, `status: ${status}`, `exit: ${result.status}`, `duration_ms: ${durationMs}`, '', result.stdout ?? '', result.stderr ?? ''].join('\n')
  );
  summary.push({ id, command, status, exit: result.status, durationMs });
  console.log(`${status}\t${id}\t${durationMs}ms`);
}

await writeFile(path.join(output, 'summary.json'), `${JSON.stringify(summary, null, 2)}\n`);
if (summary.some((item) => item.status !== 'PASS')) process.exitCode = 1;
