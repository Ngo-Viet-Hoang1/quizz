'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Radio, Loader2, BookOpenCheck, Search, Clock } from 'lucide-react';
import { useQuizzes } from '@/features/quizzes/hooks';
import { useRoomApi } from '../api/room.api';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { cn } from '@/shared/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';

interface CreateRoomDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateRoomDialog({ open, onOpenChange }: CreateRoomDialogProps) {
  const router = useRouter();
  const api = useRoomApi();
  const { data: quizzes, isLoading: isQuizzesLoading } = useQuizzes();

  const [selectedQuizId, setSelectedQuizId] = useState<string>('');
  const [search, setSearch] = useState('');
  const [timeLimitSec, setTimeLimitSec] = useState<number>(30);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter quizzes that have at least 1 question
  const validQuizzes = (quizzes || []).filter((q) => (q.questions?.length || 0) > 0);
  const filteredQuizzes = validQuizzes.filter((q) =>
    q.title.toLowerCase().includes(search.toLowerCase()),
  );
  const selectedQuiz = validQuizzes.find((q) => q._id === selectedQuizId);

  // Update default time limit whenever selected quiz changes
  React.useEffect(() => {
    if (selectedQuiz?.timeLimitSec) {
      setTimeLimitSec(selectedQuiz.timeLimitSec);
    } else {
      setTimeLimitSec(30);
    }
  }, [selectedQuiz]);

