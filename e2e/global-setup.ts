import { execFileSync } from 'node:child_process';

/**
 * Compile the real server before Playwright starts its per-test clocks.
 *
 * The container-runtime claim exercises a spawned binary. Keeping the cold
 * Rust build here means that claim measures server startup and responses,
 * rather than the availability of a warmed compiler cache.
 */
export default function buildRuntimeBinary() {
  execFileSync(
    'cargo',
    ['build', '--manifest-path', 'server/Cargo.toml', '--locked'],
    { cwd: process.cwd(), stdio: 'inherit' }
  );
}
