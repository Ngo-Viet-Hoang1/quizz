import { BullMqWorkerBase } from '@/queue/bullmq-worker.base';
import { QUEUE_CONCURRENCY, QUEUE_NAMES, QUEUE_TIMEOUT_MS } from '@/queue/queue.constants';
import { Processor } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Job } from 'bullmq';
import { Model, Types } from 'mongoose';
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
    const payload = job.data;
    this.logger.log(`Processing AI generation job: ${payload.jobId}`);

    // 1. Atomic transition from PENDING -> PROCESSING
    const jobDoc = await this.jobModel.findOneAndUpdate(
      {
        _id: payload.jobId,
        organizationId: payload.organizationId,
        status: AiGenerationJobStatus.PENDING,
      },
      {
        $set: { status: AiGenerationJobStatus.PROCESSING },
      },
      { new: true },
    );

    // If job is not in PENDING state (e.g. BullMQ retry after failed/completed), early return!
    if (!jobDoc) {
      this.logger.warn(
        `Skipping job ${payload.jobId}: status is no longer PENDING (likely already handled or retried).`,
      );
      return;
    }

    try {
      // 2. Call AI provider — pass signal so request is cancelled on job timeout
      const aiResult = await this.aiProvider.generateQuiz(
        payload.topic,
        payload.questionCount,
        payload.questionType,
        payload.difficulty,
        payload.model,
        signal,
      );

      // 3. Map generated questions — AI returns `text` field; map to `content` per QuizSchema
      const formattedQuestions = aiResult.questions.map((q) => ({
        _id: new Types.ObjectId(),
        content: q.content,
        type: q.type,
        points: q.points,
        explanation: q.explanation,
        options: q.options.map((opt) => ({
          _id: new Types.ObjectId(),
          content: opt.content,
          isCorrect: opt.isCorrect,
        })),
      }));

      // 4. Create Quiz in status: draft, sourceType: ai_generated
      const quizDoc = new this.quizModel({
        organizationId: payload.organizationId,
        ownerId: payload.userId,
        title: payload.topic,
        difficulty: payload.difficulty || QuizDifficulty.MEDIUM,
        sourceType: QuizSourceType.AI_GENERATED,
        visibility: QuizVisibility.PRIVATE,
        status: QuizStatus.DRAFT,
        questions: formattedQuestions,
      });
      const savedQuiz = await quizDoc.save();

      // 5. Update Job to COMPLETED with quizId, stats, and response
      await this.jobModel.updateOne(
        { _id: payload.jobId },
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

      this.logger.log(
        `Job ${payload.jobId} completed successfully. Created quiz draft ${savedQuiz._id}`,
      );
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Job ${payload.jobId} failed: ${errorMsg}`);

      // 6. Mark Job as FAILED
      await this.jobModel.updateOne(
        { _id: payload.jobId },
        {
          $set: {
            status: AiGenerationJobStatus.FAILED,
            errorMessage: errorMsg,
          },
        },
      );

      const isContentSafetyViolation = errorMsg.includes('Content safety violation');

      // 7. Quota refund — only for infra/transient errors (Claude down, timeout, rate-limit).
      //    Intentional content safety violations retain quota to deter abuse.
      if (!isContentSafetyViolation) {
        await this.quotaService.refundQuota(payload.organizationId, payload.jobId);
      } else {
        this.logger.warn(
          `Quota retained for job ${payload.jobId} due to deliberate content safety policy violation.`,
        );
      }

      // 8. Re-throw so BullMqWorkerBase.process() can decide: UnrecoverableError vs retry.
      //    isRetryable() is checked there — quota & status are already handled above.
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
