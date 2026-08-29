import { z } from 'zod';

const emptyToUndefined = (val: unknown): unknown => (val === '' ? undefined : val);

const booleanString = z
  .preprocess(emptyToUndefined, z.enum(['true', 'false']).default('false'))
  .transform((v) => v === 'true');

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production', 'test']).default('development'),

  PORT: z.preprocess(emptyToUndefined, z.coerce.number().int().positive().default(4000)),

  ENABLE_SWAGGER: booleanString,

  // Database
  MONGODB_URI: z.string().url(),

  // Cache (optional: empty or omitted = InMemory, provided = Redis)
  REDIS_URL: z.preprocess(emptyToUndefined, z.string().url().optional()),

  // Storage
  STORAGE_ENDPOINT: z.url(),
  STORAGE_REGION: z.preprocess(emptyToUndefined, z.string().default('auto')),
  STORAGE_ACCESS_KEY: z.string().min(1),
  STORAGE_SECRET_KEY: z.string().min(1),
  STORAGE_BUCKET: z.preprocess(emptyToUndefined, z.string().default('quiz-assets')),
  STORAGE_FORCE_PATH_STYLE: booleanString,
  STORAGE_PUBLIC_BASE_URL: z.preprocess(emptyToUndefined, z.url().optional()),

  // Auth (Clerk)
  CLERK_SECRET_KEY: z.string().min(1),
  CLERK_PUBLISHABLE_KEY: z.string().min(1),
  CLERK_WEBHOOK_SECRET: z.string().min(1),

  // CORS / Frontend URL
  FRONTEND_URL: z.preprocess(emptyToUndefined, z.url().default('http://localhost:3000')),

  // AI Provider
  ANTHROPIC_API_KEY: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
  CLAUDE_MODEL: z.preprocess(emptyToUndefined, z.string().optional()),

  // BullBoard Admin UI
  BULL_BOARD_USER: z.preprocess(emptyToUndefined, z.string().default('admin')),
  BULL_BOARD_PASSWORD: z.preprocess(emptyToUndefined, z.string().default('changeme')),
});

export type Env = z.infer<typeof envSchema>;
