import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { Organization, OrganizationSchema } from '../organizations/schemas/organization.schema';
import { Quiz, QuizSchema } from '../quiz/schemas/quiz.schema';
import { UsersModule } from '../users/users.module';
import { AiGenerationController } from './ai-generation.controller';
import { AiGenerationService } from './ai-generation.service';
import { AiGenerationProcessor } from './processor/ai-generation.processor';
import { ClaudeAiProviderService } from './provider/claude-ai-provider.service';
import { AiGenerationJob, AiGenerationJobSchema } from './schemas';
import { AiGenerationQuotaService } from './services/ai-generation-quota.service';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: AiGenerationJob.name, schema: AiGenerationJobSchema },
      { name: Organization.name, schema: OrganizationSchema },
      { name: Quiz.name, schema: QuizSchema },
    ]),
    UsersModule,
  ],
  controllers: [AiGenerationController],
  providers: [
    AiGenerationService,
    AiGenerationQuotaService,
    ClaudeAiProviderService,
    AiGenerationProcessor,
  ],
  exports: [AiGenerationService, AiGenerationQuotaService],
})
export class AiGenerationModule {}
