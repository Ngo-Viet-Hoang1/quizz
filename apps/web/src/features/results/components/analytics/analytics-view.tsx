'use client';

import * as React from 'react';
import { BarChart3 } from 'lucide-react';
import { useClasses } from '@/features/classes/hooks';
import { useAssignmentGradebook, useMyExamHistory } from '../../hooks';
import { ExamAttemptItem } from '../../types';
import { TeacherScorecardDialog } from '../scorecard';
import { AnalyticsFilters } from './analytics-filters';
import { AnalyticsKPICards } from './analytics-kpi-cards';
import { ScoreDistributionChart } from './score-distribution-chart';
import { HardestQuestionsMatrix } from './hardest-questions-matrix';
import { StudentPerformanceTable } from './student-performance-table';
import { Card } from '@/shared/ui/card';

export function AnalyticsView() {
  const [selectedClassId, setSelectedClassId] = React.useState<string>('');
  const [selectedAssignmentId, setSelectedAssignmentId] = React.useState<string>('');
  const [activeScorecardAttemptId, setActiveScorecardAttemptId] = React.useState<string | null>(
    null,
  );

  // 1. Fetch classrooms
  const { data: classes = [] } = useClasses({ limit: 100 });
  const selectedClass = classes.find((c) => (c._id || c.id) === selectedClassId);

  // 2. Fetch gradebook data for specific assignment if selected
  const { data: assignmentGradebook, isLoading: loadingGradebook } =
    useAssignmentGradebook(selectedAssignmentId);

  // 3. Fetch general org history as fallback if no specific assignment
  const { data: historyResponse, isLoading: loadingHistory } = useMyExamHistory();

  // Compute active attempts list based on filters
  const activeAttempts: ExamAttemptItem[] = React.useMemo(() => {
    if (selectedAssignmentId && assignmentGradebook?.data) {
      return assignmentGradebook.data;
    }
    return historyResponse?.data ?? [];
  }, [selectedAssignmentId, assignmentGradebook, historyResponse]);

  const isLoading = selectedAssignmentId ? loadingGradebook : loadingHistory;

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Exam Analytics & Insights
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Comprehensive class performance metrics, score distributions, and learning gap detection.
        </p>
      </div>

      {/* 2. Filters Bar */}
      <AnalyticsFilters
        selectedClassId={selectedClassId}
        onSelectClassId={setSelectedClassId}
        selectedAssignmentId={selectedAssignmentId}
        onSelectAssignmentId={setSelectedAssignmentId}
      />

      {/* 3. KPI Performance Cards */}
      <AnalyticsKPICards attempts={activeAttempts} totalStudents={selectedClass?.memberCount} />

      {/* 4. Charts & Matrices Grid */}
      {activeAttempts.length === 0 && !isLoading ? (
        <Card className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground p-6">
          <BarChart3 className="h-10 w-10 text-muted-foreground/40 mb-2" />
          <p className="text-sm font-semibold text-foreground">No Exam Attempt Data Available</p>
          <p className="text-xs max-w-sm text-muted-foreground mt-1">
            There are currently no recorded student submissions for the selected classroom and
            assessment.
          </p>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Score Distribution Chart */}
            <ScoreDistributionChart attempts={activeAttempts} />

            {/* Hardest Questions & Item Analysis */}
            <HardestQuestionsMatrix attempts={activeAttempts} />
          </div>

          {/* Student Performance Ranking Table */}
          <StudentPerformanceTable
            attempts={activeAttempts}
            onViewScorecard={(id) => setActiveScorecardAttemptId(id)}
          />
        </>
      )}

      {/* 5. Scorecard Modal */}
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
