import { getRedisConnectionOptions } from './ai-generation-queue.config';

describe('ai-generation-queue.config', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should return connection options with maxRetriesPerRequest set to null by default', () => {
    delete process.env.REDIS_URL;

    const options = getRedisConnectionOptions();

    expect(options).toEqual(
      expect.objectContaining({
        host: 'localhost',
        port: 6379,
        maxRetriesPerRequest: null,
      }),
    );
  });

  it('should parse custom REDIS_URL with password and port, keeping maxRetriesPerRequest null', () => {
    process.env.REDIS_URL = 'redis://:mysecret@redis.internal.net:6380';

    const options = getRedisConnectionOptions();

    expect(options).toEqual(
      expect.objectContaining({
        host: 'redis.internal.net',
        port: 6380,
        password: 'mysecret',
        maxRetriesPerRequest: null,
      }),
    );
  });
});
