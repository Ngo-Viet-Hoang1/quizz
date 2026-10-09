import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionsService } from '../subscriptions.service';
import { SubscriptionsScheduler } from './subscriptions.scheduler';

describe('SubscriptionsScheduler', () => {
  let scheduler: SubscriptionsScheduler;
  let service: Partial<SubscriptionsService>;

  beforeEach(async () => {
    service = {
      resetMonthlyQuotas: jest.fn().mockResolvedValue(5),
      expireSubscriptions: jest.fn().mockResolvedValue(2),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionsScheduler,
        {
          provide: SubscriptionsService,
          useValue: service,
        },
      ],
    }).compile();

    scheduler = module.get<SubscriptionsScheduler>(SubscriptionsScheduler);
  });

  it('should trigger resetMonthlyQuotas on handleMonthlyQuotaReset', async () => {
    await scheduler.handleMonthlyQuotaReset();
    expect(service.resetMonthlyQuotas).toHaveBeenCalledTimes(1);
  });

  it('should trigger expireSubscriptions on handleHourlySubscriptionExpiration', async () => {
    await scheduler.handleHourlySubscriptionExpiration();
    expect(service.expireSubscriptions).toHaveBeenCalledTimes(1);
  });
});
