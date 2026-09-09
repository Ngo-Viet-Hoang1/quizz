'use client';

import * as React from 'react';
import { toast } from 'sonner';
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
import { useArchiveClass } from '../../hooks';
import { ClassItem } from '../../types';

interface ClassArchiveDialogProps {
  classItem: ClassItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ClassArchiveDialog({ classItem, open, onOpenChange }: ClassArchiveDialogProps) {
  const archiveClassMutation = useArchiveClass();

  const handleArchive = async () => {
    if (!classItem) return;
    const classId = classItem.id || classItem._id;
    if (!classId) return;

    try {
      await archiveClassMutation.mutateAsync(classId);
      toast.success(`Class "${classItem.name}" has been archived.`);
      onOpenChange(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to archive class';
      toast.error(message);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Archive Classroom</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to archive <strong>{classItem?.name}</strong>? Archived classes
            cannot accept new members or new quiz assignments.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={archiveClassMutation.isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleArchive}
            disabled={archiveClassMutation.isPending}
            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
          >
            {archiveClassMutation.isPending ? 'Archiving...' : 'Archive Class'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
