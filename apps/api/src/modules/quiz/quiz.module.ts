import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from '../users/users.module';
import { QuizController } from './quiz.controller';
import { QuizService } from './quiz.service';
import { ExamAttempt, ExamAttemptSchema, Quiz, QuizSchema } from './schemas';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Quiz.name, schema: QuizSchema },
      { name: ExamAttempt.name, schema: ExamAttemptSchema },
    ]),
    UsersModule,
  ],
  controllers: [QuizController],
  providers: [QuizService],
  exports: [QuizService],
})
export class QuizModule {}
