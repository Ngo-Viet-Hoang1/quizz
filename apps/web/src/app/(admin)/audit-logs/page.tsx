import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
import { auth } from '@clerk/nextjs/server';
import { serverApiClient } from '@/shared/lib/server-api-client';
import { auditLogKeys } from '@/features/audit-logs/api/audit-log.api';
import { AuditTable } from '@/features/audit-logs/components';
import { DEFAULT_AUDIT_LOG_PARAMS, AuditLogItem } from '@/features/audit-logs';

export const metadata = {
  title: 'Audit Logs | AIQuizz',
  description: 'Security and compliance audit trail for organization activities',
};

export default async function AuditLogsPage() {
  const queryClient = new QueryClient();
  const { orgId } = await auth();

  if (orgId) {
    try {
      await queryClient.prefetchQuery({
        queryKey: auditLogKeys.list(orgId, DEFAULT_AUDIT_LOG_PARAMS),
        queryFn: () =>
          serverApiClient.getPaginated<AuditLogItem[]>('/audit-logs', {
            params: DEFAULT_AUDIT_LOG_PARAMS,
          }),
      });
    } catch (error) {
      console.warn('[AuditLogsPage] Server prefetch skipped:', error);
    }
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <AuditTable />
    </HydrationBoundary>
  );
}
