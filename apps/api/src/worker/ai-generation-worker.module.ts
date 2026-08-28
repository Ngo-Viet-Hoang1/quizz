import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule } from '../config/config.module';
import { DatabaseModule } from '../database/database.module';
import { LoggerModule } from '../logger/logger.module';
import { AI_GENERATION_QUEUE_NAME } from '../modules/ai-generation/constants/ai-generation.constant';
import { parseRedisConnectionOptions } from '../modules/ai-generation/queue/ai-generation-queue.config';
import { AiGenerationProcessor } from '../modules/ai-generation/processor/ai-generation.processor';
import { ClaudeAiProviderService } from '../modules/ai-generation/provider/claude-ai-provider.service';
import { AiGenerationJob, AiGenerationJobSchema } from '../modules/ai-generation/schemas';
import { AiGenerationQuotaService } from '../modules/ai-generation/services/ai-generation-quota.service';
import {
  Organization,
  OrganizationSchema,
} from '../modules/organizations/schemas/organization.schema';
import { Quiz, QuizSchema } from '../modules/quiz/schemas/quiz.schema';
import { AiGenerationWorkerService } from './ai-generation-worker.service';

@Module({
  imports: [
    ConfigModule,
    LoggerModule,
    DatabaseModule,
    MongooseModule.forFeature([
      { name: AiGenerationJob.name, schema: AiGenerationJobSchema },
      { name: Organization.name, schema: OrganizationSchema },
      { name: Quiz.name, schema: QuizSchema },
    ]),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: parseRedisConnectionOptions(configService.get<string>('REDIS_URL')),
      }),
    }),
    BullModule.registerQueue({
      name: AI_GENERATION_QUEUE_NAME,
    }),
  ],
  providers: [
    AiGenerationQuotaService,
    ClaudeAiProviderService,
    AiGenerationProcessor,
    AiGenerationWorkerService,
  ],
})
export class AiGenerationWorkerModule {}
