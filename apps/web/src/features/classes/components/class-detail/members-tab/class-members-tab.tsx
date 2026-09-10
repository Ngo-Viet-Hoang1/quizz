'use client';

import * as React from 'react';
import { createColumnHelper } from '@tanstack/react-table';
import { Check, Plus, Shield, Trash2, UserCheck, Users, X } from 'lucide-react';
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
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardContent } from '@/shared/ui/card';
import {
  DataTable,
  DataTableColumnHeader,
  FilterOption,
  type DataTableFeatures,
} from '@/shared/components/data-table';
import { useDebounce } from '@/shared/hooks';
import { formatDate, formatDateTime } from '@/shared/lib/date';
import { useApproveClassMember, useRejectClassMember, useRemoveClassMember } from '../../../hooks';
import {
  ClassItem,
  ClassMemberItem,
  ClassMemberRole,
  ClassMemberStatus,
  ClassStatus,
} from '../../../types';

const memberColumnHelper = createColumnHelper<DataTableFeatures, ClassMemberItem>();

const roleFilterOptions: FilterOption[] = [
  { label: 'All Roles', value: 'ALL' },
  { label: 'Students', value: ClassMemberRole.STUDENT },
  { label: 'Assistants', value: ClassMemberRole.ASSISTANT },
];

interface ClassMembersTabProps {
  classItem: ClassItem;
  members: ClassMemberItem[];
  isLoading?: boolean;
  onAddMember: () => void;
}

