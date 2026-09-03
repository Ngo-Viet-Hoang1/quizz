import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';
import { ClassMemberRole, ClassMemberStatus } from '../enums/class.enum';

export type ClassMemberDocument = HydratedDocument<ClassMember>;

@Schema({ collection: 'class_members', timestamps: false })
export class ClassMember {
  _id!: Types.ObjectId;

  @Prop({ type: String, required: true, index: true })
  organizationId!: string;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Class', required: true, index: true })
  classId!: Types.ObjectId;

  @Prop({ type: String, required: true, index: true })
  userId!: string;

  @Prop({ type: String, enum: ClassMemberRole, default: ClassMemberRole.STUDENT })
  role!: ClassMemberRole;

  @Prop({ type: String, enum: ClassMemberStatus, default: ClassMemberStatus.ACTIVE, index: true })
  status!: ClassMemberStatus;

  @Prop({ type: Date, default: Date.now })
  joinedAt!: Date;
}

export const ClassMemberSchema = SchemaFactory.createForClass(ClassMember);

ClassMemberSchema.index({ classId: 1, userId: 1 }, { unique: true });
ClassMemberSchema.index({ organizationId: 1, userId: 1, status: 1 });
