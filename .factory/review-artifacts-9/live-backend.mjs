import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';

const base = 'https://field-parts-promise.sociobot.in';
const result = { checkedAt: new Date().toISOString() };

const healthResponse = await fetch(`${base}/health`);
result.health = { status: healthResponse.status, body: await healthResponse.json() };
assert.equal(result.health.status, 200);
assert.equal(result.health.body.build_sha, '0f05f4d44b88ce3fa69cb3d31133f53b6efb3beb');

const invalid = await fetch(`${base}/api/v1/bootstrap`, {
  headers: { Authorization: 'Bearer not-a-jwt', 'X-Forwarded-For': '198.51.100.205' }
});
result.invalidToken = {
  status: invalid.status,
  wwwAuthenticate: invalid.headers.get('www-authenticate')
};
assert.equal(result.invalidToken.status, 401);
assert.equal(result.invalidToken.wwwAuthenticate, 'Bearer');

result.readBurst = await Promise.all(
  Array.from({ length: 60 }, async () => {
    const response = await fetch(`${base}/api/v1/bootstrap`, {
      headers: { Authorization: 'Bearer not-a-jwt', 'X-Forwarded-For': '198.51.100.209' }
    });
    return { status: response.status, retryAfter: response.headers.get('retry-after') };
  })
);
assert.equal(result.readBurst.filter((entry) => entry.status === 401).length, 40);
assert.equal(result.readBurst.filter((entry) => entry.status === 429).length, 20);
assert.equal(result.readBurst.filter((entry) => entry.status === 429).every((entry) => Number(entry.retryAfter) > 0), true);

result.exportBurst = await Promise.all(
  Array.from({ length: 7 }, async () => {
    const response = await fetch(`${base}/api/v1/export`, {
      headers: { Authorization: 'Bearer not-a-jwt', 'X-Forwarded-For': '203.0.113.210' }
    });
    return { status: response.status, retryAfter: response.headers.get('retry-after') };
  })
);
assert.equal(result.exportBurst.filter((entry) => entry.status === 401).length, 5);
assert.equal(result.exportBurst.filter((entry) => entry.status === 429).length, 2);
assert.equal(result.exportBurst.filter((entry) => entry.status === 429).every((entry) => Number(entry.retryAfter) > 0), true);

result.passed = true;
await writeFile('.factory/review-artifacts-9/live-backend.json', `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify(result, null, 2));
