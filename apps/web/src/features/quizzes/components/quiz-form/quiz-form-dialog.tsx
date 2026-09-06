'use client';

import * as React from 'react';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Textarea } from '@/shared/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { ApiError } from '@repo/shared-types';
import { QuizDifficulty, QuizItem, QuizVisibility } from '../../types';
import { useCreateQuiz, useUpdateQuiz } from '../../hooks';

interface FormErrors {
  title?: string;
  category?: string;
  timeLimitMinutes?: string;
}

interface QuizFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quizToEdit?: QuizItem | null;
}

export function QuizFormDialog({ open, onOpenChange, quizToEdit }: QuizFormDialogProps) {
  const isEditing = Boolean(quizToEdit);
  const { mutateAsync: createQuiz, isPending: isCreating } = useCreateQuiz();
  const { mutateAsync: updateQuiz, isPending: isUpdating } = useUpdateQuiz();
  const isSubmitting = isCreating || isUpdating;

  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [category, setCategory] = React.useState('General');
  const [difficulty, setDifficulty] = React.useState<QuizDifficulty>(QuizDifficulty.MEDIUM);
  const [visibility, setVisibility] = React.useState<QuizVisibility>(QuizVisibility.ORGANIZATION);
  const [timeLimitMinutes, setTimeLimitMinutes] = React.useState(30);
  const [errors, setErrors] = React.useState<FormErrors>({});

  // Sync state when dialog opens or quizToEdit changes
  React.useEffect(() => {
    if (quizToEdit) {
      setTitle(quizToEdit.title);
      setDescription(quizToEdit.description || '');
      setCategory(quizToEdit.category || 'General');
      setDifficulty(quizToEdit.difficulty || QuizDifficulty.MEDIUM);
      setVisibility(quizToEdit.visibility || QuizVisibility.ORGANIZATION);
      setTimeLimitMinutes(quizToEdit.timeLimitSec ? Math.round(quizToEdit.timeLimitSec / 60) : 30);
    } else {
      setTitle('');
      setDescription('');
      setCategory('General');
      setDifficulty(QuizDifficulty.MEDIUM);
      setVisibility(QuizVisibility.ORGANIZATION);
      setTimeLimitMinutes(30);
    }
    setErrors({});
  }, [quizToEdit, open]);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!title.trim() || title.trim().length < 3) {
      newErrors.title = 'Title must be at least 3 characters';
    }
    if (!category.trim() || category.trim().length < 2) {
      newErrors.category = 'Category is required';
    }
    const limit = Number(timeLimitMinutes);
    if (!limit || limit < 1 || limit > 300) {
      newErrors.timeLimitMinutes = 'Time limit must be between 1 and 300 minutes';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      title: title.trim(),
      description: description.trim() || undefined,
      category: category.trim(),
      difficulty,
      visibility,
      timeLimitSec: Number(timeLimitMinutes) * 60,
    };

    const action =
      isEditing && quizToEdit
        ? updateQuiz({ id: quizToEdit._id, data: payload })
        : createQuiz(payload);

    action
      .then(() => {
        onOpenChange(false);
      })
      .catch((err: unknown) => {
        // Map API validation field errors back into form state
        if (err instanceof ApiError && err.isValidationError) {
          const fieldErrors = err.toFieldErrors();
          setErrors((prev) => ({
            ...prev,
            ...(fieldErrors.title && { title: fieldErrors.title }),
            ...(fieldErrors.category && { category: fieldErrors.category }),
            ...(fieldErrors.timeLimitMinutes && {
              timeLimitMinutes: fieldErrors.timeLimitMinutes,
            }),
          }));
        }
      });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Quiz Information' : 'Create New Quiz'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the basic details for this assessment.'
              : 'Add a new quiz to your organization bank. You can add questions later.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="quiz-title">Title *</Label>
            <Input
              id="quiz-title"
              placeholder="e.g. TypeScript Advanced Exam"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="quiz-desc">Description</Label>
            <Textarea
              id="quiz-desc"
              rows={3}
              placeholder="Brief overview of the quiz topics and objectives..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Category & Difficulty */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="quiz-category">Category *</Label>
              <Input
                id="quiz-category"
                placeholder="e.g. Frontend, DevOps"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
              {errors.category && <p className="text-xs text-destructive">{errors.category}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="quiz-difficulty">Difficulty</Label>
              <Select
                value={difficulty}
                onValueChange={(val) => setDifficulty(val as QuizDifficulty)}
              >
                <SelectTrigger id="quiz-difficulty" className="w-full">
                  <SelectValue placeholder="Select difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={QuizDifficulty.EASY}>Easy</SelectItem>
                  <SelectItem value={QuizDifficulty.MEDIUM}>Medium</SelectItem>
                  <SelectItem value={QuizDifficulty.HARD}>Hard</SelectItem>
                  <SelectItem value={QuizDifficulty.MIXED}>Mixed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Time Limit & Visibility */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="quiz-time">Time Limit (Minutes) *</Label>
              <Input
                id="quiz-time"
                type="number"
                min={1}
                max={300}
                value={timeLimitMinutes}
                onChange={(e) => setTimeLimitMinutes(Number(e.target.value) || 1)}
              />
              {errors.timeLimitMinutes && (
                <p className="text-xs text-destructive">{errors.timeLimitMinutes}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="quiz-visibility">Visibility</Label>
              <Select
                value={visibility}
                onValueChange={(val) => setVisibility(val as QuizVisibility)}
              >
                <SelectTrigger id="quiz-visibility" className="w-full">
                  <SelectValue placeholder="Select visibility" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={QuizVisibility.ORGANIZATION}>
                    Organization (Default)
                  </SelectItem>
                  <SelectItem value={QuizVisibility.PUBLIC}>Public</SelectItem>
                  <SelectItem value={QuizVisibility.PRIVATE}>Private (Draft only)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="gap-1.5">
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>{isEditing ? 'Save Changes' : 'Create Quiz'}</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
