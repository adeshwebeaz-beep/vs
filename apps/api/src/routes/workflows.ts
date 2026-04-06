import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { prisma } from '../services/prisma.js';
import { enqueueWorkflowExecution } from '../queues/workflowQueue.js';

const workflowSchema = z.object({
  name: z.string().min(2),
  userId: z.string(),
  definitionJson: z.record(z.unknown())
});

export const workflowRoutes: FastifyPluginAsync = async (app) => {
  app.post('/workflows', async (request, reply) => {
    const payload = workflowSchema.parse(request.body);
    const workflow = await prisma.workflow.create({ data: payload });
    return reply.code(201).send(workflow);
  });

  app.get('/workflows/:id', async (request) => {
    const params = z.object({ id: z.string() }).parse(request.params);
    return prisma.workflow.findUniqueOrThrow({ where: { id: params.id } });
  });

  app.post('/workflows/:id/trigger', async (request, reply) => {
    const params = z.object({ id: z.string() }).parse(request.params);
    const body = z.record(z.unknown()).parse(request.body);

    await enqueueWorkflowExecution(params.id, body);
    return reply.code(202).send({ queued: true });
  });

  app.get('/workflows/:id/executions', async (request) => {
    const params = z.object({ id: z.string() }).parse(request.params);
    return prisma.workflowExecution.findMany({
      where: { workflowId: params.id },
      orderBy: { createdAt: 'desc' },
      take: 100
    });
  });
};
