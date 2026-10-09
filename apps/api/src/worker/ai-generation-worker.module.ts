import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '../config/config.module';
import { DatabaseModule } from '../database/database.module';
import { LoggerModule } from '../logger/logger.module';
import { AiGenerationProcessor } from '../modules/ai-generation/processor/ai-generation.processor';
import { ClaudeAiProviderService } from '../modules/ai-generation/provider/claude-ai-provider.service';
import { AiGenerationJob, AiGenerationJobSchema } from '../modules/ai-generation/schemas';
import { AiGenerationQuotaService } from '../modules/ai-generation/services/ai-generation-quota.service';
import {
  Organization,
  OrganizationSchema,
} from '../modules/organizations/schemas/organization.schema';
import { Quiz, QuizSchema } from '../modules/quiz/schemas/quiz.schema';
import { QueueModule } from '../queue/queue.module';

@Module({
  imports: [
    ConfigModule,
    LoggerModule,
    DatabaseModule,
    QueueModule,
    MongooseModule.forFeature([
      { name: AiGenerationJob.name, schema: AiGenerationJobSchema },
      { name: Organization.name, schema: OrganizationSchema },
      { name: Quiz.name, schema: QuizSchema },
    ]),
  ],
  providers: [AiGenerationQuotaService, ClaudeAiProviderService, AiGenerationProcessor],
})
export class AiGenerationWorkerModule {}
