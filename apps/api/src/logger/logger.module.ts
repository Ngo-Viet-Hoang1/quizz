import { Module } from '@nestjs/common';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { Env } from '../config/env.schema';

@Module({
  imports: [
    PinoLoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env>) => {
        const isProd = config.get('NODE_ENV') === 'production';
        return {
          pinoHttp: {
            level: isProd ? 'info' : 'debug',
            transport: !isProd
              ? {
                  target: 'pino-pretty',
                  options: {
                    colorize: true,
                    singleLine: true,
                    translateTime: 'SYS:HH:MM:ss.l',
                    ignore: 'pid,hostname',
                  },
                }
              : undefined,
            serializers: {
              req: (req: { id?: string; method?: string; url?: string }) => ({
                id: req.id,
                method: req.method,
                url: req.url,
              }),
              res: (res: { statusCode?: number }) => ({
                statusCode: res.statusCode,
              }),
            },
            redact: {
              paths: ['req.headers.authorization', 'req.body.password', 'req.body.token'],
              censor: '[Redacted]',
            },
            genReqId: () => randomUUID(),
          },
        };
      },
    }),
  ],
})
export class LoggerModule {}
