'use client';

import * as React from 'react';
import { SortingState } from '@tanstack/react-table';
import { Copy, Download, Check } from 'lucide-react';
import { DataTable, FilterOption } from '@/shared/components/data-table';
import { useDebounce } from '@/shared/hooks';
import { Button } from '@/shared/ui/button';
import { AuditLogItem, AuditLogQueryParams, DEFAULT_AUDIT_LOG_PARAMS } from '../types';
import { useAuditLogs } from '../hooks/use-audit-logs';
import { createAuditColumns } from './audit-columns';
import { AuditDetailSheet } from './audit-detail-sheet';

const resourceFilterOptions: FilterOption[] = [
  { label: 'All Events', value: 'ALL' },
  { label: 'Quizzes', value: 'quiz' },
  { label: 'Classes', value: 'class' },
  { label: 'Subscriptions', value: 'subscription' },
  { label: 'Users & Auth', value: 'user' },
];

export function AuditTable() {
  const [searchInput, setSearchInput] = React.useState('');
  const debouncedSearch = useDebounce(searchInput, 300);
  const [activeFilter, setActiveFilter] = React.useState<string>('ALL');
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(DEFAULT_AUDIT_LOG_PARAMS.limit ?? 10);

  const [selectedLog, setSelectedLog] = React.useState<AuditLogItem | null>(null);
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);
  const [copiedBulk, setCopiedBulk] = React.useState(false);

  const handleViewDetails = React.useCallback((log: AuditLogItem) => {
    setSelectedLog(log);
    setIsSheetOpen(true);
  }, []);

  const queryParams: AuditLogQueryParams = {
    ...DEFAULT_AUDIT_LOG_PARAMS,
    page,
    limit: pageSize,
    ...(debouncedSearch.trim() && { action: debouncedSearch.trim() }),
    ...(activeFilter !== 'ALL' && { resourceType: activeFilter }),
    ...(sorting[0] && {
      sortBy: sorting[0].id,
      sortOrder: sorting[0].desc ? 'desc' : ('asc' as const),
    }),
  };

  const { data: response, isLoading } = useAuditLogs(queryParams);

  const logs = response?.data ?? [];
  const meta = response?.meta;

  const columns = React.useMemo(() => createAuditColumns(handleViewDetails), [handleViewDetails]);

  const handleCopySelectedIds = (selected: AuditLogItem[]) => {
    const ids = selected.map((item) => item._id).join('\n');
    navigator.clipboard.writeText(ids);
    setCopiedBulk(true);
    setTimeout(() => setCopiedBulk(false), 2000);
  };

  const handleExportSelectedJson = (selected: AuditLogItem[]) => {
    const dataStr =
      'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(selected, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `audit-logs-export-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="w-full space-y-4">
      <DataTable
        columns={columns}
        data={logs}
        isLoading={isLoading}
        skeletonRowCount={8}
        searchColumnId="action"
        searchPlaceholder="Filter by action (e.g. quiz.create, user.sync)..."
        searchValue={searchInput}
        onSearchChange={(val) => {
          setSearchInput(val);
          setPage(1);
        }}
        filterOptions={resourceFilterOptions}
        activeFilter={activeFilter}
        onFilterChange={(val) => {
          setActiveFilter(val);
          setPage(1);
        }}
        serverPagination={meta}
        onPageChange={(nextPage) => setPage(nextPage)}
        onPageSizeChange={(nextSize) => {
          setPageSize(nextSize);
          setPage(1);
        }}
        onSortChange={setSorting}
        onRowClick={handleViewDetails}
        renderBulkActions={(selected) => (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs font-mono"
              onClick={() => handleCopySelectedIds(selected)}
            >
              {copiedBulk ? (
                <>
                  <Check className="h-3 w-3 mr-1 text-emerald-500" /> Copied IDs
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3 mr-1" /> Copy IDs
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs font-mono"
              onClick={() => handleExportSelectedJson(selected)}
            >
              <Download className="h-3 w-3 mr-1" /> Export JSON
            </Button>
          </div>
        )}
        emptyMessage="No audit logs found"
        emptyDescription="Audit records for administrative and system operations will appear here."
      />

      <AuditDetailSheet log={selectedLog} open={isSheetOpen} onOpenChange={setIsSheetOpen} />
    </div>
  );
}
