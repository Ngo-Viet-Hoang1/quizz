import { Controller, Get, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import helmet from 'helmet';
import request from 'supertest';

@Controller('test-security')
class TestSecurityController {
  @Get('ping')
  ping(): { message: string } {
    return { message: 'pong' };
  }
}

describe('Security Headers (Helmet) and CORS', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [TestSecurityController],
    }).compile();

    app = moduleRef.createNestApplication();
    app.use(helmet());
    app.enableCors({
      origin: ['http://localhost:3000', 'https://quiz.app'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    });

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should include Helmet security headers in responses', async () => {
    const res = await request(app.getHttpServer()).get('/test-security/ping');

    expect(res.status).toBe(200);
    // Helmet sets X-Frame-Options, X-Content-Type-Options, etc.
    expect(res.headers['x-frame-options'] || res.headers['x-content-type-options']).toBeDefined();
    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });

  it('should allow CORS for whitelisted origins with credentials', async () => {
    const res = await request(app.getHttpServer())
      .get('/test-security/ping')
      .set('Origin', 'http://localhost:3000');

    expect(res.status).toBe(200);
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:3000');
    expect(res.headers['access-control-allow-credentials']).toBe('true');
  });

  it('should not allow CORS for unauthorized origins', async () => {
    const res = await request(app.getHttpServer())
      .get('/test-security/ping')
      .set('Origin', 'https://evil-attacker-website.com');

    expect(res.status).toBe(200);
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });
});
