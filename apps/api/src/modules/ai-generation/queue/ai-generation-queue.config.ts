import { ConnectionOptions } from 'bullmq';

export function parseRedisConnectionOptions(redisUrl?: string): ConnectionOptions {
  const urlString = redisUrl || process.env.REDIS_URL || 'redis://localhost:6379';
  try {
    const parsed = new URL(urlString);
    const isTls = parsed.protocol === 'rediss:';
    return {
      host: parsed.hostname || 'localhost',
      port: parsed.port ? Number(parsed.port) : 6379,
      password: parsed.password ? decodeURIComponent(parsed.password) : undefined,
      username: parsed.username ? decodeURIComponent(parsed.username) : undefined,
      tls: isTls ? {} : undefined,
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    };
  } catch {
    return {
      host: 'localhost',
      port: 6379,
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    };
  }
}

export function getRedisConnectionOptions(): ConnectionOptions {
  return parseRedisConnectionOptions();
}
