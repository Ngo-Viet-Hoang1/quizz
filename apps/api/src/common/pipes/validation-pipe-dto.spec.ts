import { Body, Controller, INestApplication, Post, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { CreateQuizDto } from '../../modules/quiz/dto/create-quiz.dto';
import { GlobalExceptionFilter } from '../filters/global-exception.filter';
import { validationExceptionFactory } from './validation-exception.factory';

@Controller('test-validation')
class TestValidationController {
  @Post('quiz')
  createQuiz(@Body() dto: CreateQuizDto): CreateQuizDto {
    return dto;
  }
}

describe('ValidationPipe and DTO Validation', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [TestValidationController],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
        exceptionFactory: validationExceptionFactory,
      }),
    );
    app.useGlobalFilters(new GlobalExceptionFilter());

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should reject request with 400 when unknown/unwhitelisted property is provided', async () => {
    const invalidPayload = {
      title: 'Valid Quiz Title',
      hackedField: 'malicious-data', // unknown field
    };

    const res = await request(app.getHttpServer())
      .post('/test-validation/quiz')
      .send(invalidPayload);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('VALIDATION_ERROR');
    expect(JSON.stringify(res.body.errors)).toContain('hackedField');
  });

  it('should accept request with 201 when valid DTO fields are provided', async () => {
    const validPayload = {
      title: 'Valid Quiz Title',
      description: 'A valid description',
    };

    const res = await request(app.getHttpServer()).post('/test-validation/quiz').send(validPayload);

    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Valid Quiz Title');
  });
});
