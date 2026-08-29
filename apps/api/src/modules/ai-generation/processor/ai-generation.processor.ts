import { BullMqWorkerBase } from '@/queue/bullmq-worker.base';
import { QUEUE_CONCURRENCY, QUEUE_NAMES, QUEUE_TIMEOUT_MS } from '@/queue/queue.constants';
import { Processor } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Job } from 'bullmq';
import { Model } from 'mongoose';
import { QuizDifficulty, QuizSourceType, QuizStatus, QuizVisibility } from '../../quiz/enums';
import { Quiz, QuizDocument } from '../../quiz/schemas/quiz.schema';
import { AiGenerationJobStatus } from '../enums';
import { AiGenerationJobPayload } from '../interfaces';
import { ClaudeAiProviderService } from '../provider/claude-ai-provider.service';
import { AiGenerationJob, AiGenerationJobDocument } from '../schemas';
import { AiGenerationQuotaService } from '../services/ai-generation-quota.service';

@Processor(QUEUE_NAMES.AI_GENERATION, { concurrency: QUEUE_CONCURRENCY[QUEUE_NAMES.AI_GENERATION] })
@Injectable()
export class AiGenerationProcessor extends BullMqWorkerBase {
  protected readonly logger = new Logger(AiGenerationProcessor.name);
  protected readonly timeoutMs = QUEUE_TIMEOUT_MS[QUEUE_NAMES.AI_GENERATION];

  constructor(
    @InjectModel(AiGenerationJob.name)
    private readonly jobModel: Model<AiGenerationJobDocument>,
    @InjectModel(Quiz.name)
    private readonly quizModel: Model<QuizDocument>,
    private readonly aiProvider: ClaudeAiProviderService,
    private readonly quotaService: AiGenerationQuotaService,
  ) {
    super();
  }

  async handleJob(job: Job<AiGenerationJobPayload>, signal: AbortSignal): Promise<void> {
    const { jobId, organizationId, userId, topic, questionCount, questionType, difficulty, model } =
      job.data;
    this.logger.log(`Processing AI generation job: ${jobId}`);

    // 1. Atomic transition: PENDING -> PROCESSING (early return if already processed/retried)
    const jobDoc = await this.jobModel.findOneAndUpdate(
      { _id: jobId, organizationId, status: AiGenerationJobStatus.PENDING },
      { $set: { status: AiGenerationJobStatus.PROCESSING } },
      { new: true },
    );

    if (!jobDoc) {
      this.logger.warn(`Skipping job ${jobId}: no longer PENDING (already handled or retried).`);
      return;
    }

    try {
      // 2. Call AI Provider using Parameter Object Pattern
      const aiResult = await this.aiProvider.generateQuiz({
        topic,
        questionCount,
        questionType,
        difficulty,
        model,
        signal,
      });

      const quizDoc = new this.quizModel({
        organizationId,
        ownerId: userId,
        title: topic,
        difficulty: difficulty || QuizDifficulty.MEDIUM,
        sourceType: QuizSourceType.AI_GENERATED,
        visibility: QuizVisibility.PRIVATE,
        status: QuizStatus.DRAFT,
        questions: aiResult.questions,
      });
      const savedQuiz = await quizDoc.save();

      // 4. Update Job to COMPLETED with quizId, tokens and cost metrics
      await this.jobModel.updateOne(
        { _id: jobId },
        {
          $set: {
            quizId: savedQuiz._id,
            status: AiGenerationJobStatus.COMPLETED,
            rawResponse: aiResult.rawResponse,
            inputTokens: aiResult.inputTokens,
            outputTokens: aiResult.outputTokens,
            costUsd: aiResult.costUsd,
            completedAt: new Date(),
          },
        },
      );

      this.logger.log(`Job ${jobId} completed successfully. Created quiz draft ${savedQuiz._id}`);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Job ${jobId} failed: ${errorMsg}`);

      // 5. Mark Job as FAILED
      await this.jobModel.updateOne(
        { _id: jobId },
        { $set: { status: AiGenerationJobStatus.FAILED, errorMessage: errorMsg } },
      );

      // 6. Quota refund: only for infra/transient errors (not intentional content safety violations)
      const isContentSafetyViolation = errorMsg.includes('Content safety violation');
      if (!isContentSafetyViolation) {
        await this.quotaService.refundQuota(organizationId, jobId);
      } else {
        this.logger.warn(
          `Quota retained for job ${jobId} due to deliberate content safety policy violation.`,
        );
      }

      // 7. Re-throw so BullMqWorkerBase handles retry vs unrecoverable error
      throw err;
    }
  }

  /**
   * Content safety violations are intentional — do not retry.
   * All other errors (infra, timeout, rate-limit) are retryable.
   */
  protected isRetryable(error: unknown): boolean {
    const msg = error instanceof Error ? error.message : String(error);
    return !msg.includes('Content safety violation');
  }
}
