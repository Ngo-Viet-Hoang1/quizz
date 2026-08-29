import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { BullBoardModule } from '@bull-board/nestjs';
import { BullModule } from '@nestjs/bullmq';
import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import basicAuth from 'express-basic-auth';
import { BullMqJobPublisher } from './bullmq-job-publisher';
import { parseRedisConnectionOptions } from './queue-redis.config';
import { QUEUE_NAMES } from './queue.constants';

@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: parseRedisConnectionOptions(config.get<string>('REDIS_URL')),
        prefix: `{bullmq}:${config.get('NODE_ENV', 'development')}`, // prefix use {} to make Redis Cluster hash right slot
        defaultJobOptions: {
          attempts: 3,
          backoff: { type: 'exponential', delay: 2000 },
          removeOnComplete: { age: 60 * 60 * 24 * 7 },
          removeOnFail: { age: 60 * 60 * 24 * 14 },
        },
      }),
    }),
    BullModule.registerQueue(
      { name: QUEUE_NAMES.AI_GENERATION },
      { name: QUEUE_NAMES.EXAM_EXPIRE },
      { name: QUEUE_NAMES.NOTIFICATION },
    ),
    BullBoardModule.forRoot({
      route: '/admin/queues',
      adapter: ExpressAdapter,
      middleware: basicAuth({
        challenge: true,
        users: {
          [process.env['BULL_BOARD_USER'] ?? 'admin']:
            process.env['BULL_BOARD_PASSWORD'] ?? 'changeme',
        },
      }),
    }),
    BullBoardModule.forFeature(
      { name: QUEUE_NAMES.AI_GENERATION, adapter: BullMQAdapter },
      { name: QUEUE_NAMES.EXAM_EXPIRE, adapter: BullMQAdapter },
      { name: QUEUE_NAMES.NOTIFICATION, adapter: BullMQAdapter },
    ),
  ],
  providers: [BullMqJobPublisher],
  exports: [BullModule, BullMqJobPublisher],
})
export class QueueModule {}
