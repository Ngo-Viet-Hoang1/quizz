import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module';
import { ConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { CacheModule } from './cache/cache.module';

@Module({
  imports: [ConfigModule, DatabaseModule, CacheModule, HealthModule],
})
export class AppModule {}
