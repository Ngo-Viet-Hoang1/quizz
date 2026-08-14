import { Injectable } from '@nestjs/common';
import NodeCache from 'node-cache';
import { ICacheService } from './cache.interface';

@Injectable()
export class InMemoryCacheService implements ICacheService {
  private cache: NodeCache;
  private inflight = new Map<string, Promise<unknown>>();

  constructor() {
    this.cache = new NodeCache({ stdTTL: 300 });
  }

  async get<T>(key: string): Promise<T | null> {
    const val = this.cache.get<T>(key);
    return val === undefined ? null : val;
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds !== undefined) {
      this.cache.set(key, value, ttlSeconds);
    } else {
      this.cache.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    this.cache.del(key);
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
}
