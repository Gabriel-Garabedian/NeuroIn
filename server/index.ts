import { createApp } from './app.js';

const production = process.env.NODE_ENV === 'production';
const publicKey = process.env.VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;
const subject = process.env.VAPID_SUBJECT;
if ((publicKey || privateKey) && ![publicKey, privateKey, subject].every(Boolean)) {
  throw new Error('Configure VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY e VAPID_SUBJECT juntos.');
}
const port = Number(process.env.PORT ?? 3001);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT inválida.');
const service = await createApp({
  databasePath: process.env.DB_PATH ?? './data/neuroin.sqlite',
  databaseUrl: process.env.TURSO_DATABASE_URL,
  databaseAuthToken: process.env.TURSO_AUTH_TOKEN,
  production,
  publicOrigin: process.env.PUBLIC_ORIGIN,
  vapid: publicKey && privateKey && subject ? { publicKey, privateKey, subject } : undefined,
});
const server = service.app.listen(port, '127.0.0.1', () => {
  console.log(`NeuroIn disponível em http://127.0.0.1:${port}`);
});
server.on('error', async () => {
  console.error('Não foi possível iniciar o servidor NeuroIn.');
  await service.close();
  process.exitCode = 1;
});
function shutdown() {
  server.close(() => { void service.close().catch(() => { process.exitCode = 1; }); });
  server.closeIdleConnections();
}
process.once('SIGTERM', shutdown);
process.once('SIGINT', shutdown);
