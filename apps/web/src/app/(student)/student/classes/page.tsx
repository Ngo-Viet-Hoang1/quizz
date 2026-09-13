'use client';

import {
  useClassAssignments,
  useEnrolledClasses,
  useJoinClass,
  useLeaveClass,
  useStartExamAttempt,
} from '@/features/student-portal/api/student.api';
import { ClassAssignmentPanel } from '@/features/student-portal/components/classes/class-assignment-panel';
import { ClassSidebarList } from '@/features/student-portal/components/classes/class-sidebar-list';
import type { IClass, IQuizAssignment } from '@/features/student-portal/types';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui/dialog';
import { Input } from '@/shared/ui/input';
import { Skeleton } from '@/shared/ui/skeleton';
import { Clock, Play, PlusCircle, Sparkles, Users2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

export default function StudentClassesPage() {
  const [activeClassId, setActiveClassId] = useState<string | null>(null);
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [classCodeInput, setClassCodeInput] = useState('');
  const [confirmExamOpen, setConfirmExamOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<IQuizAssignment | null>(null);

  // Pagination & Search state for student enrolled classes
  const [classPage, setClassPage] = useState(1);
  const [classSearch, setClassSearch] = useState('');
  const classLimit = 5;

  // Pagination state for quiz assignments
  const [assignmentPage, setAssignmentPage] = useState(1);
  const assignmentLimit = 5;

  const { data: classesResponse, isLoading: isClassesLoading } = useEnrolledClasses({
    page: classPage,
    limit: classLimit,
    search: classSearch || undefined,
  });
  const joinClassMutation = useJoinClass();
  const leaveClassMutation = useLeaveClass();
  const startExamMutation = useStartExamAttempt();
  const router = useRouter();

  const classes: IClass[] = classesResponse?.data ?? [];
  const classesMeta = classesResponse?.meta;
  const selectedClassId = activeClassId ?? classes[0]?._id;
  const selectedClass = classes.find((c) => c._id === selectedClassId);

  // Selected class assignments
  const { data: assignmentsResponse, isLoading: isAssignmentsLoading } = useClassAssignments(
    selectedClassId ?? '',
    { page: assignmentPage, limit: assignmentLimit },
  );
  const assignments: IQuizAssignment[] = assignmentsResponse?.data ?? [];
  const assignmentsMeta = assignmentsResponse?.meta;

  const handleJoinClassSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!classCodeInput.trim()) return;

    joinClassMutation.mutate(classCodeInput.trim(), {
      onSuccess: () => {
        toast.success(`Successfully joined class! 🎉`);
        setJoinModalOpen(false);
        setClassCodeInput('');
      },
      onError: (err) => {
        toast.error(err.message || 'Class code does not exist or you have already joined.');
      },
    });
  };

  const handleLeaveClass = (classId: string, className: string) => {
    if (!confirm(`Are you sure you want to leave "${className}"?`)) return;

    leaveClassMutation.mutate(classId, {
      onSuccess: () => {
        toast.success(`Left class ${className}`);
        if (activeClassId === classId) setActiveClassId(null);
      },
      onError: (err) => toast.error(err.message || 'Unable to leave class at this time'),
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-2.5">
            <Users2 className="size-8 text-indigo-600" />
            My Classes
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage enrolled classes and assigned quizzes from your instructors
          </p>
        </div>

        <Dialog open={joinModalOpen} onOpenChange={setJoinModalOpen}>
          <DialogTrigger
            render={
              <Button
                size="lg"
                className="rounded-2xl font-extrabold bg-indigo-600 hover:bg-indigo-700 text-white gap-2 shadow-lg shadow-indigo-500/25"
              />
            }
          >
            <PlusCircle className="size-5" />
            Join Class
          </DialogTrigger>
          <DialogContent className="sm:max-w-md rounded-3xl p-6">
            <DialogHeader>
              <DialogTitle className="text-xl font-extrabold flex items-center gap-2">
                <Sparkles className="size-5 text-indigo-600" />
                Enter Class Code
              </DialogTitle>
              <DialogDescription>
                Enter the code provided by your instructor to join the class.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleJoinClassSubmit} className="space-y-4 pt-3">
              <Input
                placeholder="e.g. MATH12"
                value={classCodeInput}
                onChange={(e) => setClassCodeInput(e.target.value)}
                className="h-12 text-center text-lg font-bold tracking-widest uppercase rounded-xl"
              />
              <Button
                type="submit"
                disabled={joinClassMutation.isPending}
                className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-extrabold text-white"
              >
                {joinClassMutation.isPending ? 'Joining...' : 'Join Class'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Main Grid: Enrolled Classes List & Class Quiz Assignments */}
      {isClassesLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-3xl" />
          ))}
        </div>
      ) : classes.length === 0 && !classSearch ? (
        <Card className="rounded-3xl border-2 border-dashed p-12 text-center bg-muted/20">
          <Users2 className="size-16 mx-auto text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-bold text-foreground">You haven't joined any classes yet</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto mb-6">
            Enter a class code provided by your teacher to get started!
          </p>
          <Button
            onClick={() => setJoinModalOpen(true)}
            className="rounded-2xl font-bold bg-indigo-600 text-white px-6"
          >
            Join a Class
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <ClassSidebarList
            classes={classes}
            selectedClassId={selectedClassId}
            onSelectClass={(id) => {
              setActiveClassId(id);
              setAssignmentPage(1);
            }}
            onLeaveClass={handleLeaveClass}
            page={classPage}
            totalPages={classesMeta?.totalPages ?? 1}
            total={classesMeta?.total ?? classes.length}
            onPageChange={(newPage) => setClassPage(newPage)}
            search={classSearch}
            onSearchChange={(val) => {
              setClassSearch(val);
              setClassPage(1);
            }}
          />
          <ClassAssignmentPanel
            selectedClass={selectedClass}
            assignments={assignments}
            isLoading={isAssignmentsLoading}
            onSelectAssignment={(assignment) => {
              setSelectedAssignment(assignment);
              setConfirmExamOpen(true);
            }}
            page={assignmentPage}
            totalPages={assignmentsMeta?.totalPages ?? 1}
            onPageChange={(newPage) => setAssignmentPage(newPage)}
          />
        </div>
      )}

      {/* ─── Confirm Start Exam Dialog ─── */}
      <Dialog open={confirmExamOpen} onOpenChange={setConfirmExamOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold flex items-center gap-2">
              <Play className="size-5 text-indigo-600" />
              Start Exam Confirmation
            </DialogTitle>
            <DialogDescription>
              You are about to start the exam. Once started, the timer will begin and cannot be
              paused. Are you ready?
            </DialogDescription>
          </DialogHeader>
          {selectedAssignment?.dueAt && (
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-2">
              <Clock className="size-3 text-amber-500" />
              Due: {new Date(selectedAssignment.dueAt).toLocaleString()}
            </p>
          )}
          <div className="flex gap-3 mt-4">
            <Button
              variant="outline"
              className="flex-1 rounded-xl font-bold"
              onClick={() => setConfirmExamOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-extrabold text-white gap-2"
              disabled={startExamMutation.isPending}
              onClick={() => {
                if (!selectedAssignment) return;
                startExamMutation.mutate(
                  { quizId: selectedAssignment.quizId, assignmentId: selectedAssignment._id },
                  {
                    onSuccess: (data) => {
                      setConfirmExamOpen(false);
                      const attemptId =
                        data?.attempt?._id || (data?.attempt as unknown as { id?: string })?.id;
                      if (attemptId) {
                        router.push(`/student/exam/${attemptId}`);
                      } else {
                        toast.error('Unable to get exam attempt details');
                      }
                    },
                    onError: (err) => {
                      toast.error(err.message || 'Failed to start exam attempt');
                    },
                  },
                );
              }}
            >
              <Play className="size-4 fill-current" />
              {startExamMutation.isPending ? 'Starting...' : 'Start Exam'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
