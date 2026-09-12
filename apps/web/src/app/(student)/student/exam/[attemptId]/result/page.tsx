'use client';

import { useAttemptDetail } from '@/features/student-portal/api/student.api';
import type { FullQuestion } from '@/features/student-portal/types';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Progress } from '@/shared/ui/progress';
import { Skeleton } from '@/shared/ui/skeleton';
import { ArrowLeft, Check, CheckCircle2, Clock, Target, Trophy, X, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function ExamResultPage() {
  const params = useParams();
  const attemptId = params.attemptId as string;

  const { data: detail, isLoading } = useAttemptDetail(attemptId);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-muted-foreground">
        <p>Result not found.</p>
      </div>
    );
  }

  const { attempt, quizTitle, questions } = detail;
  const totalQuestions = attempt.correctCount + attempt.wrongCount;
  const scorePct =
    attempt.totalPoints > 0 ? Math.round((attempt.score / attempt.totalPoints) * 100) : 0;
  const isPassed = scorePct >= 50;
  const timeTaken = attempt.durationSec ?? 0;
  const timeMins = Math.floor(timeTaken / 60);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back Button */}
      <Link href="/student/history">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-muted-foreground hover:text-foreground -ml-2"
        >
          <ArrowLeft className="size-4" />
          Back to History
        </Button>
      </Link>

      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Trophy className="size-6 text-primary" />
          Results & History
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">{quizTitle}</p>
      </div>

      {/* Score Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Score */}
        <Card
          className={`rounded-xl border shadow-sm ${isPassed ? 'bg-gradient-to-br from-emerald-500/10 to-emerald-500/5' : 'bg-gradient-to-br from-red-500/10 to-red-500/5'}`}
        >
          <CardContent className="p-4 text-center">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
              Score
            </p>
            <p
              className={`text-3xl font-bold ${isPassed ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}
            >
              {scorePct}%
            </p>
          </CardContent>
        </Card>

        {/* Status */}
        <Card className="rounded-xl border shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
              Status
            </p>
            <Badge
              className={`text-sm px-3 py-1 ${
                isPassed
                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                  : 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30'
              }`}
            >
              {isPassed ? 'Pass' : 'Fail'}
            </Badge>
          </CardContent>
        </Card>

        {/* Correct */}
        <Card className="rounded-xl border shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
              Correct
            </p>
            <p className="text-2xl font-bold text-foreground">
              {attempt.correctCount}/{totalQuestions}
            </p>
          </CardContent>
        </Card>

        {/* Time */}
        <Card className="rounded-xl border shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
              Time
            </p>
            <p className="text-2xl font-bold text-foreground flex items-center justify-center gap-1">
              <Clock className="size-4 text-muted-foreground" />
              {timeMins}m
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Score Progress Bar */}
      <Card className="rounded-xl border shadow-sm">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">Overall Score</span>
            <span className="text-sm font-bold font-mono text-foreground">
              {attempt.score} / {attempt.totalPoints} pts
            </span>
          </div>
          <Progress value={scorePct} className="h-3" />
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>{attempt.correctCount} correct</span>
            <span>{attempt.wrongCount} wrong</span>
          </div>
        </CardContent>
      </Card>

      {/* Review Questions */}
      <Card className="rounded-xl border shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Target className="size-4 text-primary" />
            Review History
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {questions.map((q, idx) => {
            const question = q as FullQuestion;
            const studentAnswer = attempt.answers.find((a) => a.questionId === question._id);
            const isCorrect = studentAnswer?.isCorrect === true;
            const selectedIds = studentAnswer?.selectedOptionIds ?? [];
            const textAnswer = studentAnswer?.textAnswer;

            return (
              <div
                key={question._id}
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
                        {idx + 1}. {question.content}
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
                    <p className="text-xs font-semibold text-sky-700 dark:text-sky-400 mb-0.5">
                      Explanation
                    </p>
                    <p className="text-xs text-muted-foreground">{question.explanation}</p>
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
