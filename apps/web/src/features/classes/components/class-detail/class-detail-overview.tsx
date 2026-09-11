'use client';

import * as React from 'react';
import { Badge } from '@/shared/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { UserAvatarCell } from '@/shared/components/user-avatar-cell';
import { formatDateTime } from '@/shared/lib/date';
import { cn } from '@/shared/lib/utils';
import {
  ClassAssignmentItem,
  ClassItem,
  ClassMemberItem,
  ClassMemberStatus,
  ClassStatus,
} from '../../types';

interface ClassDetailOverviewProps {
  classItem: ClassItem;
  members: ClassMemberItem[];
  assignments: ClassAssignmentItem[];
}

export function ClassDetailOverview({ classItem, members, assignments }: ClassDetailOverviewProps) {
  const activeMembers = members.filter((m) => m.status === ClassMemberStatus.ACTIVE);
  const pendingMembers = members.filter((m) => m.status === ClassMemberStatus.PENDING);
  const isArchived = classItem.status === ClassStatus.ARCHIVED;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {/* Metric 1: Active Members */}
      <Card className="border-border/60 bg-card/60 shadow-2xs">
        <CardHeader className="pb-1.5 space-y-0">
          <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Enrolled Students
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold font-mono tracking-tight text-foreground">
            {activeMembers.length}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Active enrolled members in this classroom
          </p>
        </CardContent>
      </Card>

      {/* Metric 2: Pending Approval Requests */}
      <Card className="border-border/60 bg-card/60 shadow-2xs">
        <CardHeader className="pb-1.5 space-y-0">
          <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Pending Join Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={cn(
              'text-2xl font-bold font-mono tracking-tight',
              pendingMembers.length > 0 ? 'text-amber-500' : 'text-foreground',
            )}
          >
            {pendingMembers.length}
          </div>
          <p className="text-xs text-muted-foreground mt-1">Candidates awaiting teacher approval</p>
        </CardContent>
      </Card>

      {/* Metric 3: Assigned Quizzes */}
      <Card className="border-border/60 bg-card/60 shadow-2xs">
        <CardHeader className="pb-1.5 space-y-0">
          <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Assigned Quizzes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold font-mono tracking-tight text-foreground">
            {assignments.length}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Assessments published to this classroom
          </p>
        </CardContent>
      </Card>

      {/* Information Details Card */}
      <Card className="md:col-span-3 border-border/60 bg-card/60">
        <CardHeader className="pb-3 border-b border-border/40">
          <CardTitle className="text-sm font-semibold">Classroom Information</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1">
              <dt className="text-xs font-medium text-muted-foreground">Classroom Teacher</dt>
              <dd className="text-xs font-medium">
                <UserAvatarCell userId={classItem.ownerId} size="sm" />
              </dd>
            </div>

            <div className="space-y-1">
              <dt className="text-xs font-medium text-muted-foreground">Current Status</dt>
              <dd className="text-xs">
                <Badge
                  variant="outline"
                  className={cn(
                    'font-mono text-xs capitalize',
                    isArchived
                      ? 'border-amber-500/30 bg-amber-500/10 text-amber-500'
                      : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500',
                  )}
                >
                  {classItem.status}
                </Badge>
              </dd>
            </div>

            <div className="space-y-1">
              <dt className="text-xs font-medium text-muted-foreground">Creation Date</dt>
              <dd className="font-mono text-xs text-foreground">
                {formatDateTime(classItem.createdAt)}
              </dd>
            </div>

            <div className="space-y-1">
              <dt className="text-xs font-medium text-muted-foreground">Last Updated</dt>
              <dd className="font-mono text-xs text-foreground">
                {formatDateTime(classItem.updatedAt)}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
