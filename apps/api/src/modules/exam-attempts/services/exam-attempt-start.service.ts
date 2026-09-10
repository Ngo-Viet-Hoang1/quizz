import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { buildSanitizedQuestions } from '../../../common/utils/question-sanitizer.util';
import { shuffleArray } from '../../../common/utils/shuffle.util';
import { ClassMemberStatus } from '../../classes/enums/class.enum';
import { ClassMember, ClassMemberDocument } from '../../classes/schemas/class-member.schema';
import {
  QuizAssignment,
  QuizAssignmentDocument,
} from '../../classes/schemas/quiz-assignment.schema';
import { QuizStatus } from '../../quiz/enums';
import { Quiz, QuizDocument } from '../../quiz/schemas/quiz.schema';
import { StartExamAttemptDto } from '../dto/start-exam-attempt.dto';
import { ExamAttemptStatus } from '../enums/exam-attempt-status.enum';
import {
  ExamContext,
  IExamAttempt,
  StartExamAttemptResponse,
} from '../interfaces/exam-attempt.interface';
import { ExamAttempt, ExamAttemptDocument } from '../schemas/exam-attempt.schema';

const DEFAULT_TIME_LIMIT_SEC = 3600;

@Injectable()
export class ExamAttemptStartService {
  constructor(
    @InjectModel(ExamAttempt.name)
    private readonly attemptModel: Model<ExamAttemptDocument>,
    @InjectModel(Quiz.name)
    private readonly quizModel: Model<QuizDocument>,
    @InjectModel(QuizAssignment.name)
    private readonly assignmentModel: Model<QuizAssignmentDocument>,
    @InjectModel(ClassMember.name)
    private readonly classMemberModel: Model<ClassMemberDocument>,
  ) {}

  async startAttempt(
    orgId: string,
    userId: string,
    dto: StartExamAttemptDto,
  ): Promise<StartExamAttemptResponse> {
    const context = await this.resolveContext(orgId, userId, dto);
    const quiz = await this.getQuiz(orgId, context.quizId, !dto.assignmentId);

    const active = await this.findActiveAttempt(orgId, userId, quiz._id, context.assignment?._id);
    if (active && new Date() < new Date(active.expiresAt)) {
      return {
        attempt: active as unknown as IExamAttempt,
        quizTitle: quiz.title,
        questions: buildSanitizedQuestions(quiz.questions, active.questionOrder),
      };
    }

    return this.createAttempt(orgId, userId, quiz, context);
  }

  private async resolveContext(
    orgId: string,
    userId: string,
    dto: StartExamAttemptDto,
  ): Promise<ExamContext> {
    if (dto.assignmentId) {
      return this.validateAssignment(orgId, userId, dto.assignmentId);
    }

    if (!dto.quizId) {
      throw new BadRequestException('quizId or assignmentId is required');
    }

    return {
      quizId: new Types.ObjectId(dto.quizId),
      quizVersion: 1,
      assignment: null,
    };
  }

  private async validateAssignment(
    orgId: string,
    userId: string,
    assignmentId: string,
  ): Promise<ExamContext> {
    const assignment = await this.assignmentModel
      .findOne({ _id: new Types.ObjectId(assignmentId), organizationId: orgId })
      .exec();
    if (!assignment) throw new NotFoundException('Quiz assignment not found');

    const isMember = await this.classMemberModel.exists({
      classId: assignment.classId,
      userId,
      organizationId: orgId,
      status: ClassMemberStatus.ACTIVE,
    });
    if (!isMember) throw new ForbiddenException('You are not an active member of this class');

    if (
      assignment.dueAt &&
      new Date() > new Date(assignment.dueAt) &&
      !assignment.allowLateSubmit
    ) {
      throw new BadRequestException('Assignment deadline has passed');
    }

    const hasSubmitted = await this.attemptModel.exists({
      organizationId: orgId,
      userId,
      assignmentId: assignment._id,
      status: { $in: [ExamAttemptStatus.SUBMITTED, ExamAttemptStatus.FORCE_SUBMITTED] },
    });
    if (hasSubmitted) throw new BadRequestException('You have already submitted this assignment');

    return { quizId: assignment.quizId, quizVersion: assignment.quizVersion, assignment };
  }

  private async getQuiz(
    orgId: string,
    quizId: Types.ObjectId,
    isPractice: boolean,
  ): Promise<QuizDocument> {
    const quiz = await this.quizModel
      .findOne({ _id: quizId, organizationId: orgId, deletedAt: null })
      .exec();
    if (!quiz) throw new NotFoundException('Quiz not found');

    if (isPractice && quiz.status === QuizStatus.DRAFT) {
      throw new BadRequestException('Cannot attempt a draft quiz');
    }

    return quiz;
  }

  private async findActiveAttempt(
    orgId: string,
    userId: string,
    quizId: Types.ObjectId,
    assignmentId?: Types.ObjectId | null,
  ): Promise<ExamAttemptDocument | null> {
    return this.attemptModel
      .findOne({
        organizationId: orgId,
        userId,
        quizId,
        assignmentId: assignmentId ?? null,
        status: ExamAttemptStatus.IN_PROGRESS,
      })
      .exec();
  }

  private async createAttempt(
    orgId: string,
    userId: string,
    quiz: QuizDocument,
    context: ExamContext,
  ): Promise<StartExamAttemptResponse> {
    const startedAt = new Date();
    const expiresAt = this.calcExpiresAt(startedAt, quiz.timeLimitSec, context.assignment);
    const shuffledOrder = shuffleArray((quiz.questions || []).map((q) => q._id as Types.ObjectId));
    const totalPoints = (quiz.questions || []).reduce((sum, q) => sum + (q.points ?? 1), 0);

    const attempt = await new this.attemptModel({
      organizationId: orgId,
      userId,
      quizId: quiz._id,
      quizVersion: context.assignment ? context.quizVersion : (quiz.version ?? 1),
      assignmentId: context.assignment ? context.assignment._id : null,
      questionOrder: shuffledOrder,
      status: ExamAttemptStatus.IN_PROGRESS,
      score: 0,
      totalPoints,
      correctCount: 0,
      wrongCount: 0,
      answers: [],
      violations: [],
      startedAt,
      expiresAt,
      submittedAt: null,
      durationSec: 0,
    }).save();

    return {
      attempt: attempt as unknown as IExamAttempt,
      quizTitle: quiz.title,
      questions: buildSanitizedQuestions(quiz.questions, shuffledOrder),
    };
  }

  private calcExpiresAt(
    startedAt: Date,
    timeLimitSec?: number,
    assignment?: QuizAssignmentDocument | null,
  ): Date {
    const limitMs =
      (timeLimitSec && timeLimitSec > 0 ? timeLimitSec : DEFAULT_TIME_LIMIT_SEC) * 1000;
    const expiresAt = new Date(startedAt.getTime() + limitMs);

    if (assignment?.dueAt && !assignment.allowLateSubmit) {
      const due = new Date(assignment.dueAt);
      return due < expiresAt ? due : expiresAt;
    }

    return expiresAt;
  }
}
