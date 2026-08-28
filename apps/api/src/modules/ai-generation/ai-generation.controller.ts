import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentOrg } from '../../common/decorators/current-org.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { OrgContextGuard } from '../../common/guards/org-context.guard';
import { ParseObjectIdPipe } from '../../common/pipes/parse-object-id.pipe';
import {
  AiGenerationService,
  EnqueueJobResponse,
  GetJobStatusResponse,
} from './ai-generation.service';
import { EnqueueAiGenerationJobDto } from './dto';


@ApiTags('ai-generation')
@Controller('ai-generation-jobs')
@UseGuards(ClerkAuthGuard, OrgContextGuard)
@ApiBearerAuth('clerk-auth')
export class AiGenerationController {
  constructor(private readonly aiGenerationService: AiGenerationService) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Enqueue a new AI quiz generation job' })
  enqueue(
    @CurrentOrg() orgId: string,
    @CurrentUser('_id') userId: string,
    @Body() dto: EnqueueAiGenerationJobDto,
  ): Promise<EnqueueJobResponse> {
    return this.aiGenerationService.enqueueJob(orgId, userId, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get AI generation job status by ID' })
  getJobStatus(
    @CurrentOrg() orgId: string,
    @Param('id', ParseObjectIdPipe) id: string,
  ): Promise<GetJobStatusResponse> {
    return this.aiGenerationService.getJobById(orgId, id);
  }
}


