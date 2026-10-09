'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { AlertTriangle, ShieldAlert } from 'lucide-react';
import { Badge } from '@/shared/ui/badge';
import { ExamAttemptViolation, ViolationType } from '../../types';

const violationLabelMap: Record<string, string> = {
  [ViolationType.TAB_SWITCH]: 'Tab Switched (Left Exam Window)',
  [ViolationType.FULLSCREEN_EXIT]: 'Exited Fullscreen Mode',
  [ViolationType.WINDOW_BLUR]: 'Browser Window Lost Focus',
  [ViolationType.DEVTOOLS_OPEN]: 'Developer Tools Opened',
  [ViolationType.COPY_PASTE]: 'Copy / Paste Action Attempted',
  [ViolationType.OTHER]: 'Suspicious Activity Detected',
};

interface ScorecardViolationsProps {
  violations: ExamAttemptViolation[];
}

export function ScorecardViolations({ violations }: ScorecardViolationsProps) {
  if (!violations || violations.length === 0) return null;

  return (
    <div className="rounded-lg border border-rose-500/30 bg-rose-500/5 p-4 space-y-3">
      <div className="flex items-center gap-2 text-rose-500 font-semibold text-xs uppercase tracking-wide">
        <ShieldAlert className="h-4 w-4" />
        <span>Integrity & Proctoring Warnings ({violations.length})</span>
      </div>

      <div className="divide-y divide-rose-500/15 text-xs">
        {violations.map((v, i) => (
          <div key={i} className="flex items-center justify-between py-2 first:pt-0 last:pb-0">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-3.5 w-3.5 text-rose-500 shrink-0" />
              <span className="font-medium text-foreground">
                {violationLabelMap[v.type] || v.type}
              </span>
            </div>
            <Badge
              variant="outline"
              className="font-mono text-[11px] text-muted-foreground border-rose-500/20"
            >
              {v.occurredAt ? format(new Date(v.occurredAt), 'HH:mm:ss') : 'N/A'}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  );
}
