import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { Env, envSchema } from './env.schema';

export function validateEnv(config: Record<string, unknown>): Env {
  const result = envSchema.safeParse(config);

  if (!result.success) {
    const errorDetails = result.error.issues
      .map((err) => `  - ${err.path.join('.')}: ${err.message}`)
      .join('\n');

    throw new Error(
      `\n======================================================\n` +
        `[Config Validation Error] Invalid environment variables:\n` +
        `${errorDetails}\n` +
        `======================================================\n`,
    );
  }

  return result.data;
}

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
      ignoreEnvFile: process.env.NODE_ENV === 'production',
      envFilePath: ['.env', '../../.env'],
    }),
  ],
})
export class ConfigModule {}
