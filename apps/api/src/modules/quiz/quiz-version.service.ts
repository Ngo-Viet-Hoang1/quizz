import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, QueryFilter, Types } from 'mongoose';
import { paginate, PaginateResult } from '../../common/utils/paginate.util';
import { QueryQuizVersionDto } from './dto/query-quiz-version.dto';
import { QuizVersion, QuizVersionDocument } from './schemas/quiz-version.schema';
import { Quiz } from './schemas/quiz.schema';

const QUIZ_VERSION_SORT_FIELDS = ['createdAt', 'version'] as const;

@Injectable()
export class QuizVersionService {
  constructor(
    @InjectModel(QuizVersion.name)
    private readonly quizVersionModel: Model<QuizVersionDocument>,
  ) {}

  async freezeSnapshot(quiz: Quiz, version: number): Promise<void> {
    await this.quizVersionModel.updateOne(
      { quizId: new Types.ObjectId(quiz._id), version },
      {
        $setOnInsert: {
          quizId: new Types.ObjectId(quiz._id),
          organizationId: quiz.organizationId,
          version,
          snapshot: {
            title: quiz.title,
            timeLimitSec: quiz.timeLimitSec,
            questions: quiz.questions ?? [],
          },
          createdAt: new Date(),
        },
      },
      { upsert: true },
    );
  }

  async getVersions(
    quizId: string,
    orgId: string,
    query: QueryQuizVersionDto,
  ): Promise<PaginateResult<QuizVersion>> {
    const filter: QueryFilter<QuizVersionDocument> = {
      quizId: new Types.ObjectId(quizId),
      organizationId: orgId,
    };

    return paginate<QuizVersion, QuizVersionDocument>(this.quizVersionModel, filter, query, {
      allowedSortFields: QUIZ_VERSION_SORT_FIELDS,
    });
  }

  async getVersionDetail(quizId: string, version: number, orgId: string): Promise<QuizVersion> {
    const quizVersion = await this.quizVersionModel
      .findOne({
        quizId: new Types.ObjectId(quizId),
        organizationId: orgId,
        version,
      })
      .lean<QuizVersion>()
      .exec();

    if (!quizVersion) {
      throw new NotFoundException(`Quiz version ${version} not found for quiz ${quizId}`);
    }

    return quizVersion;
  }
}
