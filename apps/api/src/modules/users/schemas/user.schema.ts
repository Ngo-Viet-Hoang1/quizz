import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({
  timestamps: true,
  collection: 'users',
})
export class User {
  _id!: MongooseSchema.Types.ObjectId;

  @Prop({ type: String, required: true, unique: true, index: true })
  clerkUserId!: string;

  @Prop({ type: String, default: null })
  email!: string | null;

  @Prop({ type: String, required: true, default: '' })
  fullName!: string;

  @Prop({ type: String, default: null })
  avatarUrl!: string | null;

  @Prop({
    type: String,
    enum: ['active', 'blocked'],
    default: 'active',
  })
  status!: 'active' | 'blocked';

  createdAt!: Date;
  updatedAt!: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
