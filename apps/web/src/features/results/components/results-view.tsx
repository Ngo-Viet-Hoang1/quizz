'use client';

import * as React from 'react';
import { ClassAssignmentItem } from '@/features/classes/types';
import { GradebookFilters } from './gradebook/gradebook-filters';
import { AssignmentsOverviewTable } from './gradebook/assignments-overview-table';
import { AssignmentGradebookSheet } from './gradebook/assignment-gradebook-sheet';
import { TeacherScorecardDialog } from './scorecard/teacher-scorecard-dialog';

export function ResultsView() {
  const [selectedClassId, setSelectedClassId] = React.useState<string>('');
  const [searchQuery, setSearchQuery] = React.useState<string>('');

  // Selected assignment for Gradebook Sheet
  const [activeAssignment, setActiveAssignment] = React.useState<ClassAssignmentItem | null>(null);
  const [activeQuizTitle, setActiveQuizTitle] = React.useState<string>('');
  const [activeClassName, setActiveClassName] = React.useState<string>('');
  const [gradebookSheetOpen, setGradebookSheetOpen] = React.useState<boolean>(false);

  // Scorecard modal state
  const [selectedAttemptId, setSelectedAttemptId] = React.useState<string | null>(null);
  const [scorecardOpen, setScorecardOpen] = React.useState<boolean>(false);

  const handleOpenGradebook = (
    assignment: ClassAssignmentItem,
    quizTitle: string,
    classNameTitle: string,
  ) => {
    setActiveAssignment(assignment);
    setActiveQuizTitle(quizTitle);
    setActiveClassName(classNameTitle);
    setGradebookSheetOpen(true);
  };

  const handleOpenScorecard = (attemptId: string) => {
    setSelectedAttemptId(attemptId);
    setScorecardOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Results</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Monitor class assessment gradebooks, student examination submissions, and audit integrity
          reports.
        </p>
      </div>

      {/* 2. Filters & Assignments Overview */}
      <div className="space-y-4">
        <GradebookFilters
          selectedClassId={selectedClassId}
          onSelectClassId={setSelectedClassId}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        <AssignmentsOverviewTable
          selectedClassId={selectedClassId}
          searchQuery={searchQuery}
          onOpenGradebook={handleOpenGradebook}
        />
      </div>

      {/* Assignment Gradebook Drawer */}
      <AssignmentGradebookSheet
        assignmentId={activeAssignment?._id || activeAssignment?.id || null}
        quizTitle={activeQuizTitle}
        classNameTitle={activeClassName}
        quizVersion={activeAssignment?.quizVersion || 1}
        open={gradebookSheetOpen}
        onOpenChange={setGradebookSheetOpen}
        onViewScorecard={handleOpenScorecard}
      />

      {/* Teacher Student Scorecard Modal */}
      <TeacherScorecardDialog
        attemptId={selectedAttemptId}
        open={scorecardOpen}
        onOpenChange={setScorecardOpen}
      />
    </div>
  );
}
