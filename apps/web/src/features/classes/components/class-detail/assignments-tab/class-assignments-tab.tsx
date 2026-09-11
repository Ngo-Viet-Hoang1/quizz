'use client';

import * as React from 'react';
import Link from 'next/link';
import { createColumnHelper } from '@tanstack/react-table';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/ui/alert-dialog';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import {
  DataTable,
  DataTableColumnHeader,
  type DataTableFeatures,
} from '@/shared/components/data-table';
import { useDebounce } from '@/shared/hooks';
import { formatDate, formatDateTime } from '@/shared/lib/date';
import { useQuizzes } from '@/features/quizzes';
import { useRemoveClassAssignment } from '../../../hooks';
import { ClassAssignmentItem, ClassItem, ClassStatus } from '../../../types';

const assignmentColumnHelper = createColumnHelper<DataTableFeatures, ClassAssignmentItem>();

interface ClassAssignmentsTabProps {
  classItem: ClassItem;
  assignments: ClassAssignmentItem[];
  isLoading?: boolean;
  onAssignQuiz: () => void;
}

export function ClassAssignmentsTab({
  classItem,
  assignments,
  isLoading = false,
  onAssignQuiz,
}: ClassAssignmentsTabProps) {
  const [searchInput, setSearchInput] = React.useState('');
  const debouncedSearch = useDebounce(searchInput, 300);

  const [assignmentToRemove, setAssignmentToRemove] = React.useState<ClassAssignmentItem | null>(
    null,
  );

  const classId = classItem.id || classItem._id || '';
  const isArchived = classItem.status === ClassStatus.ARCHIVED;

  // Retrieve quizzes to match titles
  const { data: quizzes = [] } = useQuizzes({ limit: 100 });
  const quizMap = React.useMemo(() => {
    const map = new Map<string, string>();
    quizzes.forEach((q) => map.set(q._id, q.title));
    return map;
  }, [quizzes]);

  const removeAssignmentMutation = useRemoveClassAssignment();

  const handleConfirmRemove = async () => {
    if (!assignmentToRemove) return;
    const assignmentId = assignmentToRemove.id || assignmentToRemove._id;
    if (!assignmentId) return;

    try {
      await removeAssignmentMutation.mutateAsync({ classId, assignmentId });
      toast.success('Quiz unassigned from classroom');
      setAssignmentToRemove(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to remove assignment';
      toast.error(message);
    }
  };

  const filteredAssignments = React.useMemo(() => {
    if (!debouncedSearch.trim()) return assignments;
    const q = debouncedSearch.trim().toLowerCase();
    return assignments.filter((a) => {
      const title = quizMap.get(a.quizId)?.toLowerCase() || '';
      return title.includes(q) || a.quizId.toLowerCase().includes(q);
    });
  }, [assignments, debouncedSearch, quizMap]);

  const columns = React.useMemo(
    () =>
      assignmentColumnHelper.columns([
        assignmentColumnHelper.accessor('quizId', {
          header: ({ column }) => <DataTableColumnHeader column={column} title="ASSESSMENT" />,
          cell: ({ row }) => {
            const assignment = row.original;
            const quizTitle = quizMap.get(assignment.quizId) || 'Quiz Assessment';
            const isPractice = !assignment.startAt && !assignment.dueAt;

            return (
              <div className="flex items-center gap-2 py-1">
                <Link
                  href={`/quizzes/${assignment.quizId}`}
                  className="font-medium text-xs text-foreground hover:text-primary transition-colors line-clamp-1"
                >
                  {quizTitle}
                </Link>
                {isPractice && (
                  <Badge
                    variant="outline"
                    className="text-[10px] px-1.5 py-0 border-blue-500/30 text-blue-500 bg-blue-500/10 font-mono"
                  >
                    Practice
                  </Badge>
                )}
              </div>
            );
          },
        }),

        assignmentColumnHelper.accessor('quizVersion', {
          header: ({ column }) => <DataTableColumnHeader column={column} title="VERSION" />,
          cell: ({ row }) => (
            <Badge variant="secondary" className="font-mono text-xs">
              v{row.getValue('quizVersion') || 1}
            </Badge>
          ),
        }),

        assignmentColumnHelper.accessor('startAt', {
          header: ({ column }) => <DataTableColumnHeader column={column} title="START TIME" />,
          cell: ({ row }) => {
            const start = row.getValue('startAt') as string | null | undefined;
            if (!start) {
              return <span className="text-xs text-muted-foreground font-mono">Immediate</span>;
            }
            return (
              <span className="text-xs text-foreground font-mono">{formatDateTime(start)}</span>
            );
          },
        }),

        assignmentColumnHelper.accessor('dueAt', {
          header: ({ column }) => <DataTableColumnHeader column={column} title="DUE DATE" />,
          cell: ({ row }) => {
            const due = row.getValue('dueAt') as string | null;
            if (!due) {
              return <span className="text-xs text-muted-foreground font-mono">No Deadline</span>;
            }
            return (
              <span className="text-xs text-foreground font-mono font-medium">
                {formatDateTime(due)}
              </span>
            );
          },
        }),

        assignmentColumnHelper.accessor('allowLateSubmit', {
          header: ({ column }) => <DataTableColumnHeader column={column} title="LATE SUBMISSION" />,
          cell: ({ row }) => {
            const allowed = row.getValue('allowLateSubmit') as boolean;
            return (
              <Badge
                variant="outline"
                className={
                  allowed
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500 text-xs font-mono'
                    : 'border-border text-muted-foreground text-xs font-mono'
                }
              >
                {allowed ? 'Allowed' : 'Disabled'}
              </Badge>
            );
          },
        }),

        assignmentColumnHelper.accessor('createdAt', {
          header: ({ column }) => <DataTableColumnHeader column={column} title="ASSIGNED DATE" />,
          cell: ({ row }) => (
            <span className="font-mono text-xs text-muted-foreground">
              {formatDate(row.getValue('createdAt'))}
            </span>
          ),
        }),

        assignmentColumnHelper.display({
          id: 'actions',
          cell: ({ row }) =>
            !isArchived ? (
              <div className="flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setAssignmentToRemove(row.original)}
                  className="h-7 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span className="sr-only">Unassign quiz</span>
                </Button>
              </div>
            ) : null,
        }),
      ]),
    [isArchived, quizMap],
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold">Assigned Assessments</h2>
          <p className="text-xs text-muted-foreground">
            Quizzes and exams currently available to enrolled students in this classroom.
          </p>
        </div>

        {!isArchived && (
          <Button size="sm" onClick={onAssignQuiz} className="gap-1.5 h-8 text-xs shadow-2xs">
            <Plus className="h-3.5 w-3.5" />
            <span>Assign Quiz</span>
          </Button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={filteredAssignments}
        isLoading={isLoading}
        searchColumnId="quizId"
        searchPlaceholder="Search assigned quizzes..."
        searchValue={searchInput}
        onSearchChange={(val) => setSearchInput(val)}
        emptyMessage="No quizzes assigned yet"
        emptyDescription="Assign assessments from your Quiz Bank to let enrolled students take exams."
      />

      {/* Remove Assignment Confirmation Dialog */}
      <AlertDialog
        open={Boolean(assignmentToRemove)}
        onOpenChange={(open) => !open && setAssignmentToRemove(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unassign Quiz from Classroom</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to unassign this quiz from the classroom? Students will no
              longer be able to submit new attempts.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removeAssignmentMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmRemove}
              disabled={removeAssignmentMutation.isPending}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              {removeAssignmentMutation.isPending ? 'Removing...' : 'Unassign Quiz'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
