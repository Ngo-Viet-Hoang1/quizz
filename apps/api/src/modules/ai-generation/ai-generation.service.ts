import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { paginate, PaginateResult } from '../../common/utils/paginate.util';
import { Organization, OrganizationDocument } from '../organizations/schemas/organization.schema';
import { QuestionType, QuizDifficulty } from '../quiz/enums';
import { EnqueueAiGenerationJobDto } from './dto';
import { AiGenerationJobStatus } from './enums';
import { AiGenerationQueueService } from './queue/ai-generation-queue.service';
import { AiGenerationJob, AiGenerationJobDocument } from './schemas';

export interface EnqueueJobResponse {
  jobId: string;
  status: string;
  quizId?: string | null;
}

export interface GetJobStatusResponse {
  jobId: string;
  status: string;
  quizId: string | null;
  errorMessage?: string | null;
  createdAt?: Date;
  completedAt?: Date | null;
}

@Injectable()
export class AiGenerationService {
  constructor(
    @InjectModel(AiGenerationJob.name)
    private readonly jobModel: Model<AiGenerationJobDocument>,
    @InjectModel(Organization.name)
    private readonly organizationModel: Model<OrganizationDocument>,
    private readonly queueService: AiGenerationQueueService,
  ) {}

  async enqueueJob(
    orgId: string,
    userId: string,
    dto: EnqueueAiGenerationJobDto,
  ): Promise<EnqueueJobResponse> {
    const questionType = dto.questionType ?? QuestionType.SINGLE_CHOICE;
    const difficulty = dto.difficulty ?? QuizDifficulty.MEDIUM;
    const prompt = `Generate ${dto.questionCount} ${questionType} quiz questions on topic: "${dto.topic}". Difficulty: ${difficulty}.`;
    const model = dto.model ?? 'claude-3-5-haiku-20241022';

    // 1. Try to create the job document first with status: pending
    let createdJob: AiGenerationJobDocument;
    try {
      const doc = new this.jobModel({
        organizationId: orgId,
        userId,
        idempotencyKey: dto.idempotencyKey,
        prompt,
        questionCount: dto.questionCount,
        model,
        status: AiGenerationJobStatus.PENDING,
      });
      createdJob = await doc.save();
    } catch (err: unknown) {
      const mongoErr = err as { code?: number };
      if (mongoErr?.code === 11000) {
        // E11000 duplicate key on { organizationId, idempotencyKey }:
        // Job already exists or race condition occurred -> fetch existing job, NO quota deducted
        const existingJob = await this.jobModel.findOne({
          organizationId: orgId,
          idempotencyKey: dto.idempotencyKey,
        });
        if (existingJob) {
          return {
            jobId: existingJob._id ? existingJob._id.toString() : '',
            status: existingJob.status,
            quizId: existingJob.quizId ? existingJob.quizId.toString() : null,
          };
        }
      }
      throw err;
    }

    // 2. Insert succeeded -> Deduct quota atomic
    const cost = 1;
    const org = await this.organizationModel.findOneAndUpdate(
      {
        _id: orgId,
        $expr: {
          $lte: [{ $add: ['$aiQuotaUsed', cost] }, '$aiQuotaMonthly'],
        },
      },
      { $inc: { aiQuotaUsed: cost } },
      { new: true },
    );

    if (!org) {
      // Quota exceeded -> rollback created document and throw 403
      await this.jobModel.deleteOne({ _id: createdJob._id });
      throw new ForbiddenException('Monthly AI quota exceeded');
    }

    // 3. Quota confirmed -> Push job into BullMQ queue with error handling
    try {
      await this.queueService.addJob(
        {
          jobId: createdJob._id ? createdJob._id.toString() : '',
          organizationId: orgId,
          userId,
          topic: dto.topic,
          questionCount: dto.questionCount,
          questionType,
          difficulty,
          prompt,
          model,
          idempotencyKey: dto.idempotencyKey,
        },
        dto.idempotencyKey,
      );
    } catch (err: unknown) {
      // Rollback quota and mark job failed if Redis / Queue push fails
      await this.organizationModel.updateOne({ _id: orgId }, { $inc: { aiQuotaUsed: -cost } });
      if (createdJob?._id) {
        await this.jobModel.updateOne(
          { _id: createdJob._id },
          {
            $set: {
              status: AiGenerationJobStatus.FAILED,
              errorMessage: 'Failed to enqueue job to Redis queue',
            },
          },
        );
      }
      const errorMsg = err instanceof Error ? err.message : String(err);
      throw new InternalServerErrorException(`Failed to queue AI generation job: ${errorMsg}`);
    }

    // 4. Return immediate response
    return {
      jobId: createdJob._id ? createdJob._id.toString() : '',
      status: createdJob.status,
    };
  }

  async getJobById(orgId: string, jobId: string): Promise<GetJobStatusResponse> {
    const job = await this.jobModel.findOne({
      _id: jobId,
      organizationId: orgId,
    });

    if (!job) {
      throw new NotFoundException('AI generation job not found');
    }

    return {
      jobId: job._id ? job._id.toString() : '',
      status: job.status,
      quizId: job.quizId ? job.quizId.toString() : null,
      errorMessage: job.errorMessage ?? null,
      createdAt: job.createdAt,
      completedAt: job.completedAt ?? null,
    };
  }

  async getJobs(
    orgId: string,
    query: PaginationQueryDto,
  ): Promise<PaginateResult<AiGenerationJob>> {
    return paginate<AiGenerationJob, AiGenerationJobDocument>(
      this.jobModel,
      { organizationId: orgId },
      query,
      { allowedSortFields: ['createdAt', 'status', 'questionCount'] },
    );
  }
}




