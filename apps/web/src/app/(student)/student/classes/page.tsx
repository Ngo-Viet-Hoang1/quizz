'use client';

import {
  useClassAssignments,
  useEnrolledClasses,
  useJoinClass,
  useLeaveClass,
  useStartExamAttempt,
} from '@/features/student-portal/api/student.api';
import type { IClass, IQuizAssignment } from '@/features/student-portal/types';
import { Badge } from '@/shared/ui/badge';
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
import { BookOpenCheck, Clock, LogOut, Play, PlusCircle, Sparkles, Users2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

export default function StudentClassesPage() {
  const [activeClassId, setActiveClassId] = useState<string | null>(null);
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [classCodeInput, setClassCodeInput] = useState('');
  const [confirmExamOpen, setConfirmExamOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<IQuizAssignment | null>(null);

  const { data: classesResponse, isLoading: isClassesLoading } = useEnrolledClasses();
  const joinClassMutation = useJoinClass();
  const leaveClassMutation = useLeaveClass();
  const startExamMutation = useStartExamAttempt();
  const router = useRouter();

  const classes: IClass[] = classesResponse?.data ?? [];
  const selectedClassId = activeClassId ?? classes[0]?._id;

  // Selected class assignments
  const { data: assignmentsResponse, isLoading: isAssignmentsLoading } = useClassAssignments(
    selectedClassId ?? '',
  );
  const assignments: IQuizAssignment[] = assignmentsResponse?.data ?? [];

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
      ) : classes.length === 0 ? (
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
          {/* Left Column: Enrolled Classes List (4 cols) */}
          <div className="lg:col-span-4 space-y-3">
            <h3 className="text-xs font-black uppercase text-muted-foreground tracking-wider px-1">
              Classes List
            </h3>

            {classes.map((cls: IClass) => {
              const isSelected = cls._id === selectedClassId;

              return (
                <div
                  key={cls._id}
                  onClick={() => setActiveClassId(cls._id)}
                  className={`p-4 rounded-2xl cursor-pointer transition-all border ${
                    isSelected
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                      : 'bg-card/80 hover:bg-card border-border/60 hover:border-indigo-400'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-extrabold text-base leading-snug">{cls.name}</h4>
                        {cls.membershipStatus === 'pending' && (
                          <Badge
                            variant="outline"
                            className={`text-[10px] h-5 px-1.5 ${isSelected ? 'border-purple-200 text-purple-100' : 'border-amber-500/50 text-amber-600'}`}
                          >
                            Pending
                          </Badge>
                        )}
                      </div>
                      <p
                        className={`text-xs mt-0.5 font-mono ${isSelected ? 'text-indigo-200' : 'text-muted-foreground'}`}
                      >
                        Code: {cls.code}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLeaveClass(cls._id, cls.name);
                      }}
                      className={`size-8 rounded-xl ${
                        isSelected
                          ? 'text-indigo-200 hover:text-white hover:bg-indigo-700'
                          : 'text-muted-foreground hover:text-red-500'
                      }`}
                      title="Leave Class"
                    >
                      <LogOut className="size-4" />
                    </Button>
                  </div>

                  <div className="flex items-center justify-end mt-4 text-xs font-semibold">
                    <span className={isSelected ? 'text-indigo-200' : 'text-muted-foreground'}>
                      ID: {cls._id.slice(-6)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Quiz Assignments for Selected Class (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            <h3 className="text-xs font-black uppercase text-muted-foreground tracking-wider px-1">
              Class Quiz Assignments
            </h3>

            {classes.find((c) => c._id === selectedClassId)?.membershipStatus === 'pending' ? (
              <Card className="rounded-3xl border p-12 text-center text-muted-foreground bg-amber-500/5">
                <Clock className="size-12 mx-auto text-amber-500/50 mb-3" />
                <p className="text-sm font-bold text-foreground text-amber-600">
                  Awaiting Teacher Approval
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  You need teacher approval to view and take quizzes for this class.
                </p>
              </Card>
            ) : isAssignmentsLoading ? (
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
                        onClick={() => {
                          setSelectedAssignment(assignment);
                          setConfirmExamOpen(true);
                        }}
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
