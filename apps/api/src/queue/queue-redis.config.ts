import { ConnectionOptions } from 'bullmq';

/**
 * Parses a Redis URL (redis:// hoặc rediss://) to BullMQ ConnectionOptions.
 * maxRetriesPerRequest: null is COMPULSORY — worker will crash when Redis reconnect.
 */
export function parseRedisConnectionOptions(redisUrl?: string): ConnectionOptions {
  const urlString = redisUrl || 'redis://localhost:6379';
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
      enableOfflineQueue: false,
      connectTimeout: 2000,
      retryStrategy: (times: number) => {
        if (times > 3) return null;
        return 1000;
      },
    };
  } catch {
    return {
      host: 'localhost',
      port: 6379,
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      enableOfflineQueue: false,
      connectTimeout: 2000,
      retryStrategy: (times: number) => {
        if (times > 3) return null;
        return 1000;
      },
    };
  }
}
