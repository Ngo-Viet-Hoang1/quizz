'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { DataTable } from '@/shared/components/data-table';
import { ExamAttemptItem } from '../../types';
import { createStudentPerformanceColumns } from './student-performance-columns';

interface StudentPerformanceTableProps {
  attempts: ExamAttemptItem[];
  onViewScorecard: (attemptId: string) => void;
}

export function StudentPerformanceTable({
  attempts,
  onViewScorecard,
}: StudentPerformanceTableProps) {
  const rankedAttempts = React.useMemo(() => {
    return [...attempts].sort((a, b) => {
      const pctA = a.totalPoints > 0 ? (a.score / a.totalPoints) * 100 : 0;
      const pctB = b.totalPoints > 0 ? (b.score / b.totalPoints) * 100 : 0;
      if (pctB !== pctA) return pctB - pctA;
      // If tied on score, faster time ranks higher
      return (a.durationSec || 0) - (b.durationSec || 0);
    });
  }, [attempts]);

  const columns = React.useMemo(
    () => createStudentPerformanceColumns(onViewScorecard),
    [onViewScorecard],
  );

  return (
    <Card className="border border-border/80 bg-card/60 backdrop-blur-sm shadow-xs">
      <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-semibold">Student Performance Ranking</CardTitle>
        <span className="text-xs text-muted-foreground font-mono">
          {rankedAttempts.length} submissions
        </span>
      </CardHeader>
      <CardContent className="p-4 pt-2">
        <DataTable
          columns={columns}
          data={rankedAttempts}
          emptyMessage="No student attempts submitted yet"
          emptyDescription="Rankings will appear once students complete and submit their exams."
        />
      </CardContent>
    </Card>
  );
}