export function ClassMembersTab({
  classItem,
  members,
  isLoading = false,
  onAddMember,
}: ClassMembersTabProps) {
  const [subTab, setSubTab] = React.useState<'active' | 'pending'>('active');
  const [activeSearch, setActiveSearch] = React.useState('');
  const debouncedActiveSearch = useDebounce(activeSearch, 300);
  const [activeRoleFilter, setActiveRoleFilter] = React.useState<string>('ALL');

  const [pendingSearch, setPendingSearch] = React.useState('');
  const debouncedPendingSearch = useDebounce(pendingSearch, 300);

  const [memberToRemove, setMemberToRemove] = React.useState<ClassMemberItem | null>(null);

  const classId = classItem.id || classItem._id || '';
  const isArchived = classItem.status === ClassStatus.ARCHIVED;

  const approveMutation = useApproveClassMember();
  const rejectMutation = useRejectClassMember();
  const removeMutation = useRemoveClassMember();

  const activeMembers = React.useMemo(
    () => members.filter((m) => m.status === ClassMemberStatus.ACTIVE),
    [members],
  );

  const pendingMembers = React.useMemo(
    () => members.filter((m) => m.status === ClassMemberStatus.PENDING),
    [members],
  );

  const filteredActiveMembers = React.useMemo(() => {
    return activeMembers.filter((m) => {
      const matchRole = activeRoleFilter === 'ALL' || m.role === activeRoleFilter;
      const matchSearch =
        !debouncedActiveSearch.trim() ||
        m.userId.toLowerCase().includes(debouncedActiveSearch.trim().toLowerCase());
      return matchRole && matchSearch;
    });
  }, [activeMembers, activeRoleFilter, debouncedActiveSearch]);

  const filteredPendingMembers = React.useMemo(() => {
    return pendingMembers.filter((m) => {
      if (!debouncedPendingSearch.trim()) return true;
      return m.userId.toLowerCase().includes(debouncedPendingSearch.trim().toLowerCase());
    });
  }, [pendingMembers, debouncedPendingSearch]);

  const handleApprove = async (userId: string) => {
    try {
      await approveMutation.mutateAsync({ classId, userId });
      toast.success('Member approved and enrolled successfully');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to approve member';
      toast.error(message);
    }
  };

  const handleReject = async (userId: string) => {
    try {
      await rejectMutation.mutateAsync({ classId, userId });
      toast.success('Member request rejected');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to reject member';
      toast.error(message);
    }
  };

  const handleConfirmRemove = async () => {
    if (!memberToRemove) return;
    try {
      await removeMutation.mutateAsync({ classId, userId: memberToRemove.userId });
      toast.success('Member removed from classroom');
      setMemberToRemove(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to remove member';
      toast.error(message);
    }
  };

  // Active members columns definition using DataTable column helper
  const activeColumns = React.useMemo(
    () =>
      memberColumnHelper.columns([
        memberColumnHelper.accessor('userId', {
          header: ({ column }) => <DataTableColumnHeader column={column} title="MEMBER USER ID" />,
          cell: ({ row }) => (
            <span className="font-mono text-xs font-semibold text-foreground">
              {row.getValue('userId')}
            </span>
          ),
        }),
        memberColumnHelper.accessor('role', {
          header: ({ column }) => <DataTableColumnHeader column={column} title="ROLE" />,
          cell: ({ row }) => {
            const role = row.getValue('role') as ClassMemberRole;
            return (
              <Badge variant="secondary" className="font-mono text-xs capitalize gap-1">
                {role === ClassMemberRole.ASSISTANT && <Shield className="h-3 w-3 text-primary" />}
                {role}
              </Badge>
            );
          },
        }),
        memberColumnHelper.accessor('joinedAt', {
          header: ({ column }) => <DataTableColumnHeader column={column} title="ENROLLED DATE" />,
          cell: ({ row }) => (
            <span className="font-mono text-xs text-muted-foreground">
              {formatDate(row.getValue('joinedAt'))}
            </span>
          ),
        }),
        memberColumnHelper.accessor('status', {
          header: ({ column }) => <DataTableColumnHeader column={column} title="STATUS" />,
          cell: () => (
            <Badge
              variant="outline"
              className="border-emerald-500/30 bg-emerald-500/10 text-emerald-500 text-xs font-mono"
            >
              Active
            </Badge>
          ),
        }),
        memberColumnHelper.display({
          id: 'actions',
          cell: ({ row }) =>
            !isArchived ? (
              <div className="flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMemberToRemove(row.original)}
                  className="h-7 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span className="sr-only">Remove member</span>
                </Button>
              </div>
            ) : null,
        }),
      ]),
    [isArchived],
  );

  // Pending members columns definition using DataTable column helper
  const pendingColumns = React.useMemo(
    () =>
      memberColumnHelper.columns([
        memberColumnHelper.accessor('userId', {
          header: ({ column }) => (
            <DataTableColumnHeader column={column} title="CANDIDATE USER ID" />
          ),
          cell: ({ row }) => (
            <span className="font-mono text-xs font-semibold text-foreground">
              {row.getValue('userId')}
            </span>
          ),
        }),
        memberColumnHelper.accessor('joinedAt', {
          header: ({ column }) => <DataTableColumnHeader column={column} title="REQUESTED TIME" />,
          cell: ({ row }) => (
            <span className="font-mono text-xs text-muted-foreground">
              {formatDateTime(row.getValue('joinedAt'))}
            </span>
          ),
        }),
        memberColumnHelper.accessor('status', {
          header: ({ column }) => <DataTableColumnHeader column={column} title="STATUS" />,
          cell: () => (
            <Badge
              variant="outline"
              className="border-amber-500/30 bg-amber-500/10 text-amber-500 text-xs font-mono"
            >
              Pending Approval
            </Badge>
          ),
        }),
        memberColumnHelper.display({
          id: 'actions',
          cell: ({ row }) => {
            const member = row.original;
            return (
              <div className="flex items-center justify-end gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleReject(member.userId)}
                  disabled={rejectMutation.isPending || approveMutation.isPending}
                  className="h-7 gap-1 px-2.5 text-xs text-destructive hover:bg-destructive/10 border-destructive/30"
                >
                  <X className="h-3.5 w-3.5" />
                  <span>Reject</span>
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleApprove(member.userId)}
                  disabled={approveMutation.isPending || rejectMutation.isPending}
                  className="h-7 gap-1 px-2.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <Check className="h-3.5 w-3.5" />
                  <span>Approve</span>
                </Button>
              </div>
            );
          },
        }),
      ]),
    [approveMutation.isPending, rejectMutation.isPending],
  );

  return (
    <div className="space-y-6">
      {/* Sub Tab Navigation & Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant={subTab === 'active' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSubTab('active')}
            className="gap-1.5"
          >
            <Users className="h-4 w-4" />
            <span>Enrolled Members</span>
            {activeMembers.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs px-1.5 py-0 font-mono">
                {activeMembers.length}
              </Badge>
            )}
          </Button>

          <Button
            variant={subTab === 'pending' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSubTab('pending')}
            className="gap-1.5 relative"
          >
            <UserCheck className="h-4 w-4 text-amber-500" />
            <span>Pending Requests</span>
            {pendingMembers.length > 0 && (
              <Badge
                variant="destructive"
                className="ml-1 text-xs px-1.5 py-0 font-mono bg-amber-500 hover:bg-amber-500 text-white"
              >
                {pendingMembers.length}
              </Badge>
            )}
          </Button>
        </div>

        {subTab === 'active' && !isArchived && (
          <Button size="sm" onClick={onAddMember} className="gap-1.5 h-8">
            <Plus className="h-3.5 w-3.5" />
            <span>Add Member</span>
          </Button>
        )}
      </div>

      {/* View 1: Active Members with Shared DataTable */}
      {subTab === 'active' && (
        <Card className="border-border/60">
          <CardContent className="pt-6">
            <DataTable
              columns={activeColumns}
              data={filteredActiveMembers}
              isLoading={isLoading}
              searchColumnId="userId"
              searchPlaceholder="Search enrolled members by user ID..."
              searchValue={activeSearch}
              onSearchChange={(val) => setActiveSearch(val)}
              filterOptions={roleFilterOptions}
              activeFilter={activeRoleFilter}
              onFilterChange={(val) => setActiveRoleFilter(val)}
              emptyMessage="No enrolled members found"
              emptyDescription="Add students directly or approve pending enrollment requests."
            />
          </CardContent>
        </Card>
      )}

      {/* View 2: Pending Join Requests with Shared DataTable */}
      {subTab === 'pending' && (
        <Card className="border-border/60">
          <CardContent className="pt-6">
            <DataTable
              columns={pendingColumns}
              data={filteredPendingMembers}
              isLoading={isLoading}
              searchColumnId="userId"
              searchPlaceholder="Search pending requests by user ID..."
              searchValue={pendingSearch}
              onSearchChange={(val) => setPendingSearch(val)}
              emptyMessage="No pending join requests"
              emptyDescription="All student enrollment requests have been handled."
            />
          </CardContent>
        </Card>
      )}

      {/* Remove Member Confirmation Dialog */}
      <AlertDialog
        open={Boolean(memberToRemove)}
        onOpenChange={(open) => !open && setMemberToRemove(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Member from Classroom</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove candidate <strong>{memberToRemove?.userId}</strong>{' '}
              from this classroom? They will lose access to assigned quizzes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removeMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmRemove}
              disabled={removeMutation.isPending}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              {removeMutation.isPending ? 'Removing...' : 'Remove Member'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
