import { Module, Logger } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { Connection } from 'mongoose';
import { Env } from '../config/env.schema';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService<Env>) => ({
        uri: configService.get('MONGODB_URI'),
        maxPoolSize: 10,
        retryWrites: true,
        serverSelectionTimeoutMS: 5000,
        connectionFactory: (connection: Connection) => {
          if (connection.readyState === 1) {
            new Logger('DatabaseModule').log('MongoDB connected');
          }
          connection.on('connected', () => {
            new Logger('DatabaseModule').log('MongoDB connected');
          });
          connection.on('error', (err: Error) => {
            new Logger('DatabaseModule').error(`MongoDB connection error: ${err.message}`);
          });
          return connection;
        },
      }),
    }),
  ],
})
export class DatabaseModule {}
