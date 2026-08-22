import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { randomBytes } from 'crypto';
import { Model, QueryFilter, Types } from 'mongoose';
import { paginate, PaginateResult } from '../../common/utils/paginate.util';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { QueryQuizDto } from './dto/query-quiz.dto';
import { UpdateQuizDto } from './dto/update-quiz.dto';
import { QuestionType, QuizStatus } from './enums';
import { IQuiz } from './interfaces/quiz.interface';
import { Quiz, QuizDocument } from './schemas/quiz.schema';

const QUIZ_SORT_FIELDS = ['createdAt', 'title', 'updatedAt', 'status', 'questionCount'] as const;

const QUIZ_LIST_PROJECTION: Record<string, 0 | 1> = {
  'questions.options.isCorrect': 0,
  'questions.metadata': 0,
};

@Injectable()
export class QuizService {
  constructor(@InjectModel(Quiz.name) private readonly quizModel: Model<QuizDocument>) {}

  async create(orgId: string, userId: string, dto: CreateQuizDto): Promise<Quiz> {
    const formattedQuestions = dto.questions?.map((q, idx) => ({
      ...q,
      _id: q._id ? new Types.ObjectId(q._id) : new Types.ObjectId(),
      orderIndex: q.orderIndex ?? idx,
      options: q.options?.map((opt, oIdx) => ({
        ...opt,
        _id: opt._id ? new Types.ObjectId(opt._id) : new Types.ObjectId(),
        orderIndex: opt.orderIndex ?? oIdx,
      })),
    }));

    const quiz = new this.quizModel({
      ...dto,
      organizationId: orgId,
      ownerId: userId,
      status: QuizStatus.DRAFT,
      version: 1,
      activeRoomCount: 0,
      deletedAt: null,
      questions: formattedQuestions ?? [],
      questionCount: formattedQuestions?.length ?? 0,
    });

    return quiz.save();
  }

  async findAll(orgId: string, query: QueryQuizDto): Promise<PaginateResult<IQuiz>> {
    const filter = this.buildFilter(orgId, query);

    return paginate<IQuiz, QuizDocument>(this.quizModel, filter, query, {
      allowedSortFields: QUIZ_SORT_FIELDS,
      projection: QUIZ_LIST_PROJECTION,
    });
  }

  async findOne(id: string, orgId: string): Promise<Quiz> {
    const quiz = await this.quizModel
      .findOne({ _id: id, organizationId: orgId, deletedAt: null })
      .lean<Quiz>()
      .exec();

    if (!quiz) {
      throw new NotFoundException(`Quiz with ID ${id} not found`);
    }

    return quiz;
  }

  async update(id: string, orgId: string, dto: UpdateQuizDto): Promise<Quiz> {
    const formattedQuestions = dto.questions?.map((q, idx) => ({
      ...q,
      _id: q._id ? new Types.ObjectId(q._id) : new Types.ObjectId(),
      orderIndex: q.orderIndex ?? idx,
      options: q.options?.map((opt, oIdx) => ({
        ...opt,
        _id: opt._id ? new Types.ObjectId(opt._id) : new Types.ObjectId(),
        orderIndex: opt.orderIndex ?? oIdx,
      })),
    }));

    const payload = {
      ...dto,
      ...(formattedQuestions && {
        questions: formattedQuestions,
        questionCount: formattedQuestions.length,
      }),
    };

    const updated = await this.quizModel
      .findOneAndUpdate({ _id: id, organizationId: orgId, deletedAt: null }, payload, {
        new: true,
      })
      .lean<Quiz>()
      .exec();

    if (!updated) {
      throw new NotFoundException(`Quiz with ID ${id} not found`);
    }

    return updated;
  }

  async publish(id: string, orgId: string): Promise<Quiz> {
    const quiz = await this.quizModel
      .findOne({ _id: id, organizationId: orgId, deletedAt: null })
      .lean<Quiz>()
      .exec();

    if (!quiz) {
      throw new NotFoundException(`Quiz with ID ${id} not found`);
    }

    if (!quiz.questions || quiz.questions.length === 0) {
      throw new BadRequestException('Cannot publish a quiz with no questions');
    }

    for (const q of quiz.questions) {
      if (
        q.type === QuestionType.SINGLE_CHOICE ||
        q.type === QuestionType.MULTIPLE_CHOICE ||
        q.type === QuestionType.TRUE_FALSE
      ) {
        const hasCorrectOption = q.options?.some((opt) => opt.isCorrect === true);
        if (!hasCorrectOption) {
          throw new BadRequestException(
            `Question "${q.content}" must have at least one correct option`,
          );
        }
      } else if (q.type === QuestionType.FILL_BLANK) {
        const hasCorrectText = !!q.metadata?.correctText?.trim();
        const hasCorrectOption = q.options?.some((opt) => opt.isCorrect === true);
        if (!hasCorrectText && !hasCorrectOption) {
          throw new BadRequestException(
            `Question "${q.content}" must have a correct answer configured`,
          );
        }
      } else if (q.type === QuestionType.ORDERING) {
        const hasCorrectOrder =
          (q.metadata?.correctOrder && q.metadata.correctOrder.length > 0) ||
          (q.options && q.options.length > 1);
        if (!hasCorrectOrder) {
          throw new BadRequestException(
            `Question "${q.content}" must have valid ordering configuration`,
          );
        }
      }
    }

    const published = await this.quizModel
      .findOneAndUpdate(
        { _id: id, organizationId: orgId, deletedAt: null },
        { status: QuizStatus.PUBLISHED },
        { new: true },
      )
      .lean<Quiz>()
      .exec();

    return published!;
  }

