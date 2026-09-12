'use client';

import type { IClass, IQuizAssignment } from '@/features/student-portal/types';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { Skeleton } from '@/shared/ui/skeleton';
import { BookOpenCheck, Clock, Play } from 'lucide-react';

interface ClassAssignmentPanelProps {
  selectedClass: IClass | undefined;
  assignments: IQuizAssignment[];
  isLoading: boolean;
  onSelectAssignment: (assignment: IQuizAssignment) => void;
}

export function ClassAssignmentPanel({
  selectedClass,
  assignments,
  isLoading,
  onSelectAssignment,
}: ClassAssignmentPanelProps) {
  const isPendingApproval = selectedClass?.membershipStatus === 'pending';

  return (
    <div className="lg:col-span-8 space-y-4">
      <h3 className="text-xs font-black uppercase text-muted-foreground tracking-wider px-1">
        Class Quiz Assignments
      </h3>

      {isPendingApproval ? (
        <Card className="rounded-3xl border p-12 text-center text-muted-foreground bg-amber-500/5">
          <Clock className="size-12 mx-auto text-amber-500/50 mb-3" />
          <p className="text-sm font-bold text-foreground text-amber-600">
            Awaiting Teacher Approval
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            You need teacher approval to view and take quizzes for this class.
          </p>
        </Card>
      ) : isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : assignments.length === 0 ? (
        <Card className="rounded-3xl border p-12 text-center text-muted-foreground bg-card/40">
          <BookOpenCheck className="size-12 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-sm font-bold text-foreground">No Quizzes Assigned Yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Your instructor has not published any quizzes for this class.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {assignments.map((assignment: IQuizAssignment) => (
            <Card
              key={assignment._id}
              className="rounded-2xl border bg-card/70 backdrop-blur-sm p-5 hover:shadow-md transition-shadow flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Badge className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 border-indigo-500/20 font-bold text-[11px]">
                    Quiz Assignment
                  </Badge>
                  {assignment.dueAt && (
                    <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                      <Clock className="size-3 text-amber-500" />
                      Due: {new Date(assignment.dueAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <h4 className="font-extrabold text-base text-foreground">
                  Quiz #{assignment.quizId.slice(-6)}
                </h4>
                <p className="text-xs text-muted-foreground">
                  Created: {new Date(assignment.createdAt).toLocaleDateString()}
                </p>
              </div>

              <div className="shrink-0">
                <Button
                  onClick={() => onSelectAssignment(assignment)}
                  className="h-11 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs gap-2"
                >
                  <Play className="size-4 fill-current" />
                  Start Exam
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
