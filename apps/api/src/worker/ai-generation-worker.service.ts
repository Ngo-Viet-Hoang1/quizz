import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class AiGenerationWorkerService {
  private readonly logger = new Logger(AiGenerationWorkerService.name);

  constructor() {
    this.logger.log('AiGenerationWorkerService initialized via @nestjs/bullmq');
  }
}
