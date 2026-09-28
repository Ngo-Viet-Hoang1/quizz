'use client';

import { ClassCard } from '@/features/student-portal/components/common/class-card';
import type { IClass } from '@/features/student-portal/types';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { ChevronRight, Users2 } from 'lucide-react';
import Link from 'next/link';

interface DashboardEnrolledClassesProps {
  classes: IClass[];
  isLoading: boolean;
  onJoinClass?: (classId: string) => void;
  isJoining?: boolean;
  joiningClassId?: string | null;
}

export function DashboardEnrolledClasses({
  classes,
  isLoading,
  onJoinClass,
  isJoining,
  joiningClassId,
}: DashboardEnrolledClassesProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">Organization Classes</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Explore and participate in academic classes within your organization
          </p>
        </div>
        <Link href="/student/classes">
          <Button
            variant="ghost"
            size="sm"
            className="text-sky-600 dark:text-sky-400 font-semibold gap-1 hover:text-sky-700 text-xs"
          >
            View All <ChevronRight className="size-4" />
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-40 rounded-2xl bg-muted/40 animate-pulse" />
          ))}
        </div>
      ) : classes.length === 0 ? (
        <Card className="rounded-2xl border border-dashed p-8 text-center bg-muted/20">
          <Users2 className="size-10 mx-auto text-muted-foreground/40 mb-2.5" />
          <p className="text-sm font-semibold text-foreground">No classes available yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Teachers will create and publish classes in your organization here.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {classes.slice(0, 3).map((cls) => (
            <ClassCard
              key={cls._id}
              cls={cls}
              onJoin={onJoinClass}
              isJoining={isJoining || joiningClassId === cls._id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
