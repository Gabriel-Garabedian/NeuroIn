import assert from 'node:assert/strict';
import { randomUUID, createECDH } from 'node:crypto';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test, type TestContext } from 'node:test';
import { DatabaseSync } from 'node:sqlite';
import { generateVAPIDKeys } from 'web-push';
import { createApp, type AppOptions } from './app.js';

type Body = {
  device?: { id: string; name: string; role: string } | null;
  peers?: { id: string; name: string }[];
  subscribed?: boolean;
  publicKey?: string | null;
  code?: string;
  expiresAt?: string;
  request?: { id: string; phrase: string; readAt: string | null };
  requests?: { id: string; phrase: string; readAt: string | null; senderName: string }[];
  push?: { accepted: number; failed: number; pending: number };
  accepted?: number;
  failed?: number;
  error?: string;
};
const origin = 'http://127.0.0.1:5173';
const publicKey = createECDH('prime256v1').generateKeys().toString('base64url');
function subscription(token = 'one') {
  return { endpoint: `https://fcm.googleapis.com/fcm/send/${token}`, keys: { p256dh: publicKey, auth: Buffer.alloc(16, 1).toString('base64url') } };
}

async function fixture(t: TestContext, options: Partial<AppOptions> = {}) {
  const directory = await mkdtemp(join(tmpdir(), 'neuroin-api-'));
  const service = await createApp({ databasePath: join(directory, 'db.sqlite'), ...options });
  const server = service.app.listen(0, '127.0.0.1');
  await new Promise<void>((resolve) => server.once('listening', resolve));
  const address = server.address();
  assert.ok(address && typeof address !== 'string');
  const base = `http://127.0.0.1:${address.port}`;
  t.after(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await service.close();
    await rm(directory, { recursive: true, force: true });
  });
  function client(cookie = '') {
    let currentCookie = cookie;
    return {
      get cookie() { return currentCookie; },
      async request(path: string, method = 'GET', data?: unknown, headers: Record<string, string> = {}) {
        const response = await fetch(`${base}${path}`, {
          method,
          headers: { origin, ...(data === undefined ? {} : { 'content-type': 'application/json' }), cookie: currentCookie, ...headers },
          body: data === undefined ? undefined : JSON.stringify(data),
        });
        const setCookie = response.headers.get('set-cookie');
        if (setCookie) currentCookie = setCookie.split(';')[0];
        return { status: response.status, body: await response.json() as Body, headers: response.headers };
      },
    };
  }
  async function device(role: 'support' | 'communicator', name?: string) {
    const c = client();
    const response = await c.request('/api/devices', 'POST', { role, name });
    assert.equal(response.status, 200);
    assert.ok(response.body.device);
    return { ...c, id: response.body.device.id, get cookie() { return c.cookie; } };
  }
  async function pair(support: Awaited<ReturnType<typeof device>>, communicator: Awaited<ReturnType<typeof device>>) {
    const code = await support.request('/api/pairings', 'POST');
    assert.equal(code.status, 200);
    assert.match(code.body.code ?? '', /^[A-Z2-7]{10}$/);
    const result = await communicator.request('/api/pairings/redeem', 'POST', { code: code.body.code });
    assert.equal(result.status, 200);
    return code.body.code;
  }
  return { service, client, device, pair, directory };
}

test('sessão exige cookie aleatório e mutações validam origem e papel imutável', async (t) => {
  const f = await fixture(t);
  const anonymous = f.client();
  const session = await anonymous.request('/api/session');
  assert.equal(session.body.device, null);
  assert.equal(anonymous.cookie, '');
  assert.equal((await anonymous.request('/api/pairings', 'POST')).status, 401);
  assert.equal((await anonymous.request('/api/devices', 'POST', { role: 'support' }, { origin: '' })).status, 403);
  assert.equal((await anonymous.request('/api/devices', 'POST', { role: 'support' }, { origin: 'https://evil.example' })).status, 403);
  const created = await anonymous.request('/api/devices', 'POST', { role: 'support' });
  assert.equal(created.status, 200);
  assert.equal(created.body.device?.name, 'Responsável');
  assert.match(created.headers.get('set-cookie') ?? '', /HttpOnly; SameSite=Strict/);
  assert.match(anonymous.cookie, /^neuroin_device=[\w-]{43}$/);
  assert.equal((await anonymous.request('/api/devices', 'POST', { role: 'communicator' })).status, 409);
  assert.equal((await f.client('neuroin_device=forged').request('/api/pairings', 'POST')).status, 401);
  assert.equal((await anonymous.request('/api/devices', 'POST', { role: 'support', name: 'a'.repeat(81) })).status, 400);
});

