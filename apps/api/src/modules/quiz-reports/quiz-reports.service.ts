import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Quiz, QuizDocument } from '../quiz/schemas/quiz.schema';
import { CreateQuizReportDto } from './dto/create-quiz-report.dto';
import { QuizReport, QuizReportDocument } from './schemas/quiz-report.schema';

@Injectable()
export class QuizReportsService {
  constructor(
    @InjectModel(QuizReport.name)
    private readonly reportModel: Model<QuizReportDocument>,
    @InjectModel(Quiz.name)
    private readonly quizModel: Model<QuizDocument>,
  ) {}

  async createReport(
    orgId: string,
    userId: string,
    userName: string | undefined,
    userEmail: string | undefined,
    dto: CreateQuizReportDto,
  ): Promise<QuizReport> {
    const quiz = await this.quizModel
      .findOne({ _id: new Types.ObjectId(dto.quizId), organizationId: orgId, deletedAt: null })
      .lean()
      .exec();

    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }

    const report = new this.reportModel({
      organizationId: orgId,
      quizId: new Types.ObjectId(dto.quizId),
      quizTitle: quiz.title,
      quizVersion: dto.quizVersion,
      questionId: new Types.ObjectId(dto.questionId),
      attemptId: dto.attemptId ? new Types.ObjectId(dto.attemptId) : null,
      userId,
      userName: userName || null,
      userEmail: userEmail || null,
      reason: dto.reason,
      description: dto.description.trim(),
    });

    const saved = await report.save();
    return (saved.toObject ? saved.toObject() : saved) as unknown as QuizReport;
  }
}
