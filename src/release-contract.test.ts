import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('container release contract', () => {
  it('keeps persistent runtime state local to the one-replica data mount', () => {
    const deploy = JSON.parse(readFileSync('deploy.json', 'utf8')) as {
      deploy: { data_dir: string; replicas: number };
    };
    const dockerfile = readFileSync('Dockerfile', 'utf8');
    const server = readFileSync('server/src/main.rs', 'utf8');

    expect(deploy.deploy).toEqual({ data_dir: '/data', replicas: 1 });
    expect(dockerfile).toContain(
      'COPY --from=runtime-files --chown=nonroot:nonroot /data /data'
    );
    expect(server).toContain('parts-promise.sqlite3');
    expect(server).toContain('vfs=unix-none');
    expect(server).toContain('durable_default');
    expect(server).not.toContain('load_legacy_config');
  });

  it('rejects retired external-state references in runtime source', () => {
    const terms = [
      ['sociobot', '-v2'].join(''),
      ['sociobot', '-db'].join(''),
      ['sociobot', '-keyvault1'].join(''),
      ['shared ', 'post', 'gres'].join(''),
      ['pg', 'bouncer'].join(''),
      ['data', 'base_url'].join('_'),
      ['post', 'gres'].join('')
    ];
    const listing = spawnSync(
      'git',
      ['ls-files', '-co', '--exclude-standard'],
      {
        encoding: 'utf8'
      }
    );

    expect(listing.status).toBe(0);
    const runtimePaths = listing.stdout
      .split('\n')
      .filter(existsSync)
      .filter(
        (path) =>
          path === 'Dockerfile' ||
          path === 'deploy.json' ||
          path === 'package.json' ||
          path === 'playwright.config.ts' ||
          path.startsWith('server/') ||
          path.startsWith('src/') ||
          path.startsWith('e2e/') ||
          path.startsWith('scripts/')
      );

    for (const path of runtimePaths) {
      const source = readFileSync(path, 'utf8');
      for (const term of terms) {
        expect(
          source,
          `${path} contains a retired state reference`
        ).not.toContain(term);
      }
    }
  });

  it('rejects the original stale live health identity', async () => {
    const { verifyLiveIdentity } =
      await import('../scripts/verify-live-identity.mjs');
    const retiredDatabase = ['post', 'gres'].join('');
    const staleHealth = {
      status: 'ok',
      build_sha: '0a8062b86f7cc5a92a550d9538943e8b3fee0c82',
      database: retiredDatabase,
      auth: 'ready'
    };

    await expect(
      verifyLiveIdentity({
        expectedBuildSha: '428afeec1bbbd02272b55d5e98b13b3587df88ce',
        fetchImpl: async () => ({
          ok: true,
          status: 200,
          json: async () => staleHealth
        })
      })
    ).rejects.toThrow('Live deployment identity mismatch');
  });

  it('rejects the verifier 15 parent build even when it reports sqlite', async () => {
    const { verifyLiveIdentity } =
      await import('../scripts/verify-live-identity.mjs');
    const candidate = '6a05b4b12fff6794870ce4d9cd74a4b3ded5095d';
    const staleHealth = {
      status: 'ok',
      build_sha: '90e83f5504fac85a7b5b685819dbef389ba74379',
      database: 'sqlite',
      auth: 'ready'
    };

    await expect(
      verifyLiveIdentity({
        expectedBuildSha: candidate,
        fetchImpl: async () => ({
          ok: true,
          status: 200,
          json: async () => staleHealth
        })
      })
    ).rejects.toThrow(
      `expected build_sha=${candidate} and database=sqlite; received build_sha=${staleHealth.build_sha} and database=sqlite`
    );
  });

  it('uses the rolling stable slim Rust builder image', () => {
    const dockerfile = readFileSync('Dockerfile', 'utf8');
    const rustBuilders = [...dockerfile.matchAll(/^FROM\s+(rust:\S+)/gm)].map(
      (match) => match[1]
    );

    expect(rustBuilders).toEqual(['rust:1-slim']);
    expect(dockerfile).toContain('ARG BUILD_SHA=dev');
    expect(dockerfile).not.toMatch(/COPY\s+\.git|\bgit\s+/);
    expect(dockerfile).toContain('COPY scripts ./scripts');
  });

  it('allows a clean Rust build to finish before browser claims start', () => {
    const config = readFileSync('playwright.config.ts', 'utf8');
    const claims = readFileSync('e2e/claims.spec.ts', 'utf8');
    const containerClaim = claims.slice(
      claims.indexOf('@claim:container-runtime')
    );

    expect(config).toContain('timeout: 600_000');
    expect(config).not.toContain('globalSetup:');
    expect(containerClaim).toContain('test.setTimeout(15_000)');
    expect(containerClaim).not.toContain('cargo build');
    expect(containerClaim).not.toContain("'cargo'");
  });

  it('makes every claim command install-safe in a clean clone', () => {
    const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as {
      scripts: Record<string, string>;
    };
    const bootstrap = readFileSync(
      'scripts/ensure-e2e-dependencies.mjs',
      'utf8'
    );

    expect(packageJson.scripts['test:e2e']).toBe(
      'node scripts/ensure-e2e-dependencies.mjs && playwright test'
    );
    expect(bootstrap).toContain('node_modules/@playwright/test/package.json');
    expect(bootstrap).toContain("spawnSync(npm, ['ci']");
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

describe('round 6 public wording', () => {
  it('describes unavailable checkout and runtime settings in plain words', () => {
    const app = readFileSync('src/App.svelte', 'utf8');
    const readme = readFileSync('README.md', 'utf8');

    expect(app).toContain('<h2 id="pricing-title">Firm plan pricing</h2>');
    expect(app).not.toContain('Pay for the firm plan');
    expect(readme).toContain('Export allows five requests per minute');
    expect(readme).toContain(
      'The server starts without extra environment settings.'
    );
    expect(readme).not.toContain('critical bucket');
    expect(readme).not.toContain('optional override');
  });
});

describe('round 7 README wording', () => {
  it('explains sync retries and offline edits without implementation jargon', () => {
    const readme = readFileSync('README.md', 'utf8');

    expect(readme).toContain(
      'Retrying the same saved change does not create a duplicate.'
    );
    expect(readme).toContain(
      'Offline signed-in edits stay queued in this browser.'
    );
    expect(readme).not.toContain('same operation ID');
    expect(readme).not.toContain('browser database outbox');
  });
});

describe('service worker update contract', () => {
  it('uses a new cache and checks the network before cached documents', () => {
    const worker = readFileSync('public/sw.js', 'utf8');

    expect(worker).toContain("const CACHE = 'parts-promise-shell-v6'");
    expect(worker).toContain("request.mode === 'navigate'");
    expect(worker.indexOf('await fetch(request)')).toBeLessThan(
      worker.indexOf("request.mode === 'navigate' ? '/' : request")
    );
  });

  it('stamps build identity into both app and static 404 surfaces', () => {
    const dockerfile = readFileSync('Dockerfile', 'utf8');
    const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as {
      scripts: Record<string, string>;
    };
    const fallback = readFileSync('public/404.html', 'utf8');

    expect(dockerfile).toContain('ARG BUILD_SHA=dev');
    expect(dockerfile).toContain('ENV BUILD_SHA=${BUILD_SHA}');
    expect(packageJson.scripts['build:web']).toContain('stamp-build.mjs');
    expect(fallback).toContain('Build __BUILD_SHORT_SHA__');
    expect(fallback).toContain('title="__BUILD_SHA__"');
    expect(fallback).toContain('<title>Page not found — Parts Promise</title>');
    expect(fallback).toContain('rel="canonical"');
    expect(fallback).toContain('name="description"');
    expect(fallback).toContain('href="/privacy"');
    expect(fallback).toContain('href="/terms"');
  });
});
