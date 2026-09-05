'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  BookOpen,
  CheckCircle,
  ChevronLeft,
  Edit3,
  HelpCircle,
  Pencil,
  Plus,
  Share2,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Skeleton } from '@/shared/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/ui/alert-dialog';
import { formatDuration } from '@/shared/lib/date';
import { cn } from '@/shared/lib/utils';
import { useQuiz, useUpdateQuiz } from '../hooks';
import { QuestionItem, QuizDifficulty, QuizSourceType, QuizStatus } from '../types';
import { QuizFormDialog } from './quiz-form/quiz-form-dialog';
import { QuizShareDialog } from './quiz-share-dialog';
import { QuestionFormDialog } from './question-dialog/question-form-dialog';

const statusColorMap: Record<string, { className: string; label: string }> = {
  [QuizStatus.PUBLISHED]: {
    label: 'Published',
    className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500',
  },
  [QuizStatus.DRAFT]: {
    label: 'Draft',
    className: 'border-border bg-muted/60 text-muted-foreground',
  },
  [QuizStatus.ARCHIVED]: {
    label: 'Archived',
    className: 'border-amber-500/30 bg-amber-500/10 text-amber-500',
  },
};

// ---------------------------------------------------------------------------
// Skeleton shown while the quiz is loading
// ---------------------------------------------------------------------------
function QuizDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 border-b pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-80" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-28" />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-4 space-y-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-5 w-24" />
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-8 w-28" />
        </CardHeader>
        <CardContent className="divide-y p-0">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-5 space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-2.5 flex-1">
                  <Skeleton className="h-6 w-6 rounded-full shrink-0" />
                  <Skeleton className="h-4 flex-1 max-w-sm" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-8 w-8" />
                  <Skeleton className="h-8 w-8" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 pl-8">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
interface QuizDetailViewProps {
  quizId: string;
}

