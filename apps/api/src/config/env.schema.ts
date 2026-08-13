import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production']),
  PORT: z.preprocess((val) => (val === '' ? undefined : val), z.coerce.number().default(4000)),

  // Database
  MONGODB_URI: z.string().url(),

  // Cache (optional: empty or omitted = InMemory, provided = Redis)
  REDIS_URL: z.preprocess((val) => (val === '' ? undefined : val), z.string().url().optional()),

  // Storage
  MINIO_ENDPOINT: z.string(),
  MINIO_ACCESS_KEY: z.string(),
  MINIO_SECRET_KEY: z.string(),
  MINIO_BUCKET: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.string().default('quiz-assets'),
  ),

  // Auth (Clerk)
  CLERK_SECRET_KEY: z.string(),
  CLERK_PUBLISHABLE_KEY: z.string(),
  CLERK_WEBHOOK_SECRET: z.string(),

  // CORS / Frontend URL
  FRONTEND_URL: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.string().url().default('http://localhost:3000'),
  ),
});

export type Env = z.infer<typeof envSchema>;
