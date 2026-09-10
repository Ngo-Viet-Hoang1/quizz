'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { OrgMemberPicker } from '@/shared/components/org-member-picker';
import { useAddClassMember, useClass, useClassMembers } from '../../hooks';
import { ClassMemberRole } from '../../types';

const addMemberSchema = z.object({
  userId: z.string().min(1, 'Please select a member to enroll'),
  role: z.nativeEnum(ClassMemberRole),
});

type AddMemberFormValues = z.infer<typeof addMemberSchema>;

interface AddMemberDialogProps {
  classId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddMemberDialog({ classId, open, onOpenChange }: AddMemberDialogProps) {
  const addMemberMutation = useAddClassMember();
  const { data: classItem } = useClass(classId);
  const { data: existingMembers = [] } = useClassMembers(classId);

  const excludeUserIds = React.useMemo(() => {
    const ids = existingMembers.map((m) => m.userId);
    if (classItem?.ownerId && !ids.includes(classItem.ownerId)) {
      ids.push(classItem.ownerId);
    }
    return ids;
  }, [existingMembers, classItem?.ownerId]);

  const form = useForm<AddMemberFormValues>({
    resolver: zodResolver(addMemberSchema),
    defaultValues: {
      userId: '',
      role: ClassMemberRole.STUDENT,
    },
  });

  const handleClose = () => {
    form.reset({
      userId: '',
      role: ClassMemberRole.STUDENT,
    });
    onOpenChange(false);
  };

  const onSubmit = async (values: AddMemberFormValues) => {
    try {
      await addMemberMutation.mutateAsync({
        classId,
        data: {
          userId: values.userId,
          role: values.role,
        },
      });
      toast.success('Member added to classroom successfully');
      handleClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to add member';
      toast.error(message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <DialogHeader>
              <DialogTitle>Add Member to Class</DialogTitle>
              <DialogDescription>
                Select a member from your organization to enroll into this classroom.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <FormField
                control={form.control}
                name="userId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select Member *</FormLabel>
                    <FormControl>
                      <OrgMemberPicker
                        value={field.value}
                        onChange={field.onChange}
                        excludeUserIds={excludeUserIds}
                        disabled={addMemberMutation.isPending}
                        placeholder="Search & choose a member..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Class Role</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={(val) => val && field.onChange(val as ClassMemberRole)}
                        disabled={addMemberMutation.isPending}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={ClassMemberRole.STUDENT}>Student</SelectItem>
                          <SelectItem value={ClassMemberRole.ASSISTANT}>Assistant</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
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
        </Form>
      </DialogContent>
    </Dialog>
  );
}
