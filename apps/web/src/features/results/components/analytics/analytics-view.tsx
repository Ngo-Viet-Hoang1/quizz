'use client';

import * as React from 'react';
import { BarChart3 } from 'lucide-react';
import { useClasses, useMultipleClassAssignments } from '@/features/classes/hooks';
import { useMyExamHistory } from '../../hooks';
import { ExamAttemptItem } from '../../types';
import { TeacherScorecardDialog } from '../scorecard';
import { AnalyticsKPICards } from './analytics-kpi-cards';
import { ClassroomPerformanceTable } from './classroom-performance-table';
import { ScoreDistributionChart } from './score-distribution-chart';
import { StudentPerformanceTable } from './student-performance-table';
import { Card } from '@/shared/ui/card';

export function AnalyticsView() {
  const [activeScorecardAttemptId, setActiveScorecardAttemptId] = React.useState<string | null>(
    null,
  );

  // 1. Fetch all classrooms
  const { data: classes = [] } = useClasses({ limit: 100 });
  const totalStudentsAcrossAllClasses = React.useMemo(() => {
    return classes.reduce((sum, c) => sum + (c.memberCount || 0), 0);
  }, [classes]);

  // 2. Fetch all assignments across all classrooms
  const classIds = React.useMemo(() => {
    return classes.map((c) => c._id || c.id || '').filter(Boolean);
  }, [classes]);
  const { data: assignments = [] } = useMultipleClassAssignments(classIds);

  // 3. Fetch all organization examination attempts
  const { data: historyResponse, isLoading } = useMyExamHistory();
  const allAttempts: ExamAttemptItem[] = historyResponse?.data ?? [];

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Classroom Analytics & Insights
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Organization-wide examination statistics, class performance benchmarks, score
          distributions, and student achievements across all classrooms.
        </p>
      </div>

      {/* 2. Global KPI Cards across all classrooms */}
      <AnalyticsKPICards attempts={allAttempts} totalStudents={totalStudentsAcrossAllClasses} />

      {/* 3. Main Dashboard Content */}
      {allAttempts.length === 0 && !isLoading ? (
        <Card className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground p-6">
          <BarChart3 className="h-10 w-10 text-muted-foreground/40 mb-2" />
          <p className="text-sm font-semibold text-foreground">No Exam Attempt Data Available</p>
          <p className="text-xs max-w-sm text-muted-foreground mt-1">
            There are currently no recorded student submissions across your classrooms.
          </p>
        </Card>
      ) : (
        <>
          {/* Classroom Performance Comparison across all classes */}
          <ClassroomPerformanceTable
            classes={classes}
            attempts={allAttempts}
            assignments={assignments}
          />

          {/* Score Distribution Histogram across all classes */}
          <ScoreDistributionChart attempts={allAttempts} />

          {/* Overall Student Performance Ranking Table */}
          <StudentPerformanceTable
            attempts={allAttempts}
            onViewScorecard={(id) => setActiveScorecardAttemptId(id)}
          />
        </>
      )}

      {/* 4. Scorecard Modal */}
      <TeacherScorecardDialog
        attemptId={activeScorecardAttemptId}
        open={Boolean(activeScorecardAttemptId)}
        onOpenChange={(open) => {
          if (!open) setActiveScorecardAttemptId(null);
        }}
      />
    </div>
  );
}
