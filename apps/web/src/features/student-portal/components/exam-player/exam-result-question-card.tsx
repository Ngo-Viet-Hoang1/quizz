'use client';

import type { FullQuestion, IExamAttemptAnswer } from '@/features/student-portal/types';
import { Check, CheckCircle2, X, XCircle } from 'lucide-react';

interface ExamResultQuestionCardProps {
  question: FullQuestion;
  index: number;
  studentAnswer: IExamAttemptAnswer | undefined;
}

function getIdStr(id: unknown): string {
  if (!id) return '';
  if (typeof id === 'string') return id;
  if (typeof id === 'object' && id !== null) {
    if ('_id' in id) return getIdStr((id as { _id: unknown })._id);
    if ('toString' in id && typeof id.toString === 'function') return id.toString();
  }
  return String(id);
}

export function ExamResultQuestionCard({
  question,
  index,
  studentAnswer,
}: ExamResultQuestionCardProps) {
  const isCorrect = studentAnswer?.isCorrect === true;
  const selectedIds = (studentAnswer?.selectedOptionIds ?? []).map(getIdStr);
  const textAnswer = studentAnswer?.textAnswer;

  return (
    <div
      className={`rounded-xl border p-4 ${
        isCorrect
          ? 'border-emerald-500/30 bg-emerald-500/5'
          : 'border-red-500/30 bg-red-500/5'
      }`}
    >
      {/* Question header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-2">
          {isCorrect ? (
            <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <XCircle className="size-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
          )}
          <div>
            <p className="text-sm font-medium text-foreground">
              {index + 1}. {question.content}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">
              {question.points ?? 1} pt
            </p>
          </div>
        </div>
      </div>

      {/* Options for choice questions */}
      {question.options && question.options.length > 0 && (
        <div className="space-y-1.5 ml-7">
          {question.options.map((opt) => {
            const optIdStr = getIdStr(opt._id);
            const wasSelected = selectedIds.includes(optIdStr);
            const isCorrectOpt = 'isCorrect' in opt && opt.isCorrect === true;

            return (
              <div
                key={opt._id}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium ${
                  isCorrectOpt
                    ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30'
                    : wasSelected && !isCorrectOpt
                      ? 'bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/30'
                      : 'text-muted-foreground bg-muted/20 border border-transparent'
                }`}
              >
                {isCorrectOpt ? (
                  <Check className="size-4 shrink-0 text-emerald-600 font-bold" />
                ) : wasSelected ? (
                  <X className="size-4 shrink-0 text-red-600 font-bold" />
                ) : (
                  <span className="size-4 shrink-0" />
                )}
                <span className="flex-1">{opt.content}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Text answer display */}
      {textAnswer && (
        <div className="ml-7 mt-2 px-3 py-2 rounded-lg bg-muted/50 border text-sm">
          <span className="text-xs text-muted-foreground font-medium">Câu trả lời của bạn: </span>
          <span className="text-foreground font-semibold">{textAnswer}</span>
        </div>
      )}

      {/* Correct answer text for short answer / text questions if present */}
      {question.correctAnswer && (
        <div className="ml-7 mt-2 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-sm">
          <span className="text-xs text-emerald-700 dark:text-emerald-400 font-bold">
            Đáp án chuẩn:{' '}
          </span>
          <span className="text-foreground font-semibold">{question.correctAnswer}</span>
        </div>
      )}

      {/* Explanation */}
      {question.explanation && (
        <div className="ml-7 mt-3 px-3.5 py-2.5 rounded-xl bg-sky-500/10 border border-sky-500/25 text-sm space-y-1">
          <p className="text-xs font-extrabold text-sky-700 dark:text-sky-400 flex items-center gap-1.5">
            💡 Giải thích chi tiết:
          </p>
          <p className="text-xs text-foreground/80 leading-relaxed">{question.explanation}</p>
        </div>
      )}
    </div>
  );
}
