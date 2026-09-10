'use client';

import * as React from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  GraduationCap,
  Info,
  Users,
} from 'lucide-react';
import { Button } from '@/shared/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Switch } from '@/shared/ui/switch';
import {
  toLocalDatetimeInput,
  getMinDueDatetimeInput,
  validateAssignmentDates,
} from '@/shared/lib/date';
import { useClasses, useAssignQuizToClass, ClassStatus } from '@/features/classes';
import { QuizItem } from '../types';
import { DifficultyBadge } from './difficulty-badge';

interface AssignToClassDialogProps {
  quiz: QuizItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AssignToClassDialog({ quiz, open, onOpenChange }: AssignToClassDialogProps) {
  const [selectedClassId, setSelectedClassId] = React.useState('');
  const [startAt, setStartAt] = React.useState('');
  const [dueAt, setDueAt] = React.useState('');
  const [allowLateSubmit, setAllowLateSubmit] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const { data: classes = [], isLoading: isLoadingClasses } = useClasses({ limit: 100 });
  const assignQuizMutation = useAssignQuizToClass();

  // Filter out archived classes
  const activeClasses = React.useMemo(() => {
    return classes.filter((c) => c.status !== ClassStatus.ARCHIVED);
  }, [classes]);

  const selectedClass = React.useMemo(() => {
    return activeClasses.find((c) => (c.id || c._id) === selectedClassId);
  }, [activeClasses, selectedClassId]);

  const minStartDateTime = React.useMemo(() => {
    return toLocalDatetimeInput(new Date());
  }, [open]);

  const minDueDateTime = React.useMemo(() => {
    return getMinDueDatetimeInput(startAt, quiz?.timeLimitSec);
  }, [startAt, quiz?.timeLimitSec]);

  const handleClose = () => {
    setSelectedClassId('');
    setStartAt('');
    setDueAt('');
    setAllowLateSubmit(false);
    setError(null);
    onOpenChange(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!quiz) {
      setError('No quiz selected');
      return;
    }

    if (!selectedClassId) {
      setError('Please select a classroom to assign this quiz to');
      return;
    }

    const dateValidationError = validateAssignmentDates(startAt, dueAt, quiz.timeLimitSec);
    if (dateValidationError) {
      setError(dateValidationError);
      return;
    }

    try {
      await assignQuizMutation.mutateAsync({
        classId: selectedClassId,
        data: {
          quizId: quiz._id,
          startAt: startAt ? new Date(startAt).toISOString() : undefined,
          dueAt: dueAt ? new Date(dueAt).toISOString() : undefined,
          allowLateSubmit,
        },
      });
      toast.success(`Assigned "${quiz.title}" to classroom successfully`);
      handleClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to assign quiz to class';
      toast.error(message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden border-border/80 shadow-2xl">
        {/* Header with decorative badge */}
        <div className="bg-linear-to-r from-primary/10 via-primary/5 to-transparent px-6 pt-6 pb-4 border-b border-border/60">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/15 text-primary border border-primary/20 shadow-xs">
              <GraduationCap className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold tracking-tight">
                Assign Quiz to Classroom
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Publish this assessment to an enrolled class of students.
              </DialogDescription>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs">
              <AlertCircle className="size-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Quiz Summary Card */}
          {quiz && (
            <div className="rounded-xl border border-border/80 bg-muted/30 p-3.5 space-y-1.5 shadow-2xs">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                  Target Quiz
                </span>
                <DifficultyBadge difficulty={quiz.difficulty} />
              </div>

              <h4 className="text-sm font-semibold text-foreground truncate">{quiz.title}</h4>
              <div className="flex items-center gap-4 text-xs text-muted-foreground pt-0.5">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-3.5 text-primary" />
                  {quiz.questionCount || 0} Questions
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="size-3.5 text-muted-foreground" />
                  {quiz.timeLimitSec
                    ? `${Math.round(quiz.timeLimitSec / 60)} mins limit`
                    : 'No time limit'}
                </span>
              </div>
            </div>
          )}

          {/* Target Classroom Selection */}
          <div className="space-y-2">
            <Label
              htmlFor="assign-class-select"
              className="text-xs font-semibold flex items-center justify-between"
            >
              <span>
                Target Classroom <span className="text-destructive">*</span>
              </span>
              {selectedClass && (
                <span className="text-[11px] text-muted-foreground font-normal">
                  {selectedClass.memberCount || 0} students enrolled
                </span>
              )}
            </Label>

            {activeClasses.length === 0 && !isLoadingClasses ? (
              <div className="p-4 rounded-lg border border-dashed border-border text-center space-y-1.5">
                <p className="text-xs text-muted-foreground">
                  No active classrooms found in your organization.
                </p>
                <Link
                  href="/classes"
                  className="text-xs text-primary font-medium hover:underline inline-block"
                  onClick={handleClose}
                >
                  Create a Classroom &rarr;
                </Link>
              </div>
            ) : (
              <Select
                value={selectedClassId}
                onValueChange={(val) => {
                  if (val) setSelectedClassId(val);
                  if (error) setError(null);
                }}
                disabled={isLoadingClasses || assignQuizMutation.isPending}
              >
                <SelectTrigger
                  id="assign-class-select"
                  className="w-full h-11 px-3 text-left font-normal bg-background/50 border-input hover:border-primary/50 transition-colors"
                >
                  <SelectValue
                    placeholder={
                      isLoadingClasses ? 'Loading classrooms...' : 'Select a classroom...'
                    }
                  >
                    {selectedClass ? selectedClass.name : undefined}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="max-h-60 w-(--radix-select-trigger-width)">
                  {activeClasses.map((cls) => {
                    const id = cls.id || cls._id || '';
                    return (
                      <SelectItem key={id} value={id} className="py-2.5 cursor-pointer">
                        <div className="flex items-center justify-between w-full pr-2">
                          <span className="font-medium text-xs text-foreground truncate max-w-65">
                            {cls.name}
                          </span>
                          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <Users className="size-3" />
                            {cls.memberCount || 0} students
                          </span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Time Configuration Section */}
          <div className="space-y-3 pt-1 border-t border-border/50">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Calendar className="size-3.5 text-primary" />
                Schedule & Deadlines
              </span>
              <span className="text-[11px] text-muted-foreground">Optional</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Start Time */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="assign-class-start-date"
                  className="text-[11px] font-medium text-muted-foreground flex items-center justify-between"
                >
                  <span>Start Time (Open)</span>
                  {startAt && (
                    <button
                      type="button"
                      onClick={() => setStartAt('')}
                      className="text-[10px] text-primary hover:underline"
                    >
                      Clear
                    </button>
                  )}
                </Label>
                <Input
                  id="assign-class-start-date"
                  type="datetime-local"
                  min={minStartDateTime}
                  value={startAt}
                  onChange={(e) => {
                    setStartAt(e.target.value);
                    if (error) setError(null);
                  }}
                  className="h-9 text-xs font-mono bg-background/50"
                  disabled={assignQuizMutation.isPending}
                />
                <p className="text-[10px] text-muted-foreground">
                  Cannot be in the past. Leave empty to open immediately.
                </p>
              </div>

              {/* End Time / Due Date */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="assign-class-due-date"
                  className="text-[11px] font-medium text-muted-foreground flex items-center justify-between"
                >
                  <span>Due Date (Close)</span>
                  {dueAt && (
                    <button
                      type="button"
                      onClick={() => setDueAt('')}
                      className="text-[10px] text-primary hover:underline"
                    >
                      Clear
                    </button>
                  )}
                </Label>
                <Input
                  id="assign-class-due-date"
                  type="datetime-local"
                  min={minDueDateTime}
                  value={dueAt}
                  onChange={(e) => {
                    setDueAt(e.target.value);
                    if (error) setError(null);
                  }}
                  className="h-9 text-xs font-mono bg-background/50"
                  disabled={assignQuizMutation.isPending}
                />
                <p className="text-[10px] text-muted-foreground">
                  {quiz?.timeLimitSec
                    ? `Must be at least ${Math.round(quiz.timeLimitSec / 60)} mins after start time`
                    : 'Must be after start time. Leave empty for no deadline.'}
                </p>
              </div>
            </div>

            {!startAt && !dueAt && (
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-500 text-[11px] animate-in fade-in-50 duration-200">
                <Info className="size-3.5 shrink-0" />
                <span>
                  <strong>Practice Mode:</strong> Leaving dates empty makes this quiz always
                  accessible for unlimited student practice.
                </span>
              </div>
            )}
          </div>

          {/* Late Submission Setting */}
          <div className="flex items-center justify-between rounded-xl border border-border/70 bg-muted/20 p-3.5 shadow-2xs transition-colors hover:border-border">
            <div className="space-y-0.5 pr-2">
              <Label
                htmlFor="assign-class-allow-late"
                className="text-xs font-medium cursor-pointer text-foreground"
              >
                Allow Late Submissions
              </Label>
              <p className="text-[11px] text-muted-foreground">
                Students can still submit attempts after the deadline
              </p>
            </div>
            <Switch
              id="assign-class-allow-late"
              checked={allowLateSubmit}
              onCheckedChange={(checked) => setAllowLateSubmit(checked)}
              disabled={assignQuizMutation.isPending}
            />
          </div>

          {/* Footer Actions */}
          <DialogFooter className="pt-3 border-t border-border/50 gap-2.5 sm:gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={assignQuizMutation.isPending}
              className="text-xs h-9 px-4"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={assignQuizMutation.isPending || !selectedClassId}
              className="text-xs h-9 px-4 gap-1.5 shadow-sm"
            >
              {assignQuizMutation.isPending ? 'Assigning...' : 'Assign to Class'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
