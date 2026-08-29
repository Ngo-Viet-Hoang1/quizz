import { BullMqJobPublisher } from '@/queue/bullmq-job-publisher';
import { JOB_NAMES } from '@/queue/queue.constants';
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
import { EnqueueAiGenerationJobDto, EnqueueJobResponseDto, GetJobStatusResponseDto } from './dto';
import { AiGenerationJobStatus } from './enums';
import { AiGenerationJob, AiGenerationJobDocument } from './schemas';
import { AiGenerationQuotaService } from './services/ai-generation-quota.service';

@Injectable()
export class AiGenerationService {
  constructor(
    @InjectModel(AiGenerationJob.name)
    private readonly jobModel: Model<AiGenerationJobDocument>,
    private readonly jobPublisher: BullMqJobPublisher,
    private readonly quotaService: AiGenerationQuotaService,
  ) {}

  async enqueueJob(
    orgId: string,
    userId: string,
    dto: EnqueueAiGenerationJobDto,
  ): Promise<EnqueueJobResponseDto> {
    const { idempotencyKey, topic, questionCount, questionType, difficulty, model } = dto;
    const prompt = `Generate ${questionCount} ${questionType} quiz questions on topic: "${topic}". Difficulty: ${difficulty}.`;

    // 1. Insert new PENDING job document (or return existing job if duplicate idempotencyKey)
    let createdJob: AiGenerationJobDocument;
    try {
      const doc = new this.jobModel({
        organizationId: orgId,
        userId,
        idempotencyKey,
        prompt,
        questionCount,
        model,
        status: AiGenerationJobStatus.PENDING,
      });
      createdJob = await doc.save();
    } catch (err: unknown) {
      const mongoErr = err as { code?: number };
      if (mongoErr?.code === 11000) {
        // E11000 duplicate key on { organizationId, idempotencyKey }
        const existingJob = await this.jobModel.findOne({ organizationId: orgId, idempotencyKey });

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

    // 2. Deduct quota atomically (rollback job document if quota exhausted)
    const org = await this.quotaService.deductQuota(orgId);
    if (!org) {
      await this.jobModel.deleteOne({ _id: createdJob._id });
      throw new ForbiddenException('Monthly AI quota exceeded');
    }

    // 3. Push job into BullMQ Redis queue (rollback quota & mark job failed if Redis fails)
    const jobId = createdJob._id ? createdJob._id.toString() : '';
    try {
      await this.jobPublisher.publish(
        JOB_NAMES.GENERATE_QUIZ,
        {
          jobId,
          organizationId: orgId,
          userId,
          topic,
          questionCount,
          questionType,
          difficulty,
          prompt,
          model,
          idempotencyKey,
        },
        { jobId: idempotencyKey },
      );
    } catch (err: unknown) {
      await this.quotaService.refundQuota(orgId, jobId);
      await this.jobModel.updateOne(
        { _id: createdJob._id },
        {
          $set: {
            status: AiGenerationJobStatus.FAILED,
            errorMessage: 'Failed to enqueue job to Redis queue',
          },
        },
      );

      const errorMsg = err instanceof Error ? err.message : String(err);
      throw new InternalServerErrorException(`Failed to queue AI generation job: ${errorMsg}`);
    }

    return { jobId, status: createdJob.status };
  }

  async getJobById(orgId: string, jobId: string): Promise<GetJobStatusResponseDto> {
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
