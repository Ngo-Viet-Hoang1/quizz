'use client';

import * as React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Card, CardContent } from '@/shared/ui/card';
import { useClasses } from '../hooks';
import { ClassItem, ClassStatus } from '../types';
import { ClassArchiveDialog } from './class-dialogs/class-archive-dialog';
import { ClassCreateDialog } from './class-dialogs/class-create-dialog';
import { ClassEditDialog } from './class-dialogs/class-edit-dialog';
import { ClassTable } from './class-table/class-table';

export function ClassesListView() {
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [archiveDialogOpen, setArchiveDialogOpen] = React.useState(false);
  const [selectedClass, setSelectedClass] = React.useState<ClassItem | null>(null);

  // Fetch classes overview for metrics
  const { data: allClasses = [] } = useClasses({ page: 1, limit: 100 });

  const totalCount = allClasses.length;
  const activeCount = allClasses.filter((c) => c.status === ClassStatus.ACTIVE).length;
  const archivedCount = allClasses.filter((c) => c.status === ClassStatus.ARCHIVED).length;

  const handleEdit = (item: ClassItem) => {
    setSelectedClass(item);
    setEditDialogOpen(true);
  };

  const handleArchive = (item: ClassItem) => {
    setSelectedClass(item);
    setArchiveDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-border pb-5 pt-1 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Classes & Groups
          </h1>
          <p className="text-xs text-muted-foreground">
            Manage classrooms, student enrollments, and quiz assignments.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => setCreateDialogOpen(true)}
            className="gap-1.5 h-8 text-xs shadow-2xs"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Create Classroom</span>
          </Button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="border-border/60 bg-card/60 shadow-2xs">
          <CardContent className="p-4 space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Total Classes
            </p>
            <p className="text-2xl font-bold font-mono tracking-tight text-foreground">
              {totalCount}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/60 shadow-2xs">
          <CardContent className="p-4 space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Active Classrooms
            </p>
            <p className="text-2xl font-bold font-mono tracking-tight text-foreground">
              {activeCount}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/60 shadow-2xs">
          <CardContent className="p-4 space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Archived
            </p>
            <p className="text-2xl font-bold font-mono tracking-tight text-muted-foreground">
              {archivedCount}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Class Table */}
      <ClassTable onEdit={handleEdit} onArchive={handleArchive} />

      {/* Dialogs */}
      <ClassCreateDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
      <ClassEditDialog
        classItem={selectedClass}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
      />
      <ClassArchiveDialog
        classItem={selectedClass}
        open={archiveDialogOpen}
        onOpenChange={setArchiveDialogOpen}
      />
    </div>
  );
}
