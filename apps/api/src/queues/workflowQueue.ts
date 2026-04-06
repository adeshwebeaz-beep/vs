import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import { env } from '../config/env.js';

const connection = new IORedis(env.REDIS_URL, { maxRetriesPerRequest: null });

export const workflowQueue = new Queue('workflow-execution', { connection });

export async function enqueueWorkflowExecution(workflowId: string, triggerPayload: unknown) {
  await workflowQueue.add(
    'execute-workflow',
    { workflowId, triggerPayload },
    {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000
      },
      removeOnComplete: true,
      removeOnFail: false
    }
  );
}
