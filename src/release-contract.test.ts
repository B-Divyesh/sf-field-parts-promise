import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('container release contract', () => {
  it('uses the rolling stable slim Rust builder image', () => {
    const dockerfile = readFileSync('Dockerfile', 'utf8');
    const rustBuilders = [...dockerfile.matchAll(/^FROM\s+(rust:\S+)/gm)].map(
      (match) => match[1]
    );

    expect(rustBuilders).toEqual(['rust:1-slim']);
    expect(dockerfile).toContain('ARG BUILD_SHA=dev');
    expect(dockerfile).not.toMatch(/COPY\s+\.git|\bgit\s+/);
  });

  it('builds the runtime binary before the timed browser claim', () => {
    const config = readFileSync('playwright.config.ts', 'utf8');
    const setup = readFileSync('e2e/global-setup.ts', 'utf8');
    const claims = readFileSync('e2e/claims.spec.ts', 'utf8');
    const containerClaim = claims.slice(
      claims.indexOf('@claim:container-runtime')
    );

    expect(config).toContain("globalSetup: './e2e/global-setup.ts'");
    expect(setup).toContain("'cargo'");
    expect(setup).toContain(
      "'build', '--manifest-path', 'server/Cargo.toml', '--locked'"
    );
    expect(containerClaim).toContain('test.setTimeout(15_000)');
    expect(containerClaim).not.toContain('cargo build');
    expect(containerClaim).not.toContain("'cargo'");
  });
});

describe('public claims contract', () => {
  it('registers every claim test exactly once and gives every claim an exact command', () => {
    const claims = JSON.parse(
      readFileSync('.factory/claims.json', 'utf8')
    ) as Array<{ id: string; test: string }>;
    const browserTests = readFileSync('e2e/claims.spec.ts', 'utf8');
    const tags = [...browserTests.matchAll(/@claim:([a-z0-9-]+)/g)].map(
      (match) => match[1]
    );

    expect(new Set(claims.map((claim) => claim.id)).size).toBe(claims.length);
    expect([...tags].sort()).toEqual(claims.map((claim) => claim.id).sort());
    for (const claim of claims) {
      expect(tags.filter((tag) => tag === claim.id)).toHaveLength(1);
      expect(claim.test).toContain(`--grep @claim:${claim.id}`);
    }
  });
});

describe('service worker update contract', () => {
  it('uses a new cache and checks the network before cached documents', () => {
    const worker = readFileSync('public/sw.js', 'utf8');

    expect(worker).toContain("const CACHE = 'parts-promise-shell-v3'");
    expect(worker).toContain("request.mode === 'navigate'");
    expect(worker.indexOf('await fetch(request)')).toBeLessThan(
      worker.indexOf("request.mode === 'navigate' ? '/' : request")
    );
  });
});