test('pareamento expira, é uso único e não permite substituir um vínculo', async (t) => {
  let now = Date.parse('2026-11-06T12:00:00Z');
  const f = await fixture(t, { now: () => now });
  const support = await f.device('support');
  const communicator = await f.device('communicator');
  const code = await support.request('/api/pairings', 'POST');
  now += 600_001;
  assert.equal((await communicator.request('/api/pairings/redeem', 'POST', { code: code.body.code })).status, 400);
  now += 1;
  const activeCode = await f.pair(support, communicator);
  const other = await f.device('communicator');
  assert.equal((await other.request('/api/pairings/redeem', 'POST', { code: activeCode })).status, 400);
  const replacement = await support.request('/api/pairings', 'POST');
  assert.equal((await communicator.request('/api/pairings/redeem', 'POST', { code: replacement.body.code })).status, 409);
  assert.equal((await support.request('/api/session')).body.peers?.[0].id, communicator.id);
});

test('resgate limita força bruta por dispositivo', async (t) => {
  const f = await fixture(t);
  const communicator = await f.device('communicator');
  for (let i = 0; i < 10; i++) {
    assert.equal((await communicator.request('/api/pairings/redeem', 'POST', { code: 'AAAAAAAAAA' })).status, 400);
  }
  assert.equal((await communicator.request('/api/pairings/redeem', 'POST', { code: 'AAAAAAAAAA' })).status, 429);
});

test('pedidos isolam redes, preservam falha push e leitura depende de confirmação', async (t) => {
  const f = await fixture(t);
  const support = await f.device('support', 'Maria');
  const communicator = await f.device('communicator', 'Ana');
  const stranger = await f.device('support', 'Outra rede');
  const other = await f.device('communicator', 'Outro');
  await f.pair(support, communicator);
  await f.pair(stranger, other);
  const id = randomUUID();
  const sent = await communicator.request('/api/requests', 'POST', { id, phrase: 'Preciso de silêncio.' });
  assert.equal(sent.status, 200);
  assert.deepEqual(sent.body.push, { accepted: 0, failed: 1, pending: 0 });
  assert.equal((await support.request('/api/requests')).body.requests?.[0].senderName, 'Ana');
  assert.equal((await support.request(`/api/requests/${id}`)).body.request?.readAt, null);
  assert.equal((await communicator.request(`/api/requests/${id}`)).body.request?.readAt, null);
  assert.equal((await stranger.request(`/api/requests/${id}`)).status, 404);
  assert.equal((await stranger.request(`/api/requests/${id}/read`, 'POST')).status, 404);
  assert.equal((await communicator.request(`/api/requests/${id}/read`, 'POST')).status, 403);
  const read = await support.request(`/api/requests/${id}/read`, 'POST');
  assert.ok(read.body.request?.readAt);
  assert.equal((await communicator.request(`/api/requests/${id}`)).body.request?.readAt, read.body.request?.readAt);
  assert.equal((await stranger.request('/api/requests')).body.requests?.length, 0);
});

test('assinaturas bloqueiam SSRF, chaves inválidas e roubo de endpoint', async (t) => {
  const f = await fixture(t, { sendPush: async () => undefined });
  const support = await f.device('support');
  const other = await f.device('support');
  const communicator = await f.device('communicator');
  for (const endpoint of ['http://fcm.googleapis.com/x', 'https://127.0.0.1/x', 'https://fcm.googleapis.com.evil.example/x', 'https://user@fcm.googleapis.com/x', 'https://fcm.googleapis.com:444/x']) {
    assert.equal((await support.request('/api/subscription', 'PUT', { ...subscription(), endpoint })).status, 400);
  }
  assert.equal((await support.request('/api/subscription', 'PUT', { ...subscription(), keys: { auth: 'bad', p256dh: 'bad' } })).status, 400);
  assert.equal((await communicator.request('/api/subscription', 'PUT', subscription())).status, 403);
  assert.equal((await support.request('/api/subscription', 'PUT', subscription())).status, 200);
  assert.equal((await other.request('/api/subscription', 'PUT', subscription())).status, 409);
  assert.equal((await other.request('/api/subscription', 'PUT', { ...subscription(), endpoint: 'https://FCM.GOOGLEAPIS.COM:443/fcm/send/one' })).status, 409);
  assert.equal((await support.request('/api/session')).body.subscribed, true);
  assert.equal((await support.request('/api/push/test', 'POST')).body.accepted, 1);
  assert.equal((await support.request('/api/subscription', 'DELETE')).status, 200);
  assert.equal((await support.request('/api/push/test', 'POST')).body.accepted, 0);
});

