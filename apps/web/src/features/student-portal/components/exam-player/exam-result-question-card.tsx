'use client';

import type { FullQuestion, IExamAttemptAnswer } from '@/features/student-portal/types';
import { getIdStr } from '@/features/student-portal/utils/exam.utils';
import { cn } from '@/shared/lib/utils';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { AlertTriangle, Check, CheckCircle2, HelpCircle, X, XCircle } from 'lucide-react';

interface ExamResultQuestionCardProps {
  question: FullQuestion;
  index: number;
  studentAnswer: IExamAttemptAnswer | undefined;
  onReport?: (question: FullQuestion) => void;
}

export function ExamResultQuestionCard({
  question,
  index,
  studentAnswer,
  onReport,
}: ExamResultQuestionCardProps) {
  const isCorrect = studentAnswer?.isCorrect === true;

  const selectedIds = [
    ...(studentAnswer?.selectedOptionIds ?? []).map(getIdStr),
    ...(studentAnswer?.selectedOptionIds ?? []).map(String),
  ];
  const textAnswer = studentAnswer?.textAnswer;

  // Helper: check if an option was selected by the student
  const wasOptionSelected = (optContent: string) =>
    (textAnswer && textAnswer.trim().toLowerCase() === optContent.trim().toLowerCase()) ?? false;

  // Helper: check if an option is the correct answer
  const isOptionCorrect = (optContent: string, optIsCorrect?: boolean) => {
    if (optIsCorrect) return true;
    if (
      question.correctAnswer &&
      question.correctAnswer.trim().toLowerCase() === optContent.trim().toLowerCase()
    )
      return true;
    if (
      question.metadata?.correctText &&
      question.metadata.correctText.trim().toLowerCase() === optContent.trim().toLowerCase()
    )
      return true;
    return false;
  };

  // Find all selected options
  const selectedOptions = (question.options ?? []).filter(
    (opt) =>
      (getIdStr(opt._id) && selectedIds.includes(getIdStr(opt._id))) ||
      (opt._id && selectedIds.includes(String(opt._id))) ||
      (opt.content && selectedIds.includes(opt.content)) ||
      wasOptionSelected(opt.content),
  );

  // Ordering answers
  const orderAnswerIds = (studentAnswer?.orderAnswer ?? []).map(getIdStr);
  const orderedOptions = orderAnswerIds
    .map((id) =>
      (question.options ?? []).find((opt) => getIdStr(opt._id) === id || String(opt._id) === id),
    )
    .filter(Boolean);

  // Find all correct options
  const correctOptions = (question.options ?? []).filter((opt) =>
    isOptionCorrect(opt.content, opt.isCorrect),
  );

  const selectedAnswerDisplay =
    selectedOptions.length > 0
      ? selectedOptions.map((o) => o.content).join(', ')
      : orderedOptions.length > 0
        ? orderedOptions.map((o) => o?.content).join(' → ')
        : textAnswer || (isCorrect ? 'Correct answer selected' : 'No answer submitted');

  const correctAnswerDisplay =
    correctOptions.length > 0
      ? correctOptions.map((o) => o.content).join(', ')
      : question.correctAnswer || question.metadata?.correctText || '';

  const explanationText =
    question.explanation ||
    (isCorrect
      ? 'You answered this question correctly.'
      : correctAnswerDisplay
        ? `The correct answer is: ${correctAnswerDisplay}`
        : 'No detailed explanation available for this question.');

  return (
    <div
      className={cn(
        'rounded-2xl border p-5 transition-all space-y-4',
        isCorrect
          ? 'border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-950/10'
          : 'border-rose-500/30 bg-rose-500/5 dark:bg-rose-950/10',
      )}
    >
      {/* Question header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          {isCorrect ? (
            <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <XCircle className="size-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          )}
          <div className="space-y-1 min-w-0">
            <h3 className="text-sm sm:text-base font-bold text-foreground leading-snug">
              {index + 1}. {question.content}
            </h3>
            <span className="inline-block text-[11px] font-semibold text-muted-foreground">
              {question.points ?? 1} pt
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Badge
            className={cn(
              'text-[11px] font-bold shrink-0',
              isCorrect
                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                : 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30',
            )}
          >
            {isCorrect ? 'Correct' : 'Incorrect'}
          </Badge>

          {onReport && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onReport(question)}
              className="h-7 px-2.5 rounded-lg text-xs font-semibold text-muted-foreground hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 gap-1 border border-border/50"
              title="Report an issue with this question"
            >
              <AlertTriangle className="size-3 text-amber-500" />
              <span className="hidden sm:inline">Report Issue</span>
            </Button>
          )}
        </div>
      </div>

      {/* Options for choice questions */}
      {question.options && question.options.length > 0 && (
        <div className="space-y-2 ml-1 sm:ml-8">
          {question.options.map((opt) => {
            const optIdStr = getIdStr(opt._id);
            const wasSelected =
              (optIdStr && selectedIds.includes(optIdStr)) ||
              (opt._id && selectedIds.includes(String(opt._id))) ||
              (opt.content && selectedIds.includes(opt.content)) ||
              wasOptionSelected(opt.content);

            const isCorrectOpt = isOptionCorrect(opt.content, opt.isCorrect);

            return (
              <div
                key={opt._id ?? opt.content}
                className={cn(
                  'flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all',
                  isCorrectOpt
                    ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/40 font-semibold'
                    : wasSelected
                      ? 'bg-rose-500/15 text-rose-800 dark:text-rose-300 border border-rose-500/40 font-semibold'
                      : 'text-muted-foreground bg-muted/20 border border-border/40',
                )}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {isCorrectOpt ? (
                    <Check className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400 font-bold" />
                  ) : wasSelected ? (
                    <X className="size-4 shrink-0 text-rose-600 dark:text-rose-400 font-bold" />
                  ) : (
                    <span className="size-4 shrink-0" />
                  )}
                  <span className="truncate">{opt.content}</span>
                </div>

                <div className="shrink-0 flex items-center gap-1.5">
                  {wasSelected && isCorrectOpt && (
                    <Badge className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5">
                      Your answer &amp; Correct
                    </Badge>
                  )}
                  {wasSelected && !isCorrectOpt && (
                    <Badge className="bg-rose-600 text-white text-[10px] font-bold px-2 py-0.5">
                      Your answer
                    </Badge>
                  )}
                  {!wasSelected && isCorrectOpt && (
                    <Badge className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40 text-[10px] font-bold px-2 py-0.5">
                      Correct answer
                    </Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Answer Summary Card: Selected vs Correct */}
      <div className="ml-1 sm:ml-8 p-3.5 rounded-xl bg-card border border-border/70 space-y-2 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-muted-foreground">Your Answer:</span>
          <span
            className={cn(
              'font-semibold px-2 py-0.5 rounded-md text-xs',
              isCorrect
                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                : 'bg-rose-500/15 text-rose-700 dark:text-rose-300',
            )}
          >
            {selectedAnswerDisplay}
          </span>
        </div>

        {correctAnswerDisplay && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-muted-foreground">Correct Answer:</span>
            <span className="font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-md text-xs">
              {correctAnswerDisplay}
            </span>
          </div>
        )}
      </div>

      {/* Detailed Explanation */}
      <div className="ml-1 sm:ml-8 p-3.5 rounded-xl bg-sky-50/80 dark:bg-sky-950/30 border border-sky-200/80 dark:border-sky-900/40 text-xs space-y-1">
        <p className="font-bold text-sky-800 dark:text-sky-300 flex items-center gap-1.5">
          <HelpCircle className="size-3.5 text-sky-600 dark:text-sky-400" />
          Detailed Explanation:
        </p>
        <p className="text-muted-foreground leading-relaxed pl-5">{explanationText}</p>
      </div>
    </div>
  );
}
