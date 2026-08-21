import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { randomBytes } from 'crypto';
import { Model, Types, isValidObjectId } from 'mongoose';
import { PaginationMeta } from '../../common/response/api-response';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { QueryQuizDto } from './dto/query-quiz.dto';
import { UpdateQuizDto } from './dto/update-quiz.dto';
import { Quiz, QuizDocument, QuizStatus } from './schemas/quiz.schema';

@Injectable()
export class QuizService {
  constructor(@InjectModel(Quiz.name) private readonly quizModel: Model<QuizDocument>) {}

  async create(dto: CreateQuizDto): Promise<Quiz> {
    const quiz = new this.quizModel({
      ...dto,
      questionCount: dto.questions?.length ?? 0,
      ownerId:
        dto.ownerId && isValidObjectId(dto.ownerId) ? new Types.ObjectId(dto.ownerId) : undefined,
    });
    return quiz.save();
  }

  async findAll(query: QueryQuizDto): Promise<{ items: Quiz[]; meta: PaginationMeta }> {
    const { page = 1, limit = 10 } = query;
    const filter = this.buildFilter(query);
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.quizModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
      this.quizModel.countDocuments(filter).exec(),
    ]);

    return { items, meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 } };
  }

  async findOne(id: string): Promise<Quiz> {
    this.checkId(id);
    const quiz = await this.quizModel.findOne({ _id: id, deletedAt: null }).exec();
    if (!quiz) throw new NotFoundException(`Quiz with ID ${id} not found`);
    return quiz;
  }

  async update(id: string, dto: UpdateQuizDto): Promise<Quiz> {
    this.checkId(id);
    const payload = {
      ...dto,
      ...(dto.questions && { questionCount: dto.questions.length }),
      ...(dto.ownerId &&
        isValidObjectId(dto.ownerId) && { ownerId: new Types.ObjectId(dto.ownerId) }),
    };
    const updated = await this.quizModel
      .findOneAndUpdate({ _id: id, deletedAt: null }, payload, { new: true })
      .exec();
    if (!updated) throw new NotFoundException(`Quiz with ID ${id} not found`);
    return updated;
  }

  async publish(id: string): Promise<Quiz> {
    return this.update(id, { status: QuizStatus.PUBLISHED });
  }

  async archive(id: string): Promise<Quiz> {
    return this.update(id, { status: QuizStatus.ARCHIVED });
  }

  async clone(id: string): Promise<Quiz> {
    const original = await this.findOne(id);
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
      organizationId: original.organizationId,
      ownerId: original.ownerId,
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
      questions,
      questionCount: questions?.length ?? 0,
    });
    return cloned.save();
  }

  async share(id: string): Promise<{ shareCode: string; shareUrl: string }> {
    const quiz = await this.findOne(id);
    const shareCode = quiz.shareCode || randomBytes(4).toString('hex');
    if (!quiz.shareCode) {
      await this.quizModel.findByIdAndUpdate(id, { shareCode }).exec();
    }
    return { shareCode, shareUrl: `/quizzes/shared/${shareCode}` };
  }

  async remove(id: string): Promise<{ deleted: boolean; id: string }> {
    this.checkId(id);
    const deleted = await this.quizModel
      .findOneAndUpdate({ _id: id, deletedAt: null }, { deletedAt: new Date() })
      .exec();
    if (!deleted) throw new NotFoundException(`Quiz with ID ${id} not found`);
    return { deleted: true, id };
  }

  private checkId(id: string): void {
    if (!isValidObjectId(id)) throw new NotFoundException(`Invalid quiz ID: ${id}`);
  }

  private buildFilter(q: QueryQuizDto): Record<string, unknown> {
    const {
      search,
      organizationId,
      ownerId,
      category,
      difficulty,
      sourceType,
      visibility,
      status,
    } = q;
    const safeSearch = search ? search.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&') : undefined;

    return {
      deletedAt: null,
      ...(organizationId && { organizationId }),
      ...(ownerId && isValidObjectId(ownerId) && { ownerId: new Types.ObjectId(ownerId) }),
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
