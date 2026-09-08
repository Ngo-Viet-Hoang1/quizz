import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ClassMember, ClassMemberSchema } from '../classes/schemas/class-member.schema';
import { QuizAssignment, QuizAssignmentSchema } from '../classes/schemas/quiz-assignment.schema';
import { Quiz, QuizSchema } from '../quiz/schemas/quiz.schema';
import { ExamAttemptsController } from './exam-attempts.controller';
import { ExamAttempt, ExamAttemptSchema } from './schemas/exam-attempt.schema';
import { AutoGradingService } from './services/auto-grading.service';
import { ExamAttemptProgressService } from './services/exam-attempt-progress.service';
import { ExamAttemptStartService } from './services/exam-attempt-start.service';
import { ExamAttemptSubmitService } from './services/exam-attempt-submit.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ExamAttempt.name, schema: ExamAttemptSchema },
      { name: Quiz.name, schema: QuizSchema },
      { name: QuizAssignment.name, schema: QuizAssignmentSchema },
      { name: ClassMember.name, schema: ClassMemberSchema },
    ]),
  ],
  controllers: [ExamAttemptsController],
  providers: [
    ExamAttemptStartService,
    ExamAttemptProgressService,
    AutoGradingService,
    ExamAttemptSubmitService,
  ],
  exports: [
    ExamAttemptStartService,
    ExamAttemptProgressService,
    AutoGradingService,
    ExamAttemptSubmitService,
    MongooseModule,
  ],
})
export class ExamAttemptsModule {}
