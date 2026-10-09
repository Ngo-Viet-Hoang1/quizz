import * as React from 'react';
import { Badge } from '@/shared/ui/badge';
import { ReportReason, ReportStatus } from '../types';

export function ReportStatusBadge({ status }: { status: ReportStatus }) {
  switch (status) {
    case ReportStatus.RESOLVED:
      return (
        <Badge
          variant="outline"
          className="border-emerald-500/30 bg-emerald-500/10 text-emerald-500 text-[11px] font-mono"
        >
          Resolved
        </Badge>
      );
    case ReportStatus.REJECTED:
      return (
        <Badge
          variant="outline"
          className="border-destructive/30 bg-destructive/10 text-destructive text-[11px] font-mono"
        >
          Rejected
        </Badge>
      );
    case ReportStatus.PENDING:
    default:
      return (
        <Badge
          variant="outline"
          className="border-amber-500/30 bg-amber-500/10 text-amber-500 text-[11px] font-mono"
        >
          Pending
        </Badge>
      );
  }
}

const reasonLabels: Record<ReportReason, string> = {
  [ReportReason.INCORRECT_ANSWER]: 'Incorrect Answer',
  [ReportReason.UNCLEAR_QUESTION]: 'Unclear Question',
  [ReportReason.TYPO]: 'Typo / Grammar',
  [ReportReason.OUTDATED_CONTENT]: 'Outdated Content',
  [ReportReason.OTHER]: 'Other',
};

export function ReportReasonBadge({ reason }: { reason: ReportReason }) {
  return (
    <Badge variant="secondary" className="text-[11px] font-mono font-normal">
      {reasonLabels[reason] || reason}
    </Badge>
  );
}
