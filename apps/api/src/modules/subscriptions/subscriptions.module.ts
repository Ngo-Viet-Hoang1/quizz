import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuditModule } from '../audit/audit.module';
import { Organization, OrganizationSchema } from '../organizations/schemas/organization.schema';
import { UsersModule } from '../users/users.module';
import {
  PaymentTransaction,
  PaymentTransactionSchema,
  Subscription,
  SubscriptionHistory,
  SubscriptionHistorySchema,
  SubscriptionSchema,
} from './schemas';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionsScheduler } from './tasks/subscriptions.scheduler';

@Module({
  imports: [
    ConfigModule,
    UsersModule,
    AuditModule,
    MongooseModule.forFeature([
      { name: Subscription.name, schema: SubscriptionSchema },
      { name: PaymentTransaction.name, schema: PaymentTransactionSchema },
      { name: SubscriptionHistory.name, schema: SubscriptionHistorySchema },
      { name: Organization.name, schema: OrganizationSchema },
    ]),
  ],
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService, SubscriptionsScheduler],
  exports: [SubscriptionsService, SubscriptionsScheduler],
})
export class SubscriptionsModule {}
