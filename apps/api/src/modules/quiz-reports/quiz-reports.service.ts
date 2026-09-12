import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, QueryFilter, Types } from 'mongoose';
import { paginate, PaginateResult } from '../../common/utils/paginate.util';
import { QuizVersion, QuizVersionDocument } from '../quiz/schemas/quiz-version.schema';
import { Question, Quiz, QuizDocument } from '../quiz/schemas/quiz.schema';
import { CreateQuizReportDto } from './dto/create-quiz-report.dto';
import { QueryQuizReportDto } from './dto/query-quiz-report.dto';
import { QuizReport, QuizReportDocument } from './schemas/quiz-report.schema';

const QUIZ_REPORT_SORT_FIELDS = ['createdAt', 'status', 'quizTitle', 'reason'] as const;

export interface QuizReportDetailResponse {
  report: QuizReport;
  question?: Question;
  latestVersion?: number;
}

@Injectable()
export class QuizReportsService {
  constructor(
    @InjectModel(QuizReport.name)
    private readonly reportModel: Model<QuizReportDocument>,
    @InjectModel(Quiz.name)
    private readonly quizModel: Model<QuizDocument>,
    @InjectModel(QuizVersion.name)
    private readonly quizVersionModel: Model<QuizVersionDocument>,
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

  async findAllReports(
    orgId: string,
    query: QueryQuizReportDto,
  ): Promise<PaginateResult<QuizReport>> {
    const filter: QueryFilter<QuizReportDocument> = {
      organizationId: orgId,
    };

    if (query.status) {
      filter.status = query.status;
    }

    if (query.quizId) {
      filter.quizId = new Types.ObjectId(query.quizId);
    }

    if (query.reason) {
      filter.reason = query.reason;
    }

    if (query.search && query.search.trim()) {
      const safeSearch = query.search.trim().replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
      filter.$or = [
        { quizTitle: { $regex: safeSearch, $options: 'i' } },
        { description: { $regex: safeSearch, $options: 'i' } },
        { userName: { $regex: safeSearch, $options: 'i' } },
      ];
    }

    return paginate<QuizReport, QuizReportDocument>(this.reportModel, filter, query, {
      allowedSortFields: QUIZ_REPORT_SORT_FIELDS,
    });
  }

  async getReportById(orgId: string, id: string): Promise<QuizReportDetailResponse> {
    const report = await this.reportModel
      .findOne({ _id: new Types.ObjectId(id), organizationId: orgId })
      .lean<QuizReport>()
      .exec();

    if (!report) {
      throw new NotFoundException('Quiz report not found');
    }

    const [snapshotVersionDoc, latestVersionDoc] = await Promise.all([
      this.quizVersionModel
        .findOne({
          quizId: new Types.ObjectId(report.quizId),
          organizationId: orgId,
          version: report.quizVersion,
        })
        .lean()
        .exec(),
      this.quizVersionModel
        .findOne({
          quizId: new Types.ObjectId(report.quizId),
          organizationId: orgId,
        })
        .sort({ version: -1 })
        .lean()
        .exec(),
    ]);

    const questions =
      snapshotVersionDoc?.snapshot?.questions ?? latestVersionDoc?.snapshot?.questions ?? [];
    const question = questions.find((q) => q._id?.toString() === report.questionId.toString());

    return {
      report,
      question,
      latestVersion: latestVersionDoc?.version,
    };
  }
}
