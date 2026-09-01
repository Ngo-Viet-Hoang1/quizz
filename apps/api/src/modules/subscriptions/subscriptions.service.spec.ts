import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Connection, Model } from 'mongoose';
import { AuditService } from '../audit/audit.service';
import { OrganizationDocument } from '../organizations/schemas/organization.schema';
import { SepayWebhookDto } from './dto';
import {
  PaymentTransactionDocument,
  PaymentTransactionStatus,
  SubscriptionChangeType,
  SubscriptionDocument,
  SubscriptionHistoryDocument,
} from './schemas';
import { PLAN_CONFIG, SubscriptionPlan, SubscriptionStatus } from '@repo/shared-types';
import { SubscriptionsService } from './subscriptions.service';

describe('SubscriptionsService', () => {
  let service: SubscriptionsService;
  let connection: Partial<Connection>;
  let subscriptionModel: Partial<Model<SubscriptionDocument>>;
  let paymentTransactionModel: Partial<Model<PaymentTransactionDocument>>;
  let subscriptionHistoryModel: { create: jest.Mock; insertMany: jest.Mock };
  let organizationModel: Partial<Model<OrganizationDocument>>;
  let configService: Partial<ConfigService>;
  let mockSession: {
    withTransaction: jest.Mock;
    endSession: jest.Mock;
  };

  const mockOrgId = 'org_3I2YsVYmeOLxL2Dh6KEEIWwHRsP';

  beforeEach(() => {
    mockSession = {
      withTransaction: jest.fn(async (cb) => {
        await cb();
      }),
      endSession: jest.fn().mockResolvedValue(undefined),
    };

    connection = {
      startSession: jest.fn().mockResolvedValue(mockSession),
    };

    subscriptionModel = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      findOneAndUpdate: jest.fn(),
      updateMany: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
    };

    paymentTransactionModel = {
      create: jest.fn(),
    };

    organizationModel = {
      findById: jest.fn(),
      updateOne: jest.fn(),
      updateMany: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
    };

    configService = {
      get: jest.fn((key: string) => {
        if (key === 'SEPAY_BANK_ID') return 'MBBank';
        if (key === 'SEPAY_ACCOUNT_NUMBER') return '0987654321';
        if (key === 'SEPAY_ACCOUNT_NAME') return 'QUIZ PLATFORM';
        return undefined;
      }),
    };

    subscriptionHistoryModel = {
      create: jest.fn().mockResolvedValue([]),
      insertMany: jest.fn().mockResolvedValue([]),
    };

    const auditService: Partial<AuditService> = {
      log: jest.fn().mockResolvedValue(undefined),
    };

    service = new SubscriptionsService(
      connection as Connection,
      subscriptionModel as unknown as Model<SubscriptionDocument>,
      paymentTransactionModel as unknown as Model<PaymentTransactionDocument>,
      subscriptionHistoryModel as unknown as Model<SubscriptionHistoryDocument>,
      organizationModel as unknown as Model<OrganizationDocument>,
      configService as ConfigService,
      auditService as unknown as AuditService,
    );
  });

  describe('parseTransferContent', () => {
    it('should parse valid transfer content with spaces', () => {
      const result = service.parseTransferContent(`QUIZ ${mockOrgId} pro`);
      expect(result).toEqual({
        organizationId: mockOrgId,
        targetPlan: SubscriptionPlan.PRO,
      });
    });

    it('should parse valid transfer content with enterprise plan', () => {
      const result = service.parseTransferContent(`QUIZ ${mockOrgId} enterprise`);
      expect(result).toEqual({
        organizationId: mockOrgId,
        targetPlan: SubscriptionPlan.ENTERPRISE,
      });
    });

    it('should parse valid transfer content with hyphens or underscores', () => {
      const result = service.parseTransferContent(`QUIZ_${mockOrgId}_pro`);
      expect(result).toEqual({
        organizationId: mockOrgId,
        targetPlan: SubscriptionPlan.PRO,
      });
    });

    it('should return null for invalid or missing content', () => {
      expect(service.parseTransferContent('')).toBeNull();
      expect(service.parseTransferContent('Hello world')).toBeNull();
      expect(service.parseTransferContent('QUIZ only_one_arg')).toBeNull();
    });
  });

  describe('getSubscriptionByOrgId', () => {
    it('should throw NotFoundException if organization does not exist', async () => {
      (organizationModel.findById as jest.Mock).mockResolvedValue(null);

      await expect(service.getSubscriptionByOrgId(mockOrgId)).rejects.toThrow(NotFoundException);
    });

    it('should create default Free subscription if not existing', async () => {
      const mockOrg = {
        _id: mockOrgId,
        plan: SubscriptionPlan.FREE,
        aiQuotaMonthly: 100,
        aiQuotaUsed: 10,
        createdAt: new Date('2026-01-01'),
      };
      (organizationModel.findById as jest.Mock).mockResolvedValue(mockOrg);
      (subscriptionModel.findOne as jest.Mock).mockResolvedValue(null);

      const createdSub = {
        organizationId: mockOrgId,
        plan: SubscriptionPlan.FREE,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodStart: new Date('2026-01-01'),
        currentPeriodEnd: null,
      };
      (subscriptionModel.create as jest.Mock).mockResolvedValue(createdSub);

      const res = await service.getSubscriptionByOrgId(mockOrgId);

      expect(res.plan).toBe(SubscriptionPlan.FREE);
      expect(res.status).toBe(SubscriptionStatus.ACTIVE);
      expect(res.aiQuotaMonthly).toBe(100);
      expect(subscriptionModel.create).toHaveBeenCalled();
    });

    it('should return existing subscription details', async () => {
      const mockOrg = {
        _id: mockOrgId,
        aiQuotaMonthly: 1000,
        aiQuotaUsed: 50,
      };
      const existingSub = {
        organizationId: mockOrgId,
        plan: SubscriptionPlan.PRO,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodStart: new Date('2026-08-01'),
        currentPeriodEnd: new Date('2026-08-31'),
      };
      (organizationModel.findById as jest.Mock).mockResolvedValue(mockOrg);
      (subscriptionModel.findOne as jest.Mock).mockResolvedValue(existingSub);

      const res = await service.getSubscriptionByOrgId(mockOrgId);

      expect(res.plan).toBe(SubscriptionPlan.PRO);
      expect(res.aiQuotaMonthly).toBe(1000);
      expect(res.aiQuotaUsed).toBe(50);
    });
  });

  describe('createCheckout', () => {
    it('should throw NotFoundException if organization does not exist', async () => {
      (organizationModel.findById as jest.Mock).mockResolvedValue(null);

      await expect(
        service.createCheckout(mockOrgId, { plan: SubscriptionPlan.PRO }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when selecting Free plan', async () => {
      (organizationModel.findById as jest.Mock).mockResolvedValue({ _id: mockOrgId });

      await expect(
        service.createCheckout(mockOrgId, { plan: SubscriptionPlan.FREE }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should return VietQR and transfer code for Pro plan', async () => {
      (organizationModel.findById as jest.Mock).mockResolvedValue({ _id: mockOrgId });

      const res = await service.createCheckout(mockOrgId, {
        plan: SubscriptionPlan.PRO,
      });

      expect(res.plan).toBe(SubscriptionPlan.PRO);
      expect(res.amount).toBe(PLAN_CONFIG.pro.priceVnd);
      expect(res.transferCode).toBe(`QUIZ ${mockOrgId} pro`);
      expect(res.qrUrl).toContain('img.vietqr.io');
    });
  });

  describe('processSepayWebhook', () => {
    const validDto: SepayWebhookDto = {
      id: 4829104,
      gateway: 'MBBank',
      transactionDate: '2026-08-31 15:30:00',
      accountNumber: '0987654321',
      code: 'MB_FT123456',
      content: `QUIZ ${mockOrgId} pro`,
      transferType: 'in',
      transferAmount: 199000,
      referenceCode: 'FT2408319999',
    };

    it('should return failure if transfer content format is invalid', async () => {
      const res = await service.processSepayWebhook({
        ...validDto,
        content: 'Chuyen tien khong dung cu phap',
      });

      expect(res.success).toBe(false);
      expect(res.message).toBe('Invalid or missing transfer content format');
    });

    it('should record amount_mismatch and return failure if transferred amount is insufficient', async () => {
      const res = await service.processSepayWebhook({
        ...validDto,
        transferAmount: 50000, // less than 199000
      });

      expect(res.success).toBe(false);
      expect(res.message).toBe('Transfer amount is insufficient');
      expect(paymentTransactionModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          status: PaymentTransactionStatus.AMOUNT_MISMATCH,
          amount: 50000,
        }),
      );
    });

    it('should atomically upgrade subscription and update organization quota in transaction', async () => {
      const sessionQuery = {
        session: jest.fn().mockResolvedValue(null),
      };
      (subscriptionModel.findOne as jest.Mock).mockReturnValue(sessionQuery);

      const res = await service.processSepayWebhook(validDto);

      expect(res.success).toBe(true);
      expect(res.message).toBe('Subscription upgraded successfully');
      expect(connection.startSession).toHaveBeenCalled();
      expect(mockSession.withTransaction).toHaveBeenCalled();
      expect(paymentTransactionModel.create).toHaveBeenCalledWith(
        [
          expect.objectContaining({
            transactionId: '4829104',
            organizationId: mockOrgId,
            amount: 199000,
            targetPlan: SubscriptionPlan.PRO,
            status: PaymentTransactionStatus.SUCCESS,
          }),
        ],
        { session: mockSession },
      );
      expect(subscriptionModel.findOneAndUpdate).toHaveBeenCalledWith(
        { organizationId: mockOrgId },
        expect.objectContaining({
          $set: expect.objectContaining({
            plan: SubscriptionPlan.PRO,
            status: SubscriptionStatus.ACTIVE,
          }),
        }),
        expect.objectContaining({ upsert: true, session: mockSession }),
      );
      expect(organizationModel.updateOne).toHaveBeenCalledWith(
        { _id: mockOrgId },
        {
          $set: {
            plan: SubscriptionPlan.PRO,
            aiQuotaMonthly: 1000,
            aiQuotaUsed: 0,
          },
        },
        { session: mockSession },
      );
      expect(mockSession.endSession).toHaveBeenCalled();
    });

    it('should extend expiration date from existing period end when currently active (Early Renewal)', async () => {
      const futureDate = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000); // 10 days remaining
      const existingSub = {
        organizationId: mockOrgId,
        plan: SubscriptionPlan.PRO,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodStart: new Date('2026-08-01'),
        currentPeriodEnd: futureDate,
      };

      const sessionQuery = {
        session: jest.fn().mockResolvedValue(existingSub),
      };
      (subscriptionModel.findOne as jest.Mock).mockReturnValue(sessionQuery);

      await service.processSepayWebhook(validDto);

      expect(subscriptionModel.findOneAndUpdate).toHaveBeenCalledWith(
        { organizationId: mockOrgId },
        expect.objectContaining({
          $set: expect.objectContaining({
            currentPeriodStart: existingSub.currentPeriodStart,
            currentPeriodEnd: new Date(futureDate.getTime() + 30 * 24 * 60 * 60 * 1000),
          }),
        }),
        expect.any(Object),
      );
    });

    it('should start 30 days from now when upgrading from PRO to ENTERPRISE even if active (Upgrade)', async () => {
      const futureDate = new Date(Date.now() + 20 * 24 * 60 * 60 * 1000);
      const existingSub = {
        organizationId: mockOrgId,
        plan: SubscriptionPlan.PRO,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodStart: new Date('2026-08-01'),
        currentPeriodEnd: futureDate,
      };

      const sessionQuery = {
        session: jest.fn().mockResolvedValue(existingSub),
      };
      (subscriptionModel.findOne as jest.Mock).mockReturnValue(sessionQuery);

      const upgradeDto: SepayWebhookDto = {
        ...validDto,
        id: 999999,
        transferAmount: PLAN_CONFIG.enterprise.priceVnd,
        content: `QUIZ ${mockOrgId} enterprise`,
      };

      await service.processSepayWebhook(upgradeDto);

      expect(subscriptionModel.findOneAndUpdate).toHaveBeenCalledWith(
        { organizationId: mockOrgId },
        expect.objectContaining({
          $set: expect.objectContaining({
            plan: SubscriptionPlan.ENTERPRISE,
            status: SubscriptionStatus.ACTIVE,
          }),
        }),
        expect.any(Object),
      );
      expect(subscriptionHistoryModel.create).toHaveBeenCalledWith(
        [
          expect.objectContaining({
            changeType: SubscriptionChangeType.UPGRADE,
            fromPlan: SubscriptionPlan.PRO,
            toPlan: SubscriptionPlan.ENTERPRISE,
          }),
        ],
        expect.any(Object),
      );
    });

    it('should handle idempotency gracefully on duplicate transactionId (code 11000)', async () => {
      mockSession.withTransaction = jest.fn().mockRejectedValue({ code: 11000 });

      const res = await service.processSepayWebhook(validDto);

      expect(res.success).toBe(true);
      expect(res.message).toBe('Transaction already processed (Idempotent)');
      expect(mockSession.endSession).toHaveBeenCalled();
    });
  });

  describe('expireSubscriptions', () => {
    it('should downgrade expired subscriptions to Free plan and reset quota to 100 via batch operations', async () => {
      const expiredSub1 = {
        _id: 'sub_1',
        organizationId: 'org_1',
        status: SubscriptionStatus.ACTIVE,
        plan: SubscriptionPlan.PRO,
        currentPeriodStart: new Date('2026-01-01'),
        currentPeriodEnd: new Date('2026-01-31'),
      };
      (subscriptionModel.find as jest.Mock).mockResolvedValue([expiredSub1]);

      const count = await service.expireSubscriptions();

      expect(count).toBe(1);
      expect(subscriptionModel.updateMany).toHaveBeenCalledWith(
        { _id: { $in: ['sub_1'] } },
        {
          $set: {
            status: SubscriptionStatus.EXPIRED,
            plan: SubscriptionPlan.FREE,
          },
        },
      );
      expect(organizationModel.updateMany).toHaveBeenCalledWith(
        { _id: { $in: ['org_1'] } },
        {
          $set: {
            plan: SubscriptionPlan.FREE,
            aiQuotaMonthly: 100,
          },
        },
      );
    });
  });

  describe('resetToFreeForDev', () => {
    it('should reset organization and subscription to Free plan with active status', async () => {
      (organizationModel.findById as jest.Mock) = jest.fn().mockResolvedValue({ _id: mockOrgId });
      (subscriptionModel.findOneAndUpdate as jest.Mock) = jest.fn().mockResolvedValue({
        plan: SubscriptionPlan.PRO,
        status: SubscriptionStatus.ACTIVE,
      });
      (organizationModel.updateOne as jest.Mock) = jest
        .fn()
        .mockResolvedValue({ modifiedCount: 1 });

      const res = await service.resetToFreeForDev(mockOrgId);

      expect(res.organizationId).toBe(mockOrgId);
      expect(res.plan).toBe(SubscriptionPlan.FREE);
      expect(res.status).toBe(SubscriptionStatus.ACTIVE);
      expect(res.aiQuotaMonthly).toBe(100);
      expect(res.aiQuotaUsed).toBe(0);
      expect(res.currentPeriodEnd).toBeNull();
      expect(subscriptionModel.findOneAndUpdate).toHaveBeenCalledWith(
        { organizationId: mockOrgId },
        expect.objectContaining({
          $set: expect.objectContaining({
            status: SubscriptionStatus.ACTIVE,
            plan: SubscriptionPlan.FREE,
            currentPeriodEnd: null,
          }),
        }),
        { upsert: true },
      );
      expect(organizationModel.updateOne).toHaveBeenCalledWith(
        { _id: mockOrgId },
        expect.objectContaining({
          $set: expect.objectContaining({
            plan: SubscriptionPlan.FREE,
            aiQuotaMonthly: 100,
            aiQuotaUsed: 0,
          }),
        }),
      );
    });

    it('should throw NotFoundException if organization does not exist', async () => {
      (organizationModel.findById as jest.Mock) = jest.fn().mockResolvedValue(null);

      await expect(service.resetToFreeForDev(mockOrgId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('simulatePaymentForOrg', () => {
    it('should construct valid payload and call processSepayWebhook', async () => {
      const spy = jest.spyOn(service, 'processSepayWebhook').mockResolvedValue({
        success: true,
        message: 'Subscription upgraded successfully',
      });

      const res = await service.simulatePaymentForOrg(mockOrgId, SubscriptionPlan.PRO);

      expect(res.success).toBe(true);
      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          content: `QUIZ ${mockOrgId} pro`,
          transferAmount: 199000,
        }),
      );
    });
  });
});
