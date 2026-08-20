import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { AuditService } from './audit.service';
import { AuditLog } from './schemas/audit-log.schema';

describe('AuditService', () => {
  let service: AuditService;
  let mockAuditLogModel: {
    create: jest.Mock;
  };

  beforeEach(async () => {
    mockAuditLogModel = {
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        {
          provide: getModelToken(AuditLog.name),
          useValue: mockAuditLogModel,
        },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create audit log with derived resourceType and timestamp', async () => {
    mockAuditLogModel.create.mockResolvedValueOnce({});

    await service.log({
      action: 'quiz.delete',
      resourceId: 'quiz_123',
      userId: 'user_456',
      orgId: 'org_789',
      ip: '127.0.0.1',
      userAgent: 'Mozilla/5.0',
      traceId: 'trace_abc',
      statusCode: 200,
    });

    expect(mockAuditLogModel.create).toHaveBeenCalledWith({
      action: 'quiz.delete',
      resourceType: 'quiz',
      resourceId: 'quiz_123',
      userId: 'user_456',
      orgId: 'org_789',
      ip: '127.0.0.1',
      userAgent: 'Mozilla/5.0',
      traceId: 'trace_abc',
      statusCode: 200,
      timestamp: expect.any(Date),
    });
  });

  it('should catch error and not throw when model.create fails', async () => {
    mockAuditLogModel.create.mockRejectedValueOnce(new Error('DB connection failed'));

    await expect(
      service.log({
        action: 'quiz.delete',
      }),
    ).resolves.not.toThrow();
  });
});
