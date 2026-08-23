import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
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
}
