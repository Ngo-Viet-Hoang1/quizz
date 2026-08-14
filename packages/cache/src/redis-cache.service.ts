import { Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { ICacheService } from './cache.interface';

@Injectable()
export class RedisCacheService implements ICacheService, OnModuleDestroy {
  private redis: Redis;
  private inflight = new Map<string, Promise<unknown>>();

  constructor() {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
      throw new Error('REDIS_URL is not defined but RedisCacheService was instantiated');
    }
    this.redis = new Redis(redisUrl);
  }

  async get<T>(key: string): Promise<T | null> {
    const value = await this.redis.get(key);
    if (value === null) {
      return null;
    }
    try {
      return JSON.parse(value) as T;
    } catch {
      return value as unknown as T;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    if (ttlSeconds !== undefined) {
      await this.redis.set(key, stringValue, 'EX', ttlSeconds);
    } else {
      await this.redis.set(key, stringValue);
    }
  }

  async del(key: string): Promise<void> {
    await this.redis.del(key);
  }

  async getOrSet<T>(key: string, factory: () => Promise<T>, ttlSeconds?: number): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const inflightPromise = this.inflight.get(key) as Promise<T> | undefined;
    if (inflightPromise) {
      return inflightPromise;
    }

    const promise = factory()
      .then(async (data) => {
        await this.set(key, data, ttlSeconds);
        return data;
      })
      .finally(() => {
        this.inflight.delete(key);
      });

    this.inflight.set(key, promise);
    return promise;
  }

  onModuleDestroy() {
    this.redis.disconnect();
  }
}
