import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import { env } from '../config/env.js';
import { runWorkflow } from '../services/workflowEngine.js';

const connection = new IORedis(env.REDIS_URL, { maxRetriesPerRequest: null });

export const workflowWorker = new Worker(
  'workflow-execution',
  async (job) => {
    await runWorkflow(job.data.workflowId, job.data.triggerPayload);
  },
  { connection }
);

workflowWorker.on('failed', (job, error) => {
  console.error('Workflow job failed', { jobId: job?.id, error: error.message });
  // TODO: notify user through email/in-app channel after final retry.
});
