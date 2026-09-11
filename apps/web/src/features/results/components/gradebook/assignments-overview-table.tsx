'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { BookOpen, Calendar, FileSpreadsheet, GraduationCap } from 'lucide-react';

import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { Skeleton } from '@/shared/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';
import { useClasses, useClassAssignments } from '@/features/classes/hooks';
import { ClassAssignmentItem, ClassItem } from '@/features/classes/types';
import { useQuizzes } from '@/features/quizzes/hooks';

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

  // Fetch assignments for single class or all classes
  const targetClassId = selectedClassId || classes[0]?._id || classes[0]?.id || '';
  const { data: assignments = [], isLoading: loadingAssignments } = useClassAssignments(
    targetClassId,
    undefined,
  );

  const isLoading =
    loadingClasses || loadingQuizzes || (Boolean(targetClassId) && loadingAssignments);

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
            : 'No quizzes have been assigned to this classroom yet.'}
        </p>
      </Card>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <Table>
        <TableHeader className="bg-muted/40 text-xs">
          <TableRow>
            <TableHead>Quiz Assessment</TableHead>
            <TableHead>Classroom</TableHead>
            <TableHead>Schedule & Deadline</TableHead>
            <TableHead>Late Submission</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody className="text-xs divide-y divide-border/60">
          {filteredAssignments.map((assignment) => {
            const assignmentId = assignment._id || assignment.id || '';
            const quizTitle = quizMap.get(assignment.quizId) || 'Quiz Assessment';
            const cls = classMap.get(assignment.classId);
            const classNameTitle = cls?.name || 'Classroom';
            const isPractice = !assignment.startAt && !assignment.dueAt;

            return (
              <TableRow key={assignmentId} className="hover:bg-muted/30">
                {/* 1. Quiz Title */}
                <TableCell>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground text-sm">{quizTitle}</span>
                      <Badge variant="outline" className="font-mono text-[10px] px-1.5 py-0">
                        v{assignment.quizVersion}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Assigned: {format(new Date(assignment.createdAt), 'MMM dd, yyyy')}
                    </p>
                  </div>
                </TableCell>

                {/* 2. Classroom */}
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <GraduationCap className="h-3.5 w-3.5 text-primary" />
                    <span className="font-medium text-foreground">{classNameTitle}</span>
                    {cls?.memberCount ? (
                      <span className="text-muted-foreground font-mono">
                        ({cls.memberCount} students)
                      </span>
                    ) : null}
                  </div>
                </TableCell>

                {/* 3. Schedule & Deadline */}
                <TableCell>
                  {isPractice ? (
                    <Badge variant="secondary" className="text-[10px]">
                      Open Practice / Untimed
                    </Badge>
                  ) : (
                    <div className="space-y-0.5 text-muted-foreground font-mono text-[11px]">
                      {assignment.dueAt ? (
                        <div className="flex items-center gap-1 text-foreground font-medium">
                          <Calendar className="h-3 w-3 text-primary" />
                          <span>Due: {format(new Date(assignment.dueAt), 'MMM dd, HH:mm')}</span>
                        </div>
                      ) : null}
                      {assignment.startAt ? (
                        <p>Starts: {format(new Date(assignment.startAt), 'MMM dd, HH:mm')}</p>
                      ) : null}
                    </div>
                  )}
                </TableCell>

                {/* 4. Late Submission */}
                <TableCell>
                  <Badge
                    variant="outline"
                    className={
                      assignment.allowLateSubmit
                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500 text-[10px]'
                        : 'border-border text-muted-foreground text-[10px]'
                    }
                  >
                    {assignment.allowLateSubmit ? 'Allowed' : 'Disabled'}
                  </Badge>
                </TableCell>

                {/* 5. Action */}
                <TableCell className="text-right">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs gap-1.5 font-medium"
                    onClick={() => onOpenGradebook(assignment, quizTitle, classNameTitle)}
                  >
                    <FileSpreadsheet className="h-3.5 w-3.5 text-primary" />
                    <span>View Gradebook</span>
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
