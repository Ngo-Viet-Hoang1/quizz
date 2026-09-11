'use client';

import * as React from 'react';
import { FileSpreadsheet, GraduationCap, History } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { ClassAssignmentItem } from '@/features/classes/types';
import { GradebookFilters } from './gradebook/gradebook-filters';
import { AssignmentsOverviewTable } from './gradebook/assignments-overview-table';
import { AssignmentGradebookSheet } from './gradebook/assignment-gradebook-sheet';
import { AttemptHistoryTable } from './history/attempt-history-table';
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
      <div className="border-b border-border pb-5 pt-1">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Results & Gradebook
          </h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Monitor class assessment gradebooks, student examination submissions, and audit integrity
          reports.
        </p>
      </div>

      {/* 2. Main Tabs */}
      <Tabs defaultValue="gradebook" className="space-y-5">
        <TabsList className="bg-muted/60 p-1">
          <TabsTrigger value="gradebook" className="gap-1.5 text-xs">
            <GraduationCap className="h-4 w-4" />
            <span>Assigned Quizzes & Gradebooks</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-1.5 text-xs">
            <History className="h-4 w-4" />
            <span>Attempt Activity History</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Assigned Quizzes & Gradebooks */}
        <TabsContent value="gradebook" className="space-y-4 focus-visible:outline-hidden">
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
        </TabsContent>

        {/* Tab 2: Attempt History */}
        <TabsContent value="history" className="space-y-4 focus-visible:outline-hidden">
          <AttemptHistoryTable onViewScorecard={handleOpenScorecard} />
        </TabsContent>
      </Tabs>

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
