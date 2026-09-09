'use client';

import * as React from 'react';
import { BookOpen, Info, Users } from 'lucide-react';
import { Badge } from '@/shared/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { useClass, useClassAssignments, useClassMembers } from '../../hooks';
import { ClassItem, ClassMemberStatus } from '../../types';
import { ClassArchiveDialog } from '../class-dialogs/class-archive-dialog';
import { ClassEditDialog } from '../class-dialogs/class-edit-dialog';
import { AddMemberDialog } from '../class-dialogs/add-member-dialog';
import { AssignQuizDialog } from '../class-dialogs/assign-quiz-dialog';
import { ClassAssignmentsTab } from './assignments-tab/class-assignments-tab';
import { ClassDetailHeader } from './class-detail-header';
import { ClassDetailOverview } from './class-detail-overview';
import { ClassMembersTab } from './members-tab/class-members-tab';

interface ClassDetailViewProps {
  classId: string;
  initialData?: ClassItem;
}

export function ClassDetailView({ classId, initialData }: ClassDetailViewProps) {
  const [activeTab, setActiveTab] = React.useState('members');
  const [editOpen, setEditOpen] = React.useState(false);
  const [archiveOpen, setArchiveOpen] = React.useState(false);
  const [addMemberOpen, setAddMemberOpen] = React.useState(false);
  const [assignQuizOpen, setAssignQuizOpen] = React.useState(false);

  const { data: classItem, isLoading: isLoadingClass } = useClass(classId, initialData);
  const { data: members = [], isLoading: isLoadingMembers } = useClassMembers(classId);
  const { data: assignments = [], isLoading: isLoadingAssignments } = useClassAssignments(classId);

  const pendingCount = members.filter((m) => m.status === ClassMemberStatus.PENDING).length;

  if (isLoadingClass && !classItem) {
    return (
      <div className="space-y-6">
        <div className="h-24 w-full animate-pulse rounded-lg bg-muted/60" />
        <div className="h-64 w-full animate-pulse rounded-lg bg-muted/60" />
      </div>
    );
  }

  if (!classItem) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h2 className="text-xl font-bold">Classroom not found</h2>
        <p className="text-sm text-muted-foreground mt-1">
          The requested class might have been deleted or does not exist.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <ClassDetailHeader
        classItem={classItem}
        onEdit={() => setEditOpen(true)}
        onArchive={() => setArchiveOpen(true)}
        onAddMember={() => setAddMemberOpen(true)}
        onAssignQuiz={() => setAssignQuizOpen(true)}
      />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 sm:w-105">
          <TabsTrigger value="members" className="gap-1.5 text-xs">
            <Users className="h-3.5 w-3.5" />
            <span>Members</span>
            {pendingCount > 0 && (
              <Badge
                variant="destructive"
                className="ml-1 text-xs px-1.5 py-0 font-mono bg-amber-500 hover:bg-amber-500 text-white"
              >
                {pendingCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="assignments" className="gap-1.5 text-xs">
            <BookOpen className="h-3.5 w-3.5" />
            <span>Assessments</span>
            {assignments.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs px-1.5 py-0 font-mono">
                {assignments.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="overview" className="gap-1.5 text-xs">
            <Info className="h-3.5 w-3.5" />
            <span>Overview</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="members">
          <ClassMembersTab
            classItem={classItem}
            members={members}
            isLoading={isLoadingMembers}
            onAddMember={() => setAddMemberOpen(true)}
          />
        </TabsContent>

        <TabsContent value="assignments">
          <ClassAssignmentsTab
            classItem={classItem}
            assignments={assignments}
            isLoading={isLoadingAssignments}
            onAssignQuiz={() => setAssignQuizOpen(true)}
          />
        </TabsContent>

        <TabsContent value="overview">
          <ClassDetailOverview classItem={classItem} members={members} assignments={assignments} />
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <ClassEditDialog classItem={classItem} open={editOpen} onOpenChange={setEditOpen} />
      <ClassArchiveDialog classItem={classItem} open={archiveOpen} onOpenChange={setArchiveOpen} />
      <AddMemberDialog classId={classId} open={addMemberOpen} onOpenChange={setAddMemberOpen} />
      <AssignQuizDialog classId={classId} open={assignQuizOpen} onOpenChange={setAssignQuizOpen} />
    </div>
  );
}
