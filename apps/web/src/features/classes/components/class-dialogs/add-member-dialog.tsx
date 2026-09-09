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
import { useAddClassMember } from '../../hooks';
import { ClassMemberRole } from '../../types';

interface AddMemberDialogProps {
  classId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddMemberDialog({ classId, open, onOpenChange }: AddMemberDialogProps) {
  const [userId, setUserId] = React.useState('');
  const [role, setRole] = React.useState<ClassMemberRole>(ClassMemberRole.STUDENT);
  const [error, setError] = React.useState<string | null>(null);

  const addMemberMutation = useAddClassMember();

  const handleClose = () => {
    setUserId('');
    setRole(ClassMemberRole.STUDENT);
    setError(null);
    onOpenChange(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedId = userId.trim();

    if (!trimmedId) {
      setError('User ID is required');
      return;
    }

    try {
      await addMemberMutation.mutateAsync({
        classId,
        data: {
          userId: trimmedId,
          role,
        },
      });
      toast.success('Member added to class successfully');
      handleClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to add member';
      toast.error(message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add Member to Class</DialogTitle>
            <DialogDescription>
              Directly enroll a student or teaching assistant into this classroom.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="member-user-id">User ID *</Label>
              <Input
                id="member-user-id"
                placeholder="e.g. user_2xyz..."
                value={userId}
                onChange={(e) => {
                  setUserId(e.target.value);
                  if (error) setError(null);
                }}
                disabled={addMemberMutation.isPending}
                autoFocus
              />
              {error && <p className="text-xs text-destructive">{error}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="member-role">Class Role</Label>
              <Select
                value={role}
                onValueChange={(val) => val && setRole(val as ClassMemberRole)}
                disabled={addMemberMutation.isPending}
              >
                <SelectTrigger id="member-role">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ClassMemberRole.STUDENT}>Student</SelectItem>
                  <SelectItem value={ClassMemberRole.ASSISTANT}>Assistant</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={addMemberMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={addMemberMutation.isPending}>
              {addMemberMutation.isPending ? 'Adding...' : 'Add Member'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
