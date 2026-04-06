import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  OPENAI_API_KEY: z.string().min(1),
  ENCRYPTION_KEY: z.string().min(32),
  WEBHOOK_SIGNING_SECRET: z.string().min(16)
});

export const env = schema.parse(process.env);