test('push falho recupera com mesmo id sem duplicar envio já aceito', async (t) => {
  let fail = true;
  const payloads: string[] = [];
  const f = await fixture(t, { sendPush: async (_subscription, payload) => {
    if (fail) throw new Error('offline');
    payloads.push(payload);
  } });
  const support = await f.device('support');
  const communicator = await f.device('communicator');
  await f.pair(support, communicator);
  await support.request('/api/subscription', 'PUT', subscription());
  const body = { id: randomUUID(), phrase: 'Quero ajuda.' };
  assert.equal((await communicator.request('/api/requests', 'POST', body)).body.push?.failed, 1);
  fail = false;
  assert.equal((await communicator.request('/api/requests', 'POST', body)).body.push?.accepted, 1);
  assert.equal((await communicator.request('/api/requests', 'POST', body)).body.push?.accepted, 1);
  assert.equal(payloads.length, 1);
  assert.match(payloads[0], /Quero ajuda/);
  assert.equal((await communicator.request('/api/requests', 'POST', { ...body, phrase: 'Outra frase' })).status, 409);
  assert.equal((await support.request('/api/requests')).body.requests?.length, 1);
});

test('concorrência do mesmo pedido não duplica entrega e 410 remove assinatura', async (t) => {
  let sends = 0;
  const f = await fixture(t, { sendPush: async () => {
    sends++;
    await new Promise((resolve) => setTimeout(resolve, 20));
    throw Object.assign(new Error('expired'), { statusCode: 410 });
  } });
  const support = await f.device('support');
  const communicator = await f.device('communicator');
  await f.pair(support, communicator);
  await support.request('/api/subscription', 'PUT', subscription());
  const body = { id: randomUUID(), phrase: 'Ajuda' };
  await Promise.all([communicator.request('/api/requests', 'POST', body), communicator.request('/api/requests', 'POST', body)]);
  assert.equal(sends, 1);
  assert.equal((await support.request('/api/session')).body.subscribed, false);
});

test('desvincular remove acesso e cancela entregas ainda não aceitas', async (t) => {
  let sends = 0;
  let now = Date.now();
  const f = await fixture(t, { now: () => now, sendPush: async () => { sends++; } });
  const support = await f.device('support');
  const communicator = await f.device('communicator');
  await f.pair(support, communicator);
  const id = randomUUID();
  await communicator.request('/api/requests', 'POST', { id, phrase: 'Silêncio' });
  assert.equal((await support.request(`/api/links/${communicator.id}`, 'DELETE')).status, 200);
  await support.request('/api/subscription', 'PUT', subscription());
  now += 60_000;
  await f.service.processQueue();
  assert.equal(sends, 0);
  assert.equal((await support.request(`/api/requests/${id}`)).status, 404);
  assert.equal((await support.request('/api/session')).body.peers?.length, 0);
  assert.equal((await communicator.request('/api/requests', 'POST', { id: randomUUID(), phrase: 'Ajuda' })).status, 409);
});

test('SQLite restaura sessão, pedidos e fila após reinício', async (t) => {
  const directory = await mkdtemp(join(tmpdir(), 'neuroin-restart-'));
  const path = join(directory, 'nested', 'db.sqlite');
  let now = Date.now();
  let sends = 0;
  const first = await fixture(t, { databasePath: path, now: () => now });
  const support = await first.device('support');
  const communicator = await first.device('communicator');
  await first.pair(support, communicator);
  const id = randomUUID();
  await communicator.request('/api/requests', 'POST', { id, phrase: 'Preciso de água' });
  await first.service.close();
  now += 60_000;
  const second = await fixture(t, { databasePath: path, now: () => now, sendPush: async () => { sends++; } });
  t.after(() => rm(directory, { recursive: true, force: true }));
  const restored = second.client(support.cookie);
  assert.equal((await restored.request('/api/session')).body.device?.id, support.id);
  assert.equal((await restored.request('/api/requests')).body.requests?.[0].id, id);
  await restored.request('/api/subscription', 'PUT', subscription());
  await second.service.processQueue();
  assert.equal(sends, 1);
});