  async archive(id: string, orgId: string): Promise<Quiz> {
    const updated = await this.quizModel
      .findOneAndUpdate(
        { _id: id, organizationId: orgId, deletedAt: null },
        { status: QuizStatus.ARCHIVED },
        { new: true },
      )
      .lean<Quiz>()
      .exec();

    if (!updated) {
      throw new NotFoundException(`Quiz with ID ${id} not found`);
    }

    return updated;
  }

  async clone(id: string, orgId: string, userId: string): Promise<Quiz> {
    const original = await this.findOne(id, orgId);

    const questions = original.questions?.map((q, idx) => ({
      ...q,
      _id: new Types.ObjectId(),
      orderIndex: q.orderIndex ?? idx,
      options: q.options?.map((opt, oIdx) => ({
        ...opt,
        _id: new Types.ObjectId(),
        orderIndex: opt.orderIndex ?? oIdx,
      })),
    }));

    const cloned = new this.quizModel({
      organizationId: orgId,
      ownerId: userId, // assign the cloning user as the creator / owner
      title: `${original.title} (Copy)`,
      description: original.description,
      category: original.category,
      difficulty: original.difficulty,
      sourceType: original.sourceType,
      visibility: original.visibility,
      timeLimitSec: original.timeLimitSec,
      coverImageUrl: original.coverImageUrl,
      status: QuizStatus.DRAFT,
      version: 1,
      activeRoomCount: 0,
      deletedAt: null,
      questions: questions ?? [],
      questionCount: questions?.length ?? 0,
    });

    return cloned.save();
  }

  async share(id: string, orgId: string): Promise<{ shareCode: string; shareUrl: string }> {
    const quiz = await this.quizModel
      .findOne({ _id: id, organizationId: orgId, deletedAt: null })
      .lean<Quiz>()
      .exec();

    if (!quiz) {
      throw new NotFoundException(`Quiz with ID ${id} not found`);
    }

    if (quiz.shareCode) {
      return { shareCode: quiz.shareCode, shareUrl: `/quizzes/shared/${quiz.shareCode}` };
    }

    const candidateCode = randomBytes(4).toString('hex');

    // Atomic update to avoid race conditions when concurrent requests attempt to share
    const updated = await this.quizModel
      .findOneAndUpdate(
        {
          _id: id,
          organizationId: orgId,
          deletedAt: null,
          $or: [{ shareCode: null }, { shareCode: { $exists: false } }, { shareCode: '' }],
        },
        { $set: { shareCode: candidateCode } },
        { new: true },
      )
      .lean<Quiz>()
      .exec();

    const finalShareCode =
      updated?.shareCode ||
      (await this.quizModel.findOne({ _id: id, organizationId: orgId }).lean<Quiz>().exec())
        ?.shareCode ||
      candidateCode;

    return { shareCode: finalShareCode, shareUrl: `/quizzes/shared/${finalShareCode}` };
  }

  async remove(id: string, orgId: string): Promise<{ deleted: boolean; id: string }> {
    const deleted = await this.quizModel
      .findOneAndUpdate(
        { _id: id, organizationId: orgId, deletedAt: null },
        { deletedAt: new Date() },
      )
      .lean<Quiz>()
      .exec();

    if (!deleted) {
      throw new NotFoundException(`Quiz with ID ${id} not found`);
    }

    return { deleted: true, id };
  }

  private buildFilter(orgId: string, q: QueryQuizDto): QueryFilter<QuizDocument> {
    const { search, category, difficulty, sourceType, visibility, status, ownerId } = q;
    const safeSearch = search ? search.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&') : undefined;

    return {
      deletedAt: null,
      organizationId: orgId, // strictly enforced from auth context
      ...(ownerId && { ownerId }),
      ...(category && { category }),
      ...(difficulty && { difficulty }),
      ...(sourceType && { sourceType }),
      ...(visibility && { visibility }),
      ...(status && { status }),
      ...(safeSearch && {
        $or: [
          { title: { $regex: safeSearch, $options: 'i' } },
          { description: { $regex: safeSearch, $options: 'i' } },
        ],
      }),
    };
  }
}
