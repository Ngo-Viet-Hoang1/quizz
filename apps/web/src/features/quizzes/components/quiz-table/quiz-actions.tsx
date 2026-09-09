'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Archive,
  Copy,
  ExternalLink,
  GraduationCap,
  MoreHorizontal,
  Play,
  Share2,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/shared/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
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
import { QuizItem, QuizStatus } from '../../types';
import { useArchiveQuiz, useCloneQuiz, useDeleteQuiz, usePublishQuiz } from '../../hooks';
import { AssignToClassDialog } from '../assign-to-class-dialog';

interface QuizRowActionsProps {
  quiz: QuizItem;
  onShare?: (quiz: QuizItem) => void;
}

export function QuizRowActions({ quiz, onShare }: QuizRowActionsProps) {
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [archiveOpen, setArchiveOpen] = React.useState(false);
  const [assignClassOpen, setAssignClassOpen] = React.useState(false);

  const { mutateAsync: deleteQuiz, isPending: isDeleting } = useDeleteQuiz();
  const { mutateAsync: publishQuiz, isPending: isPublishing } = usePublishQuiz();
  const { mutateAsync: archiveQuiz, isPending: isArchiving } = useArchiveQuiz();
  const { mutateAsync: cloneQuiz, isPending: isCloning } = useCloneQuiz();

  const handleDelete = () => {
    deleteQuiz(quiz._id)
      .then(() => {
        setDeleteOpen(false);
        toast.success('Quiz deleted successfully');
      })
      .catch((error) => {
        console.error('[QuizRowActions] Failed to delete quiz:', error);
      });
  };

  const handleArchive = () => {
    archiveQuiz(quiz._id)
      .then(() => {
        setArchiveOpen(false);
        toast.success('Quiz archived successfully');
      })
      .catch((error) => {
        console.error('[QuizRowActions] Failed to archive quiz:', error);
      });
  };

  const handlePublish = () => {
    publishQuiz(quiz._id)
      .then(() => {
        toast.success('Quiz published successfully');
      })
      .catch((error) => {
        console.error('[QuizRowActions] Failed to publish quiz:', error);
      });
  };

  const handleClone = () => {
    cloneQuiz(quiz._id)
      .then(() => {
        toast.success('Quiz cloned successfully');
      })
      .catch((error) => {
        console.error('[QuizRowActions] Failed to clone quiz:', error);
      });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          }
        />
        <DropdownMenuContent align="end" className="w-52 text-xs">
          <DropdownMenuLabel>Quiz Actions</DropdownMenuLabel>
          <DropdownMenuItem
            render={
              <Link href={`/quizzes/${quiz._id}`} className="flex items-center gap-2">
                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                <span>View Questions ({quiz.questionCount})</span>
              </Link>
            }
          />
          <DropdownMenuItem onClick={() => onShare?.(quiz)} className="flex items-center gap-2">
            <Share2 className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Share Quiz Code</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setAssignClassOpen(true)}
            className="flex items-center gap-2 text-primary font-medium"
          >
            <GraduationCap className="h-3.5 w-3.5" />
            <span>Assign to Classroom</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {quiz.status !== QuizStatus.PUBLISHED && (
            <DropdownMenuItem
              disabled={isPublishing}
              onClick={handlePublish}
              className="flex items-center gap-2 text-emerald-500"
            >
              <Play className="h-3.5 w-3.5" />
              <span>Publish Quiz</span>
            </DropdownMenuItem>
          )}

          {quiz.status === QuizStatus.PUBLISHED && (
            <DropdownMenuItem
              disabled={isArchiving}
              onClick={() => setArchiveOpen(true)}
              className="flex items-center gap-2 text-amber-500"
            >
              <Archive className="h-3.5 w-3.5" />
              <span>Archive Quiz</span>
            </DropdownMenuItem>
          )}

          <DropdownMenuItem
            disabled={isCloning}
            onClick={handleClone}
            className="flex items-center gap-2"
          >
            <Copy className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Clone to New Copy</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={() => setDeleteOpen(true)}
            className="flex items-center gap-2 text-destructive focus:bg-destructive/10"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Delete Quiz</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Quiz</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{quiz.title}</strong>? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
              onClick={handleDelete}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Archive Confirmation Dialog */}
      <AlertDialog open={archiveOpen} onOpenChange={setArchiveOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Quiz</AlertDialogTitle>
            <AlertDialogDescription>
              Archived quizzes will no longer accept new candidate attempts or live examination
              rooms.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isArchiving}>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={isArchiving} onClick={handleArchive}>
              {isArchiving ? 'Archiving...' : 'Archive'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Assign to Classroom Dialog */}
      <AssignToClassDialog quiz={quiz} open={assignClassOpen} onOpenChange={setAssignClassOpen} />
    </>
  );
}
