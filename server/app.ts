import { createHash, randomBytes, randomUUID, ECDH } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { DatabaseSync, type SQLInputValue } from 'node:sqlite';
import express, { type ErrorRequestHandler, type Request, type Response } from 'express';
import * as webPush from 'web-push';

type Role = 'support' | 'communicator';
type Device = { id: string; role: Role; name: string };
type Subscription = { endpoint: string; keys: { p256dh: string; auth: string } };
type Vapid = { publicKey: string; privateKey: string; subject: string };
type StoredRequest = { id: string; sender_id: string; phrase: string; created_at: number; read_at: number | null; sender_name: string };
type Delivery = StoredRequest & { recipient_id: string; attempts: number };
export type AppOptions = {
  databasePath: string;
  production?: boolean;
  publicOrigin?: string;
  vapid?: Vapid;
  now?: () => number;
  sendPush?: (subscription: Subscription, payload: string) => Promise<unknown>;
};

class HttpError extends Error {
  constructor(readonly status: number, message: string) { super(message); }
}
const hash = (value: string) => createHash('sha256').update(value).digest('hex');
const iso = (value: number) => new Date(value).toISOString();
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new HttpError(400, 'Dados inválidos.');
  return value as Record<string, unknown>;
}
function text(value: unknown, max: number, label: string) {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > max) throw new HttpError(400, `${label} inválido.`);
  return value.trim();
}
function validateSubscription(body: unknown): Subscription {
  const value = object(body);
  const endpoint = text(value.endpoint, 2048, 'Endereço de notificação');
  let url: URL;
  try { url = new URL(endpoint); } catch { throw new HttpError(400, 'Endereço de notificação inválido.'); }
  const host = url.hostname.toLowerCase();
  const allowed = ['fcm.googleapis.com', 'android.googleapis.com', 'updates.push.services.mozilla.com', 'web.push.apple.com'].includes(host)
    || (host.endsWith('.notify.windows.com') && host !== 'notify.windows.com');
  if (!allowed || url.protocol !== 'https:' || url.username || url.password || url.hash || (url.port && url.port !== '443')) {
    throw new HttpError(400, 'Serviço de notificação não permitido.');
  }
  const keys = object(value.keys);
  const p256dh = text(keys.p256dh, 90, 'Chave pública');
  const auth = text(keys.auth, 24, 'Chave de autenticação');
  if (!/^[\w-]+={0,2}$/.test(p256dh) || !/^[\w-]+={0,2}$/.test(auth)
    || Buffer.from(p256dh, 'base64url').length !== 65 || Buffer.from(auth, 'base64url').length !== 16) {
    throw new HttpError(400, 'Chaves de notificação inválidas.');
  }
  try { ECDH.convertKey(Buffer.from(p256dh, 'base64url'), 'prime256v1'); }
  catch { throw new HttpError(400, 'Chave pública de notificação inválida.'); }
  return { endpoint: url.href, keys: { p256dh, auth } };
}

