import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
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
import { QuizModule } from './modules/quiz/quiz.module';
import { NotificationModule } from './modules/notifications/notification.module';
import { RequestContextMiddleware } from './common/middleware/request-context.middleware';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { OrganizationMembersModule } from './modules/organization-members/organization-members.module';
import { AuditModule } from './modules/audit/audit.module';
import { SyncModule } from './modules/sync/sync.module';
import { AiGenerationModule } from './modules/ai-generation/ai-generation.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { QueueModule } from './queue/queue.module';
import { ClassesModule } from './modules/classes/classes.module';
import { ExamAttemptsModule } from './modules/exam-attempts/exam-attempts.module';
import { QuizReportsModule } from './modules/quiz-reports/quiz-reports.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    ScheduleModule.forRoot(),
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
    AuditModule,
    QuizModule,
    NotificationModule,
    SyncModule,
    AiGenerationModule,
    SubscriptionsModule,
    QueueModule,
    ClassesModule,
    ExamAttemptsModule,
    QuizReportsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestContextMiddleware).forRoutes('*');
  }
}
