import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ClassMember, ClassMemberSchema } from '../classes/schemas/class-member.schema';
import { QuizAssignment, QuizAssignmentSchema } from '../classes/schemas/quiz-assignment.schema';
import { QuizVersion, QuizVersionSchema } from '../quiz/schemas/quiz-version.schema';
import { Quiz, QuizSchema } from '../quiz/schemas/quiz.schema';
import { ExamAttemptsController } from './exam-attempts.controller';
import { ExamAttempt, ExamAttemptSchema } from './schemas/exam-attempt.schema';
import {
  AutoGradingService,
  ExamAttemptProgressService,
  ExamAttemptQueryService,
  ExamAttemptStartService,
  ExamAttemptSubmitService,
} from './services';
import { ExamAttemptsScheduler } from './tasks/exam-attempts.scheduler';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ExamAttempt.name, schema: ExamAttemptSchema },
      { name: Quiz.name, schema: QuizSchema },
      { name: QuizVersion.name, schema: QuizVersionSchema },
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
    ExamAttemptQueryService,
    ExamAttemptsScheduler,
  ],
  exports: [
    ExamAttemptStartService,
    ExamAttemptProgressService,
    AutoGradingService,
    ExamAttemptSubmitService,
    ExamAttemptQueryService,
    MongooseModule,
  ],
})
export class ExamAttemptsModule {}
