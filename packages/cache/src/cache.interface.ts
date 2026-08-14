export const CACHE_SERVICE = Symbol('CACHE_SERVICE');

export interface ICacheService {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
  del(key: string): Promise<void>;
  getOrSet<T>(key: string, factory: () => Promise<T>, ttlSeconds?: number): Promise<T>;
}
