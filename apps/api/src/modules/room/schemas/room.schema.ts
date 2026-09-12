import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import { RoomStatus } from '../enums';

export type RoomDocument = HydratedDocument<Room>;

@Schema({ _id: false })
export class RoomParticipant {
  @Prop({ type: String, required: true, ref: 'User' })
  userId!: string;

  @Prop({ required: true, trim: true })
  nickname!: string;

  @Prop({ type: Date, default: () => new Date() })
  joinedAt!: Date;

  @Prop({ type: Date, default: null })
  leftAt!: Date | null;
}

export const RoomParticipantSchema = SchemaFactory.createForClass(RoomParticipant);

@Schema({ timestamps: true, collection: 'rooms' })
export class Room {
  _id?: Types.ObjectId;

  @Prop({ required: true, trim: true })
  organizationId!: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, required: true, ref: 'Quiz' })
  quizId!: Types.ObjectId;

  @Prop({ type: String, required: true, ref: 'User' })
  hostId!: string;

  @Prop({ required: true, trim: true })
  roomCode!: string;

  @Prop({ type: String, enum: RoomStatus, default: RoomStatus.WAITING })
  status!: RoomStatus;

  @Prop({ type: [RoomParticipantSchema], default: [] })
  participants!: RoomParticipant[];

  @Prop({ type: Date, default: null })
  startedAt!: Date | null;

  @Prop({ type: Date, default: null })
  endedAt!: Date | null;

  createdAt?: Date;
  updatedAt?: Date;
}

export const RoomSchema = SchemaFactory.createForClass(Room);

RoomSchema.index(
  { organizationId: 1, status: 1, createdAt: -1 },
  { name: 'org_status_created_idx' },
);

RoomSchema.index({ roomCode: 1 }, { unique: true, sparse: true, name: 'room_code_unique_idx' });

RoomSchema.index({ quizId: 1 }, { name: 'quiz_id_idx' });
