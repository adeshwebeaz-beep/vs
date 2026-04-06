import { FastifyPluginAsync } from 'fastify';

function sanitizeValue(value: unknown): unknown {
  if (typeof value === 'string') {
    return value.replace(/[<>]/g, '');
  }
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, nested]) => [key, sanitizeValue(nested)])
    );
  }
  return value;
}

export const sanitizeMiddleware: FastifyPluginAsync = async (app) => {
  app.addHook('preValidation', async (request) => {
    if (request.body) request.body = sanitizeValue(request.body);
  });
};
