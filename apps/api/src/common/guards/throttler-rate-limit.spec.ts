import { Controller, Get, INestApplication, Post } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { SkipThrottle, ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import request from 'supertest';
import { GlobalExceptionFilter } from '../filters/global-exception.filter';

@Controller('test-throttle')
class TestThrottleController {
  @Get('limited')
  limited(): { message: string } {
    return { message: 'ok' };
  }

  @SkipThrottle()
  @Post('webhook-skip')
  webhookSkip(): { success: boolean } {
    return { success: true };
  }
}

describe('Rate Limiting with @nestjs/throttler', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [
        ThrottlerModule.forRoot([
          {
            ttl: 60000,
            limit: 3,
          },
        ]),
      ],
      controllers: [TestThrottleController],
      providers: [
        {
          provide: APP_GUARD,
          useClass: ThrottlerGuard,
        },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalFilters(new GlobalExceptionFilter());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should allow requests within limit and block excess requests with 429 and correct error format', async () => {
    // 1st request -> 200 OK
    const res1 = await request(app.getHttpServer()).get('/test-throttle/limited');
    expect(res1.status).toBe(200);

    // 2nd request -> 200 OK
    const res2 = await request(app.getHttpServer()).get('/test-throttle/limited');
    expect(res2.status).toBe(200);

    // 3rd request -> 200 OK (limit is 3)
    const res3 = await request(app.getHttpServer()).get('/test-throttle/limited');
    expect(res3.status).toBe(200);

    // 4th request -> 429 Too Many Requests
    const res4 = await request(app.getHttpServer()).get('/test-throttle/limited');
    expect(res4.status).toBe(429);
    expect(res4.body).toEqual(
      expect.objectContaining({
        success: false,
        code: 'TOO_MANY_REQUESTS',
        message: 'Too Many Requests',
        data: null,
      }),
    );
  });

  it('should skip rate limiting on routes decorated with @SkipThrottle()', async () => {
    // Send 10 consecutive requests to skipped webhook route
    for (let i = 0; i < 10; i++) {
      const res = await request(app.getHttpServer()).post('/test-throttle/webhook-skip');
      expect(res.status).toBe(201);
      expect(res.body).toEqual({ success: true });
    }
  });
});