export function createApp(options: AppOptions) {
  const now = options.now ?? Date.now;
  const production = options.production ?? false;
  if (production && !options.publicOrigin) throw new Error('PUBLIC_ORIGIN é obrigatório em produção.');
  const origins = new Set(production ? [] : ['http://127.0.0.1:5173', 'http://localhost:5173']);
  if (options.publicOrigin) {
    const url = new URL(options.publicOrigin);
    if (url.origin !== options.publicOrigin || (production && url.protocol !== 'https:') || url.username || url.password) {
      throw new Error('PUBLIC_ORIGIN precisa ser uma origem válida; produção exige HTTPS.');
    }
    origins.add(url.origin);
  }
  if (options.vapid) {
    // Valida sem configurar estado global compartilhado entre instâncias.
    webPush.getVapidHeaders('https://fcm.googleapis.com', options.vapid.subject, options.vapid.publicKey, options.vapid.privateKey, 'aes128gcm');
  }
  if (options.databasePath !== ':memory:') mkdirSync(dirname(resolve(options.databasePath)), { recursive: true });
  const db = new DatabaseSync(options.databasePath);
  db.exec(`
    PRAGMA foreign_keys = ON;
    PRAGMA busy_timeout = 5000;
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS devices (
      id TEXT PRIMARY KEY, token_hash TEXT NOT NULL UNIQUE,
      role TEXT NOT NULL CHECK(role IN ('support','communicator')), name TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS pairings (
      code_hash TEXT PRIMARY KEY, issuer_id TEXT NOT NULL REFERENCES devices(id), expires_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS pairings_issuer ON pairings(issuer_id);
    CREATE TABLE IF NOT EXISTS links (
      support_id TEXT NOT NULL REFERENCES devices(id), communicator_id TEXT NOT NULL REFERENCES devices(id),
      PRIMARY KEY(support_id, communicator_id)
    );
    CREATE INDEX IF NOT EXISTS links_communicator ON links(communicator_id);
    CREATE TABLE IF NOT EXISTS subscriptions (
      device_id TEXT PRIMARY KEY REFERENCES devices(id), endpoint TEXT NOT NULL UNIQUE, p256dh TEXT NOT NULL, auth TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS requests (
      id TEXT PRIMARY KEY, sender_id TEXT NOT NULL REFERENCES devices(id), phrase TEXT NOT NULL,
      created_at INTEGER NOT NULL, read_at INTEGER
    );
    CREATE INDEX IF NOT EXISTS requests_sender ON requests(sender_id, created_at DESC);
    CREATE TABLE IF NOT EXISTS recipients (
      request_id TEXT NOT NULL REFERENCES requests(id) ON DELETE CASCADE, device_id TEXT NOT NULL REFERENCES devices(id),
      PRIMARY KEY(request_id, device_id)
    );
    CREATE INDEX IF NOT EXISTS recipients_device ON recipients(device_id, request_id);
    CREATE TABLE IF NOT EXISTS deliveries (
      request_id TEXT NOT NULL, recipient_id TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('queued','sending','sent','failed')),
      attempts INTEGER NOT NULL DEFAULT 0, next_attempt_at INTEGER, lease_until INTEGER,
      PRIMARY KEY(request_id, recipient_id),
      FOREIGN KEY(request_id, recipient_id) REFERENCES recipients(request_id, device_id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS deliveries_pending ON deliveries(status, next_attempt_at);
    CREATE TABLE IF NOT EXISTS rate_limits (
      bucket TEXT PRIMARY KEY, count INTEGER NOT NULL, reset_at INTEGER NOT NULL
    );
  `);
  function get<T>(sql: string, ...args: SQLInputValue[]) { return db.prepare(sql).get(...args) as T | undefined; }
  function all<T>(sql: string, ...args: SQLInputValue[]) { return db.prepare(sql).all(...args) as T[]; }
  function run(sql: string, ...args: SQLInputValue[]) { return db.prepare(sql).run(...args); }
  function transaction<T>(action: () => T): T {
    db.exec('BEGIN IMMEDIATE');
    try { const result = action(); db.exec('COMMIT'); return result; }
    catch (error) { db.exec('ROLLBACK'); throw error; }
  }
  function limit(key: string, max: number, milliseconds: number) {
    const time = now();
    const row = get<{ count: number; reset_at: number }>(`
      INSERT INTO rate_limits(bucket,count,reset_at) VALUES(?,1,?)
      ON CONFLICT(bucket) DO UPDATE SET
        count=CASE WHEN reset_at<=? THEN 1 ELSE count+1 END,
        reset_at=CASE WHEN reset_at<=? THEN excluded.reset_at ELSE reset_at END
      RETURNING count,reset_at`, key, time + milliseconds, time, time);
    if (row && row.count > max) throw new HttpError(429, 'Muitas tentativas. Aguarde alguns minutos.');
  }
  function authenticate(req: Request): Device | null {
    const cookie = /(?:^|;\s*)neuroin_device=([\w-]{43})(?:;|$)/.exec(req.headers.cookie ?? '');
    return cookie ? get<Device>('SELECT id,role,name FROM devices WHERE token_hash=?', hash(cookie[1])) ?? null : null;
  }
  const clientIp = (req: Request) => hash(req.ip ?? req.socket.remoteAddress ?? 'unknown');
  function requireDevice(req: Request, role?: Role) {
    const device = authenticate(req);
    if (!device) throw new HttpError(401, 'Configure este dispositivo primeiro.');
    if (role && device.role !== role) throw new HttpError(403, 'Este dispositivo não pode realizar essa ação.');
    return device;
  }
  function peers(device: Device) {
    return all<{ id: string; name: string }>(`SELECT d.id,d.name FROM links l JOIN devices d
      ON d.id=CASE WHEN l.support_id=? THEN l.communicator_id ELSE l.support_id END
      WHERE l.support_id=? OR l.communicator_id=? ORDER BY d.name`, device.id, device.id, device.id);
  }
  function session(device: Device | null) {
    return { device, peers: device ? peers(device) : [], subscribed: !!device && !!get('SELECT 1 FROM subscriptions WHERE device_id=?', device.id), publicKey: options.vapid?.publicKey ?? null };
  }
  function storedSubscription(deviceId: string): Subscription | undefined {
    const sub = get<{ endpoint: string; p256dh: string; auth: string }>('SELECT endpoint,p256dh,auth FROM subscriptions WHERE device_id=?', deviceId);
    return sub ? { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } } : undefined;
  }
  const sendPush = options.sendPush ?? (async (subscription: Subscription, payload: string) => {
    if (!options.vapid) throw new Error('Notificações não configuradas.');
    return webPush.sendNotification(subscription, payload, { TTL: 300, urgency: 'high', timeout: 5000, vapidDetails: options.vapid });
  });
  async function send(subscription: Subscription, payload: string) {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      await Promise.race([sendPush(subscription, payload), new Promise<never>((_resolve, reject) => {
        timer = setTimeout(() => reject(new Error('Tempo de envio esgotado.')), 6000);
      })]);
    } finally { clearTimeout(timer); }
  }
  function expiredSubscription(error: unknown) {
    return !!error && typeof error === 'object' && 'statusCode' in error && [404, 410].includes(Number(error.statusCode));
  }
  let closed = false;
  let queueRunning: Promise<void> | undefined;
  async function deliver(delivery: Delivery) {
    const time = now();
    const claimed = run(`UPDATE deliveries SET status='sending', attempts=attempts+1, lease_until=?
      WHERE request_id=? AND recipient_id=? AND (status IN ('queued','failed') OR (status='sending' AND lease_until<=?))`,
    time + 30_000, delivery.id, delivery.recipient_id, time);
    if (!claimed.changes) return;
    const sub = storedSubscription(delivery.recipient_id);
    try {
      if (!sub) throw new Error('Nenhum dispositivo de apoio com notificações ativas.');
      await send(sub, JSON.stringify({ title: `Novo pedido de ${delivery.sender_name}`, body: delivery.phrase, url: `/rede?pedido=${delivery.id}`, requestId: delivery.id }));
      run("UPDATE deliveries SET status='sent',next_attempt_at=NULL,lease_until=NULL WHERE request_id=? AND recipient_id=?", delivery.id, delivery.recipient_id);
    } catch (error) {
      if (sub && expiredSubscription(error)) run('DELETE FROM subscriptions WHERE device_id=? AND endpoint=?', delivery.recipient_id, sub.endpoint);
      const attempts = delivery.attempts + 1;
      run("UPDATE deliveries SET status='failed',next_attempt_at=?,lease_until=NULL WHERE request_id=? AND recipient_id=?",
        attempts >= 6 ? null : now() + Math.min(300_000, 5000 * 2 ** (attempts - 1)), delivery.id, delivery.recipient_id);
    }
  }
  async function processQueue(requestId?: string, force = false) {
    while (queueRunning) await queueRunning;
    if (closed) return;
    const time = now();
    const rows = all<Delivery>(`SELECT r.*,d.name AS sender_name,q.recipient_id,q.attempts FROM deliveries q
      JOIN requests r ON r.id=q.request_id JOIN devices d ON d.id=r.sender_id
      JOIN links l ON l.support_id=q.recipient_id AND l.communicator_id=r.sender_id
      WHERE ${requestId ? 'q.request_id=? AND ' : ''}
        ((q.status IN ('queued','failed') AND ${force ? '1=1' : 'q.next_attempt_at IS NOT NULL AND q.next_attempt_at<=?'})
        OR (q.status='sending' AND q.lease_until<=?))
      ORDER BY r.created_at LIMIT 100`, ...(requestId ? [requestId] : []), ...(force ? [] : [time]), time);
    queueRunning = Promise.all(rows.map(deliver)).then(() => undefined);
    try { await queueRunning; } finally { queueRunning = undefined; }
  }
  function pushStatus(requestId: string) {
    const rows = all<{ status: string; count: number }>('SELECT status,COUNT(*) AS count FROM deliveries WHERE request_id=? GROUP BY status', requestId);
    return { accepted: rows.find((r) => r.status === 'sent')?.count ?? 0, failed: rows.find((r) => r.status === 'failed')?.count ?? 0,
      pending: rows.filter((r) => r.status === 'queued' || r.status === 'sending').reduce((sum, r) => sum + r.count, 0) };
  }
  const requestSelect = 'SELECT r.*,d.name AS sender_name FROM requests r JOIN devices d ON d.id=r.sender_id';
  function authorizedRequest(id: string, device: Device) {
    const request = get<StoredRequest>(`${requestSelect} WHERE r.id=? AND (r.sender_id=? OR EXISTS(
      SELECT 1 FROM recipients p JOIN links l ON l.support_id=p.device_id AND l.communicator_id=r.sender_id
      WHERE p.request_id=r.id AND p.device_id=?))`, id, device.id, device.id);
    if (!request) throw new HttpError(404, 'Pedido não encontrado nesta rede.');
    return request;
  }
  function view(request: StoredRequest) {
    return { id: request.id, phrase: request.phrase, createdAt: iso(request.created_at), readAt: request.read_at === null ? null : iso(request.read_at), senderName: request.sender_name };
  }
  const app = express();
  app.disable('x-powered-by');
  if (production) app.set('trust proxy', 'loopback');
  app.use('/api', (req, res, next) => {
    res.set({ 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method) && !origins.has(req.headers.origin ?? '')) {
      return res.status(403).json({ error: 'Origem da solicitação não permitida.' });
    }
    next();
  });
  app.use('/api', express.json({ limit: '8kb', strict: true }));
  app.use('/api', (req, _res, next) => {
    try {
      if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        limit(`mutation-ip:${clientIp(req)}`, 180, 60_000);
        const device = authenticate(req);
        if (device) limit(`mutation-device:${device.id}`, 120, 60_000);
      }
      next();
    } catch (error) { next(error); }
  });
  app.get('/api/session', (req, res) => { res.json(session(authenticate(req))); });
  app.post('/api/devices', (req, res) => {
    const body = object(req.body);
    if (body.role !== 'support' && body.role !== 'communicator') throw new HttpError(400, 'Tipo de dispositivo inválido.');
    const name = body.name === undefined ? (body.role === 'support' ? 'Responsável' : 'Ana') : text(body.name, 80, 'Nome');
    let device = authenticate(req);
    if (device && device.role !== body.role) throw new HttpError(409, 'Este dispositivo já possui outro papel. Use outro navegador ou perfil.');
    if (!device) {
      limit(`create:${clientIp(req)}`, 30, 3_600_000);
      const token = randomBytes(32).toString('base64url');
      device = { id: randomUUID(), role: body.role, name };
      run('INSERT INTO devices(id,token_hash,role,name) VALUES(?,?,?,?)', device.id, hash(token), device.role, name);
      res.setHeader('Set-Cookie', `neuroin_device=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=31536000${production ? '; Secure' : ''}`);
    }
    res.json(session(device));
  });
  app.post('/api/pairings', (req, res) => {
    const device = requireDevice(req, 'support');
    limit(`pair-issue:${device.id}`, 5, 600_000);
    limit(`pair-issue-ip:${clientIp(req)}`, 30, 600_000);
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    const code = [...randomBytes(10)].map((byte) => alphabet[byte & 31]).join('');
    const expiresAt = now() + 600_000;
    transaction(() => {
      run('DELETE FROM pairings WHERE issuer_id=? OR expires_at<=?', device.id, now());
      run('INSERT INTO pairings(code_hash,issuer_id,expires_at) VALUES(?,?,?)', hash(code), device.id, expiresAt);
    });
    res.json({ code, expiresAt: iso(expiresAt) });
  });
  app.post('/api/pairings/redeem', (req, res) => {
    const device = requireDevice(req, 'communicator');
    limit(`pair-redeem:${device.id}`, 10, 600_000);
    limit(`pair-redeem-ip:${clientIp(req)}`, 30, 600_000);
    const code = text(object(req.body).code, 20, 'Código').toUpperCase().replace(/[\s-]/g, '');
    if (!/^[A-Z2-7]{10}$/.test(code)) throw new HttpError(400, 'Código inválido ou expirado.');
    transaction(() => {
      const pairing = get<{ issuer_id: string; expires_at: number }>('SELECT issuer_id,expires_at FROM pairings WHERE code_hash=?', hash(code));
      if (!pairing || pairing.expires_at <= now()) throw new HttpError(400, 'Código inválido ou expirado.');
      if (get('SELECT 1 FROM links WHERE support_id=? AND communicator_id=?', pairing.issuer_id, device.id)) {
        throw new HttpError(409, 'Estes dispositivos já estão vinculados.');
      }
      run('INSERT INTO links(support_id,communicator_id) VALUES(?,?)', pairing.issuer_id, device.id);
      run('DELETE FROM pairings WHERE code_hash=?', hash(code));
    });
    res.json(session(device));
  });
  app.delete('/api/links/:peerId', (req, res) => {
    const device = requireDevice(req);
    const peerId = String(req.params.peerId);
    const supportId = device.role === 'support' ? device.id : peerId;
    const communicatorId = device.role === 'communicator' ? device.id : peerId;
    transaction(() => {
      run('DELETE FROM recipients WHERE device_id=? AND request_id IN (SELECT id FROM requests WHERE sender_id=?)', supportId, communicatorId);
      run('DELETE FROM links WHERE support_id=? AND communicator_id=?', supportId, communicatorId);
    });
    res.json({ ok: true });
  });
  app.put('/api/subscription', (req, res) => {
    const device = requireDevice(req, 'support');
    const sub = validateSubscription(req.body);
    transaction(() => {
      const owner = get<{ device_id: string }>('SELECT device_id FROM subscriptions WHERE endpoint=?', sub.endpoint);
      if (owner && owner.device_id !== device.id) throw new HttpError(409, 'Essa assinatura pertence a outro dispositivo.');
      run(`INSERT INTO subscriptions(device_id,endpoint,p256dh,auth) VALUES(?,?,?,?) ON CONFLICT(device_id)
        DO UPDATE SET endpoint=excluded.endpoint,p256dh=excluded.p256dh,auth=excluded.auth`, device.id, sub.endpoint, sub.keys.p256dh, sub.keys.auth);
      run("UPDATE deliveries SET status='queued',attempts=0,next_attempt_at=? WHERE recipient_id=? AND status='failed'", now(), device.id);
    });
    res.json({ ok: true });
  });
  app.delete('/api/subscription', (req, res) => {
    const device = requireDevice(req, 'support');
    run('DELETE FROM subscriptions WHERE device_id=?', device.id);
    res.json({ ok: true });
  });
  app.post('/api/push/test', async (req, res) => {
    const device = requireDevice(req, 'support');
    limit(`push-test:${device.id}`, 10, 600_000);
    const sub = storedSubscription(device.id);
    if (!sub) { res.json({ accepted: 0, failed: 1 }); return; }
    try {
      await send(sub, JSON.stringify({ title: 'NeuroIn', body: 'Notificação de teste.', url: '/rede' }));
      res.json({ accepted: 1, failed: 0 });
    } catch (error) {
      if (expiredSubscription(error)) run('DELETE FROM subscriptions WHERE device_id=? AND endpoint=?', device.id, sub.endpoint);
      res.json({ accepted: 0, failed: 1 });
    }
  });
  app.post('/api/requests', async (req, res) => {
    const device = requireDevice(req, 'communicator');
    limit(`requests:${device.id}`, 60, 600_000);
    const body = object(req.body);
    if (typeof body.id !== 'string' || !uuid.test(body.id)) throw new HttpError(400, 'Identificador de pedido inválido.');
    const id = body.id.toLowerCase();
    const phrase = text(body.phrase, 500, 'Frase');
    const expectedPeers = body.expectedPeers;
    if (expectedPeers !== undefined && (!Array.isArray(expectedPeers) || expectedPeers.length > 100
      || expectedPeers.some((peer) => typeof peer !== 'string' || !uuid.test(peer))
      || new Set(expectedPeers).size !== expectedPeers.length)) throw new HttpError(400, 'Lista de vínculos inválida.');
    transaction(() => {
      const existing = get<StoredRequest>(`${requestSelect} WHERE r.id=?`, id);
      if (existing) {
        if (existing.sender_id !== device.id || existing.phrase !== phrase) throw new HttpError(409, 'Este identificador já foi usado para outro pedido.');
        return;
      }
      const recipients = all<{ support_id: string }>('SELECT support_id FROM links WHERE communicator_id=?', device.id);
      if (Array.isArray(expectedPeers) && (expectedPeers.length !== recipients.length
        || recipients.some((recipient) => !expectedPeers.includes(recipient.support_id)))) {
        throw new HttpError(409, 'O vínculo mudou. Selecione novamente a mensagem.');
      }
      if (!recipients.length) throw new HttpError(409, 'Vincule um dispositivo de apoio antes de enviar um pedido.');
      run('INSERT INTO requests(id,sender_id,phrase,created_at) VALUES(?,?,?,?)', id, device.id, phrase, now());
      for (const recipient of recipients) {
        run('INSERT INTO recipients(request_id,device_id) VALUES(?,?)', id, recipient.support_id);
        run("INSERT INTO deliveries(request_id,recipient_id,status,next_attempt_at) VALUES(?,?,'queued',?)", id, recipient.support_id, now());
      }
    });
    await processQueue(id, true);
    res.json({ request: view(authorizedRequest(id, device)), push: pushStatus(id) });
  });
  app.get('/api/requests', (req, res) => {
    const device = requireDevice(req, 'support');
    const requests = all<StoredRequest>(`${requestSelect} JOIN recipients p ON p.request_id=r.id
      JOIN links l ON l.support_id=p.device_id AND l.communicator_id=r.sender_id
      WHERE p.device_id=? ORDER BY r.created_at DESC,r.id DESC LIMIT 100`, device.id);
    res.json({ requests: requests.map(view) });
  });
  app.get('/api/requests/:id', (req, res) => {
    res.json({ request: view(authorizedRequest(String(req.params.id), requireDevice(req))) });
  });
  app.post('/api/requests/:id/read', (req, res) => {
    const device = requireDevice(req, 'support');
    const request = authorizedRequest(String(req.params.id), device);
    run('UPDATE requests SET read_at=COALESCE(read_at,?) WHERE id=?', now(), request.id);
    res.json({ request: view(authorizedRequest(request.id, device)) });
  });
  app.use('/api', (_req, res) => { res.status(404).json({ error: 'Rota não encontrada.' }); });
  if (production) {
    const dist = resolve('dist');
    app.use(express.static(dist, { index: false, setHeaders(res, file) {
      if (file.endsWith('sw.js') || file.endsWith('index.html')) res.setHeader('Cache-Control', 'no-cache');
    } }));
    app.get('/{*path}', (_req, res) => { res.sendFile(resolve(dist, 'index.html')); });
  }
  const errorHandler: ErrorRequestHandler = (error: unknown, _req: Request, res: Response, next) => {
    if (res.headersSent) { next(error); return; }
    if (error instanceof HttpError) { res.status(error.status).json({ error: error.message }); return; }
    if (error && typeof error === 'object' && 'type' in error && error.type === 'entity.too.large') {
      res.status(413).json({ error: 'Dados maiores que o permitido.' }); return;
    }
    if (error instanceof SyntaxError) { res.status(400).json({ error: 'JSON inválido.' }); return; }
    console.error('Falha interna na API NeuroIn.', error instanceof Error ? error.name : 'UnknownError');
    res.status(500).json({ error: 'Não foi possível concluir a solicitação.' });
  };
  app.use(errorHandler);
  const reportQueueError = () => console.error('Não foi possível processar a fila de notificações.');
  const startup = setTimeout(() => { void processQueue().catch(reportQueueError); }, 0);
  const interval = setInterval(() => {
    run('DELETE FROM rate_limits WHERE reset_at<=?', now());
    run('DELETE FROM pairings WHERE expires_at<=?', now());
    void processQueue().catch(reportQueueError);
  }, 10_000);
  interval.unref();
  return { app, processQueue, async close() {
    if (closed) return;
    closed = true;
    clearTimeout(startup);
    clearInterval(interval);
    await queueRunning;
    db.close();
  } };
}
