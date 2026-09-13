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
import { QuizVersion, QuizVersionDocument } from '../../quiz/schemas/quiz-version.schema';
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
    @InjectModel(QuizVersion.name)
    private readonly quizVersionModel: Model<QuizVersionDocument>,
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
      // Đọc đúng phiên bản snapshot tại thời điểm học sinh BẮT ĐẦU thi
      const activeSnapshot = await this.quizVersionModel
        .findOne({
          quizId: active.quizId,
          organizationId: orgId,
          version: active.quizVersion,
        })
        .lean()
        .exec();

      return {
        attempt: active as unknown as IExamAttempt,
        quizTitle: activeSnapshot?.snapshot.title ?? 'Quiz',
        questions: buildSanitizedQuestions(
          activeSnapshot?.snapshot.questions ?? [],
          active.questionOrder,
        ),
      };
    }

    return this.createAttempt(orgId, userId, context);
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

  /**
   * Lấy phiên bản snapshot mới nhất của quiz từ collection quiz_versions.
   * KHÔNG bao giờ đọc từ quizzes.questions (mutable) để tránh data integrity bug.
   */
  private async getQuizSnapshot(
    orgId: string,
    quizId: Types.ObjectId,
  ): Promise<QuizVersionDocument> {
    const latestVersion = await this.quizVersionModel
      .findOne({ quizId, organizationId: orgId })
      .sort({ version: -1 })
      .lean()
      .exec();

    if (!latestVersion) {
      throw new NotFoundException(
        'Đề thi chưa có phiên bản xuất bản nào. Vui lòng yêu cầu giáo viên publish đề thi.',
      );
    }

    return latestVersion as unknown as QuizVersionDocument;
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
    context: ExamContext,
  ): Promise<StartExamAttemptResponse> {
    // ✅ Đọc từ snapshot bất biến thay vì quiz mutable
    const snapshot = await this.getQuizSnapshot(orgId, context.quizId);

    const startedAt = new Date();
    const expiresAt = this.calcExpiresAt(
      startedAt,
      snapshot.snapshot.timeLimitSec,
      context.assignment,
    );
    const shuffledOrder = shuffleArray(
      snapshot.snapshot.questions.map((q) => (q as unknown as { _id: Types.ObjectId })._id),
    );
    const totalPoints = snapshot.snapshot.questions.reduce((sum, q) => sum + (q.points ?? 1), 0);

    const attempt = await new this.attemptModel({
      organizationId: orgId,
      userId,
      quizId: context.quizId,
      quizVersion: snapshot.version, // ✅ Ghi version cố định vào attempt
      assignmentId: context.assignment?._id ?? null,
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
      quizTitle: snapshot.snapshot.title,
      questions: buildSanitizedQuestions(snapshot.snapshot.questions, shuffledOrder),
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