  const handleStartLiveRoom = async () => {
    if (!selectedQuizId) {
      toast.error('Please select a quiz to launch');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await api.createRoom(selectedQuizId, {
        quizVersion: selectedQuiz?.version,
        timeLimitSec: timeLimitSec > 0 ? timeLimitSec : 30,
      });
      if (res?.pin) {
        toast.success(`Live room launched successfully! PIN: ${res.pin}`);
        onOpenChange(false);
        router.push(`/room/host?pin=${res.pin}`);
      }
    } catch (error) {
      console.error('Failed to create live room:', error);
      toast.error('Failed to create live room');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader className="space-y-1.5">
          <div className="size-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500 mb-1">
            <Radio className="h-5 w-5" />
          </div>
          <DialogTitle className="text-lg font-bold">Host Live Quiz Room</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Select an assessment from your library to start a real-time interactive session with
            students.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-3">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Select Assessment
            </label>
            {isQuizzesLoading ? (
              <div className="h-11 rounded-md border border-input bg-muted/40 animate-pulse flex items-center px-3 text-xs text-muted-foreground">
                Loading assessment library...
              </div>
            ) : validQuizzes.length === 0 ? (
              <div className="p-4 rounded-lg border border-dashed text-center text-xs text-muted-foreground">
                No quizzes with questions found. Please add questions to a quiz before hosting.
              </div>
            ) : (
              <Select value={selectedQuizId} onValueChange={(val) => setSelectedQuizId(val || '')}>
                <SelectTrigger className="w-full h-11 px-3.5 text-left font-normal bg-background border-input hover:border-primary/50 transition-colors">
                  <SelectValue placeholder="-- Choose an assessment from library --">
                    {selectedQuiz ? (
                      <span className="font-medium text-foreground truncate block text-left">
                        {selectedQuiz.title}
                      </span>
                    ) : undefined}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="max-h-72 w-(--anchor-width) min-w-[360px]">
                  {validQuizzes.length > 4 && (
                    <div className="p-2 border-b border-border/40 sticky top-0 bg-popover z-10">
                      <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-md border border-input bg-muted/40">
                        <Search className="size-3.5 text-muted-foreground shrink-0" />
                        <input
                          type="text"
                          placeholder="Filter assessments..."
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => e.stopPropagation()}
                          className="w-full bg-transparent text-xs text-foreground placeholder:text-muted-foreground outline-none"
                        />
                      </div>
                    </div>
                  )}
                  {filteredQuizzes.length === 0 ? (
                    <div className="p-3 text-center text-xs text-muted-foreground">
                      No assessments matching &quot;{search}&quot;
                    </div>
                  ) : (
                    filteredQuizzes.map((quiz) => (
                      <SelectItem
                        key={quiz._id}
                        value={quiz._id}
                        className="py-2.5 px-3 cursor-pointer"
                      >
                        <div className="flex items-center justify-between w-full min-w-0 gap-3">
                          <span
                            className="font-medium text-foreground truncate min-w-0 flex-1 text-left"
                            title={quiz.title}
                          >
                            {quiz.title}
                          </span>
                          <div className="flex items-center gap-1.5 shrink-0 text-xs font-mono text-muted-foreground bg-muted/70 px-2 py-0.5 rounded border border-border/40">
                            <span>{quiz.questions?.length || 0} Qs</span>
                            <span className="opacity-40">•</span>
                            <span>v{quiz.version || 1}</span>
                          </div>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            )}
          </div>

          {selectedQuiz && (
            <>
              {/* Assessment Summary Card */}
              <div className="p-4 rounded-xl bg-card border border-border space-y-2 text-xs text-muted-foreground shadow-2xs">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2 min-w-0 flex-1">
                    <BookOpenCheck className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="text-sm font-semibold text-foreground leading-snug break-words">
                      {selectedQuiz.title}
                    </span>
                  </div>
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-muted border border-border/60 shrink-0 text-muted-foreground">
                    v{selectedQuiz.version || 1}
                  </span>
                </div>
                {selectedQuiz.description && (
                  <p className="line-clamp-2 text-muted-foreground text-xs leading-relaxed">
                    {selectedQuiz.description}
                  </p>
                )}
                <div className="flex items-center gap-3 pt-1.5 font-mono text-xs border-t border-border/40">
                  <span>
                    Questions:{' '}
                    <strong className="text-foreground">
                      {selectedQuiz.questions?.length || 0}
                    </strong>
                  </span>
                  <span>•</span>
                  <span>
                    Quiz Default:{' '}
                    <strong className="text-foreground">
                      {selectedQuiz.timeLimitSec ? `${selectedQuiz.timeLimitSec}s` : '30s'}
                    </strong>
                  </span>
                </div>
              </div>

              {/* Time Limit Setting */}
              <div className="space-y-2.5 p-4 rounded-xl border border-border bg-card shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Clock className="size-3.5 text-emerald-600" />
                    <label className="text-xs font-semibold uppercase tracking-wider text-foreground font-mono">
                      Playtime Per Question
                    </label>
                  </div>
                  <span className="text-xs font-mono text-muted-foreground">
                    Est. session: ~
                    {Math.ceil(((selectedQuiz.questions?.length || 0) * timeLimitSec) / 60)} mins
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {[15, 20, 30, 45, 60, 90].map((preset) => (
                    <Button
                      key={preset}
                      type="button"
                      variant={timeLimitSec === preset ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setTimeLimitSec(preset)}
                      className={cn(
                        'h-8 px-3 text-xs font-mono',
                        timeLimitSec === preset
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white font-semibold'
                          : 'text-muted-foreground hover:text-foreground',
                      )}
                    >
                      {preset}s
                    </Button>
                  ))}

                  <div className="flex items-center gap-1.5 ml-auto">
                    <Input
                      type="number"
                      min={5}
                      max={300}
                      value={timeLimitSec}
                      onChange={(e) => setTimeLimitSec(Math.max(5, parseInt(e.target.value) || 30))}
                      className="w-20 h-8 text-xs font-mono text-center px-1"
                    />
                    <span className="text-xs text-muted-foreground font-mono">sec</span>
                  </div>
                </div>

                <p className="text-[11px] text-muted-foreground">
                  Each student will have <strong>{timeLimitSec} seconds</strong> to answer each
                  question before the countdown reaches 0.
                </p>
              </div>
            </>
          )}
        </div>

        <DialogFooter className="flex sm:justify-end gap-3 pt-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="h-9 px-4"
          >
            Cancel
          </Button>
          <Button
            onClick={handleStartLiveRoom}
            disabled={!selectedQuizId || isSubmitting}
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 h-9 px-5 font-medium shadow-xs"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Launching...</span>
              </>
            ) : (
              <span>Launch Live Room</span>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
