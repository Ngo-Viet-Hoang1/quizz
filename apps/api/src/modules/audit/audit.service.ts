import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, QueryFilter } from 'mongoose';
import { paginate, PaginateResult } from '../../common/utils/paginate.util';
import { QueryAuditLogsDto } from './dto/query-audit-logs.dto';
import { AuditLog, AuditLogDocument } from './schemas/audit-log.schema';

export interface CreateAuditLogDto {
  action: string;
  resourceType?: string | null;
  resourceId?: string | null;
  userId?: string | null;
  orgId?: string | null;
  method?: string | null;
  path?: string | null;
  durationMs?: number | null;
  statusCode?: number;
  metadata?: Record<string, unknown> | null;
  ip?: string | null;
  userAgent?: string | null;
  traceId?: string | null;
}

const ALLOWED_SORT_FIELDS = ['timestamp', 'durationMs', 'statusCode', 'action'] as const;

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectModel(AuditLog.name)
    private readonly auditLogModel: Model<AuditLogDocument>,
  ) {}

  async log(payload: CreateAuditLogDto): Promise<void> {
    try {
      const resourceType = payload.resourceType ?? payload.action.split('.')[0] ?? null;

      await this.auditLogModel.create({
        ...payload,
        resourceType,
        timestamp: new Date(),
      });
    } catch (error) {
      // Audit log error must never fail the user's business request
      this.logger.warn(`Failed to write audit log for action: ${payload.action}`, error);
    }
  }

  async findByOrg(orgId: string, query: QueryAuditLogsDto): Promise<PaginateResult<AuditLog>> {
    const filter = this.buildOrgFilter(orgId, query);

    return paginate<AuditLog, AuditLogDocument>(this.auditLogModel, filter, query, {
      allowedSortFields: ALLOWED_SORT_FIELDS,
    });
  }

  private buildOrgFilter(orgId: string, query: QueryAuditLogsDto): QueryFilter<AuditLogDocument> {
    const dateFilter =
      query.startDate || query.endDate
        ? {
            timestamp: {
              ...(query.startDate && { $gte: new Date(query.startDate) }),
              ...(query.endDate && { $lte: new Date(query.endDate) }),
            },
          }
        : {};

    const safeAction = query.action
      ? query.action.trim().replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')
      : undefined;

    return {
      orgId,
      ...(safeAction && { action: { $regex: safeAction, $options: 'i' } }),
      ...(query.resourceType && { resourceType: query.resourceType }),
      ...(query.userId && { userId: query.userId }),
      ...(typeof query.statusCode === 'number' && { statusCode: query.statusCode }),
      ...dateFilter,
    };
  }
}