test('mudança de vínculo exige selecionar novamente e não cria pedido nem envio', async (t) => {
  const f = await fixture(t);
  const support = await f.device('support');
  const other = await f.device('support');
  const communicator = await f.device('communicator');
  await f.pair(support, communicator);
  await f.pair(other, communicator);
  const id = randomUUID();
  assert.equal((await communicator.request('/api/requests', 'POST', { id, phrase: 'Ajuda', expectedPeers: [support.id] })).status, 409);
  assert.equal((await support.request('/api/requests')).body.requests?.length, 0);
  assert.equal((await communicator.request('/api/requests', 'POST', { id, phrase: 'Ajuda', expectedPeers: 'invalid' })).status, 400);
  assert.equal((await communicator.request('/api/requests', 'POST', { id, phrase: 'Ajuda', expectedPeers: [support.id, other.id] })).status, 200);
});

test('fila respeita backoff e limite de seis tentativas; retry explícito recupera', async (t) => {
  let now = Date.parse('2026-11-06T12:00:00Z');
  let fail = true;
  let sends = 0;
  const f = await fixture(t, { now: () => now, sendPush: async () => { sends++; if (fail) throw new Error('offline'); } });
  const support = await f.device('support');
  const communicator = await f.device('communicator');
  await f.pair(support, communicator);
  await support.request('/api/subscription', 'PUT', subscription());
  const body = { id: randomUUID(), phrase: 'Ajuda' };
  await communicator.request('/api/requests', 'POST', body);
  now += 4999;
  await f.service.processQueue();
  assert.equal(sends, 1);
  now += 1;
  await f.service.processQueue();
  assert.equal(sends, 2);
  for (const delay of [10_000, 20_000, 40_000, 80_000]) { now += delay; await f.service.processQueue(); }
  assert.equal(sends, 6);
  now += 3_600_000;
  await f.service.processQueue();
  assert.equal(sends, 6);
  fail = false;
  assert.equal((await communicator.request('/api/requests', 'POST', body)).body.push?.accepted, 1);
  assert.equal(sends, 7);
});

test('limite por IP permanece após reinício e impede rodízio de dispositivos', async (t) => {
  const directory = await mkdtemp(join(tmpdir(), 'neuroin-ip-'));
  const path = join(directory, 'db.sqlite');
  const first = await fixture(t, { databasePath: path });
  for (let n = 0; n < 3; n++) {
    const communicator = await first.device('communicator');
    for (let i = 0; i < 10; i++) {
      assert.equal((await communicator.request('/api/pairings/redeem', 'POST', { code: 'AAAAAAAAAA' })).status, 400);
    }
  }
  await first.service.close();
  const second = await fixture(t, { databasePath: path });
  t.after(() => rm(directory, { recursive: true, force: true }));
  const fresh = await second.device('communicator');
  assert.equal((await fresh.request('/api/pairings/redeem', 'POST', { code: 'AAAAAAAAAA' })).status, 429);
});

test('produção exige HTTPS, usa cookie Secure e publica somente chave VAPID pública', async (t) => {
  await assert.rejects(async () => createApp({ databasePath: ':memory:', production: true }), /PUBLIC_ORIGIN/);
  await assert.rejects(async () => createApp({ databasePath: ':memory:', production: true, publicOrigin: 'http://example.com' }), /HTTPS/);
  const keys = generateVAPIDKeys();
  const f = await fixture(t, { production: true, publicOrigin: 'https://neuroin.example', vapid: { ...keys, subject: 'mailto:teste@example.com' } });
  const client = f.client();
  const created = await client.request('/api/devices', 'POST', { role: 'support' }, { origin: 'https://neuroin.example' });
  assert.equal(created.status, 200);
  assert.match(created.headers.get('set-cookie') ?? '', /; Secure/);
  assert.equal(created.body.publicKey, keys.publicKey);
  assert.ok(!JSON.stringify(created.body).includes(keys.privateKey));
  assert.equal((await client.request('/api/pairings', 'POST')).status, 403);
  const db = new DatabaseSync(join(f.directory, 'db.sqlite'), { readOnly: true });
  const stored = db.prepare('SELECT token_hash FROM devices').get();
  db.close();
  assert.match(String(stored?.token_hash), /^[0-9a-f]{64}$/);
  assert.notEqual(stored?.token_hash, client.cookie.split('=')[1]);
});

