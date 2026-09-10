'use client';

import * as React from 'react';
import { Archive, CheckCircle2, GraduationCap, Plus } from 'lucide-react';
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
        <div className="space-y-1.5">
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Classes & Groups
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage your classrooms, student enrollment requests, and assessment assignments.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={() => setCreateDialogOpen(true)} className="gap-1.5 shadow-sm">
            <Plus className="h-4 w-4" />
            <span>Create Classroom</span>
          </Button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-border/60 bg-card/60 backdrop-blur-sm shadow-xs">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Total Classes</p>
              <p className="text-2xl font-bold font-mono tracking-tight">{totalCount}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/60 backdrop-blur-sm shadow-xs">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Active Classrooms</p>
              <p className="text-2xl font-bold font-mono tracking-tight text-emerald-500">
                {activeCount}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/60 backdrop-blur-sm shadow-xs">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
              <Archive className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Archived</p>
              <p className="text-2xl font-bold font-mono tracking-tight text-amber-500">
                {archivedCount}
              </p>
            </div>
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
