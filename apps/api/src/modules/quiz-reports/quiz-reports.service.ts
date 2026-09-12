import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, QueryFilter, Types } from 'mongoose';
import { paginate, PaginateResult } from '../../common/utils/paginate.util';
import { ExamAttempt, ExamAttemptDocument } from '../exam-attempts/schemas/exam-attempt.schema';
import { NotificationService } from '../notifications/notification.service';
import { NotificationType } from '../notifications/schemas/notification.schema';
import { QuizVersion, QuizVersionDocument } from '../quiz/schemas/quiz-version.schema';
import { Question, Quiz, QuizDocument } from '../quiz/schemas/quiz.schema';
import { CreateQuizReportDto } from './dto/create-quiz-report.dto';
import { QueryQuizReportDto } from './dto/query-quiz-report.dto';
import { ResolveQuizReportDto } from './dto/resolve-quiz-report.dto';
import { ReportStatus } from './enums';
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
    @InjectModel(ExamAttempt.name)
    private readonly attemptModel: Model<ExamAttemptDocument>,
    private readonly notificationService: NotificationService,
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

  async resolveReport(
    orgId: string,
    resolverId: string,
    id: string,
    dto: ResolveQuizReportDto,
  ): Promise<QuizReport> {
    const report = await this.reportModel
      .findOne({ _id: new Types.ObjectId(id), organizationId: orgId })
      .exec();

    if (!report) {
      throw new NotFoundException('Quiz report not found');
    }

    if (report.status !== ReportStatus.PENDING) {
      throw new BadRequestException('Quiz report has already been resolved');
    }

    // 1-Click Void Question (Exclude from total score)
    if (dto.status === ReportStatus.RESOLVED && report.attemptId) {
      const attempt = await this.attemptModel
        .findOne({ _id: report.attemptId, organizationId: orgId })
        .exec();

      if (attempt) {
        const answerIdx = attempt.answers?.findIndex(
          (a) => a.questionId?.toString() === report.questionId.toString(),
        );

        if (answerIdx !== undefined && answerIdx >= 0 && attempt.answers) {
          const currentAnswer = attempt.answers[answerIdx];
          const totalQuestions = attempt.questionOrder?.length || attempt.answers.length || 1;
          const pointPerQuestion =
            attempt.totalPoints > 0 ? attempt.totalPoints / totalQuestions : 1;
          const questionPoint = Number(pointPerQuestion.toFixed(2));

          // If student previously got it wrong, reduce wrong count
          if (!currentAnswer.isCorrect && attempt.wrongCount && attempt.wrongCount > 0) {
            attempt.wrongCount -= 1;
          } else if (currentAnswer.isCorrect) {
            attempt.score = Math.max(0, Number(((attempt.score ?? 0) - questionPoint).toFixed(2)));
            if (attempt.correctCount && attempt.correctCount > 0) {
              attempt.correctCount -= 1;
            }
          }

          // Mark question as voided
          currentAnswer.isCorrect = null;

          // Deduct from total possible points
          attempt.totalPoints = Math.max(
            0,
            Number(((attempt.totalPoints ?? 0) - questionPoint).toFixed(2)),
          );

          await attempt.save();
        }
      }
    }

    report.status = dto.status;
    report.resolutionNotes = dto.resolutionNotes?.trim() || null;
    report.resolvedBy = resolverId;
    report.resolvedAt = new Date();

    const saved = await report.save();

    // Send Notification to student
    const notifTitle =
      dto.status === ReportStatus.RESOLVED
        ? 'Question report approved'
        : 'Feedback on question report';
    const notifContent = dto.resolutionNotes
      ? `Teacher response: "${dto.resolutionNotes}"`
      : dto.status === ReportStatus.RESOLVED
        ? `The reported question in "${report.quizTitle}" has been voided and excluded from your total score.`
        : `The reported question in "${report.quizTitle}" has been reviewed and retained.`;

    try {
      await this.notificationService.create(orgId, report.userId, {
        type: NotificationType.SYSTEM,
        title: notifTitle,
        content: notifContent,
      });
    } catch {
      // Non-blocking notification
    }

    return (saved.toObject ? saved.toObject() : saved) as unknown as QuizReport;
  }
}
