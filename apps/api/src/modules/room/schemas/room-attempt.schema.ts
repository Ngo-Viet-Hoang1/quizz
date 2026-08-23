import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

export type RoomAttemptDocument = HydratedDocument<RoomAttempt>;

@Schema({ timestamps: true, collection: 'room_attempts' })
export class RoomAttempt {
  _id?: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, required: true, ref: 'Room' })
  roomId!: Types.ObjectId;

  @Prop({ type: String, required: true, ref: 'User' })
  userId!: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, required: true })
  questionId!: Types.ObjectId;

  @Prop({ type: [MongooseSchema.Types.ObjectId], default: [] })
  selectedOptionIds!: Types.ObjectId[];

  @Prop({ type: String, default: null, trim: true })
  answerText!: string | null;

  @Prop({ required: true })
  isCorrect!: boolean;

  @Prop({ required: true, default: 0 })
  score!: number;

  @Prop({ type: Date, default: () => new Date() })
  answeredAt!: Date;

  @Prop({ required: true, default: 0 })
  timeTakenMs!: number;

  createdAt?: Date;
  updatedAt?: Date;
}

export const RoomAttemptSchema = SchemaFactory.createForClass(RoomAttempt);

RoomAttemptSchema.index({ roomId: 1, userId: 1 }, { name: 'room_user_idx' });

RoomAttemptSchema.index(
  { roomId: 1, questionId: 1, userId: 1 },
  { unique: true, name: 'room_question_user_unique_idx' },
);
