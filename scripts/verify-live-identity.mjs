const DEFAULT_BASE_URL = 'https://field-parts-promise.sociobot.in';

/** @param {string} baseUrl */
function healthUrl(baseUrl) {
  return new URL('/health', baseUrl).toString();
}

/**
 * @typedef {(url: string) => Promise<{ok: boolean, status: number, json: () => Promise<any>}>} HealthFetch
 */

/**
 * @param {{baseUrl?: string, expectedBuildSha?: string, fetchImpl?: HealthFetch}} options
 */
export async function verifyLiveIdentity({
  baseUrl = DEFAULT_BASE_URL,
  expectedBuildSha,
  fetchImpl = fetch
} = {}) {
  if (!expectedBuildSha) {
    throw new Error('EXPECTED_BUILD_SHA is required.');
  }

  const response = await fetchImpl(healthUrl(baseUrl));
  if (!response.ok) {
    throw new Error(
      `Live health check failed with HTTP ${response.status} at ${healthUrl(baseUrl)}.`
    );
  }

  const health = await response.json();
  const identityMatches =
    health?.status === 'ok' &&
    health?.build_sha === expectedBuildSha &&
    health?.database === 'sqlite';

  if (!identityMatches) {
    throw new Error(
      `Live deployment identity mismatch: expected build_sha=${expectedBuildSha} and database=sqlite; received build_sha=${String(health?.build_sha)} and database=${String(health?.database)}.`
    );
  }

  return health;
}

async function main() {
  const health = await verifyLiveIdentity({
    baseUrl: process.env.LIVE_URL ?? DEFAULT_BASE_URL,
    expectedBuildSha: process.env.EXPECTED_BUILD_SHA
  });
  process.stdout.write(`${JSON.stringify(health)}\n`);
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  main().catch((error) => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  });
}
