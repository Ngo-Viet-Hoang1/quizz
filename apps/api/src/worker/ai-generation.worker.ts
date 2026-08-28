import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AiGenerationWorkerModule } from './ai-generation-worker.module';

async function bootstrap(): Promise<void> {
  const logger = new Logger('AiGenerationWorkerBootstrap');
  logger.log('Starting standalone AI Generation Worker process...');

  const app = await NestFactory.createApplicationContext(AiGenerationWorkerModule);
  app.enableShutdownHooks();

  const shutdown = async (signal: string): Promise<void> => {
    logger.log(`Received ${signal}. Shutting down AI Generation Worker gracefully...`);
    await app.close();
    process.exit(0);
  };

  process.on('SIGINT', () => {
    void shutdown('SIGINT');
  });

  process.on('SIGTERM', () => {
    void shutdown('SIGTERM');
  });

  logger.log('AI Generation Worker process is running and waiting for jobs.');
}

void bootstrap();
