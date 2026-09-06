import { Test, TestingModule } from '@nestjs/testing';
import { Schema as MongooseSchema } from 'mongoose';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { OrgContextGuard } from '../../common/guards/org-context.guard';
import { AuditController } from './audit.controller';
import { AuditService } from './audit.service';
import { QueryAuditLogsDto } from './dto/query-audit-logs.dto';
import { AuditLog } from './schemas/audit-log.schema';

describe('AuditController', () => {
  let controller: AuditController;
  let service: jest.Mocked<AuditService>;

  const mockAuditLogs: AuditLog[] = [
    {
      _id: new MongooseSchema.Types.ObjectId('507f1f77bcf86cd799439011'),
      action: 'quiz.create',
      resourceType: 'quiz',
      resourceId: 'quiz_123',
      userId: 'user_1',
      orgId: 'org_1',
      method: 'POST',
      path: '/api/v1/quizzes',
      durationMs: 45,
      statusCode: 201,
      metadata: { title: 'Math Quiz' },
      ip: '127.0.0.1',
      userAgent: 'Jest',
      traceId: 'trace_1',
      timestamp: new Date('2026-09-06T12:00:00.000Z'),
    },
  ];

  const mockPaginationResult = {
    items: mockAuditLogs,
    meta: {
      page: 1,
      limit: 20,
      total: 1,
      totalPages: 1,
    },
  };

  beforeEach(async () => {
    const mockAuditService = {
      findByOrg: jest.fn().mockResolvedValue(mockPaginationResult),
      log: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuditController],
      providers: [
        {
          provide: AuditService,
          useValue: mockAuditService,
        },
      ],
    })
      .overrideGuard(ClerkAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(OrgContextGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AuditController>(AuditController);
    service = module.get(AuditService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated audit logs wrapped in ApiResponse envelope', async () => {
      const orgId = 'org_test_123';
      const query: QueryAuditLogsDto = {
        page: 1,
        limit: 20,
        sortBy: 'timestamp',
        sortOrder: 'desc',
        action: 'quiz.create',
      };

      const result = await controller.findAll(orgId, query);

      expect(service.findByOrg).toHaveBeenCalledWith(orgId, query);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockAuditLogs);
      expect(result.meta).toEqual(mockPaginationResult.meta);
    });
  });
});
