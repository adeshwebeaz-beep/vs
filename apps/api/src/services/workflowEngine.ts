import { ExecutionStatus } from '@prisma/client';
import { prisma } from './prisma.js';

export type WorkflowCondition = {
  field: string;
  operator: 'equals' | 'contains' | 'exists';
  value?: string;
};

export type WorkflowAction = {
  type: string;
  config: Record<string, unknown>;
};

export type WorkflowDefinition = {
  trigger: { type: string; config: Record<string, unknown> };
  conditions: WorkflowCondition[];
  actions: WorkflowAction[];
};

function evaluateCondition(condition: WorkflowCondition, payload: Record<string, unknown>): boolean {
  const current = payload[condition.field];
  switch (condition.operator) {
    case 'equals':
      return current === condition.value;
    case 'contains':
      return typeof current === 'string' && current.includes(condition.value ?? '');
    case 'exists':
      return typeof current !== 'undefined' && current !== null;
  }
}

async function executeAction(action: WorkflowAction, payload: Record<string, unknown>) {
  // Placeholder: replace with per-integration microservice dispatch (HTTP/gRPC)
  return {
    action: action.type,
    status: 'success',
    output: {
      payloadKeys: Object.keys(payload)
    }
  };
}

export async function runWorkflow(workflowId: string, triggerPayload: Record<string, unknown>) {
  const started = Date.now();
  const workflow = await prisma.workflow.findUniqueOrThrow({ where: { id: workflowId } });
  const definition = workflow.definitionJson as WorkflowDefinition;

  const execution = await prisma.workflowExecution.create({
    data: {
      workflowId,
      status: ExecutionStatus.running,
      startedAt: new Date(),
      triggerPayload,
      actionLogs: []
    }
  });

  const passed = definition.conditions.every((condition) => evaluateCondition(condition, triggerPayload));
  if (!passed) {
    await prisma.workflowExecution.update({
      where: { id: execution.id },
      data: {
        status: ExecutionStatus.succeeded,
        finishedAt: new Date(),
        durationMs: Date.now() - started,
        actionLogs: [{ message: 'Conditions not met. No actions executed.' }]
      }
    });
    return;
  }

  const logs: unknown[] = [];
  try {
    for (const action of definition.actions) {
      const result = await executeAction(action, triggerPayload);
      logs.push(result);
    }

    await prisma.workflowExecution.update({
      where: { id: execution.id },
      data: {
        status: ExecutionStatus.succeeded,
        finishedAt: new Date(),
        durationMs: Date.now() - started,
        actionLogs: logs
      }
    });
  } catch (error) {
    await prisma.workflowExecution.update({
      where: { id: execution.id },
      data: {
        status: ExecutionStatus.failed,
        finishedAt: new Date(),
        durationMs: Date.now() - started,
        errorMessage: error instanceof Error ? error.message : 'Unknown workflow error',
        actionLogs: logs
      }
    });

    throw error;
  }
}
