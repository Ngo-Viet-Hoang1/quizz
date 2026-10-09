'use client';

import * as React from 'react';
import { Plus, Sparkles } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { AiGenerationDialog } from '@/features/ai-generation';
import { QuizItem } from '../types';
import { QuizTable } from './quiz-table/quiz-table';
import { QuizFormDialog } from './quiz-form/quiz-form-dialog';
import { QuizShareDialog } from './quiz-share-dialog';

export function QuizListView() {
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
  const [aiDialogOpen, setAiDialogOpen] = React.useState(false);
  const [shareDialogOpen, setShareDialogOpen] = React.useState(false);
  const [selectedQuizForShare, setSelectedQuizForShare] = React.useState<QuizItem | null>(null);

  const handleShareQuiz = (quiz: QuizItem) => {
    setSelectedQuizForShare(quiz);
    setShareDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-border pb-5 pt-1 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Quiz Bank
          </h1>
          <p className="text-sm text-muted-foreground">
            Create, organize, and monitor assessments and examinations across your organization.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setAiDialogOpen(true)}
            className="gap-1.5 border-primary/30 hover:border-primary/60 hover:bg-primary/5"
          >
            <Sparkles className="h-4 w-4 text-primary animate-pulse" />
            <span>AI Generate</span>
          </Button>
          <Button onClick={() => setCreateDialogOpen(true)} className="gap-1.5">
            <Plus className="h-4 w-4" />
            <span>Create Quiz</span>
          </Button>
        </div>
      </div>

      {/* DataTable */}
      <QuizTable onShareQuiz={handleShareQuiz} />

      {/* Dialogs */}
      <AiGenerationDialog open={aiDialogOpen} onOpenChange={setAiDialogOpen} />
      <QuizFormDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
      <QuizShareDialog
        quiz={selectedQuizForShare}
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
      />
    </div>
  );
}
