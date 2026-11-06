import assert from 'node:assert/strict';
import { test } from 'node:test';
import { cloudOptions } from './service.js';
import { consume, retry } from './delivery.js';

const env = { TURSO_DATABASE_URL: 'libsql://example.turso.io', TURSO_AUTH_TOKEN: 'server-only',
  VAPID_PUBLIC_KEY: 'public', VAPID_PRIVATE_KEY: 'private', VAPID_SUBJECT: 'mailto:test@example.com',
  VERCEL_PROJECT_PRODUCTION_URL: 'neuroin.example' };

test('Vercel exige banco remoto, VAPID e origem HTTPS, sem fallback efêmero', () => {
  for (const missing of ['TURSO_DATABASE_URL', 'TURSO_AUTH_TOKEN', 'VAPID_PRIVATE_KEY', 'VERCEL_PROJECT_PRODUCTION_URL']) {
    assert.throws(() => cloudOptions({ ...env, [missing]: undefined }));
  }
  assert.throws(() => cloudOptions({ ...env, TURSO_DATABASE_URL: 'file:/tmp/db.sqlite' }));
  assert.throws(() => cloudOptions({ ...env, PUBLIC_ORIGIN: 'http://neuroin.example' }));
  const options = cloudOptions(env);
  assert.equal(options.backgroundProcessing, false);
  assert.equal(options.databasePath, undefined);
  assert.equal(options.publicOrigin, 'https://neuroin.example');
  assert.equal(options.databaseAuthToken, 'server-only');
});

test('consumer reconsulta a fila persistente e só confirma quando não há pendência', async () => {
  const id = '11111111-1111-4111-8111-111111111111';
  let pending = true;
  let calls = 0;
  const service = { async processQueue(requestId?: string) { assert.equal(requestId, id); calls++; }, async hasPendingDelivery() { return pending; } };
  await assert.rejects(() => consume({ requestId: id }, service), /nova tentativa/);
  pending = false;
  await consume({ requestId: id }, service);
  await consume({ requestId: id }, service);
  assert.equal(calls, 3);
  await assert.rejects(() => consume({ requestId: 'arbitrary' }, service), /inválida/);
  assert.equal(calls, 3);
  assert.deepEqual(retry(new Error(), { deliveryCount: 1 }), { afterSeconds: 10 });
  assert.deepEqual(retry(new Error(), { deliveryCount: 11 }), { afterSeconds: 80 });
  assert.deepEqual(retry(new Error(), { deliveryCount: 12 }), { acknowledge: true });
});
