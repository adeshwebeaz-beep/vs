import { FastifyPluginAsync } from 'fastify';
import OpenAI from 'openai';
import { z } from 'zod';
import { env } from '../config/env.js';

const client = new OpenAI({ apiKey: env.OPENAI_API_KEY });

const inputSchema = z.object({
  prompt: z.string().min(8),
  triggerCatalog: z.array(z.object({ type: z.string(), description: z.string() })),
  actionCatalog: z.array(z.object({ type: z.string(), description: z.string() }))
});

export const copilotRoutes: FastifyPluginAsync = async (app) => {
  app.post('/copilot/generate-workflow', async (request) => {
    const input = inputSchema.parse(request.body);

    const completion = await client.responses.create({
      model: 'gpt-4o-mini',
      temperature: 0.1,
      input: [
        {
          role: 'system',
          content:
            'You generate business automation workflows. Respond with strict JSON: {"name":"string","trigger":{},"conditions":[],"actions":[]}'
        },
        {
          role: 'user',
          content: JSON.stringify(input)
        }
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'workflow_definition',
          schema: {
            type: 'object',
            additionalProperties: false,
            properties: {
              name: { type: 'string' },
              trigger: { type: 'object', additionalProperties: true },
              conditions: { type: 'array', items: { type: 'object', additionalProperties: true } },
              actions: { type: 'array', items: { type: 'object', additionalProperties: true } }
            },
            required: ['name', 'trigger', 'conditions', 'actions']
          },
          strict: true
        }
      }
    });

    return {
      workflow: JSON.parse(completion.output_text)
    };
  });
};
