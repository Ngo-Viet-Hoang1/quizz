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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { useUpdateClass } from '../../hooks';
import { ClassItem, ClassStatus } from '../../types';

interface ClassEditDialogProps {
  classItem: ClassItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ClassEditDialog({ classItem, open, onOpenChange }: ClassEditDialogProps) {
  const [name, setName] = React.useState('');
  const [status, setStatus] = React.useState<ClassStatus>(ClassStatus.ACTIVE);
  const [error, setError] = React.useState<string | null>(null);

  const updateClassMutation = useUpdateClass();

  React.useEffect(() => {
    if (classItem) {
      setName(classItem.name || '');
      setStatus(classItem.status || ClassStatus.ACTIVE);
      setError(null);
    }
  }, [classItem]);

  const handleClose = () => {
    setError(null);
    onOpenChange(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classItem) return;

    const classId = classItem.id || classItem._id;
    if (!classId) return;

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
      await updateClassMutation.mutateAsync({
        id: classId,
        data: {
          name: trimmedName,
          status,
        },
      });
      toast.success('Class updated successfully');
      handleClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update class';
      toast.error(message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Classroom</DialogTitle>
            <DialogDescription>Update classroom name and status details.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-class-name">Class Name *</Label>
              <Input
                id="edit-class-name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (error) setError(null);
                }}
                disabled={updateClassMutation.isPending}
              />
              {error && <p className="text-xs text-destructive">{error}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-class-status">Status</Label>
              <Select
                value={status}
                onValueChange={(val) => setStatus(val as ClassStatus)}
                disabled={updateClassMutation.isPending}
              >
                <SelectTrigger id="edit-class-status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ClassStatus.ACTIVE}>Active</SelectItem>
                  <SelectItem value={ClassStatus.ARCHIVED}>Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={updateClassMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={updateClassMutation.isPending}>
              {updateClassMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
