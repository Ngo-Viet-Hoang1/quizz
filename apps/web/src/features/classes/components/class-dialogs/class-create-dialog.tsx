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
import { useCreateClass } from '../../hooks';

const createClassSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Class name is required')
    .max(100, 'Class name must be at most 100 characters'),
});

type CreateClassFormValues = z.infer<typeof createClassSchema>;

interface ClassCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ClassCreateDialog({ open, onOpenChange }: ClassCreateDialogProps) {
  const createClassMutation = useCreateClass();

  const form = useForm<CreateClassFormValues>({
    resolver: zodResolver(createClassSchema),
    defaultValues: {
      name: '',
    },
  });

  const handleClose = () => {
    form.reset({ name: '' });
    onOpenChange(false);
  };

  const onSubmit = async (values: CreateClassFormValues) => {
    try {
      await createClassMutation.mutateAsync({ name: values.name.trim() });
      toast.success('Classroom created successfully');
      handleClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create class';
      toast.error(message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <DialogHeader>
              <DialogTitle>Create Classroom</DialogTitle>
              <DialogDescription>
                Create a new class to manage students, assign assessments, and track progress.
              </DialogDescription>
            </DialogHeader>

            <div className="py-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Class Name *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. Physics 101 - Spring 2026"
                        disabled={createClassMutation.isPending}
                        autoFocus
                        {...field}
                      />
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
                disabled={createClassMutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createClassMutation.isPending}>
                {createClassMutation.isPending ? 'Creating...' : 'Create Class'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
