import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { SchemaTypes, Types } from 'mongoose';

@Schema({ _id: false })
export class ExamAttemptAnswer {
  @Prop({ type: SchemaTypes.ObjectId, required: true })
  questionId!: Types.ObjectId;

  @Prop({ type: [{ type: SchemaTypes.ObjectId }], default: [] })
  selectedOptionIds?: Types.ObjectId[];

  @Prop({ type: String, trim: true, default: null })
  textAnswer?: string | null;

  @Prop({ type: [{ type: SchemaTypes.ObjectId }], default: [] })
  orderAnswer?: Types.ObjectId[];

  @Prop({ type: Boolean, default: null })
  isCorrect?: boolean | null;

  @Prop({ type: Number, default: 0 })
  timeSpentSec?: number;

  @Prop({ type: Date, default: Date.now })
  answeredAt?: Date;
}

export const ExamAttemptAnswerSchema = SchemaFactory.createForClass(ExamAttemptAnswer);
