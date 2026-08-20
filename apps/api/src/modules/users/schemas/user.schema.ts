import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({
  timestamps: true,
  collection: 'users',
  _id: false,
})
export class User {
  @Prop({ type: String, required: true })
  _id!: string;

  @Prop({ type: String, default: null })
  email!: string | null;

  @Prop({ type: String, required: true, default: '' })
  fullName!: string;

  @Prop({ type: String, default: null })
  avatarUrl!: string | null;

  @Prop({
    type: String,
    enum: ['active', 'blocked', 'deleted'],
    default: 'active',
  })
  status!: 'active' | 'blocked' | 'deleted';

  @Prop({ type: [String], default: [] })
  organizationIds!: string[];

  @Prop({ type: Date, default: null })
  deletedAt!: Date | null;

  createdAt!: Date;
  updatedAt!: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.index(
  { email: 1 },
  { unique: true, partialFilterExpression: { email: { $type: 'string' } } },
);
