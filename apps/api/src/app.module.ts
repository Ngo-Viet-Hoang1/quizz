import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module';
import { ConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { CacheModule } from './cache/cache.module';
import { LoggerModule } from './logger/logger.module';
import { StorageModule } from './storage/storage.module';

@Module({
  imports: [ConfigModule, LoggerModule, DatabaseModule, CacheModule, HealthModule, StorageModule],
})
export class AppModule {}