test('gerar novo código revoga o anterior e rejeita corpos inválidos sem salvar', async (t) => {
  const f = await fixture(t);
  const support = await f.device('support');
  const communicator = await f.device('communicator');
  const old = await support.request('/api/pairings', 'POST');
  const fresh = await support.request('/api/pairings', 'POST');
  assert.equal((await communicator.request('/api/pairings/redeem', 'POST', { code: old.body.code })).status, 400);
  assert.equal((await communicator.request('/api/pairings/redeem', 'POST', { code: fresh.body.code })).status, 200);
  for (const body of [{ id: 'bad', phrase: 'Ajuda' }, { id: randomUUID(), phrase: '' }, { id: randomUUID(), phrase: 'a'.repeat(501) }]) {
    assert.equal((await communicator.request('/api/requests', 'POST', body)).status, 400);
  }
  assert.equal((await communicator.request('/api/requests', 'POST', { id: randomUUID(), phrase: 'a'.repeat(9000) })).status, 413);
  assert.equal((await support.request('/api/requests')).body.requests?.length, 0);
});

test('produção separa limite por IP recebido do proxy local confiável', async (t) => {
  const f = await fixture(t, { production: true, publicOrigin: 'https://neuroin.example' });
  const headers = { origin: 'https://neuroin.example', 'x-forwarded-for': '198.51.100.7' };
  for (let i = 0; i < 30; i++) {
    assert.equal((await f.client().request('/api/devices', 'POST', { role: 'support' }, headers)).status, 200);
  }
  assert.equal((await f.client().request('/api/devices', 'POST', { role: 'support' }, headers)).status, 429);
  assert.equal((await f.client().request('/api/devices', 'POST', { role: 'support' }, { ...headers, 'x-forwarded-for': '198.51.100.8' })).status, 200);
});

test('modo serverless não agenda timers locais e exige destino persistente explícito', async (t) => {
  const interval = t.mock.method(globalThis, 'setInterval');
  const timeout = t.mock.method(globalThis, 'setTimeout');
  const service = await createApp({ databasePath: ':memory:', backgroundProcessing: false });
  try {
    assert.equal(interval.mock.callCount(), 0);
    assert.equal(timeout.mock.callCount(), 0);
  } finally {
    interval.mock.restore();
    timeout.mock.restore();
    await service.close();
  }
  await assert.rejects(async () => createApp({ databaseUrl: 'invalid://db', backgroundProcessing: false }), /database|banco|URL|scheme/i);
});

test('serverless agenda retry persistido e encerra pendência após envio ou desvínculo', async (t) => {
  const pending: string[] = [];
  let fail = true;
  const f = await fixture(t, {
    backgroundProcessing: false,
    onPendingRequest: async (id) => { pending.push(id); },
    sendPush: async () => { if (fail) throw new Error('offline'); },
  });
  const support = await f.device('support');
  const communicator = await f.device('communicator');
  await f.pair(support, communicator);
  await support.request('/api/subscription', 'PUT', subscription());
  const body = { id: randomUUID(), phrase: 'Ajuda' };
  const response = await communicator.request('/api/requests', 'POST', body);
  assert.equal(response.status, 200);
  assert.deepEqual(response.body.push, { accepted: 0, failed: 1, pending: 0 });
  assert.deepEqual(pending, [body.id]);
  assert.equal(await f.service.hasPendingDelivery(body.id), true);
  await support.request('/api/requests');
  assert.deepEqual(pending, [body.id]);
  fail = false;
  assert.equal((await communicator.request('/api/requests', 'POST', body)).body.push?.accepted, 1);
  assert.equal(await f.service.hasPendingDelivery(body.id), false);
  assert.deepEqual(pending, [body.id, body.id]);
  fail = true;
  const unlinked = { id: randomUUID(), phrase: 'Água' };
  await communicator.request('/api/requests', 'POST', unlinked);
  assert.equal(await f.service.hasPendingDelivery(unlinked.id), true);
  await support.request(`/api/links/${communicator.id}`, 'DELETE');
  assert.equal(await f.service.hasPendingDelivery(unlinked.id), false);
});

