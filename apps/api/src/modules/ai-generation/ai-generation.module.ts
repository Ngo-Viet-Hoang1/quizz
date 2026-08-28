import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bullmq';
import { UsersModule } from '../users/users.module';
import { Organization, OrganizationSchema } from '../organizations/schemas/organization.schema';
import { Quiz, QuizSchema } from '../quiz/schemas/quiz.schema';
import { AI_GENERATION_QUEUE_NAME } from './constants/ai-generation.constant';
import { parseRedisConnectionOptions } from './queue/ai-generation-queue.config';
import { AiGenerationJob, AiGenerationJobSchema } from './schemas';
import { AiGenerationQueueService } from './queue/ai-generation-queue.service';
import { AiGenerationService } from './ai-generation.service';
import { AiGenerationQuotaService } from './services/ai-generation-quota.service';
import { ClaudeAiProviderService } from './provider/claude-ai-provider.service';
import { AiGenerationProcessor } from './processor/ai-generation.processor';
import { AiGenerationController } from './ai-generation.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AiGenerationJob.name, schema: AiGenerationJobSchema },
      { name: Organization.name, schema: OrganizationSchema },
      { name: Quiz.name, schema: QuizSchema },
    ]),
    UsersModule,
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
  controllers: [AiGenerationController],
  providers: [
    AiGenerationService,
    AiGenerationQueueService,
    AiGenerationQuotaService,
    ClaudeAiProviderService,
    AiGenerationProcessor,
  ],
  exports: [
    MongooseModule,
    BullModule,
    AiGenerationService,
    AiGenerationQueueService,
    AiGenerationQuotaService,
    ClaudeAiProviderService,
    AiGenerationProcessor,
  ],
})
export class AiGenerationModule {}

