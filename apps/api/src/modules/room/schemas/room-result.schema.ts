import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type RoomResultDocument = HydratedDocument<RoomResult>;

@Schema({ _id: false })
export class LeaderboardEntry {
  @Prop({ required: true })
  rank!: number;

  @Prop({ type: String, default: null })
  userId!: string | null;

  @Prop({ required: true })
  nickname!: string;

  @Prop({ required: true })
  score!: number;

  @Prop({ default: 0 })
  correctAnswersCount!: number;
}

export const LeaderboardEntrySchema = SchemaFactory.createForClass(LeaderboardEntry);

@Schema({ collection: 'room_results', timestamps: true })
export class RoomResult {
  _id!: Types.ObjectId;

  @Prop({ required: true, index: true })
  pin!: string;

  @Prop({ type: Types.ObjectId, ref: 'Quiz', required: true, index: true })
  quizId!: Types.ObjectId;

  @Prop({ required: true })
  quizTitle!: string;

  @Prop({ type: Number, required: true })
  quizVersion!: number;

  @Prop({ required: true, index: true })
  organizationId!: string;

  @Prop({ required: true, index: true })
  hostUserId!: string;

  @Prop({ required: true })
  totalQuestions!: number;

  @Prop({ required: true })
  participantsCount!: number;

  @Prop({ type: [LeaderboardEntrySchema], default: [] })
  leaderboard!: LeaderboardEntry[];

  @Prop({ type: Date, default: null })
  endedAt?: Date | null;

  createdAt!: Date;
}

export const RoomResultSchema = SchemaFactory.createForClass(RoomResult);
RoomResultSchema.index({ 'leaderboard.userId': 1 });
RoomResultSchema.index({ organizationId: 1, hostUserId: 1, createdAt: -1 });
