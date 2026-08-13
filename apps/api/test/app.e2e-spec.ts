import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { ResponseInterceptor } from '../src/common/interceptors/response.interceptor';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalInterceptors(new ResponseInterceptor());

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/v1/health', () => {
    it('should return wrapped health status with success: true', async () => {
      const response = await request(app.getHttpServer()).get('/api/v1/health').expect(200);

      expect(response.body).toEqual({
        success: true,
        data: {
          status: 'ok',
          timestamp: expect.any(String),
        },
      });
    });
  });

  describe('GET /api/v1/health/error-test', () => {
    it('should return formatted exception response for HttpException', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/health/error-test')
        .expect(404);

      expect(response.body).toEqual({
        success: false,
        error: {
          message: 'quiz not found',
          code: 'NOT_FOUND',
          statusCode: 404,
        },
      });
    });
  });

  describe('GET /api/v1/health/generic-error-test', () => {
    let originalNodeEnv: string | undefined;

    beforeEach(() => {
      originalNodeEnv = process.env.NODE_ENV;
    });

    afterEach(() => {
      process.env.NODE_ENV = originalNodeEnv;
    });

    it('should expose error details when NOT in production', async () => {
      process.env.NODE_ENV = 'development';
      const response = await request(app.getHttpServer())
        .get('/api/v1/health/generic-error-test')
        .expect(500);

      expect(response.body).toEqual({
        success: false,
        error: {
          message: 'sensitive db error info',
          code: 'INTERNAL_ERROR',
          statusCode: 500,
        },
      });
    });

    it('should mask error details with "Internal server error" when in production', async () => {
      process.env.NODE_ENV = 'production';
      const response = await request(app.getHttpServer())
        .get('/api/v1/health/generic-error-test')
        .expect(500);

      expect(response.body).toEqual({
        success: false,
        error: {
          message: 'Internal server error',
          code: 'INTERNAL_ERROR',
          statusCode: 500,
        },
      });
    });
  });
});
