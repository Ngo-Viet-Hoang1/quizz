'use client';

import * as React from 'react';
import { toast } from 'sonner';
import {
  AlertCircle,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  FileQuestion,
  Info,
  Loader2,
  Search,
  X,
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
import { Switch } from '@/shared/ui/switch';
import { useDebounce } from '@/shared/hooks';
import {
  toLocalDatetimeInput,
  getMinDueDatetimeInput,
  validateAssignmentDates,
} from '@/shared/lib/date';
import { useInfiniteQuizzes, DifficultyBadge, QuizItem } from '@/features/quizzes';
import { useAssignQuizToClass } from '../../hooks';

interface AssignQuizDialogProps {
  classId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AssignQuizDialog({ classId, open, onOpenChange }: AssignQuizDialogProps) {
  const [selectedQuizId, setSelectedQuizId] = React.useState('');
  const [selectedQuiz, setSelectedQuiz] = React.useState<QuizItem | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);

  const [startAt, setStartAt] = React.useState('');
  const [dueAt, setDueAt] = React.useState('');
  const [allowLateSubmit, setAllowLateSubmit] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const loadMoreRef = React.useRef<HTMLDivElement>(null);

  // Infinite query for quizzes with limit = 4 per page
  const {
    data,
    isLoading: isLoadingQuizzes,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteQuizzes({
    search: debouncedSearch.trim() || undefined,
    limit: 4,
  });

  const assignQuizMutation = useAssignQuizToClass();

  // Flatten all pages
  const quizzes = React.useMemo(() => {
    return data?.pages.flatMap((page) => page.data) ?? [];
  }, [data]);

  const totalQuizzes = data?.pages[0]?.meta?.total ?? quizzes.length;

  // Update selected quiz if in loaded list
  React.useEffect(() => {
    if (selectedQuizId && !selectedQuiz) {
      const found = quizzes.find((q) => q._id === selectedQuizId);
      if (found) setSelectedQuiz(found);
    }
  }, [quizzes, selectedQuizId, selectedQuiz]);

  // Click outside listener for dropdown
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  // IntersectionObserver for infinite scrolling with scroll container as root
  React.useEffect(() => {
    if (
      !loadMoreRef.current ||
      !scrollContainerRef.current ||
      !hasNextPage ||
      isFetchingNextPage ||
      !isDropdownOpen
    ) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      {
        root: scrollContainerRef.current,
        threshold: 0.1,
      },
    );

    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, isDropdownOpen, quizzes.length]);

  const handleContainerScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (
      scrollTop > 10 &&
      scrollHeight - scrollTop <= clientHeight + 30 &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      fetchNextPage();
    }
  };

  const handleClose = () => {
    setSelectedQuizId('');
    setSelectedQuiz(null);
    setSearchQuery('');
    setIsDropdownOpen(false);
    setStartAt('');
    setDueAt('');
    setAllowLateSubmit(false);
    setError(null);
    onOpenChange(false);
  };

  const minStartDateTime = React.useMemo(() => {
    return toLocalDatetimeInput(new Date());
  }, [open]);

  const minDueDateTime = React.useMemo(() => {
    return getMinDueDatetimeInput(startAt, selectedQuiz?.timeLimitSec);
  }, [startAt, selectedQuiz?.timeLimitSec]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedQuizId) {
      setError('Please select a quiz to assign to this class');
      return;
    }

    const dateValidationError = validateAssignmentDates(startAt, dueAt, selectedQuiz?.timeLimitSec);
    if (dateValidationError) {
      setError(dateValidationError);
      return;
    }

    try {
      await assignQuizMutation.mutateAsync({
        classId,
        data: {
          quizId: selectedQuizId,
          startAt: startAt ? new Date(startAt).toISOString() : undefined,
          dueAt: dueAt ? new Date(dueAt).toISOString() : undefined,
          allowLateSubmit,
        },
      });

      toast.success('Quiz assigned to class successfully');
      handleClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to assign quiz';
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
              <FileQuestion className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold tracking-tight">
                Assign Quiz to Classroom
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Select an assessment from your Quiz Bank and configure schedule settings.
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

          {/* Quiz Selection with Integrated Search & Infinite Scroll */}
          <div className="space-y-2 relative" ref={dropdownRef}>
            <Label className="text-xs font-semibold flex items-center justify-between">
              <span>
                Select Quiz <span className="text-destructive">*</span>
              </span>
              {selectedQuiz && (
                <span className="text-[11px] text-muted-foreground font-normal">
                  1 quiz selected
                </span>
              )}
            </Label>

            {/* Trigger Button */}
            <button
              type="button"
              onClick={() => setIsDropdownOpen((prev) => !prev)}
              disabled={assignQuizMutation.isPending}
              className="flex w-full h-11 items-center justify-between rounded-lg border border-input bg-background/50 px-3 text-left text-sm transition-colors hover:border-primary/50 focus-visible:ring-3 focus-visible:ring-ring/50 outline-none disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span
                className={
                  selectedQuiz
                    ? 'text-foreground font-medium truncate pr-2'
                    : 'text-muted-foreground truncate pr-2'
                }
              >
                {selectedQuiz
                  ? `${selectedQuiz.title} (${selectedQuiz.questionCount || 0} Qs)`
                  : 'Choose a quiz from bank...'}
              </span>
              <ChevronDown
                className={`size-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
                  isDropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Dropdown Menu Container */}
            {isDropdownOpen && (
              <div className="absolute top-[calc(100%+4px)] left-0 z-50 w-full rounded-xl border border-border/80 bg-popover text-popover-foreground shadow-xl ring-1 ring-foreground/10 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150">
                {/* Search Header */}
                <div className="p-2 border-b border-border/60 bg-muted/30">
                  <div className="relative flex items-center">
                    <Search className="absolute left-2.5 size-3.5 text-muted-foreground pointer-events-none" />
                    <Input
                      autoFocus
                      placeholder="Search quizzes by title..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="h-8 pl-8 pr-7 text-xs bg-background/80 border-input/60"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2 text-muted-foreground hover:text-foreground"
                      >
                        <X className="size-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Scrollable Quiz List with Infinite Scroll */}
                <div
                  ref={scrollContainerRef}
                  onScroll={handleContainerScroll}
                  className="max-h-52 overflow-y-auto p-1.5 space-y-1 divide-y divide-border/20"
                >
                  {isLoadingQuizzes && quizzes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground gap-2">
                      <Loader2 className="size-5 animate-spin text-primary" />
                      <span className="text-xs">Loading quizzes...</span>
                    </div>
                  ) : quizzes.length === 0 ? (
                    <div className="py-8 text-center text-xs text-muted-foreground">
                      {searchQuery
                        ? `No quizzes found for "${searchQuery}"`
                        : 'No quizzes available in your bank.'}
                    </div>
                  ) : (
                    <>
                      {quizzes.map((quiz) => {
                        const isSelected = selectedQuizId === quiz._id;
                        return (
                          <div
                            key={quiz._id}
                            onClick={() => {
                              setSelectedQuizId(quiz._id);
                              setSelectedQuiz(quiz);
                              setIsDropdownOpen(false);
                              if (error) setError(null);
                            }}
                            className={`flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-colors ${
                              isSelected
                                ? 'bg-primary/10 text-primary border border-primary/20'
                                : 'hover:bg-muted/60 text-foreground'
                            }`}
                          >
                            <div className="flex flex-col gap-1 min-w-0 pr-2">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-xs truncate max-w-65">
                                  {quiz.title}
                                </span>
                                <DifficultyBadge difficulty={quiz.difficulty} />
                              </div>
                              <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                                <span>{quiz.questionCount || 0} Questions</span>
                                {quiz.timeLimitSec ? (
                                  <span>{Math.round(quiz.timeLimitSec / 60)} mins</span>
                                ) : (
                                  <span>No timer</span>
                                )}
                                {quiz.category && (
                                  <span className="truncate max-w-28">• {quiz.category}</span>
                                )}
                              </div>
                            </div>

                            {isSelected && <Check className="size-4 shrink-0 text-primary" />}
                          </div>
                        );
                      })}

                      {/* Infinite Scroll Anchor & Loading State */}
                      <div ref={loadMoreRef} className="py-2 text-center">
                        {isFetchingNextPage ? (
                          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground py-1">
                            <Loader2 className="size-3.5 animate-spin text-primary" />
                            <span>Loading more quizzes...</span>
                          </div>
                        ) : hasNextPage ? (
                          <button
                            type="button"
                            onClick={() => fetchNextPage()}
                            className="text-[11px] text-primary hover:underline cursor-pointer py-1"
                          >
                            Scroll or click to load more ({quizzes.length}/{totalQuizzes})
                          </button>
                        ) : quizzes.length > 4 ? (
                          <span className="text-[10px] text-muted-foreground/60">
                            All {quizzes.length} quizzes loaded
                          </span>
                        ) : null}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Selected Quiz Card Preview */}
            {selectedQuiz && (
              <div className="mt-2.5 rounded-lg border border-primary/20 bg-primary/3 p-3 transition-all animate-in fade-in-50 duration-200">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-xs font-semibold text-foreground truncate">
                        {selectedQuiz.title}
                      </h4>
                      <DifficultyBadge difficulty={selectedQuiz.difficulty} />
                    </div>

                    {selectedQuiz.description && (
                      <p className="text-[11px] text-muted-foreground line-clamp-1">
                        {selectedQuiz.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground pt-0.5">
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="size-3 text-primary" />
                        {selectedQuiz.questionCount || 0} Questions
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="size-3 text-muted-foreground" />
                        {selectedQuiz.timeLimitSec
                          ? `${Math.round(selectedQuiz.timeLimitSec / 60)} mins limit`
                          : 'No time limit'}
                      </span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedQuizId('');
                      setSelectedQuiz(null);
                    }}
                    className="size-6 p-0 text-muted-foreground hover:text-foreground shrink-0 rounded-full"
                    title="Clear selection"
                  >
                    <X className="size-3.5" />
                  </Button>
                </div>
              </div>
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
                  htmlFor="assign-start-date"
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
                  id="assign-start-date"
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
                  htmlFor="assign-due-date"
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
                  id="assign-due-date"
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
                  {selectedQuiz?.timeLimitSec
                    ? `Must be at least ${Math.round(selectedQuiz.timeLimitSec / 60)} mins after start time`
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
                htmlFor="allow-late-submit"
                className="text-xs font-medium cursor-pointer text-foreground"
              >
                Allow Late Submissions
              </Label>
              <p className="text-[11px] text-muted-foreground">
                Students can still submit attempts after the deadline
              </p>
            </div>
            <Switch
              id="allow-late-submit"
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
              disabled={assignQuizMutation.isPending || !selectedQuizId}
              className="text-xs h-9 px-4 gap-1.5 shadow-sm"
            >
              {assignQuizMutation.isPending ? 'Assigning...' : 'Assign Quiz'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
