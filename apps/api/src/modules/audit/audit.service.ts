import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
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
const MAX_BUFFER_SIZE = 50;
const FLUSH_INTERVAL_MS = 2000;

@Injectable()
export class AuditService implements OnModuleDestroy {
  private readonly logger = new Logger(AuditService.name);
  private logBuffer: Array<CreateAuditLogDto & { resourceType: string | null; timestamp: Date }> =
    [];
  private flushTimer: NodeJS.Timeout | null = null;

  constructor(
    @InjectModel(AuditLog.name)
    private readonly auditLogModel: Model<AuditLogDocument>,
  ) {
    this.flushTimer = setInterval(() => {
      this.flushBuffer().catch((err) => {
        this.logger.warn('Failed periodic audit log flush', err);
      });
    }, FLUSH_INTERVAL_MS);
  }

  async onModuleDestroy(): Promise<void> {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    await this.flushBuffer();
  }

  async log(payload: CreateAuditLogDto): Promise<void> {
    const resourceType = payload.resourceType ?? payload.action.split('.')[0] ?? null;
    this.logBuffer.push({
      ...payload,
      resourceType,
      timestamp: new Date(),
    });

    if (this.logBuffer.length >= MAX_BUFFER_SIZE) {
      this.flushBuffer().catch((err) => {
        this.logger.warn('Failed buffer limit audit log flush', err);
      });
    }
  }

  private async flushBuffer(): Promise<void> {
    if (this.logBuffer.length === 0) return;
    const itemsToInsert = this.logBuffer;
    this.logBuffer = [];

    try {
      await this.auditLogModel.insertMany(itemsToInsert, { ordered: false });
    } catch (error) {
      this.logger.warn(`Failed to batch insert ${itemsToInsert.length} audit logs`, error);
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
