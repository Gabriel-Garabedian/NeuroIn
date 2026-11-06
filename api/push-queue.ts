import { QueueClient } from '@vercel/queue';
import { consume, retry } from '../serverless/delivery.js';

export default new QueueClient().handleNodeCallback((message) => consume(message), { retry });
