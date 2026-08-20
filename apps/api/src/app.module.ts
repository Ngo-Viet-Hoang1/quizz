import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { HealthModule } from './health/health.module';
import { ConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { CacheModule } from './cache/cache.module';
import { LoggerModule } from './logger/logger.module';
import { StorageModule } from './storage/storage.module';
import { ClerkModule } from './common/clerk/clerk.module';
import { UsersModule } from './modules/users/users.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { RequestContextMiddleware } from './common/middleware/request-context.middleware';
import { OrganizationMembersModule } from './modules/organization-members/organization-members.module';

@Module({
  imports: [
    ConfigModule,
    LoggerModule,
    DatabaseModule,
    CacheModule,
    HealthModule,
    StorageModule,
    ClerkModule,
    UsersModule,
    OrganizationsModule,
    OrganizationMembersModule,
    WebhooksModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestContextMiddleware).forRoutes('*');
  }
}
