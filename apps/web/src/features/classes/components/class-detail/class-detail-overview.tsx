'use client';

import * as React from 'react';
import { useOrganization, useUser } from '@clerk/nextjs';
import { BookOpen, Calendar, CheckCircle2, Clock, Shield, UserCheck, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { formatDateTime } from '@/shared/lib/date';
import { ClassAssignmentItem, ClassItem, ClassMemberItem, ClassMemberStatus } from '../../types';

interface ClassDetailOverviewProps {
  classItem: ClassItem;
  members: ClassMemberItem[];
  assignments: ClassAssignmentItem[];
}

export function ClassDetailOverview({ classItem, members, assignments }: ClassDetailOverviewProps) {
  const activeMembers = members.filter((m) => m.status === ClassMemberStatus.ACTIVE);
  const pendingMembers = members.filter((m) => m.status === ClassMemberStatus.PENDING);

  const { user } = useUser();
  const { memberships } = useOrganization({ memberships: { infinite: true } });

  const orgMember = memberships?.data?.find((m) => m.publicUserData?.userId === classItem.ownerId);

  const isCurrentUser = user?.id === classItem.ownerId;

  const teacherName = orgMember?.publicUserData?.firstName
    ? `${orgMember.publicUserData.firstName} ${orgMember.publicUserData.lastName || ''}`.trim()
    : orgMember?.publicUserData?.identifier ||
      (isCurrentUser
        ? user?.fullName || user?.username || user?.primaryEmailAddress?.emailAddress
        : classItem.ownerId || 'N/A');

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {/* Metric 1: Active Members */}
      <Card className="border-border/60 bg-card/60 backdrop-blur-sm shadow-xs">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Enrolled Students
          </CardTitle>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
            <Users className="h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold font-mono text-emerald-500">
            {activeMembers.length}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Active enrolled candidates in this classroom
          </p>
        </CardContent>
      </Card>

      {/* Metric 2: Pending Approval Requests */}
      <Card className="border-border/60 bg-card/60 backdrop-blur-sm shadow-xs">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Pending Join Requests
          </CardTitle>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
            <UserCheck className="h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold font-mono text-amber-500">{pendingMembers.length}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Students waiting for approval to enter class
          </p>
        </CardContent>
      </Card>

      {/* Metric 3: Assigned Quizzes */}
      <Card className="border-border/60 bg-card/60 backdrop-blur-sm shadow-xs">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Assigned Quizzes
          </CardTitle>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <BookOpen className="h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold font-mono text-primary">{assignments.length}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Assessments published to this classroom
          </p>
        </CardContent>
      </Card>

      {/* Information Details Card */}
      <Card className="md:col-span-3 border-border/60 bg-card/60 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Classroom Information</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1">
              <dt className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5 text-primary" />
                Classroom Teacher
              </dt>
              <dd className="text-xs font-semibold text-foreground break-all">{teacherName}</dd>
            </div>

            <div className="space-y-1">
              <dt className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                Current Status
              </dt>
              <dd className="font-mono text-xs font-semibold text-foreground capitalize">
                {classItem.status}
              </dd>
            </div>

            <div className="space-y-1">
              <dt className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                Creation Date
              </dt>
              <dd className="font-mono text-xs text-foreground">
                {formatDateTime(classItem.createdAt)}
              </dd>
            </div>

            <div className="space-y-1">
              <dt className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                Last Updated
              </dt>
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
