import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ _id: false })
export class ExamAttemptViolation {
  @Prop({ type: String, required: true, trim: true })
  type!: string;

  @Prop({ type: Date, default: Date.now })
  occurredAt!: Date;
}

export const ExamAttemptViolationSchema = SchemaFactory.createForClass(ExamAttemptViolation);
