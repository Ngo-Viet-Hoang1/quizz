import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { SubscriptionsService } from '../subscriptions.service';

@Injectable()
export class SubscriptionsScheduler {
  private readonly logger = new Logger(SubscriptionsScheduler.name);

  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  /**
   * Automatically resets monthly AI generation quota for all organizations on the 1st of every month at 00:00 UTC.
   */
  @Cron('0 0 1 * *')
  async handleMonthlyQuotaReset(): Promise<void> {
    try {
      const count = await this.subscriptionsService.resetMonthlyQuotas();
      this.logger.log(`Monthly AI quota reset completed (${count} orgs).`);
    } catch (err) {
      this.logger.error('Failed to execute scheduled monthly quota reset:', err);
    }
  }

  /**
   * Automatically scans and downgrades expired subscriptions to Free plan every hour at minute 0.
   */
  @Cron('0 * * * *')
  async handleHourlySubscriptionExpiration(): Promise<void> {
    try {
      const count = await this.subscriptionsService.expireSubscriptions();
      if (count > 0) {
        this.logger.log(`Hourly subscription expiration downgraded ${count} orgs.`);
      }
    } catch (err) {
      this.logger.error('Failed to execute scheduled subscription expiration scan:', err);
    }
  }
}
