export interface AuditLogItem {
  _id: string;
  action: string;
  resourceType?: string | null;
  resourceId?: string | null;
  userId?: string | null;
  orgId?: string | null;
  method?: string | null;
  path?: string | null;
  durationMs?: number | null;
  statusCode: number;
  metadata?: Record<string, unknown> | null;
  ip?: string | null;
  userAgent?: string | null;
  traceId?: string | null;
  timestamp: string;
}

export interface AuditLogQueryParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  action?: string;
  resourceType?: string;
  userId?: string;
  statusCode?: number;
  startDate?: string;
  endDate?: string;
}

export const DEFAULT_AUDIT_LOG_PARAMS: AuditLogQueryParams = {
  page: 1,
  limit: 10,
  sortBy: 'timestamp',
  sortOrder: 'desc',
};
