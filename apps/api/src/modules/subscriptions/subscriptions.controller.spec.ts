import { Test, TestingModule } from '@nestjs/testing';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { OrgContextGuard } from '../../common/guards/org-context.guard';
import { SubscriptionPlan, SubscriptionStatus } from '@repo/shared-types';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';

describe('SubscriptionsController', () => {
  let controller: SubscriptionsController;
  let service: Partial<SubscriptionsService>;

  const mockOrgId = 'org_test_123';

  beforeEach(async () => {
    service = {
      getSubscriptionByOrgId: jest.fn().mockResolvedValue({
        organizationId: mockOrgId,
        plan: SubscriptionPlan.FREE,
        status: SubscriptionStatus.ACTIVE,
        aiQuotaMonthly: 100,
        aiQuotaUsed: 0,
        currentPeriodStart: new Date(),
        currentPeriodEnd: null,
      }),
      createCheckout: jest.fn().mockResolvedValue({
        plan: SubscriptionPlan.PRO,
        amount: 199000,
        currency: 'VND',
        transferCode: `QUIZ ${mockOrgId} pro`,
        bankId: 'MBBank',
        accountNumber: '0987654321',
        accountName: 'QUIZ PLATFORM',
        qrUrl: 'https://img.vietqr.io/...',
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SubscriptionsController],
      providers: [
        {
          provide: SubscriptionsService,
          useValue: service,
        },
      ],
    })
      .overrideGuard(ClerkAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(OrgContextGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<SubscriptionsController>(SubscriptionsController);
  });

  it('should return current subscription', async () => {
    const res = await controller.getCurrentSubscription(mockOrgId);
    expect(res.organizationId).toBe(mockOrgId);
    expect(res.plan).toBe(SubscriptionPlan.FREE);
    expect(service.getSubscriptionByOrgId).toHaveBeenCalledWith(mockOrgId);
  });

  it('should create checkout', async () => {
    const res = await controller.createCheckout(mockOrgId, {
      plan: SubscriptionPlan.PRO,
    });
    expect(res.plan).toBe(SubscriptionPlan.PRO);
    expect(res.amount).toBe(199000);
    expect(service.createCheckout).toHaveBeenCalledWith(mockOrgId, {
      plan: SubscriptionPlan.PRO,
    });
  });

  it('should simulate payment for active organization', async () => {
    (service.simulatePaymentForOrg as jest.Mock) = jest.fn().mockResolvedValue({
      success: true,
      message: 'Subscription upgraded successfully',
    });

    const res = await controller.simulatePayment(mockOrgId, {
      plan: SubscriptionPlan.PRO,
    });
    expect(res.success).toBe(true);
    expect(service.simulatePaymentForOrg).toHaveBeenCalledWith(mockOrgId, SubscriptionPlan.PRO);
  });
});
