import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';

const base = 'https://field-parts-promise.sociobot.in';
const result = { checkedAt: new Date().toISOString() };

const health = await fetch(`${base}/health`);
result.health = { status: health.status, body: await health.json() };
assert.equal(result.health.status, 200);
assert.equal(result.health.body.build_sha, '40766071e5464eef46db29bf89eb69e818c86128');
assert.equal(result.health.body.database, 'sqlite');

const invalid = await fetch(`${base}/api/v1/bootstrap`, {
  headers: { Authorization: 'Bearer not-a-jwt', 'X-Forwarded-For': '198.51.100.223' }
});
result.invalidToken = { status: invalid.status, wwwAuthenticate: invalid.headers.get('www-authenticate') };
assert.equal(result.invalidToken.status, 401);
assert.equal(result.invalidToken.wwwAuthenticate, 'Bearer');

result.readBurst = await Promise.all(Array.from({ length: 60 }, async () => {
  const response = await fetch(`${base}/api/v1/bootstrap`, {
    headers: { Authorization: 'Bearer not-a-jwt', 'X-Forwarded-For': '198.51.100.224' }
  });
  return { status: response.status, retryAfter: response.headers.get('retry-after') };
}));
assert.equal(result.readBurst.filter((entry) => entry.status === 401).length, 40);
assert.equal(result.readBurst.filter((entry) => entry.status === 429).length, 20);
assert.equal(result.readBurst.filter((entry) => entry.status === 429).every((entry) => Number(entry.retryAfter) > 0), true);

result.exportBurst = await Promise.all(Array.from({ length: 7 }, async () => {
  const response = await fetch(`${base}/api/v1/export`, {
    headers: { Authorization: 'Bearer not-a-jwt', 'X-Forwarded-For': '198.51.100.225' }
  });
  return { status: response.status, retryAfter: response.headers.get('retry-after') };
}));
assert.equal(result.exportBurst.filter((entry) => entry.status === 401).length, 5);
assert.equal(result.exportBurst.filter((entry) => entry.status === 429).length, 2);
assert.equal(result.exportBurst.filter((entry) => entry.status === 429).every((entry) => Number(entry.retryAfter) > 0), true);

result.passed = true;
await writeFile('.factory/verification-artifacts-23/live-backend.json', `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify({
  health: result.health,
  invalidToken: result.invalidToken,
  read: { allowed: result.readBurst.filter((entry) => entry.status === 401).length, limited: result.readBurst.filter((entry) => entry.status === 429).length, retryAfter: [...new Set(result.readBurst.filter((entry) => entry.status === 429).map((entry) => entry.retryAfter))] },
  export: { allowed: result.exportBurst.filter((entry) => entry.status === 401).length, limited: result.exportBurst.filter((entry) => entry.status === 429).length, retryAfter: [...new Set(result.exportBurst.filter((entry) => entry.status === 429).map((entry) => entry.retryAfter))] }
}, null, 2));
