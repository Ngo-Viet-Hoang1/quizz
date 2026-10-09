import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { SubscriptionPlan } from '@repo/shared-types';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

export type PaymentTransactionDocument = HydratedDocument<PaymentTransaction>;

export enum PaymentTransactionStatus {
  SUCCESS = 'success',
  AMOUNT_MISMATCH = 'amount_mismatch',
  UNRECOGNIZED_CONTENT = 'unrecognized_content',
  FAILED = 'failed',
}

export enum RefundStatus {
  NONE = 'none',
  PENDING = 'pending',
  PARTIAL = 'partial',
  REFUNDED = 'refunded',
  REJECTED = 'rejected',
}

@Schema({
  timestamps: true,
  collection: 'payment_transactions',
})
export class PaymentTransaction {
  _id?: Types.ObjectId;

  @Prop({ type: String, required: true, unique: true, index: true })
  transactionId!: string;

  @Prop({ type: String, default: null, index: true })
  organizationId?: string | null;

  @Prop({ type: String, default: 'sepay' })
  gateway!: string;

  @Prop({ type: Number, required: true })
  amount!: number;

  @Prop({
    type: String,
    enum: SubscriptionPlan,
    default: null,
  })
  targetPlan?: SubscriptionPlan | null;

  @Prop({
    type: String,
    enum: PaymentTransactionStatus,
    default: PaymentTransactionStatus.SUCCESS,
  })
  status!: PaymentTransactionStatus;

  @Prop({
    type: String,
    enum: RefundStatus,
    default: RefundStatus.NONE,
    index: true,
  })
  refundStatus!: RefundStatus;

  @Prop({ type: Number, default: 0 })
  refundedAmount!: number;

  @Prop({ type: Date, default: null })
  refundedAt?: Date | null;

  @Prop({ type: String, default: null })
  refundReason?: string | null;

  @Prop({ type: String, default: null })
  refundNote?: string | null;

  @Prop({ type: String, default: null })
  transferContent?: string | null;

  @Prop({ type: MongooseSchema.Types.Mixed, default: {} })
  rawPayload?: Record<string, unknown>;

  createdAt!: Date;
  updatedAt!: Date;
}

export const PaymentTransactionSchema = SchemaFactory.createForClass(PaymentTransaction);
