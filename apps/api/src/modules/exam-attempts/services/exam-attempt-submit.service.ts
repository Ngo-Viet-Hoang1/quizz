import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CACHE_SERVICE, ICacheService } from '@repo/cache';
import { Model, Types } from 'mongoose';
import {
  QuizSnapshot,
  QuizVersion,
  QuizVersionDocument,
} from '../../quiz/schemas/quiz-version.schema';
import { ExamAttemptStatus } from '../enums/exam-attempt-status.enum';
import { IExamAttempt, IExamAttemptAnswer } from '../interfaces/exam-attempt.interface';
import { ExamAttemptAnswer } from '../schemas/exam-attempt-answer.schema';
import { ExamAttempt, ExamAttemptDocument } from '../schemas/exam-attempt.schema';
import { AutoGradingService } from './auto-grading.service';

@Injectable()
export class ExamAttemptSubmitService {
  constructor(
    @InjectModel(ExamAttempt.name)
    private readonly attemptModel: Model<ExamAttemptDocument>,
    @InjectModel(QuizVersion.name)
    private readonly quizVersionModel: Model<QuizVersionDocument>,
    private readonly autoGradingService: AutoGradingService,
    @Optional()
    @Inject(CACHE_SERVICE)
    private readonly cacheService?: ICacheService,
  ) {}

  private async getCachedQuizSnapshot(
    quizId: Types.ObjectId | string,
    organizationId: string,
    version: number,
  ): Promise<QuizSnapshot | null> {
    const cacheKey = `quiz_version:${String(quizId)}:${version}`;
    if (this.cacheService) {
      try {
        const cached = await this.cacheService.get<QuizSnapshot>(cacheKey);
        if (cached?.questions) {
          return cached;
        }
      } catch {
        // Fallback to database on cache error
      }
    }

    const quizObjectId =
      quizId instanceof Types.ObjectId ? quizId : new Types.ObjectId(String(quizId));
    const quizSnapshot = await this.quizVersionModel
      .findOne({
        quizId: quizObjectId,
        organizationId,
        version,
      })
      .lean()
      .exec();

    if (quizSnapshot?.snapshot) {
      if (this.cacheService) {
        try {
          await this.cacheService.set(cacheKey, quizSnapshot.snapshot, 3600); // Cache 1 hour
        } catch {
          // Ignore cache write error
        }
      }
      return quizSnapshot.snapshot;
    }

    return null;
  }

  async submitAttempt(orgId: string, userId: string, attemptId: string): Promise<IExamAttempt> {
    const attempt = await this.findAttemptToSubmit(orgId, userId, attemptId);

    const snapshot = await this.getCachedQuizSnapshot(
      attempt.quizId,
      attempt.organizationId,
      attempt.quizVersion,
    );

    if (!snapshot) {
      throw new NotFoundException(
        `Snapshot version ${attempt.quizVersion} not found for this quiz. Data may be corrupted.`,
      );
    }

    const questions = snapshot.questions;

    const grading = this.autoGradingService.gradeAttempt(
      attempt.questionOrder,
      attempt.answers,
      questions,
    );

    const schemaAnswers = this.mapToSchemaAnswers(grading.answers);
    this.applyGradingResult(
      attempt,
      grading.score,
      grading.totalPoints,
      grading.correctCount,
      grading.wrongCount,
      schemaAnswers,
    );

    const saved = await attempt.save();
    return saved as unknown as IExamAttempt;
  }

  async forceSubmitExpiredAttempts(batchSize = 50): Promise<number> {
    const now = new Date();
    const expiredAttempts = await this.attemptModel
      .find({
        status: ExamAttemptStatus.IN_PROGRESS,
        expiresAt: { $lte: now },
      })
      .limit(batchSize)
      .exec();

    let processedCount = 0;

    for (const attempt of expiredAttempts) {
      try {
        const snapshot = await this.getCachedQuizSnapshot(
          attempt.quizId,
          attempt.organizationId,
          attempt.quizVersion,
        );

        if (!snapshot) {
          continue;
        }

        const grading = this.autoGradingService.gradeAttempt(
          attempt.questionOrder,
          attempt.answers,
          snapshot.questions,
        );

        const schemaAnswers = this.mapToSchemaAnswers(grading.answers);
        this.applyGradingResult(
          attempt,
          grading.score,
          grading.totalPoints,
          grading.correctCount,
          grading.wrongCount,
          schemaAnswers,
        );

        await attempt.save();
        processedCount += 1;
      } catch {
        // Skip individual failure and continue processing
      }
    }

    return processedCount;
  }

  private async findAttemptToSubmit(
    orgId: string,
    userId: string,
    attemptId: string,
  ): Promise<ExamAttemptDocument> {
    const attempt = await this.attemptModel
      .findOne({ _id: new Types.ObjectId(attemptId), organizationId: orgId, userId })
      .exec();

    if (!attempt) {
      throw new NotFoundException('Exam attempt not found');
    }
    if (attempt.status !== ExamAttemptStatus.IN_PROGRESS) {
      throw new BadRequestException('Exam attempt is already submitted');
    }

    return attempt;
  }

  private mapToSchemaAnswers(answers: IExamAttemptAnswer[]): ExamAttemptAnswer[] {
    return answers.map((ans) => ({
      questionId:
        ans.questionId instanceof Types.ObjectId
          ? ans.questionId
          : new Types.ObjectId(String(ans.questionId)),
      selectedOptionIds:
        ans.selectedOptionIds
          ?.filter((id: unknown) => Boolean(id) && Types.ObjectId.isValid(String(id)))
          .map((id: Types.ObjectId | string) =>
            id instanceof Types.ObjectId ? id : new Types.ObjectId(String(id)),
          ) ?? [],
      textAnswer: ans.textAnswer ?? null,
      orderAnswer:
        ans.orderAnswer
          ?.filter((id: unknown) => Boolean(id) && Types.ObjectId.isValid(String(id)))
          .map((id: Types.ObjectId | string) =>
            id instanceof Types.ObjectId ? id : new Types.ObjectId(String(id)),
          ) ?? [],
      isCorrect: ans.isCorrect ?? null,
      timeSpentSec: ans.timeSpentSec ?? 0,
      answeredAt: ans.answeredAt ?? new Date(),
    }));
  }

  private applyGradingResult(
    attempt: ExamAttemptDocument,
    score: number,
    totalPoints: number,
    correctCount: number,
    wrongCount: number,
    answers: ExamAttemptAnswer[],
  ): void {
    const now = new Date();
    const startTime = new Date(attempt.startedAt).getTime();
    const durationSec = Math.max(0, Math.round((now.getTime() - startTime) / 1000));

    attempt.status = ExamAttemptStatus.SUBMITTED;
    attempt.score = score;
    attempt.totalPoints = totalPoints;
    attempt.correctCount = correctCount;
    attempt.wrongCount = wrongCount;
    attempt.answers = answers;
    attempt.submittedAt = now;
    attempt.durationSec = durationSec;
    attempt.markModified?.('answers');
  }
}
