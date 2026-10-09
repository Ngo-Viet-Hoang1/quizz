'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { DataTable } from '@/shared/components/data-table';
import { ClassAssignmentItem, ClassItem } from '@/features/classes/types';
import { ExamAttemptItem } from '../../types';
import {
  ClassPerformanceRow,
  createClassroomPerformanceColumns,
} from './classroom-performance-columns';

interface ClassroomPerformanceTableProps {
  classes: ClassItem[];
  attempts: ExamAttemptItem[];
  assignments?: ClassAssignmentItem[];
}

export function ClassroomPerformanceTable({
  classes,
  attempts,
  assignments = [],
}: ClassroomPerformanceTableProps) {
  const classStats: ClassPerformanceRow[] = React.useMemo(() => {
    if (classes.length === 0) return [];

    return classes.map((cls, idx) => {
      const classId = cls._id || cls.id || `class-${idx}`;
      const memberCount = cls.memberCount || 0;

      // Find all assignment IDs belonging to this class
      const classAssignmentIds = new Set(
        assignments
          .filter((a) => a.classId === classId)
          .map((a) => a._id || a.id || '')
          .filter(Boolean),
      );

      // Group attempts for this class
      const classAttempts = attempts.filter((a) => {
        return (
          (a.assignmentId && classAssignmentIds.has(a.assignmentId)) || a.assignmentId === classId
        );
      });

      const totalAttempts = classAttempts.length;
      let totalScore = 0;
      let totalMax = 0;
      let passed = 0;
      let violations = 0;

      for (const a of classAttempts) {
        totalScore += a.score;
        totalMax += a.totalPoints > 0 ? a.totalPoints : 10;
        const pct = a.totalPoints > 0 ? (a.score / a.totalPoints) * 100 : 0;
        if (pct >= 50) passed++;
        violations += a.violations?.length || 0;
      }

      const avgScore = totalAttempts > 0 ? Math.round((totalScore / totalAttempts) * 10) / 10 : 0;
      const avgPercentage = totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0;
      const passRate = totalAttempts > 0 ? Math.round((passed / totalAttempts) * 100) : 0;

      return {
        classId,
        className: cls.name,
        totalStudents: memberCount,
        totalAttempts,
        avgScore,
        avgPercentage,
        passRate,
        violationsCount: violations,
      };
    });
  }, [classes, attempts]);

  const columns = React.useMemo(() => createClassroomPerformanceColumns(), []);

  return (
    <Card className="border border-border/80 bg-card/60 backdrop-blur-sm shadow-xs">
      <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-semibold">Classroom Performance Comparison</CardTitle>
        <span className="text-xs text-muted-foreground font-mono">
          {classes.length} classroom{classes.length !== 1 ? 's' : ''}
        </span>
      </CardHeader>
      <CardContent className="p-4 pt-2">
        <DataTable
          columns={columns}
          data={classStats}
          emptyMessage="No classroom performance data available"
          emptyDescription="Classrooms will be displayed once created."
        />
      </CardContent>
    </Card>
  );
}
