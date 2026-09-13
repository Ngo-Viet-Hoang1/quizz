'use client';

import { useState } from 'react';
import { useAttemptDetail, useStartPracticeQuiz } from '@/features/student-portal/api/student.api';
import {
  ExamResultQuestionCard,
  ReportQuestionModal,
} from '@/features/student-portal/components/exam-player';
import type { FullQuestion } from '@/features/student-portal/types';
import {
  calculateScorePercentage,
  getIdStr,
  isExamPassed,
} from '@/features/student-portal/utils/exam.utils';
import { cn } from '@/shared/lib/utils';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Progress } from '@/shared/ui/progress';
import { Skeleton } from '@/shared/ui/skeleton';
import { ArrowLeft, Clock, RotateCcw, Target, Trophy } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';

const RESULT_STATUS_CONFIG = {
  pass: {
    cardBg: 'bg-emerald-500/10',
    textColor: 'text-emerald-600 dark:text-emerald-400',
    badgeClass: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
    label: 'Pass',
  },
  fail: {
    cardBg: 'bg-red-500/10',
    textColor: 'text-red-600 dark:text-red-400',
    badgeClass: 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30',
    label: 'Fail',
  },
} as const;

function formatDurationSec(sec: number = 0): string {
  if (sec <= 0) return '< 1s';
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

export default function ExamResultPage() {
  const params = useParams();
  const router = useRouter();
  const attemptId = params.attemptId as string;

  const [selectedReportQuestion, setSelectedReportQuestion] = useState<FullQuestion | null>(null);
  const [selectedReportIndex, setSelectedReportIndex] = useState<number>(0);

  const { data: detail, isLoading } = useAttemptDetail(attemptId);
  const startPractice = useStartPracticeQuiz();

  const handleRetake = () => {
    if (!detail?.attempt) return;
    const quizId =
      typeof detail.attempt.quizId === 'object' &&
      detail.attempt.quizId !== null &&
      '_id' in detail.attempt.quizId
        ? String((detail.attempt.quizId as { _id: unknown })._id)
        : String(detail.attempt.quizId);

    if (!quizId) return;

    startPractice.mutate(quizId, {
      onSuccess: (data) => {
        toast.success('Starting new attempt!');
        router.push(`/student/exam/${data.attempt._id}`);
      },
      onError: (err) => {
        toast.error(err.message || 'Failed to start retake attempt');
      },
    });
  };

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
  const totalQuestions =
    questions && questions.length > 0
      ? questions.length
      : attempt.correctCount + attempt.wrongCount;
  const scorePct = calculateScorePercentage(attempt.score, attempt.totalPoints);
  const passed = isExamPassed(attempt.score, attempt.totalPoints);
  const formattedTime = formatDurationSec(attempt.durationSec);
  const statusConfig = passed ? RESULT_STATUS_CONFIG.pass : RESULT_STATUS_CONFIG.fail;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1">
          <Link href="/student/classes">
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-muted-foreground hover:text-foreground -ml-2"
            >
              <ArrowLeft className="size-4" />
              My Classes
            </Button>
          </Link>
          <span className="text-muted-foreground/40">/</span>
          <Link href="/student/history">
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-muted-foreground hover:text-foreground"
            >
              History
            </Button>
          </Link>
        </div>

        <Button
          size="sm"
          onClick={handleRetake}
          disabled={startPractice.isPending}
          className="rounded-xl font-semibold text-xs gap-1.5 bg-sky-600 hover:bg-sky-700 text-white shadow-xs"
        >
          <RotateCcw className="size-3.5" />
          {startPractice.isPending ? 'Starting...' : 'Retake Practice'}
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Trophy className="size-6 text-primary" />
          Results & History
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">{quizTitle}</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className={cn('rounded-xl border shadow-sm', statusConfig.cardBg)}>
          <CardContent className="p-4 text-center">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
              Score
            </p>
            <p className={cn('text-3xl font-bold', statusConfig.textColor)}>{scorePct}%</p>
          </CardContent>
        </Card>

        <Card className="rounded-xl border shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
              Status
            </p>
            <Badge className={cn('text-sm px-3 py-1', statusConfig.badgeClass)}>
              {statusConfig.label}
            </Badge>
          </CardContent>
        </Card>

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

        <Card className="rounded-xl border shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
              Time
            </p>
            <p className="text-2xl font-bold text-foreground flex items-center justify-center gap-1">
              <Clock className="size-4 text-muted-foreground" />
              {formattedTime}
            </p>
          </CardContent>
        </Card>
      </div>

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

      <Card className="rounded-xl border shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Target className="size-4 text-primary" />
            Review Questions & Explanations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!questions || questions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No question review available for this attempt.
            </p>
          ) : (
            questions.map((q, idx) => {
              const question = q as FullQuestion;
              const studentAnswer =
                attempt.answers?.find((a) => getIdStr(a.questionId) === getIdStr(question._id)) ??
                attempt.answers?.[idx];

              return (
                <ExamResultQuestionCard
                  key={question._id ?? idx}
                  question={question}
                  index={idx}
                  studentAnswer={studentAnswer}
                  onReport={(q) => {
                    setSelectedReportQuestion(q);
                    setSelectedReportIndex(idx);
                  }}
                />
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Report Question Modal */}
      {selectedReportQuestion && (
        <ReportQuestionModal
          isOpen={Boolean(selectedReportQuestion)}
          onClose={() => setSelectedReportQuestion(null)}
          question={selectedReportQuestion}
          questionIndex={selectedReportIndex}
          quizId={
            typeof attempt.quizId === 'object' && attempt.quizId !== null && '_id' in attempt.quizId
              ? String((attempt.quizId as { _id: unknown })._id)
              : String(attempt.quizId)
          }
          quizVersion={attempt.quizVersion ?? 1}
          attemptId={attempt._id}
        />
      )}
    </div>
  );
}
