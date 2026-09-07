import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { QuizVersion, QuizVersionDocument } from './schemas/quiz-version.schema';
import { Quiz } from './schemas/quiz.schema';

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
}
