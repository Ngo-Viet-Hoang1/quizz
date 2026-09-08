import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Quiz, QuizDocument } from '../../quiz/schemas/quiz.schema';
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
    @InjectModel(Quiz.name)
    private readonly quizModel: Model<QuizDocument>,
    private readonly autoGradingService: AutoGradingService,
  ) {}

  async submitAttempt(orgId: string, userId: string, attemptId: string): Promise<IExamAttempt> {
    const attempt = await this.findAttemptToSubmit(orgId, userId, attemptId);
    const quiz = await this.findQuiz(orgId, attempt.quizId.toString());

    const grading = this.autoGradingService.gradeAttempt(
      attempt.questionOrder,
      attempt.answers,
      quiz.questions,
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
        const quiz = await this.findQuiz(attempt.organizationId, attempt.quizId.toString());
        const grading = this.autoGradingService.gradeAttempt(
          attempt.questionOrder,
          attempt.answers,
          quiz.questions,
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

  private async findQuiz(orgId: string, quizId: string): Promise<QuizDocument> {
    const quiz = await this.quizModel
      .findOne({ _id: new Types.ObjectId(quizId), organizationId: orgId, deletedAt: null })
      .exec();

    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }

    return quiz;
  }

  private mapToSchemaAnswers(answers: IExamAttemptAnswer[]): ExamAttemptAnswer[] {
    return answers.map((ans) => ({
      questionId: new Types.ObjectId(ans.questionId),
      selectedOptionIds:
        ans.selectedOptionIds?.map((id: Types.ObjectId | string) => new Types.ObjectId(id)) ?? [],
      textAnswer: ans.textAnswer ?? null,
      orderAnswer:
        ans.orderAnswer?.map((id: Types.ObjectId | string) => new Types.ObjectId(id)) ?? [],
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
  }
}
