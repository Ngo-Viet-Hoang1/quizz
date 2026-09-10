import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';

export type QuizAssignmentDocument = HydratedDocument<QuizAssignment>;

@Schema({ collection: 'quiz_assignments', timestamps: false })
export class QuizAssignment {
  _id!: Types.ObjectId;

  @Prop({ type: String, required: true, index: true })
  organizationId!: string;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Quiz', required: true, index: true })
  quizId!: Types.ObjectId;

  @Prop({ type: Number, required: true, default: 1 })
  quizVersion!: number;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Class', required: true, index: true })
  classId!: Types.ObjectId;

  @Prop({ type: String, required: true })
  assignedBy!: string;

  @Prop({ type: Date, default: null })
  startAt!: Date | null;

  @Prop({ type: Date, default: null })
  dueAt!: Date | null;

  @Prop({ type: Boolean, default: false })
  allowLateSubmit!: boolean;

  @Prop({ type: Date, default: Date.now })
  createdAt!: Date;
}

export const QuizAssignmentSchema = SchemaFactory.createForClass(QuizAssignment);

QuizAssignmentSchema.index({ organizationId: 1, classId: 1, createdAt: -1 });
QuizAssignmentSchema.index({ organizationId: 1, quizId: 1 });
