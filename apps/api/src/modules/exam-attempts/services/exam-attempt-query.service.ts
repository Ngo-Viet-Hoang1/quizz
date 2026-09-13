import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, QueryFilter, Types } from 'mongoose';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { PaginateResult, paginate } from '../../../common/utils/paginate.util';
import { buildSanitizedQuestions } from '../../../common/utils/question-sanitizer.util';
import {
  QuizAssignment,
  QuizAssignmentDocument,
} from '../../classes/schemas/quiz-assignment.schema';
import { Question, Quiz, QuizDocument } from '../../quiz/schemas/quiz.schema';
import { QueryExamAttemptDto } from '../dto/query-exam-attempt.dto';
import { ExamAttemptStatus } from '../enums/exam-attempt-status.enum';
import {
  ExamAttemptDetailResponse,
  IExamAttempt,
  SanitizedQuestion,
} from '../interfaces/exam-attempt.interface';
import { ExamAttempt, ExamAttemptDocument } from '../schemas/exam-attempt.schema';

@Injectable()
export class ExamAttemptQueryService {
  constructor(
    @InjectModel(ExamAttempt.name)
    private readonly attemptModel: Model<ExamAttemptDocument>,
    @InjectModel(Quiz.name)
    private readonly quizModel: Model<QuizDocument>,
    @InjectModel(QuizAssignment.name)
    private readonly assignmentModel: Model<QuizAssignmentDocument>,
  ) {}

  async getAssignmentGradebook(
    orgId: string,
    assignmentId: string,
    query: PaginationQueryDto,
  ): Promise<PaginateResult<IExamAttempt>> {
    const assignment = await this.assignmentModel
      .findOne({ _id: new Types.ObjectId(assignmentId), organizationId: orgId })
      .exec();

    if (!assignment) {
      throw new NotFoundException('Quiz assignment not found');
    }

    const filter: QueryFilter<ExamAttemptDocument> = {
      organizationId: orgId,
      assignmentId: new Types.ObjectId(assignmentId),
    };

    return paginate<IExamAttempt, ExamAttemptDocument>(this.attemptModel, filter, query, {
      allowedSortFields: ['createdAt', 'score', 'startedAt', 'submittedAt', 'totalPoints'],
    });
  }

  async getMyHistory(
    orgId: string,
    userId: string,
    query: QueryExamAttemptDto,
  ): Promise<PaginateResult<IExamAttempt>> {
    const filter: QueryFilter<ExamAttemptDocument> = {
      organizationId: orgId,
      userId,
    };

    if (query.quizId) {
      filter.quizId = new Types.ObjectId(query.quizId);
    }
    if (query.assignmentId) {
      filter.assignmentId = new Types.ObjectId(query.assignmentId);
    }
    if (query.status) {
      filter.status = query.status;
    }

    return paginate<IExamAttempt, ExamAttemptDocument>(this.attemptModel, filter, query, {
      allowedSortFields: ['createdAt', 'score', 'startedAt', 'submittedAt', 'totalPoints'],
      populate: 'quizId',
    });
  }

  async getAttemptDetail(
    orgId: string,
    userId: string,
    attemptId: string,
  ): Promise<ExamAttemptDetailResponse> {
    const attempt = await this.attemptModel
      .findOne({ _id: new Types.ObjectId(attemptId), organizationId: orgId, userId })
      .lean()
      .exec();

    if (!attempt) {
      throw new NotFoundException('Exam attempt not found');
    }

    const quizIdStr =
      typeof attempt.quizId === 'object' && attempt.quizId !== null && '_id' in attempt.quizId
        ? String((attempt.quizId as { _id: unknown })._id)
        : String(attempt.quizId);

    const quiz = await this.quizModel
      .findOne({ _id: new Types.ObjectId(quizIdStr), organizationId: orgId, deletedAt: null })
      .lean()
      .exec();

    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }

    let questions: (SanitizedQuestion | Question)[];
    if (attempt.status === ExamAttemptStatus.IN_PROGRESS) {
      questions = buildSanitizedQuestions(quiz.questions, attempt.questionOrder);
    } else {
      if (attempt.questionOrder && attempt.questionOrder.length > 0) {
        const questionMap = new Map(
          quiz.questions.map((q) => [(q as { _id?: unknown })._id?.toString(), q]),
        );
        const ordered = attempt.questionOrder
          .map((id) => questionMap.get(id.toString()))
          .filter(Boolean) as Question[];
        questions = ordered.length > 0 ? ordered : quiz.questions;
      } else {
        questions = quiz.questions;
      }
    }

    return {
      attempt: attempt as unknown as IExamAttempt,
      quizTitle: quiz.title,
      questions,
    };
  }
}
