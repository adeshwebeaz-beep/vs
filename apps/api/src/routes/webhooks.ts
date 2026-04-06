import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { prisma } from '../services/prisma.js';
import { enqueueWorkflowExecution } from '../queues/workflowQueue.js';
import { verifyWebhook } from '../services/crypto.js';

export const webhookRoutes: FastifyPluginAsync = async (app) => {
  app.post('/webhooks/:slug', async (request, reply) => {
    const params = z.object({ slug: z.string() }).parse(request.params);
    const signature = String(request.headers['x-webhook-signature'] ?? '');
    const timestamp = String(request.headers['x-webhook-timestamp'] ?? '0');
    const rawBody = JSON.stringify(request.body ?? {});

    if (!verifyWebhook(timestamp, rawBody, signature)) {
      return reply.code(401).send({ error: 'Invalid webhook signature' });
    }

    const endpoint = await prisma.webhookEndpoint.findUniqueOrThrow({
      where: { slug: params.slug }
    });

    await enqueueWorkflowExecution(endpoint.workflowId, request.body);
    return reply.code(202).send({ queued: true });
  });
};
