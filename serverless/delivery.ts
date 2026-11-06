import { send } from '@vercel/queue';
import { getService } from './service.js';

export async function enqueue(requestId: string) {
  // A entrega é deduplicada no banco; reativar uma inscrição precisa poder publicar outra tentativa.
  await send('neuroin-push', { requestId }, { delaySeconds: 5, retentionSeconds: 600 });
}

export async function consume(message: unknown, service?: Pick<Awaited<ReturnType<typeof getService>>, 'processQueue' | 'hasPendingDelivery'>) {
  if (!message || typeof message !== 'object' || !('requestId' in message) || typeof message.requestId !== 'string'
    || !/^[0-9a-f-]{36}$/i.test(message.requestId)) throw new Error('Mensagem de fila inválida.');
  const api = service ?? await getService();
  await api.processQueue(message.requestId);
  if (await api.hasPendingDelivery(message.requestId)) throw new Error('Notificação aguardando nova tentativa.');
}

export function retry(_error: unknown, { deliveryCount }: { deliveryCount: number }) {
  return deliveryCount >= 12 ? { acknowledge: true as const } : { afterSeconds: Math.min(80, 5 * 2 ** deliveryCount) };
}
