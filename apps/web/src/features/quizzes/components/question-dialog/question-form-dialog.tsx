'use client';

import * as React from 'react';
import { Plus, Trash2, CheckCircle2, Circle, Loader2 } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Textarea } from '@/shared/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { toast } from 'sonner';
import { QuestionDifficulty, QuestionItem, QuestionOption, QuestionType } from '../../types';

interface QuestionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  questionToEdit?: QuestionItem | null;
  onSave: (question: QuestionItem) => Promise<void>;
  isLoading?: boolean;
}

const defaultOptions: QuestionOption[] = [
  { content: '', isCorrect: true, orderIndex: 0 },
  { content: '', isCorrect: false, orderIndex: 1 },
  { content: '', isCorrect: false, orderIndex: 2 },
  { content: '', isCorrect: false, orderIndex: 3 },
];

export function QuestionFormDialog({
  open,
  onOpenChange,
  questionToEdit,
  onSave,
  isLoading = false,
}: QuestionFormDialogProps) {
  const isEditing = Boolean(questionToEdit);

  const [type, setType] = React.useState<QuestionType>(QuestionType.SINGLE_CHOICE);
  const [content, setContent] = React.useState('');
  const [difficulty, setDifficulty] = React.useState<QuestionDifficulty>(QuestionDifficulty.MEDIUM);
  const [points, setPoints] = React.useState(1);
  const [explanation, setExplanation] = React.useState('');
  const [options, setOptions] = React.useState<QuestionOption[]>(defaultOptions);
  const [correctText, setCorrectText] = React.useState('');

  React.useEffect(() => {
    if (questionToEdit) {
      setType(questionToEdit.type || QuestionType.SINGLE_CHOICE);
      setContent(questionToEdit.content || '');
      setDifficulty(questionToEdit.difficulty || QuestionDifficulty.MEDIUM);
      setPoints(questionToEdit.points ?? 1);
      setExplanation(questionToEdit.explanation || '');
      setOptions(
        questionToEdit.options && questionToEdit.options.length > 0
          ? questionToEdit.options
          : defaultOptions,
      );
      setCorrectText(questionToEdit.metadata?.correctText || '');
    } else {
      setType(QuestionType.SINGLE_CHOICE);
      setContent('');
      setDifficulty(QuestionDifficulty.MEDIUM);
      setPoints(1);
      setExplanation('');
      setOptions([
        { content: '', isCorrect: true, orderIndex: 0 },
        { content: '', isCorrect: false, orderIndex: 1 },
        { content: '', isCorrect: false, orderIndex: 2 },
        { content: '', isCorrect: false, orderIndex: 3 },
      ]);
      setCorrectText('');
    }
  }, [questionToEdit, open]);

  // Handle Type Change
  const handleTypeChange = (newType: QuestionType) => {
    setType(newType);
    if (newType === QuestionType.TRUE_FALSE) {
      setOptions([
        { content: 'True', isCorrect: true, orderIndex: 0 },
        { content: 'False', isCorrect: false, orderIndex: 1 },
      ]);
    } else if (newType === QuestionType.SINGLE_CHOICE || newType === QuestionType.MULTIPLE_CHOICE) {
      if (options.length < 2) {
        setOptions([
          { content: '', isCorrect: true, orderIndex: 0 },
          { content: '', isCorrect: false, orderIndex: 1 },
        ]);
      }
    }
  };

  // Option modifications
  const handleOptionContentChange = (index: number, val: string) => {
    setOptions((prev) => prev.map((opt, idx) => (idx === index ? { ...opt, content: val } : opt)));
  };

  const handleToggleCorrect = (index: number) => {
    if (type === QuestionType.SINGLE_CHOICE || type === QuestionType.TRUE_FALSE) {
      setOptions((prev) => prev.map((opt, idx) => ({ ...opt, isCorrect: idx === index })));
    } else {
      setOptions((prev) =>
        prev.map((opt, idx) => (idx === index ? { ...opt, isCorrect: !opt.isCorrect } : opt)),
      );
    }
  };

  const handleAddOption = () => {
    if (options.length >= 6) {
      toast.warning('Maximum 6 options allowed');
      return;
    }
    setOptions((prev) => [...prev, { content: '', isCorrect: false, orderIndex: prev.length }]);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length <= 2) {
      toast.warning('A question must have at least 2 options');
      return;
    }
    setOptions((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) {
      toast.error('Question content is required');
      return;
    }

    if (type === QuestionType.FILL_BLANK) {
      if (!correctText.trim()) {
        toast.error('Correct text answer is required for Fill-in-Blank');
        return;
      }
    } else {
      const hasEmptyOption = options.some((opt) => !opt.content.trim());
      if (hasEmptyOption) {
        toast.error('All options must have content');
        return;
      }

      const hasCorrect = options.some((opt) => opt.isCorrect);
      if (!hasCorrect) {
        toast.error('Please mark at least one correct option');
        return;
      }
    }

    const payload: QuestionItem = {
      ...(questionToEdit?._id && { _id: questionToEdit._id }),
      type,
      content: content.trim(),
      difficulty,
      points,
      explanation: explanation.trim() || undefined,
      ...(type !== QuestionType.FILL_BLANK && {
        options: options.map((opt, idx) => ({
          ...opt,
          content: opt.content.trim(),
          orderIndex: idx,
        })),
      }),
      ...(type === QuestionType.FILL_BLANK && {
        metadata: { correctText: correctText.trim() },
      }),
    };

    void onSave(payload);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Question' : 'Add New Question'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the question prompt, answer choices, and scoring.'
              : 'Add a new question with choices and mark the correct answer(s).'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Question Type & Difficulty */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Question Type</Label>
              <Select value={type} onValueChange={(val) => handleTypeChange(val as QuestionType)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={QuestionType.SINGLE_CHOICE}>Single Choice</SelectItem>
                  <SelectItem value={QuestionType.MULTIPLE_CHOICE}>Multiple Choice</SelectItem>
                  <SelectItem value={QuestionType.TRUE_FALSE}>True / False</SelectItem>
                  <SelectItem value={QuestionType.FILL_BLANK}>Fill in the Blank</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Points</Label>
              <Input
                type="number"
                min={1}
                max={100}
                value={points}
                onChange={(e) => setPoints(Number(e.target.value) || 1)}
              />
            </div>
          </div>

          {/* Question Content */}
          <div className="space-y-1.5">
            <Label htmlFor="q-content">Question</Label>
            <Textarea
              id="q-content"
              rows={3}
              placeholder="e.g. What is the output of typeof NaN in JavaScript?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
            />
          </div>

          {/* Answer Options for Choice / True-False */}
          {type !== QuestionType.FILL_BLANK ? (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Answer Options (Click icon to mark correct)
                </Label>
                {type !== QuestionType.TRUE_FALSE && options.length < 6 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleAddOption}
                    className="h-7 text-xs gap-1 text-primary"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add Option</span>
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                {options.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleCorrect(idx)}
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-colors ${
                        opt.isCorrect
                          ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-500'
                          : 'border-border bg-muted/40 text-muted-foreground hover:text-foreground'
                      }`}
                      title={opt.isCorrect ? 'Correct option' : 'Click to mark correct'}
                    >
                      {opt.isCorrect ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                      ) : (
                        <Circle className="h-5 w-5" />
                      )}
                    </button>

                    <div className="relative flex-1">
                      <span className="absolute left-3 top-2.5 font-mono text-xs font-semibold text-muted-foreground">
                        {String.fromCharCode(65 + idx)}.
                      </span>
                      <Input
                        value={opt.content}
                        onChange={(e) => handleOptionContentChange(idx, e.target.value)}
                        placeholder={`Option ${String.fromCharCode(65 + idx)} content`}
                        className="pl-8 text-sm"
                        disabled={type === QuestionType.TRUE_FALSE}
                        required
                      />
                    </div>

                    {type !== QuestionType.TRUE_FALSE && options.length > 2 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveOption(idx)}
                        className="h-9 w-9 p-0 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Fill in the Blank Input */
            <div className="space-y-1.5">
              <Label htmlFor="q-correct-text">Correct Answer Text *</Label>
              <Input
                id="q-correct-text"
                placeholder="Exact text expected as correct answer"
                value={correctText}
                onChange={(e) => setCorrectText(e.target.value)}
                required
              />
            </div>
          )}

          {/* Explanation */}
          <div className="space-y-1.5">
            <Label htmlFor="q-explanation">Explanation (Optional)</Label>
            <Textarea
              id="q-explanation"
              rows={2}
              placeholder="Explain why the correct answer is right. Shown during review."
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="gap-1.5">
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>{isEditing ? 'Save Question' : 'Add Question'}</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
