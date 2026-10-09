import { parseRedisConnectionOptions } from './queue-redis.config';

describe('queue-redis.config', () => {
  it('should return localhost default with maxRetriesPerRequest: null when no url is provided', () => {
    const options = parseRedisConnectionOptions();
    expect(options).toEqual(
      expect.objectContaining({
        host: 'localhost',
        port: 6379,
        maxRetriesPerRequest: null,
      }),
    );
  });

  it('should parse custom REDIS_URL with password, port and tls', () => {
    const options = parseRedisConnectionOptions('rediss://:secret@redis.custom.io:6380');
    expect(options).toEqual(
      expect.objectContaining({
        host: 'redis.custom.io',
        port: 6380,
        password: 'secret',
        tls: {},
        maxRetriesPerRequest: null,
      }),
    );
  });
});
