import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from '../users/users.module';
import { QuizVersionService } from './quiz-version.service';
import { QuizController } from './quiz.controller';
import { QuizService } from './quiz.service';
import { QuizVersion, QuizVersionSchema } from './schemas/quiz-version.schema';
import { Quiz, QuizSchema } from './schemas/quiz.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Quiz.name, schema: QuizSchema },
      { name: QuizVersion.name, schema: QuizVersionSchema },
    ]),
    UsersModule,
  ],
  controllers: [QuizController],
  providers: [QuizService, QuizVersionService],
  exports: [QuizService, QuizVersionService],
})
export class QuizModule {}
