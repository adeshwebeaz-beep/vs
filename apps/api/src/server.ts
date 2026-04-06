import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import websocket from '@fastify/websocket';
import { env } from './config/env.js';
import { workflowRoutes } from './routes/workflows.js';
import { webhookRoutes } from './routes/webhooks.js';
import { copilotRoutes } from './routes/copilot.js';
import { sanitizeMiddleware } from './middleware/sanitize.js';
import './workers/workflowWorker.js';

const app = Fastify({ logger: true });

await app.register(cors, { origin: true, credentials: true });
await app.register(rateLimit, {
  max: 100,
  timeWindow: '1 minute',
  keyGenerator: (request) => String(request.headers['x-user-id'] ?? request.ip)
});
await app.register(websocket);
await app.register(sanitizeMiddleware);

app.get('/health', async () => ({ ok: true }));
app.register(workflowRoutes, { prefix: '/api/v1' });
app.register(webhookRoutes, { prefix: '/api/v1' });
app.register(copilotRoutes, { prefix: '/api/v1' });

app.get('/api/v1/execution-stream', { websocket: true }, (socket) => {
  socket.send(JSON.stringify({ type: 'connected' }));
});

await app.listen({ port: env.PORT, host: '0.0.0.0' });
