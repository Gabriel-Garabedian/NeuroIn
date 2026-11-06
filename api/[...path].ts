import type { Request, Response } from 'express';
import { getService } from '../serverless/service.js';

export default async function handler(req: Request, res: Response) {
  try { (await getService()).app(req, res); }
  catch {
    console.error('Não foi possível conectar a API NeuroIn ao banco persistente.');
    res.statusCode = 503;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-store');
    res.end(JSON.stringify({ error: 'Serviço indisponível. Tente novamente em instantes.' }));
  }
}
