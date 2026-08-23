import { InMemoryCacheService } from '@repo/cache';

describe('InMemoryCacheService', () => {
  let service: InMemoryCacheService;

  beforeEach(() => {
    service = new InMemoryCacheService();
  });

  it('should return null when key does not exist', async () => {
    const val = await service.get('nonexistent');
    expect(val).toBeNull();
  });

  it('should return correct value after set', async () => {
    await service.set('test-key', { foo: 'bar' });
    const val = await service.get<{ foo: string }>('test-key');
    expect(val).toEqual({ foo: 'bar' });
  });

  it('should return null after TTL expires', async () => {
    await service.set('ttl-key', 'expired-soon', 1); // 1 second TTL
    const valBefore = await service.get('ttl-key');
    expect(valBefore).toBe('expired-soon');

    // Wait 1.1s for TTL expiry
    await new Promise((resolve) => setTimeout(resolve, 1100));
    const valAfter = await service.get('ttl-key');
    expect(valAfter).toBeNull();
  });

  it('should call factory only once when concurrent requests miss cache (cache stampede prevention)', async () => {
    const factory = jest.fn().mockImplementation(async () => {
      // Simulate asynchronous db fetch delay
      await new Promise((resolve) => setTimeout(resolve, 100));
      return 'fetched-data';
    });

    const results = await Promise.all([
      service.getOrSet('stampede-key', factory, 10),
      service.getOrSet('stampede-key', factory, 10),
      service.getOrSet('stampede-key', factory, 10),
    ]);

    expect(results).toEqual(['fetched-data', 'fetched-data', 'fetched-data']);
    expect(factory).toHaveBeenCalledTimes(1);
  });
});
