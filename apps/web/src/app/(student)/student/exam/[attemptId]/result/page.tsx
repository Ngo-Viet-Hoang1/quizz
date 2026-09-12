'use client';

import { useAttemptDetail } from '@/features/student-portal/api/student.api';
import { ExamResultQuestionCard } from '@/features/student-portal/components/exam-player/exam-result-question-card';
import type { FullQuestion } from '@/features/student-portal/types';
import { calculateScorePercentage, isExamPassed } from '@/features/student-portal/utils/exam.utils';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Progress } from '@/shared/ui/progress';
import { Skeleton } from '@/shared/ui/skeleton';
import { ArrowLeft, Clock, Target, Trophy } from 'lucide-react';
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
  const scorePct = calculateScorePercentage(attempt.score, attempt.totalPoints);
  const passed = isExamPassed(attempt.score, attempt.totalPoints);
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
          className={`rounded-xl border shadow-sm ${
            passed
              ? 'bg-gradient-to-br from-emerald-500/10 to-emerald-500/5'
              : 'bg-gradient-to-br from-red-500/10 to-red-500/5'
          }`}
        >
          <CardContent className="p-4 text-center">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
              Score
            </p>
            <p
              className={`text-3xl font-bold ${
                passed ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
              }`}
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
                passed
                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                  : 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30'
              }`}
            >
              {passed ? 'Pass' : 'Fail'}
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

            return (
              <ExamResultQuestionCard
                key={question._id}
                question={question}
                index={idx}
                studentAnswer={studentAnswer}
              />
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
