import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Job, UnrecoverableError } from 'bullmq';
import { Model, Types } from 'mongoose';
import { QuizDifficulty, QuizSourceType, QuizStatus, QuizVisibility } from '../../quiz/enums';
import { Quiz, QuizDocument } from '../../quiz/schemas/quiz.schema';
import { AI_GENERATION_QUEUE_NAME } from '../constants/ai-generation.constant';
import { AiGenerationJobStatus } from '../enums';
import { AiGenerationJobPayload } from '../interfaces';
import { ClaudeAiProviderService } from '../provider/claude-ai-provider.service';
import { AiGenerationJob, AiGenerationJobDocument } from '../schemas';
import { AiGenerationQuotaService } from '../services/ai-generation-quota.service';

@Processor(AI_GENERATION_QUEUE_NAME)
@Injectable()
export class AiGenerationProcessor extends WorkerHost {
  private readonly logger = new Logger(AiGenerationProcessor.name);

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

  async process(jobOrPayload: Job<AiGenerationJobPayload> | AiGenerationJobPayload): Promise<void> {
    const payload = 'data' in jobOrPayload ? jobOrPayload.data : jobOrPayload;
    this.logger.log(`Processing AI generation job: ${payload.jobId}`);

    // 1. Atomic transition from PENDING -> PROCESSING
    const job = await this.jobModel.findOneAndUpdate(
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
    if (!job) {
      this.logger.warn(
        `Skipping job ${payload.jobId}: status is no longer PENDING (likely already handled or retried).`,
      );
      return;
    }

    try {
      // 2. Call AI provider
      const aiResult = await this.aiProvider.generateQuiz(
        payload.topic,
        payload.questionCount,
        payload.questionType,
        payload.difficulty,
        payload.model,
      );

      // 3. Map generated questions into Quiz questions format
      const formattedQuestions = aiResult.questions.map((q) => ({
        _id: new Types.ObjectId(),
        text: q.text,
        type: q.type,
        points: q.points,
        explanation: q.explanation,
        options: q.options.map((opt) => ({
          _id: new Types.ObjectId(),
          key: opt.key,
          text: opt.text,
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

      // 7. Refund quota for infrastructure/transient errors, retain quota on intentional safety violations
      if (!isContentSafetyViolation) {
        await this.quotaService.refundQuota(payload.organizationId, payload.jobId);
      } else {
        this.logger.warn(
          `Quota retained for job ${payload.jobId} due to deliberate content safety policy violation.`,
        );
      }

      // 8. For safety violations, throw UnrecoverableError so BullMQ terminates without retrying
      if (isContentSafetyViolation) {
        throw new UnrecoverableError(errorMsg);
      }

      // Re-throw so BullMQ records the failed attempt for transient errors
      throw err;
    }
  }
}

