import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { Connection } from 'mongoose';
import { Logger } from 'nestjs-pino';
import { Env } from '../config/env.schema';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      inject: [ConfigService, Logger],
      useFactory: (configService: ConfigService<Env>, logger: Logger) => ({
        uri: configService.get('MONGODB_URI'),
        maxPoolSize: 10,
        retryWrites: true,
        serverSelectionTimeoutMS: 5000,
        connectionFactory: (connection: Connection) => {
          if (connection.readyState === 1) {
            logger.log('MongoDB connected', 'DatabaseModule');
          }
          connection.on('connected', () => {
            logger.log('MongoDB connected', 'DatabaseModule');
          });
          connection.on('error', (err: Error) => {
            logger.error('MongoDB connection error', err.message, 'DatabaseModule');
          });
          return connection;
        },
      }),
    }),
  ],
})
export class DatabaseModule {}