export function QuizDetailView({ quizId }: QuizDetailViewProps) {
  const router = useRouter();
  const { data: quiz, isLoading } = useQuiz(quizId);
  const { mutateAsync: updateQuiz, isPending: isUpdating } = useUpdateQuiz();

  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [shareDialogOpen, setShareDialogOpen] = React.useState(false);

  // Question dialog state
  const [questionDialogOpen, setQuestionDialogOpen] = React.useState(false);
  const [questionToEdit, setQuestionToEdit] = React.useState<QuestionItem | null>(null);

  // Delete question confirmation state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false);
  const [questionToDeleteIndex, setQuestionToDeleteIndex] = React.useState<number | null>(null);

  const handleOpenAddQuestion = () => {
    setQuestionToEdit(null);
    setQuestionDialogOpen(true);
  };

  const handleOpenEditQuestion = (q: QuestionItem) => {
    setQuestionToEdit(q);
    setQuestionDialogOpen(true);
  };

  const handleOpenDeleteQuestion = (index: number) => {
    setQuestionToDeleteIndex(index);
    setDeleteConfirmOpen(true);
  };

  const handleSaveQuestion = async (saved: QuestionItem) => {
    if (!quiz) return;
    const current = quiz.questions || [];

    const next = questionToEdit
      ? current.map((q) =>
          (q._id && q._id === questionToEdit._id) || q.content === questionToEdit.content
            ? saved
            : q,
        )
      : [...current, saved];

    await updateQuiz({ id: quiz._id, data: { questions: next } });
    setQuestionDialogOpen(false);
  };

  const handleDeleteQuestionConfirm = async () => {
    if (!quiz || questionToDeleteIndex === null) return;
    const next = (quiz.questions || []).filter((_, idx) => idx !== questionToDeleteIndex);
    await updateQuiz({ id: quiz._id, data: { questions: next } });
    setDeleteConfirmOpen(false);
    setQuestionToDeleteIndex(null);
  };

  // Loading
  if (isLoading) return <QuizDetailSkeleton />;

  // Not found
  if (!quiz) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3 text-center">
        <HelpCircle className="h-10 w-10 text-muted-foreground" />
        <h3 className="text-lg font-semibold">Quiz Not Found</h3>
        <p className="text-sm text-muted-foreground">The requested quiz could not be located.</p>
        <Button variant="outline" onClick={() => router.push('/quizzes')}>
          Return to Quizzes
        </Button>
      </div>
    );
  }

  const statusConfig = statusColorMap[quiz.status] || {
    label: quiz.status,
    className: 'border-border bg-muted/60 text-muted-foreground',
  };

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col gap-4 border-b border-border pb-5 pt-1 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1.5">
          <div>
            <Link
              href="/quizzes"
              className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>Back to Quiz Bank</span>
            </Link>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {quiz.title}
            </h1>
            <Badge
              variant="outline"
              className={cn('font-mono text-xs capitalize', statusConfig.className)}
            >
              {statusConfig.label}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {quiz.description || 'No description provided'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:self-center">
          <Button variant="outline" onClick={() => setShareDialogOpen(true)} className="gap-1.5">
            <Share2 className="h-4 w-4" />
            <span>Share Code</span>
          </Button>
          <Button onClick={() => setEditDialogOpen(true)} className="gap-1.5">
            <Edit3 className="h-4 w-4" />
            <span>Edit Details</span>
          </Button>
        </div>
      </div>

      {/* 2. Metadata Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground uppercase font-medium">Category</p>
          <p className="text-base font-semibold mt-1">{quiz.category || 'General'}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground uppercase font-medium">Difficulty</p>
          <p className="text-base font-semibold capitalize mt-1">
            {quiz.difficulty || QuizDifficulty.MEDIUM}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground uppercase font-medium">Time Limit</p>
          <p className="text-base font-semibold font-mono mt-1">
            {quiz.timeLimitSec ? formatDuration(quiz.timeLimitSec) : 'Untimed'}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground uppercase font-medium">Source</p>
          <div className="mt-1">
            {quiz.sourceType !== QuizSourceType.MANUAL ? (
              <Badge
                variant="outline"
                className="gap-1 text-primary border-primary/30 bg-primary/10"
              >
                <Sparkles className="h-3 w-3" />
                AI Generated
              </Badge>
            ) : (
              <Badge variant="secondary">Manual</Badge>
            )}
          </div>
        </Card>
      </div>

      {/* 3. Questions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <span>Questions ({quiz.questionCount || quiz.questions?.length || 0})</span>
          </CardTitle>
          <Button onClick={handleOpenAddQuestion} size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" />
            <span>Add Question</span>
          </Button>
        </CardHeader>

        <CardContent className="divide-y p-0">
          {!quiz.questions?.length ? (
            <div className="py-12 text-center text-muted-foreground text-sm space-y-3">
              <p>No questions added yet.</p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenAddQuestion}
                className="gap-1.5"
              >
                <Plus className="h-4 w-4" />
                <span>Add First Question</span>
              </Button>
            </div>
          ) : (
            quiz.questions.map((q, idx) => (
              <div key={q._id || idx} className="p-5 space-y-3">
                {/* Question row */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-2.5">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted font-mono text-xs font-semibold mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="font-semibold text-foreground">{q.content}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="outline" className="capitalize text-xs font-mono">
                      {q.type.replace('_', ' ')}
                    </Badge>
                    <Badge variant="secondary" className="text-xs font-mono">
                      {q.points ?? 1} pt
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenEditQuestion(q)}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenDeleteQuestion(idx)}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Answer options */}
                {q.options && q.options.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-8">
                    {q.options.map((opt, oIdx) => (
                      <div
                        key={opt._id || oIdx}
                        className={`flex items-center gap-2 rounded-lg border p-2.5 text-xs transition-colors ${
                          opt.isCorrect
                            ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-500 font-medium'
                            : 'border-border bg-muted/20 text-muted-foreground'
                        }`}
                      >
                        {opt.isCorrect ? (
                          <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                        ) : (
                          <span className="h-4 w-4 shrink-0 rounded-full border border-muted-foreground/40 text-center font-mono text-[10px] leading-4">
                            {String.fromCharCode(65 + oIdx)}
                          </span>
                        )}
                        <span>{opt.content}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Explanation */}
                {q.explanation && (
                  <p className="text-xs text-muted-foreground italic pl-8">
                    <strong>Explanation:</strong> {q.explanation}
                  </p>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <QuizFormDialog open={editDialogOpen} onOpenChange={setEditDialogOpen} quizToEdit={quiz} />
      <QuizShareDialog quiz={quiz} open={shareDialogOpen} onOpenChange={setShareDialogOpen} />
      <QuestionFormDialog
        open={questionDialogOpen}
        onOpenChange={setQuestionDialogOpen}
        questionToEdit={questionToEdit}
        onSave={handleSaveQuestion}
        isLoading={isUpdating}
      />
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Question</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this question from the quiz?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpdating}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isUpdating}
              onClick={handleDeleteQuestionConfirm}
            >
              {isUpdating ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
