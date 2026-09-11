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
import { Input } from '@/shared/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { useUpdateClass } from '../../hooks';
import { ClassItem, ClassStatus } from '../../types';

const editClassSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Class name is required')
    .max(100, 'Class name must be at most 100 characters'),
  status: z.nativeEnum(ClassStatus),
});

type EditClassFormValues = z.infer<typeof editClassSchema>;

interface ClassEditDialogProps {
  classItem: ClassItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ClassEditDialog({ classItem, open, onOpenChange }: ClassEditDialogProps) {
  const updateClassMutation = useUpdateClass();

  const form = useForm<EditClassFormValues>({
    resolver: zodResolver(editClassSchema),
    defaultValues: {
      name: '',
      status: ClassStatus.ACTIVE,
    },
  });

  React.useEffect(() => {
    if (classItem) {
      form.reset({
        name: classItem.name || '',
        status: classItem.status || ClassStatus.ACTIVE,
      });
    }
  }, [classItem, form]);

  const handleClose = () => {
    onOpenChange(false);
  };

  const onSubmit = async (values: EditClassFormValues) => {
    if (!classItem) return;
    const classId = classItem.id || classItem._id;
    if (!classId) return;

    try {
      await updateClassMutation.mutateAsync({
        id: classId,
        data: {
          name: values.name.trim(),
          status: values.status,
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
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <DialogHeader>
              <DialogTitle>Edit Classroom</DialogTitle>
              <DialogDescription>Update classroom name and status details.</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Class Name *</FormLabel>
                    <FormControl>
                      <Input disabled={updateClassMutation.isPending} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={(val) => val && field.onChange(val as ClassStatus)}
                        disabled={updateClassMutation.isPending}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={ClassStatus.ACTIVE}>Active</SelectItem>
                          <SelectItem value={ClassStatus.ARCHIVED}>Archived</SelectItem>
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
                disabled={updateClassMutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updateClassMutation.isPending}>
                {updateClassMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
