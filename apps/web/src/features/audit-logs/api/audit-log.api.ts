import { apiClient, useApiClient, PaginatedResponse } from '@/shared/lib/api-client';
import { AuditLogItem, AuditLogQueryParams } from '../types';

export const auditLogKeys = {
  all: ['audit-logs'] as const,
  lists: () => [...auditLogKeys.all, 'list'] as const,
  list: (orgId?: string | null, params?: AuditLogQueryParams) =>
    [...auditLogKeys.lists(), orgId ?? 'anonymous', params ?? {}] as const,
};

export const createAuditLogApi = (client = apiClient) => ({
  getAuditLogs: (params?: AuditLogQueryParams): Promise<PaginatedResponse<AuditLogItem[]>> =>
    client.getPaginated<AuditLogItem[]>('/audit-logs', { params }),
});

export const auditLogApi = createAuditLogApi();
export const useAuditLogApi = () => createAuditLogApi(useApiClient());
