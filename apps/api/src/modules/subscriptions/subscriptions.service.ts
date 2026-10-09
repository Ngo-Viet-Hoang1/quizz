import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { PLAN_CONFIG, SubscriptionPlan, SubscriptionStatus } from '@repo/shared-types';
import { ClientSession, Connection, Model } from 'mongoose';
import { AuditService } from '../audit/audit.service';
import { Organization, OrganizationDocument } from '../organizations/schemas/organization.schema';
import {
  CheckoutResponseDto,
  CreateCheckoutDto,
  SepayWebhookDto,
  SubscriptionResponseDto,
} from './dto';
import {
  PaymentTransaction,
  PaymentTransactionDocument,
  PaymentTransactionStatus,
  RefundStatus,
  Subscription,
  SubscriptionChangeType,
  SubscriptionDocument,
  SubscriptionHistory,
  SubscriptionHistoryDocument,
} from './schemas';

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);

  constructor(
    @InjectConnection() private readonly connection: Connection,
    @InjectModel(Subscription.name)
    private readonly subscriptionModel: Model<SubscriptionDocument>,
    @InjectModel(PaymentTransaction.name)
    private readonly paymentTransactionModel: Model<PaymentTransactionDocument>,
    @InjectModel(SubscriptionHistory.name)
    private readonly subscriptionHistoryModel: Model<SubscriptionHistoryDocument>,
    @InjectModel(Organization.name)
    private readonly organizationModel: Model<OrganizationDocument>,
    private readonly configService: ConfigService,
    private readonly auditService: AuditService,
  ) {}

  async getSubscriptionByOrgId(orgId: string): Promise<SubscriptionResponseDto> {
    const org = await this.organizationModel.findById(orgId);
    if (!org) throw new NotFoundException(`Organization with ID "${orgId}" not found`);

    let sub = await this.subscriptionModel.findOne({ organizationId: orgId });

    if (!sub) {
      const planValue = org.plan ?? SubscriptionPlan.FREE;

      sub = await this.subscriptionModel.create({
        organizationId: orgId,
        plan: planValue,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodStart: org.createdAt ?? new Date(),
        currentPeriodEnd: null,
      });

      await this.subscriptionHistoryModel.create([
        {
          organizationId: orgId,
          fromPlan: null,
          toPlan: planValue,
          fromStatus: null,
          toStatus: SubscriptionStatus.ACTIVE,
          changeType: SubscriptionChangeType.INITIAL,
          currentPeriodStart: org.createdAt ?? new Date(),
          currentPeriodEnd: null,
        },
      ]);
    }

    return {
      organizationId: orgId,
      plan: sub.plan,
      status: sub.status,
      aiQuotaMonthly: org.aiQuotaMonthly ?? 100,
      aiQuotaUsed: org.aiQuotaUsed ?? 0,
      currentPeriodStart: sub.currentPeriodStart,
      currentPeriodEnd: sub.currentPeriodEnd,
    };
  }

  /**
   * Generates VietQR checkout information and payment memo code for bank transfer.
   */
  async createCheckout(orgId: string, dto: CreateCheckoutDto): Promise<CheckoutResponseDto> {
    const org = await this.organizationModel.findById(orgId);
    if (!org) throw new NotFoundException(`Organization with ID "${orgId}" not found`);
    if (dto.plan === SubscriptionPlan.FREE)
      throw new BadRequestException('Free plan does not require checkout');

    const planConfig = PLAN_CONFIG[dto.plan];
    if (!planConfig) throw new BadRequestException(`Invalid subscription plan: "${dto.plan}"`);

    // Format transfer memo: "QUIZ <orgId> <plan>"
    const transferCode = `QUIZ ${orgId} ${dto.plan}`;

    const bankId = this.configService.get<string>('SEPAY_BANK_ID') ?? 'MBBank';
    const accountNumber = this.configService.get<string>('SEPAY_ACCOUNT_NUMBER') ?? '0000000001';
    const accountName = this.configService.get<string>('SEPAY_ACCOUNT_NAME') ?? 'LE PHI VU';

    const cleanBankCode = bankId.replace(/Bank$/i, '');
    const encodedMemo = encodeURIComponent(transferCode);
    const encodedName = encodeURIComponent(accountName);

    const qrUrl = `https://img.vietqr.io/image/${cleanBankCode}-${accountNumber}-qr_only.png?amount=${planConfig.priceVnd}&addInfo=${encodedMemo}&accountName=${encodedName}`;

    return {
      plan: dto.plan,
      amount: planConfig.priceVnd,
      currency: 'VND',
      transferCode,
      bankId,
      accountNumber,
      accountName,
      qrUrl,
    };
  }

  async processSepayWebhook(dto: SepayWebhookDto): Promise<{ success: boolean; message: string }> {
    const { id: rawTransactionId } = dto;
    const transactionId = String(rawTransactionId).trim();
    const content = (dto.content || dto.description || '').trim();
    const transferAmount = dto.transferAmount ?? dto.amountIn ?? 0;

    this.logger.log(
      `Received SePay webhook: txId=${transactionId}, amount=${transferAmount}, content="${content}"`,
    );

    const parsed = this.parseTransferContent(content);
    if (!parsed) {
      this.logger.warn(`Could not parse organization/plan from transfer content: "${content}"`);

      try {
        await this.paymentTransactionModel.create({
          transactionId,
          organizationId: null,
          amount: transferAmount,
          targetPlan: null,
          gateway: dto.gateway ?? 'sepay',
          status: PaymentTransactionStatus.UNRECOGNIZED_CONTENT,
          transferContent: content,
          rawPayload: dto as unknown as Record<string, unknown>,
        });
      } catch (err: unknown) {
        if ((err as { code?: number })?.code !== 11000) {
          this.logger.error(`Failed to record unrecognized transaction ${transactionId}:`, err);
        }
      }

      await this.auditService.log({
        action: 'subscription.webhook_unrecognized_content',
        resourceType: 'payment_transaction',
        resourceId: transactionId,
        metadata: {
          transactionId,
          transferAmount,
          content,
          gateway: dto.gateway ?? 'sepay',
        },
      });

      return { success: false, message: 'Invalid or missing transfer content format' };
    }

    const { organizationId, targetPlan } = parsed;
    const planConfig = PLAN_CONFIG[targetPlan];

    if (transferAmount < planConfig.priceVnd) {
      this.logger.warn(
        `Insufficient transfer amount: received ${transferAmount} VND, required ${planConfig.priceVnd} VND`,
      );

      try {
        await this.paymentTransactionModel.create({
          transactionId,
          organizationId,
          amount: transferAmount,
          targetPlan,
          gateway: dto.gateway ?? 'sepay',
          status: PaymentTransactionStatus.AMOUNT_MISMATCH,
          transferContent: content,
          rawPayload: dto as unknown as Record<string, unknown>,
        });
      } catch (err: unknown) {
        if ((err as { code?: number })?.code !== 11000) {
          this.logger.error(`Failed to record amount mismatch transaction ${transactionId}:`, err);
        }
      }

      await this.auditService.log({
        action: 'subscription.webhook_amount_mismatch',
        orgId: organizationId,
        resourceType: 'payment_transaction',
        resourceId: transactionId,
        metadata: {
          transactionId,
          transferAmount,
          requiredAmount: planConfig.priceVnd,
          targetPlan,
        },
      });

      return { success: false, message: 'Transfer amount is insufficient' };
    }

    try {
      await this.runWithTransaction(async (session) => {
        await this.paymentTransactionModel.create(
          [
            {
              transactionId,
              organizationId,
              amount: transferAmount,
              targetPlan,
              gateway: dto.gateway ?? 'sepay',
              status: PaymentTransactionStatus.SUCCESS,
              transferContent: content,
              rawPayload: dto as unknown as Record<string, unknown>,
            },
          ],
          session ? { session } : undefined,
        );

        const now = new Date();
        const existingSub = session
          ? await this.subscriptionModel.findOne({ organizationId }).session(session)
          : await this.subscriptionModel.findOne({ organizationId });

        const isCurrentlyActive =
          existingSub?.status === SubscriptionStatus.ACTIVE &&
          (existingSub.currentPeriodEnd ?? 0) > now;

        const isSamePlanRenewal = isCurrentlyActive && existingSub?.plan === targetPlan;
        const baseDate = isSamePlanRenewal ? existingSub.currentPeriodEnd! : now;
        const monthsPaid = Math.max(1, Math.floor(transferAmount / planConfig.priceVnd));
        const durationMs = monthsPaid * planConfig.durationDays * 24 * 60 * 60 * 1000;
        const newPeriodEnd = new Date(baseDate.getTime() + durationMs);
        const newPeriodStart = isSamePlanRenewal ? existingSub.currentPeriodStart : now;

        await this.subscriptionModel.findOneAndUpdate(
          { organizationId },
          {
            $set: {
              plan: targetPlan,
              status: SubscriptionStatus.ACTIVE,
              currentPeriodStart: newPeriodStart,
              currentPeriodEnd: newPeriodEnd,
            },
          },
          { upsert: true, ...(session ? { session } : {}), new: true },
        );

        // Update Organization plan & AI quota (Replenish quota on upgrade/renewal)
        await this.organizationModel.updateOne(
          { _id: organizationId },
          { $set: { plan: targetPlan, aiQuotaMonthly: planConfig.aiQuotaMonthly, aiQuotaUsed: 0 } },
          session ? { session } : undefined,
        );

        // E. Record immutable SubscriptionHistory
        const changeType: SubscriptionChangeType = isSamePlanRenewal
          ? SubscriptionChangeType.RENEWAL
          : SubscriptionChangeType.UPGRADE;
        await this.subscriptionHistoryModel.create(
          [
            {
              organizationId,
              fromPlan: existingSub?.plan ?? SubscriptionPlan.FREE,
              toPlan: targetPlan,
              fromStatus: existingSub?.status ?? SubscriptionStatus.ACTIVE,
              toStatus: SubscriptionStatus.ACTIVE,
              changeType,
              transactionId,
              currentPeriodStart: newPeriodStart,
              currentPeriodEnd: newPeriodEnd,
              metadata: {
                transferAmount,
                monthsPaid,
                gateway: dto.gateway ?? 'sepay',
              },
            },
          ],
          session ? { session } : undefined,
        );
      });

      this.logger.log(
        `Successfully upgraded subscription for org=${organizationId} to ${targetPlan}`,
      );

      await this.auditService.log({
        action: 'subscription.webhook_upgraded',
        orgId: organizationId,
        resourceType: 'subscription',
        resourceId: organizationId,
        metadata: {
          transactionId,
          targetPlan,
          amount: transferAmount,
          gateway: dto.gateway ?? 'sepay',
        },
      });

      return { success: true, message: 'Subscription upgraded successfully' };
    } catch (err: unknown) {
      // If transactionId is duplicated (SePay retry), return 200 OK immediately
      const mongoErr = err as { code?: number };
      if (mongoErr?.code === 11000) {
        this.logger.log(
          `Webhook transactionId=${transactionId} already processed (Idempotent response).`,
        );
        return { success: true, message: 'Transaction already processed (Idempotent)' };
      }
      throw err;
    }
  }

  /**
   * Resets monthly AI generation quota for all organizations (Called by scheduler or admin).
   */
  async resetMonthlyQuotas(): Promise<number> {
    const result = await this.organizationModel.updateMany({}, { $set: { aiQuotaUsed: 0 } });
    this.logger.log(
      `[Monthly Quota Reset] Successfully reset aiQuotaUsed for ${result.modifiedCount} organizations.`,
    );

    await this.auditService.log({
      action: 'subscription.monthly_quota_reset',
      resourceType: 'organization',
      metadata: { modifiedCount: result.modifiedCount },
    });

    return result.modifiedCount;
  }

  async resetToFreeForDev(orgId: string): Promise<SubscriptionResponseDto> {
    const org = await this.organizationModel.findById(orgId);
    if (!org) throw new NotFoundException(`Organization with ID "${orgId}" not found`);

    const now = new Date();

    const previousSub = await this.subscriptionModel.findOneAndUpdate(
      { organizationId: orgId },
      {
        $set: {
          status: SubscriptionStatus.ACTIVE,
          plan: SubscriptionPlan.FREE,
          currentPeriodStart: now,
          currentPeriodEnd: null,
        },
      },
      { upsert: true },
    );

    await Promise.all([
      this.organizationModel.updateOne(
        { _id: orgId },
        {
          $set: {
            plan: SubscriptionPlan.FREE,
            aiQuotaMonthly: PLAN_CONFIG[SubscriptionPlan.FREE].aiQuotaMonthly,
            aiQuotaUsed: 0,
          },
        },
      ),
      this.subscriptionHistoryModel.create([
        {
          organizationId: orgId,
          fromPlan: previousSub?.plan ?? null,
          toPlan: SubscriptionPlan.FREE,
          fromStatus: previousSub?.status ?? null,
          toStatus: SubscriptionStatus.ACTIVE,
          changeType: SubscriptionChangeType.DEV_RESET,
          currentPeriodStart: now,
          currentPeriodEnd: null,
        },
      ]),
    ]);

    this.logger.log(`[Dev Reset] Reset organization ${orgId} to Free plan.`);

    return {
      organizationId: orgId,
      plan: SubscriptionPlan.FREE,
      status: SubscriptionStatus.ACTIVE,
      currentPeriodStart: now,
      currentPeriodEnd: null,
      aiQuotaMonthly: PLAN_CONFIG[SubscriptionPlan.FREE].aiQuotaMonthly,
      aiQuotaUsed: 0,
    };
  }

  /**
   * Scans and expires overdue subscriptions
   */
  async expireSubscriptions(): Promise<number> {
    const now = new Date();
    const freePlanConfig = PLAN_CONFIG[SubscriptionPlan.FREE];
    const expiredSubs = await this.subscriptionModel.find({
      status: SubscriptionStatus.ACTIVE,
      plan: { $ne: SubscriptionPlan.FREE },
      currentPeriodEnd: { $ne: null, $lt: now },
    });

    if (expiredSubs.length === 0) return 0;

    const expiredOrgIds = expiredSubs.map((s) => s.organizationId);
    const expiredSubIds = expiredSubs.map((s) => s._id);

    await this.subscriptionModel.updateMany(
      { _id: { $in: expiredSubIds } },
      { $set: { status: SubscriptionStatus.EXPIRED, plan: SubscriptionPlan.FREE } },
    );

    await this.organizationModel.updateMany(
      { _id: { $in: expiredOrgIds } },
      { $set: { plan: SubscriptionPlan.FREE, aiQuotaMonthly: freePlanConfig.aiQuotaMonthly } },
    );

    try {
      await this.subscriptionHistoryModel.insertMany(
        expiredSubs.map((sub) => ({
          organizationId: sub.organizationId,
          fromPlan: sub.plan,
          toPlan: SubscriptionPlan.FREE,
          fromStatus: SubscriptionStatus.ACTIVE,
          toStatus: SubscriptionStatus.EXPIRED,
          changeType: SubscriptionChangeType.EXPIRED_DOWNGRADE,
          currentPeriodStart: sub.currentPeriodStart,
          currentPeriodEnd: sub.currentPeriodEnd,
        })),
      );
    } catch (err) {
      this.logger.warn(`Failed to record batch subscription history: ${err}`);
    }

    this.logger.log(`Downgraded ${expiredSubs.length} expired subscriptions to Free plan.`);
    await this.auditService.log({
      action: 'subscription.expired_downgraded',
      resourceType: 'subscription',
      metadata: { count: expiredSubs.length },
    });

    return expiredSubs.length;
  }

  async processRefund(
    transactionId: string,
    dto: { refundAmount?: number; reason?: string; note?: string },
  ): Promise<{ success: boolean; message: string; transaction: PaymentTransaction }> {
    const tx = await this.paymentTransactionModel.findOne({ transactionId });
    if (!tx) throw new NotFoundException(`Transaction "${transactionId}" not found`);

    if (tx.refundStatus === RefundStatus.REFUNDED)
      throw new BadRequestException(`Transaction "${transactionId}" has already been refunded`);

    let updatedTx: PaymentTransactionDocument | null = null;
    await this.runWithTransaction(async (session) => {
      const refundAmount = dto.refundAmount ?? tx.amount;
      const now = new Date();

      tx.refundStatus = RefundStatus.REFUNDED;
      tx.refundedAmount = refundAmount;
      tx.refundedAt = now;
      tx.refundReason = dto.reason ?? 'Customer requested refund';
      tx.refundNote = dto.note ?? null;
      updatedTx = await tx.save(session ? { session } : undefined);

      if (tx.organizationId) {
        const currentSub = session
          ? await this.subscriptionModel
              .findOne({ organizationId: tx.organizationId })
              .session(session)
          : await this.subscriptionModel.findOne({ organizationId: tx.organizationId });

        await this.subscriptionModel.updateOne(
          { organizationId: tx.organizationId },
          { $set: { plan: SubscriptionPlan.FREE, status: SubscriptionStatus.CANCELED } },
          session ? { session } : undefined,
        );

        await this.organizationModel.updateOne(
          { _id: tx.organizationId },
          {
            $set: {
              plan: SubscriptionPlan.FREE,
              aiQuotaMonthly: PLAN_CONFIG[SubscriptionPlan.FREE].aiQuotaMonthly,
            },
          },
          session ? { session } : undefined,
        );

        await this.subscriptionHistoryModel.create(
          [
            {
              organizationId: tx.organizationId,
              fromPlan: currentSub?.plan ?? tx.targetPlan,
              toPlan: SubscriptionPlan.FREE,
              fromStatus: currentSub?.status ?? SubscriptionStatus.ACTIVE,
              toStatus: SubscriptionStatus.CANCELED,
              changeType: SubscriptionChangeType.REFUND_DOWNGRADE,
              transactionId: tx.transactionId,
              metadata: { refundAmount, reason: dto.reason, note: dto.note },
            },
          ],
          session ? { session } : undefined,
        );
      }
    });

    await this.auditService.log({
      action: 'subscription.refund_processed',
      orgId: tx.organizationId ?? null,
      resourceType: 'payment_transaction',
      resourceId: transactionId,
      metadata: {
        transactionId,
        refundAmount: dto.refundAmount ?? tx.amount,
        reason: dto.reason,
      },
    });

    this.logger.log(`Successfully processed refund for transaction ${transactionId}`);
    return {
      success: true,
      message: `Refund of ${dto.refundAmount ?? tx.amount} VND processed successfully`,
      transaction: updatedTx!,
    };
  }

  /**
   * Sandbox Demo Helper: Simulates an incoming payment webhook for the active organization.
   * Directly exercises the complete SePay webhook processor pipeline.
   */
  async simulatePaymentForOrg(
    orgId: string,
    plan: SubscriptionPlan,
    amount?: number,
  ): Promise<{ success: boolean; message: string }> {
    const planConfig = PLAN_CONFIG[plan];
    const transferAmount = amount ?? planConfig.priceVnd;
    const txId = Math.floor(100_000 + Math.random() * 900_000);
    const content = `QUIZ ${orgId} ${plan}`;

    return this.processSepayWebhook({
      id: txId,
      gateway: this.configService.get<string>('SEPAY_BANK_ID') ?? 'MBBank',
      transactionDate: new Date().toISOString().replace('T', ' ').substring(0, 19),
      accountNumber: this.configService.get<string>('SEPAY_ACCOUNT_NUMBER') ?? '0000000001',
      code: `MB_SIM_${txId}`,
      content,
      transferType: 'in',
      description: content,
      transferAmount,
      referenceCode: `SIM_${Date.now()}`,
    });
  }

  /**
   * Helper to execute operations in a transaction if supported by MongoDB cluster,
   * with graceful fallback for standalone development instances.
   */
  private async runWithTransaction<T>(work: (session?: ClientSession) => Promise<T>): Promise<T> {
    const client =
      typeof this.connection?.getClient === 'function' ? this.connection.getClient() : null;
    const topologyType = (client as unknown as { topology?: { description?: { type?: string } } })
      ?.topology?.description?.type;

    const isExplicitStandalone = topologyType === 'Single' || topologyType === 'Standalone';

    // If MongoDB is running in explicit standalone mode (local dev without replica set),
    // execute sequentially without session transaction
    if (isExplicitStandalone) {
      return work(undefined);
    }

    let session: ClientSession | null = null;
    try {
      session = await this.connection.startSession();
      let result: T;
      await session.withTransaction(async () => {
        result = await work(session!);
      });
      return result!;
    } catch (err: unknown) {
      const error = err as { message?: string; codeName?: string; code?: number };
      const isStandalone =
        error?.message?.includes('replica set') ||
        error?.message?.includes('Transaction numbers are only allowed') ||
        error?.codeName === 'IllegalOperation' ||
        error?.code === 20;

      if (isStandalone) return work(undefined);

      throw err;
    } finally {
      if (session) await session.endSession();
    }
  }

  /**
   * Parses transfer description content: matches "QUIZ <orgId> <plan>" or "QUIZ_<orgId>_<plan>".
   */
  public parseTransferContent(
    content: string,
  ): { organizationId: string; targetPlan: SubscriptionPlan } | null {
    if (!content || typeof content !== 'string') return null;

    const match = content.trim().match(/QUIZ[\s_-]+([a-zA-Z0-9_-]+)[\s_-]+(pro|enterprise|free)/i);
    if (!match?.[1] || !match?.[2]) return null;

    const planMap: Record<string, SubscriptionPlan> = {
      pro: SubscriptionPlan.PRO,
      enterprise: SubscriptionPlan.ENTERPRISE,
      free: SubscriptionPlan.FREE,
    };

    const targetPlan = planMap[match[2].toLowerCase()];
    return targetPlan ? { organizationId: match[1].trim(), targetPlan } : null;
  }
}
