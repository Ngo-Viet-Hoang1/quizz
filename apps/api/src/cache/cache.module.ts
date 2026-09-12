import { Global, Module } from '@nestjs/common';
import { CACHE_SERVICE, InMemoryCacheService, RedisCacheService } from '@repo/cache';

@Global()
@Module({
  providers: [
    {
      provide: CACHE_SERVICE,
      useClass: process.env.USE_REDIS === 'true' ? RedisCacheService : InMemoryCacheService,
    },
  ],
  exports: [CACHE_SERVICE],
})
export class CacheModule {}