test('falha do agendamento preserva pedido e não confirma recebimento', async (t) => {
  const errors: unknown[][] = [];
  t.mock.method(console, 'error', (...args: unknown[]) => { errors.push(args); });
  const f = await fixture(t, {
    backgroundProcessing: false,
    onPendingRequest: async () => { throw new Error('sensitive-provider-token'); },
  });
  const support = await f.device('support');
  const communicator = await f.device('communicator');
  await f.pair(support, communicator);
  const body = { id: randomUUID(), phrase: 'Preciso de ajuda' };
  const response = await communicator.request('/api/requests', 'POST', body);
  assert.equal(response.status, 200);
  assert.equal(response.body.push?.accepted, 0);
  assert.equal(response.body.push?.failed, 1);
  assert.equal((await support.request('/api/requests')).body.requests?.[0].id, body.id);
  assert.equal(await f.service.hasPendingDelivery(body.id), true);
  assert.equal(errors.length, 1);
  assert.ok(!JSON.stringify(errors).includes('sensitive-provider-token'));
});

test('reativar inscrição agenda novamente um pedido que esgotou as tentativas', async (t) => {
  let now = Date.now();
  const scheduled: string[] = [];
  const f = await fixture(t, { backgroundProcessing: false, now: () => now,
    onPendingRequest: async (id) => { scheduled.push(id); }, sendPush: async () => { throw new Error('offline'); } });
  const support = await f.device('support');
  const communicator = await f.device('communicator');
  await f.pair(support, communicator);
  const id = randomUUID();
  await communicator.request('/api/requests', 'POST', { id, phrase: 'Ajuda' });
  for (const delay of [5000, 10000, 20000, 40000, 80000]) { now += delay; await f.service.processQueue(id); }
  assert.equal(await f.service.hasPendingDelivery(id), false);
  await support.request('/api/subscription', 'PUT', subscription());
  assert.equal(await f.service.hasPendingDelivery(id), true);
  assert.deepEqual(scheduled, [id, id]);
});

test('duas instâncias compartilham banco, sessão e deduplicação atômica', async (t) => {
  let sends = 0;
  const sendPush = async () => { sends++; await new Promise((resolve) => setTimeout(resolve, 20)); };
  const first = await fixture(t, { backgroundProcessing: false, sendPush });
  const second = await fixture(t, { databasePath: join(first.directory, 'db.sqlite'), backgroundProcessing: false, sendPush });
  const support = await first.device('support');
  const communicator = await first.device('communicator');
  await first.pair(support, communicator);
  await support.request('/api/subscription', 'PUT', subscription());
  const body = { id: randomUUID(), phrase: 'Ajuda' };
  const responses = await Promise.all([
    communicator.request('/api/requests', 'POST', body),
    second.client(communicator.cookie).request('/api/requests', 'POST', body),
  ]);
  assert.deepEqual(responses.map((response) => response.status), [200, 200]);
  assert.equal((await second.client(support.cookie).request('/api/requests')).body.requests?.length, 1);
  assert.equal(sends, 1);
  await second.service.close();
});

test('falha no meio da transação não deixa pedido nem destinatários parciais', async (t) => {
  const f = await fixture(t, { backgroundProcessing: false });
  const support = await f.device('support');
  const communicator = await f.device('communicator');
  await f.pair(support, communicator);
  const db = new DatabaseSync(join(f.directory, 'db.sqlite'));
  db.exec("CREATE TRIGGER reject_delivery BEFORE INSERT ON deliveries BEGIN SELECT RAISE(ABORT, 'test rollback'); END;");
  const errorLog = t.mock.method(console, 'error', () => undefined);
  const body = { id: randomUUID(), phrase: 'Ajuda' };
  assert.equal((await communicator.request('/api/requests', 'POST', body)).status, 500);
  assert.equal((await support.request('/api/requests')).body.requests?.length, 0);
  assert.equal(db.prepare('SELECT COUNT(*) AS count FROM requests').get()?.count, 0);
  assert.equal(db.prepare('SELECT COUNT(*) AS count FROM recipients').get()?.count, 0);
  db.exec('DROP TRIGGER reject_delivery');
  db.close();
  errorLog.mock.restore();
  assert.equal((await communicator.request('/api/requests', 'POST', body)).status, 200);
});
