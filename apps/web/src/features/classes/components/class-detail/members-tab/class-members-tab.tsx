'use client';

import * as React from 'react';
import { useOrganization } from '@clerk/nextjs';
import { createColumnHelper } from '@tanstack/react-table';
import { Check, Plus, Trash2, X } from 'lucide-react';
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
import {
  DataTable,
  DataTableColumnHeader,
  FilterOption,
  type DataTableFeatures,
} from '@/shared/components/data-table';
import { UserAvatarCell } from '@/shared/components/user-avatar-cell';
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

  const { memberships } = useOrganization({ memberships: { infinite: true } });

  const approveMutation = useApproveClassMember();
  const rejectMutation = useRejectClassMember();
  const removeMutation = useRemoveClassMember();

  // Helper to get user searchable text from Clerk org
  const userSearchIndex = React.useMemo(() => {
    const map = new Map<string, string>();
    memberships?.data?.forEach((m) => {
      const p = m.publicUserData;
      const text =
        `${p?.firstName || ''} ${p?.lastName || ''} ${p?.identifier || ''} ${p?.userId || ''}`.toLowerCase();
      if (p?.userId) {
        map.set(p.userId, text);
      }
    });
    return map;
  }, [memberships]);

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
      if (!matchRole) return false;
      if (!debouncedActiveSearch.trim()) return true;

      const q = debouncedActiveSearch.trim().toLowerCase();
      const userText = userSearchIndex.get(m.userId) || m.userId.toLowerCase();
      return userText.includes(q);
    });
  }, [activeMembers, activeRoleFilter, debouncedActiveSearch, userSearchIndex]);

  const filteredPendingMembers = React.useMemo(() => {
    return pendingMembers.filter((m) => {
      if (!debouncedPendingSearch.trim()) return true;
      const q = debouncedPendingSearch.trim().toLowerCase();
      const userText = userSearchIndex.get(m.userId) || m.userId.toLowerCase();
      return userText.includes(q);
    });
  }, [pendingMembers, debouncedPendingSearch, userSearchIndex]);

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
          header: ({ column }) => <DataTableColumnHeader column={column} title="MEMBER" />,
          cell: ({ row }) => <UserAvatarCell userId={row.getValue('userId')} size="sm" />,
        }),
        memberColumnHelper.accessor('role', {
          header: ({ column }) => <DataTableColumnHeader column={column} title="ROLE" />,
          cell: ({ row }) => {
            const role = row.getValue('role') as ClassMemberRole;
            return (
              <Badge variant="secondary" className="font-mono text-xs capitalize">
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
          header: ({ column }) => <DataTableColumnHeader column={column} title="CANDIDATE" />,
          cell: ({ row }) => <UserAvatarCell userId={row.getValue('userId')} size="sm" />,
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
              Pending
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
    <div className="space-y-4">
      {/* Sub Tab Navigation & Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-1.5 p-1 bg-muted/50 rounded-lg w-fit border border-border/40">
          <button
            type="button"
            onClick={() => setSubTab('active')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
              subTab === 'active'
                ? 'bg-background text-foreground shadow-2xs font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <span>Enrolled Members</span>
            {activeMembers.length > 0 && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-mono">
                {activeMembers.length}
              </Badge>
            )}
          </button>

          <button
            type="button"
            onClick={() => setSubTab('pending')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
              subTab === 'pending'
                ? 'bg-background text-foreground shadow-2xs font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <span>Pending Requests</span>
            {pendingMembers.length > 0 && (
              <Badge
                variant="destructive"
                className="text-[10px] px-1.5 py-0 font-mono bg-amber-500 hover:bg-amber-500 text-white"
              >
                {pendingMembers.length}
              </Badge>
            )}
          </button>
        </div>

        {subTab === 'active' && !isArchived && (
          <Button size="sm" onClick={onAddMember} className="gap-1.5 h-8 text-xs shadow-2xs">
            <Plus className="h-3.5 w-3.5" />
            <span>Add Member</span>
          </Button>
        )}
      </div>

      {/* View 1: Active Members with Flat DataTable (No redundant Card wrap) */}
      {subTab === 'active' && (
        <DataTable
          columns={activeColumns}
          data={filteredActiveMembers}
          isLoading={isLoading}
          searchColumnId="userId"
          searchPlaceholder="Search by name, email, or ID..."
          searchValue={activeSearch}
          onSearchChange={(val) => setActiveSearch(val)}
          filterOptions={roleFilterOptions}
          activeFilter={activeRoleFilter}
          onFilterChange={(val) => setActiveRoleFilter(val)}
          emptyMessage="No enrolled members found"
          emptyDescription="Add members directly from your organization or approve join requests."
        />
      )}

      {/* View 2: Pending Join Requests with Flat DataTable */}
      {subTab === 'pending' && (
        <DataTable
          columns={pendingColumns}
          data={filteredPendingMembers}
          isLoading={isLoading}
          searchColumnId="userId"
          searchPlaceholder="Search pending requests..."
          searchValue={pendingSearch}
          onSearchChange={(val) => setPendingSearch(val)}
          emptyMessage="No pending join requests"
          emptyDescription="All student enrollment requests have been handled."
        />
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
              Are you sure you want to remove this member from the classroom? They will lose access
              to assigned quizzes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            {memberToRemove && (
              <UserAvatarCell
                userId={memberToRemove.userId}
                className="p-3 bg-muted/40 rounded-lg border border-border/50"
              />
            )}
          </div>
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
