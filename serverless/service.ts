import { createApp, type AppOptions } from '../server/app.js';

export function cloudOptions(env: NodeJS.ProcessEnv): AppOptions {
  const databaseUrl = env.TURSO_DATABASE_URL;
  if (!databaseUrl || !['libsql:', 'https:'].includes(new URL(databaseUrl).protocol) || !env.TURSO_AUTH_TOKEN) {
    throw new Error('Configure TURSO_DATABASE_URL e TURSO_AUTH_TOKEN para um banco remoto persistente.');
  }
  const { VAPID_PUBLIC_KEY: publicKey, VAPID_PRIVATE_KEY: privateKey, VAPID_SUBJECT: subject } = env;
  if (!publicKey || !privateKey || !subject) throw new Error('Configure as três variáveis VAPID no servidor.');
  const publicOrigin = env.PUBLIC_ORIGIN ?? (env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${env.VERCEL_PROJECT_PRODUCTION_URL}` : undefined);
  if (!publicOrigin) throw new Error('Configure PUBLIC_ORIGIN com o endereço HTTPS do aplicativo.');
  if (new URL(publicOrigin).origin !== publicOrigin || !publicOrigin.startsWith('https://')) throw new Error('PUBLIC_ORIGIN exige uma origem HTTPS.');
  return { databaseUrl, databaseAuthToken: env.TURSO_AUTH_TOKEN, production: true, publicOrigin,
    vapid: { publicKey, privateKey, subject }, backgroundProcessing: false, trustedProxy: 1 };
}

let service: ReturnType<typeof createApp> | undefined;
export function getService() {
  service ??= (async () => {
    const { enqueue } = await import('./delivery.js');
    return createApp({ ...cloudOptions(process.env), onPendingRequest: enqueue });
  })().catch((error) => { service = undefined; throw error; });
  return service;
}
