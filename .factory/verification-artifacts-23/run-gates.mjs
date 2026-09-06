import { spawnSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const checkout = process.argv[2];
if (!checkout) throw new Error('Pass the clean checkout path.');
const output = '/work/repo/.factory/verification-artifacts-23/gates';
await mkdir(output, { recursive: true });
const sha = 'b6a9c49dd239911807b4f7bcd22f63106244d3f3';
const gates = [
  ['npm-test', 'npm test'],
  ['check', 'npm run check'],
  ['format-check', 'npm run format:check'],
  ['clippy', 'cargo clippy --manifest-path server/Cargo.toml --locked --all-targets -- -D warnings'],
  ['npm-audit', 'npm audit --audit-level=high'],
  ['build', `BUILD_SHA=${sha} npm run build`],
  ['e2e-full', `BUILD_SHA=${sha} npm run test:e2e -- --retries=0 --reporter=list`]
];
const summary = [];

for (const [id, command] of gates) {
  const started = Date.now();
  const result = spawnSync(command, {
    cwd: checkout,
    encoding: 'utf8',
    shell: true,
    env: { ...process.env, CI: '0' },
    maxBuffer: 40 * 1024 * 1024
  });
  const item = { id, command, status: result.status === 0 ? 'PASS' : 'FAIL', exit: result.status, durationMs: Date.now() - started };
  await writeFile(path.join(output, `${id}.log`), [`command: ${command}`, `status: ${item.status}`, `exit: ${item.exit}`, `duration_ms: ${item.durationMs}`, '', result.stdout ?? '', result.stderr ?? ''].join('\n'));
  summary.push(item);
  console.log(`${item.status}\t${id}\t${item.durationMs}ms`);
}

await writeFile(path.join(output, 'summary.json'), `${JSON.stringify(summary, null, 2)}\n`);
if (summary.some((item) => item.status !== 'PASS')) process.exitCode = 1;
