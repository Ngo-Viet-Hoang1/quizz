'use client';

import { useAuth } from '@clerk/nextjs';
import { useQuery } from '@tanstack/react-query';
import { auditLogKeys, useAuditLogApi } from '../api/audit-log.api';
import { AuditLogItem, AuditLogQueryParams } from '../types';
import { PaginatedResponse } from '@/shared/lib/api-client';

export function useAuditLogs(params?: AuditLogQueryParams) {
  const { isLoaded, orgId } = useAuth();
  const api = useAuditLogApi();

  return useQuery<PaginatedResponse<AuditLogItem[]>>({
    queryKey: auditLogKeys.list(orgId, params),
    queryFn: () => api.getAuditLogs(params),
    enabled: isLoaded && Boolean(orgId),
    placeholderData: (previousData) => previousData,
  });
}
