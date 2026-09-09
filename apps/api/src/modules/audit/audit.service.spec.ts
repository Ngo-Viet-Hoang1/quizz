import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { AuditService } from './audit.service';
import { AuditLog } from './schemas/audit-log.schema';
import { QueryAuditLogsDto } from './dto/query-audit-logs.dto';

describe('AuditService', () => {
  let service: AuditService;
  let mockAuditLogModel: {
    create: jest.Mock;
    find: jest.Mock;
    countDocuments: jest.Mock;
  };

  const mockQueryChain = {
    sort: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    populate: jest.fn().mockReturnThis(),
    lean: jest.fn().mockReturnThis(),
    exec: jest.fn(),
  };

  const mockCountExec = {
    exec: jest.fn(),
  };

  beforeEach(async () => {
    mockAuditLogModel = {
      create: jest.fn(),
      find: jest.fn().mockReturnValue(mockQueryChain),
      countDocuments: jest.fn().mockReturnValue(mockCountExec),
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

  describe('log', () => {
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

  describe('findByOrg', () => {
    const mockLogs = [
      {
        _id: 'log_1',
        action: 'quiz.create',
        orgId: 'org_test',
        timestamp: new Date('2026-09-06T12:00:00.000Z'),
      },
    ];

    it('should query audit logs with default pagination and sorting', async () => {
      mockQueryChain.exec.mockResolvedValueOnce(mockLogs);
      mockCountExec.exec.mockResolvedValueOnce(1);

      const query: QueryAuditLogsDto = {
        page: 1,
        limit: 20,
        sortBy: 'timestamp',
        sortOrder: 'desc',
      };

      const result = await service.findByOrg('org_test', query);

      expect(mockAuditLogModel.find).toHaveBeenCalledWith({ orgId: 'org_test' }, undefined);
      expect(mockQueryChain.sort).toHaveBeenCalledWith({ timestamp: -1 });
      expect(mockQueryChain.skip).toHaveBeenCalledWith(0);
      expect(mockQueryChain.limit).toHaveBeenCalledWith(20);
      expect(result.items).toEqual(mockLogs);
      expect(result.meta).toEqual({
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
      });
    });

    it('should apply filters for action, resourceType, userId, statusCode, and date range', async () => {
      mockQueryChain.exec.mockResolvedValueOnce([]);
      mockCountExec.exec.mockResolvedValueOnce(0);

      const query: QueryAuditLogsDto = {
        page: 2,
        limit: 10,
        sortBy: 'durationMs',
        sortOrder: 'asc',
        action: 'class.member.remove',
        resourceType: 'class',
        userId: 'user_123',
        statusCode: 200,
        startDate: '2026-09-01T00:00:00.000Z',
        endDate: '2026-09-06T23:59:59.999Z',
      };

      await service.findByOrg('org_test', query);

      expect(mockAuditLogModel.find).toHaveBeenCalledWith(
        {
          orgId: 'org_test',
          action: { $regex: 'class\\.member\\.remove', $options: 'i' },
          resourceType: 'class',
          userId: 'user_123',
          statusCode: 200,
          timestamp: {
            $gte: new Date('2026-09-01T00:00:00.000Z'),
            $lte: new Date('2026-09-06T23:59:59.999Z'),
          },
        },
        undefined,
      );
      expect(mockQueryChain.sort).toHaveBeenCalledWith({ durationMs: 1 });
      expect(mockQueryChain.skip).toHaveBeenCalledWith(10);
      expect(mockQueryChain.limit).toHaveBeenCalledWith(10);
    });

    it('should fallback to timestamp sort if sortBy is createdAt or invalid', async () => {
      mockQueryChain.exec.mockResolvedValueOnce([]);
      mockCountExec.exec.mockResolvedValueOnce(0);

      const query: QueryAuditLogsDto = {
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      };

      await service.findByOrg('org_test', query);

      expect(mockQueryChain.sort).toHaveBeenCalledWith({ timestamp: -1 });
    });
  });
});
