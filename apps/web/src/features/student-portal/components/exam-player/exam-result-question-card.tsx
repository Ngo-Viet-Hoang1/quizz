'use client';

import type { FullQuestion, IExamAttemptAnswer } from '@/features/student-portal/types';
import { Badge } from '@/shared/ui/badge';
import { Check, CheckCircle2, X, XCircle } from 'lucide-react';

interface ExamResultQuestionCardProps {
  question: FullQuestion;
  index: number;
  studentAnswer: IExamAttemptAnswer | undefined;
}

export function ExamResultQuestionCard({
  question,
  index,
  studentAnswer,
}: ExamResultQuestionCardProps) {
  const isCorrect = studentAnswer?.isCorrect === true;
  const selectedIds = studentAnswer?.selectedOptionIds ?? [];
  const textAnswer = studentAnswer?.textAnswer;

  return (
    <div
      className={`rounded-xl border p-4 ${
        isCorrect
          ? 'border-emerald-500/30 bg-emerald-500/5'
          : studentAnswer
            ? 'border-red-500/30 bg-red-500/5'
            : 'border-border'
      }`}
    >
      {/* Question header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-2">
          {isCorrect ? (
            <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          ) : studentAnswer ? (
            <XCircle className="size-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
          ) : (
            <div className="size-5 rounded-full border-2 border-muted-foreground/30 shrink-0 mt-0.5" />
          )}
          <div>
            <p className="text-sm font-medium text-foreground">
              {index + 1}. {question.content}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5 capitalize">
              {question.type.replace(/_/g, ' ')} • {question.points ?? 1} pt
            </p>
          </div>
        </div>
      </div>

      {/* Options for choice questions */}
      {question.options && question.options.length > 0 && (
        <div className="space-y-1.5 ml-7">
          {question.options.map((opt) => {
            const wasSelected = selectedIds.includes(opt._id);
            const isCorrectOpt = 'isCorrect' in opt && opt.isCorrect === true;

            return (
              <div
                key={opt._id}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm ${
                  isCorrectOpt
                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                    : wasSelected && !isCorrectOpt
                      ? 'bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/30'
                      : 'text-muted-foreground'
                }`}
              >
                {isCorrectOpt ? (
                  <Check className="size-3.5 shrink-0" />
                ) : wasSelected ? (
                  <X className="size-3.5 shrink-0" />
                ) : (
                  <span className="size-3.5 shrink-0" />
                )}
                <span>{opt.content}</span>
                {wasSelected && (
                  <Badge variant="outline" className="text-[9px] ml-auto shrink-0">
                    Your answer
                  </Badge>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Text answer display */}
      {textAnswer && (
        <div className="ml-7 mt-2 px-3 py-2 rounded-lg bg-muted/50 border text-sm">
          <span className="text-xs text-muted-foreground font-medium">Your answer: </span>
          <span className="text-foreground">{textAnswer}</span>
        </div>
      )}

      {/* Explanation */}
      {question.explanation && (
        <div className="ml-7 mt-3 px-3 py-2 rounded-lg bg-sky-500/5 border border-sky-500/20 text-sm">
          <p className="text-xs font-semibold text-sky-700 dark:text-sky-400 mb-0.5">Explanation</p>
          <p className="text-xs text-muted-foreground">{question.explanation}</p>
        </div>
      )}
    </div>
  );
}
