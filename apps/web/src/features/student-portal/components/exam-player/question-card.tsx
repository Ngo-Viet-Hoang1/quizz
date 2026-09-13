'use client';

import type { SanitizedQuestion } from '@/features/student-portal/types';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardContent } from '@/shared/ui/card';
import { Check, Flag } from 'lucide-react';

interface QuestionCardProps {
  question: SanitizedQuestion;
  qIdx: number;
  selectedOptions: string[];
  textAnswer: string;
  isFlagged: boolean;
  isAnswered: boolean;
  onSelectOption: (questionId: string, optionId: string, isMultiple: boolean) => void;
  onTextAnswerChange: (questionId: string, text: string) => void;
  onTextAnswerBlur: (questionId: string) => void;
  onToggleFlag: (questionId: string) => void;
}

export function QuestionCard({
  question,
  qIdx,
  selectedOptions,
  textAnswer,
  isFlagged,
  isAnswered,
  onSelectOption,
  onTextAnswerChange,
  onTextAnswerBlur,
  onToggleFlag,
}: QuestionCardProps) {
  const qType = String(question.type ?? '').toLowerCase();
  const isMultiple =
    qType === 'multiple_choice' ||
    (question.options ?? []).filter((o) => 'isCorrect' in o && o.isCorrect === true).length > 1;
  const isTextType =
    qType === 'fill_blank' ||
    qType === 'fill_in_blank' ||
    qType === 'short_answer' ||
    qType === 'text' ||
    qType === 'essay' ||
    !question.options ||
    question.options.length === 0;

  return (
    <Card
      id={`question-${question._id}`}
      className={`rounded-2xl border bg-card transition-all duration-200 scroll-mt-28 ${
        isFlagged
          ? 'ring-2 ring-amber-400/50 border-amber-400/60 shadow-sm'
          : isAnswered
            ? 'border-indigo-200 dark:border-indigo-900/60 shadow-sm'
            : 'border-border/80 shadow-sm hover:border-border'
      }`}
    >
      <CardContent className="p-5 sm:p-6">
        {/* Question Header */}
        <div className="flex items-start justify-between mb-4 pb-3 border-b border-border/60 gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <Badge className="bg-indigo-600 hover:bg-indigo-600 text-white font-bold text-xs px-3 py-1 rounded-lg">
              Question {qIdx + 1}
            </Badge>
            <span className="text-xs text-muted-foreground font-medium capitalize">
              {question.points ?? 1} {(question.points ?? 1) > 1 ? 'pts' : 'pt'}
            </span>
          </div>
          <Button
            variant={isFlagged ? 'default' : 'outline'}
            size="sm"
            className={`h-8 text-xs rounded-xl gap-1.5 font-semibold transition-colors ${
              isFlagged
                ? 'bg-amber-500 hover:bg-amber-600 text-white border-transparent'
                : 'border-border/80 text-muted-foreground hover:text-foreground hover:bg-muted/60'
            }`}
            onClick={() => onToggleFlag(question._id)}
          >
            <Flag className="size-3.5" />
            {isFlagged ? 'Flagged' : 'Flag'}
          </Button>
        </div>

        {/* Question Text */}
        <div className="prose prose-sm max-w-none mb-5">
          <p className="text-base font-semibold text-foreground leading-relaxed">
            {question.content}
          </p>
        </div>

        {/* Options / Text Input */}
        {isTextType ? (
          <div className="space-y-2">
            <textarea
              className="w-full min-h-28 p-4 rounded-xl border border-border bg-background text-sm resize-y focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none transition-all placeholder:text-muted-foreground/60"
              placeholder="Type your answer here..."
              value={textAnswer}
              onChange={(e) => onTextAnswerChange(question._id, e.target.value)}
              onBlur={() => onTextAnswerBlur(question._id)}
            />
          </div>
        ) : (
          <div className="space-y-2.5">
            {(question.options ?? []).map((opt, optIdx) => {
              const isSelected = selectedOptions.includes(opt._id);
              const letter = String.fromCharCode(65 + optIdx);

              return (
                <button
                  key={opt._id}
                  type="button"
                  onClick={() => onSelectOption(question._id, opt._id, isMultiple)}
                  className={`w-full flex items-center gap-3.5 p-3.5 sm:p-4 rounded-xl border text-left transition-all duration-150 cursor-pointer ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/30 ring-1 ring-indigo-600/20 font-semibold text-foreground'
                      : 'border-border/80 bg-background hover:border-indigo-400/50 hover:bg-muted/30 text-foreground/90'
                  }`}
                >
                  <div
                    className={`flex size-7 sm:size-8 items-center justify-center rounded-lg text-xs font-bold shrink-0 transition-colors ${
                      isSelected ? 'bg-indigo-600 text-white' : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {isSelected ? <Check className="size-4 stroke-[2.5]" /> : letter}
                  </div>
                  <span className="text-sm leading-snug">{opt.content}</span>
                </button>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
