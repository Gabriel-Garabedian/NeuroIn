import type { Request, Response } from 'express';
import { getService } from '../serverless/service.js';

export default async function handler(req: Request, res: Response) {
  try { (await getService()).app(req, res); }
  catch (error) {
    console.error('Não foi possível conectar a API NeuroIn ao banco persistente.', {
      name: error instanceof Error ? error.name : 'UnknownError',
      code: error && typeof error === 'object' && 'code' in error ? String(error.code) : undefined,
      databaseConfigured: !!process.env.TURSO_DATABASE_URL && !!process.env.TURSO_AUTH_TOKEN,
      vapidConfigured: !!process.env.VAPID_PUBLIC_KEY && !!process.env.VAPID_PRIVATE_KEY && !!process.env.VAPID_SUBJECT,
    });
    res.statusCode = 503;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-store');
    res.end(JSON.stringify({ error: 'Serviço indisponível. Tente novamente em instantes.' }));
  }
}
