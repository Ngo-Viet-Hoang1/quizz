'use client';

import * as React from 'react';
import { BookOpen, GraduationCap } from 'lucide-react';
import { Card } from '@/shared/ui/card';
import { Skeleton } from '@/shared/ui/skeleton';
import { DataTable } from '@/shared/components/data-table';
import { useClasses, useMultipleClassAssignments } from '@/features/classes/hooks';
import { ClassAssignmentItem, ClassItem } from '@/features/classes/types';
import { useQuizzes } from '@/features/quizzes/hooks';
import { createAssignmentsOverviewColumns } from './assignments-overview-columns';

interface AssignmentsOverviewTableProps {
  selectedClassId?: string;
  searchQuery?: string;
  onOpenGradebook: (
    assignment: ClassAssignmentItem,
    quizTitle: string,
    classNameTitle: string,
  ) => void;
}

export function AssignmentsOverviewTable({
  selectedClassId,
  searchQuery = '',
  onOpenGradebook,
}: AssignmentsOverviewTableProps) {
  const { data: classes = [], isLoading: loadingClasses } = useClasses({ limit: 100 });
  const { data: quizzes = [], isLoading: loadingQuizzes } = useQuizzes({ limit: 100 });

  // Quiz map: quizId -> quizTitle
  const quizMap = React.useMemo(() => {
    const map = new Map<string, string>();
    quizzes.forEach((q) => map.set(q._id, q.title));
    return map;
  }, [quizzes]);

  // Class map: classId -> ClassItem
  const classMap = React.useMemo(() => {
    const map = new Map<string, ClassItem>();
    classes.forEach((c) => {
      const id = c._id || c.id || '';
      if (id) map.set(id, c);
    });
    return map;
  }, [classes]);

  // Determine target class IDs: single class or all classes
  const targetClassIds = React.useMemo(() => {
    if (selectedClassId && selectedClassId !== 'all') {
      return [selectedClassId];
    }
    return classes.map((c) => c._id || c.id || '').filter(Boolean);
  }, [selectedClassId, classes]);

  const { data: assignments = [], isLoading: loadingAssignments } =
    useMultipleClassAssignments(targetClassIds);

  const isLoading =
    loadingClasses || loadingQuizzes || (targetClassIds.length > 0 && loadingAssignments);

  // Filter assignments by search query
  const filteredAssignments = React.useMemo(() => {
    if (!searchQuery.trim()) return assignments;
    const q = searchQuery.trim().toLowerCase();

    return assignments.filter((item) => {
      const quizTitle = quizMap.get(item.quizId)?.toLowerCase() || '';
      const cls = classMap.get(item.classId);
      const clsName = cls?.name.toLowerCase() || '';
      return quizTitle.includes(q) || clsName.includes(q);
    });
  }, [assignments, searchQuery, quizMap, classMap]);

  const columns = React.useMemo(
    () =>
      createAssignmentsOverviewColumns({
        quizMap,
        classMap,
        onOpenGradebook,
      }),
    [quizMap, classMap, onOpenGradebook],
  );

  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-card p-4 space-y-3">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-2 pt-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-md" />
          ))}
        </div>
      </div>
    );
  }

  if (classes.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground p-6">
        <GraduationCap className="h-10 w-10 text-muted-foreground/40 mb-2" />
        <p className="text-sm font-semibold text-foreground">No Classrooms Available</p>
        <p className="text-xs max-w-sm text-muted-foreground mt-1">
          Create classrooms and assign quizzes first to monitor student assessment results.
        </p>
      </Card>
    );
  }

  if (filteredAssignments.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground p-6">
        <BookOpen className="h-10 w-10 text-muted-foreground/40 mb-2" />
        <p className="text-sm font-semibold text-foreground">No Quiz Assignments Found</p>
        <p className="text-xs max-w-sm text-muted-foreground mt-1">
          {searchQuery
            ? 'No assigned quizzes match your search criteria.'
            : selectedClassId
              ? 'No quizzes have been assigned to this classroom yet.'
              : 'No quizzes have been assigned to any classroom yet.'}
        </p>
      </Card>
    );
  }

  return (
    <DataTable
      columns={columns}
      data={filteredAssignments}
      isLoading={isLoading}
      emptyMessage="No quiz assignments found"
      emptyDescription="Create and assign a quiz to start tracking student scores."
    />
  );
}
