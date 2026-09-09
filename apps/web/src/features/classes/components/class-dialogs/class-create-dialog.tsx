'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { Button } from '@/shared/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { useCreateClass } from '../../hooks';

interface ClassCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ClassCreateDialog({ open, onOpenChange }: ClassCreateDialogProps) {
  const [name, setName] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);

  const createClassMutation = useCreateClass();

  const handleClose = () => {
    setName('');
    setError(null);
    onOpenChange(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();

    if (!trimmedName) {
      setError('Class name is required');
      return;
    }
    if (trimmedName.length > 100) {
      setError('Class name must be at most 100 characters');
      return;
    }

    try {
      await createClassMutation.mutateAsync({ name: trimmedName });
      toast.success('Class created successfully');
      handleClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create class';
      toast.error(message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Classroom</DialogTitle>
            <DialogDescription>
              Create a new class to manage students, assign assessments, and track results.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="class-name">Class Name *</Label>
              <Input
                id="class-name"
                placeholder="e.g. Physics 101 - Spring 2026"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (error) setError(null);
                }}
                disabled={createClassMutation.isPending}
                autoFocus
              />
              {error && <p className="text-xs text-destructive">{error}</p>}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={createClassMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createClassMutation.isPending}>
              {createClassMutation.isPending ? 'Creating...' : 'Create Class'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
