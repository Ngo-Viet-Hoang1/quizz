import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { RecordViolationDto } from '../dto/record-violation.dto';
import { SubmitAnswerDto } from '../dto/submit-answer.dto';
import { ExamAttemptStatus } from '../enums/exam-attempt-status.enum';
import { IExamAttempt } from '../interfaces/exam-attempt.interface';
import { ExamAttemptAnswer } from '../schemas/exam-attempt-answer.schema';
import { ExamAttempt, ExamAttemptDocument } from '../schemas/exam-attempt.schema';

@Injectable()
export class ExamAttemptProgressService {
  constructor(
    @InjectModel(ExamAttempt.name)
    private readonly attemptModel: Model<ExamAttemptDocument>,
  ) {}

  async saveAnswer(
    orgId: string,
    userId: string,
    attemptId: string,
    dto: SubmitAnswerDto,
  ): Promise<IExamAttempt> {
    const attempt = await this.findActiveAttempt(orgId, userId, attemptId);
    this.validateQuestionMembership(attempt, dto.questionId);
    this.upsertAnswer(attempt.answers, dto);
    const saved = await attempt.save();
    return saved as unknown as IExamAttempt;
  }

  async recordViolation(
    orgId: string,
    userId: string,
    attemptId: string,
    dto: RecordViolationDto,
  ): Promise<IExamAttempt> {
    const attempt = await this.findActiveAttempt(orgId, userId, attemptId);
    attempt.violations.push({
      type: dto.type,
      occurredAt: new Date(),
    });
    const saved = await attempt.save();
    return saved as unknown as IExamAttempt;
  }

  private async findActiveAttempt(
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
      throw new BadRequestException('Exam attempt is no longer in progress');
    }
    if (new Date() > new Date(attempt.expiresAt)) {
      throw new BadRequestException('Exam attempt time has expired');
    }

    return attempt;
  }

  private validateQuestionMembership(attempt: ExamAttemptDocument, questionId: string): void {
    const hasQuestion = attempt.questionOrder.some((qId) => qId.toString() === questionId);
    if (!hasQuestion) {
      throw new BadRequestException('Question does not belong to this exam attempt');
    }
  }

  private upsertAnswer(answers: ExamAttemptAnswer[], dto: SubmitAnswerDto): void {
    const newAnswer: ExamAttemptAnswer = {
      questionId: new Types.ObjectId(dto.questionId),
      selectedOptionIds: dto.selectedOptionIds?.map((id) => new Types.ObjectId(id)) ?? [],
      textAnswer: dto.textAnswer ?? null,
      orderAnswer: dto.orderAnswer?.map((id) => new Types.ObjectId(id)) ?? [],
      isCorrect: null,
      timeSpentSec: dto.timeSpentSec ?? 0,
      answeredAt: new Date(),
    };

    const index = answers.findIndex((ans) => ans.questionId.toString() === dto.questionId);
    if (index >= 0) {
      answers[index] = newAnswer;
    } else {
      answers.push(newAnswer);
    }
  }
}
