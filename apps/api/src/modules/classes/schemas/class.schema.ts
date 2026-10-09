import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { ClassStatus } from '../enums/class.enum';

export type ClassDocument = HydratedDocument<Class>;

@Schema({ collection: 'classes', timestamps: true })
export class Class {
  _id!: Types.ObjectId;

  @Prop({ type: String, required: true, index: true })
  organizationId!: string;

  @Prop({ type: String, required: true, trim: true })
  name!: string;

  @Prop({ type: String, required: true, index: true })
  ownerId!: string;

  @Prop({ type: String, enum: ClassStatus, default: ClassStatus.ACTIVE, index: true })
  status!: ClassStatus;

  createdAt?: Date;
  updatedAt?: Date;
}

export const ClassSchema = SchemaFactory.createForClass(Class);

ClassSchema.index({ organizationId: 1, ownerId: 1, status: 1 });
