import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Quiz, QuizSchema } from '../quiz/schemas/quiz.schema';
import { QuizReportsController } from './quiz-reports.controller';
import { QuizReportsService } from './quiz-reports.service';
import { QuizReport, QuizReportSchema } from './schemas/quiz-report.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: QuizReport.name, schema: QuizReportSchema },
      { name: Quiz.name, schema: QuizSchema },
    ]),
  ],
  controllers: [QuizReportsController],
  providers: [QuizReportsService],
  exports: [QuizReportsService, MongooseModule],
})
export class QuizReportsModule {}
