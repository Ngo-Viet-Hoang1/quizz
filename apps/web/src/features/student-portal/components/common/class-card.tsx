'use client';

import type { IClass } from '@/features/student-portal/types';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardContent } from '@/shared/ui/card';
import { CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

interface ClassCardProps {
  cls: IClass;
  /** Extra enrolled classes list to cross-check status (optional) */
  enrolledClasses?: IClass[];
  onJoin?: (classId: string) => void;
  isJoining?: boolean;
}

export function ClassCard({ cls, enrolledClasses = [], onJoin, isJoining }: ClassCardProps) {
  const isEnrolled =
    cls.membershipStatus === 'active' ||
    enrolledClasses.some(
      (e) =>
        String(e._id) === String(cls._id) &&
        (e.membershipStatus === 'active' || e.membershipStatus === undefined),
    );

  const isPending =
    cls.membershipStatus === 'pending' ||
    enrolledClasses.some(
      (e) => String(e._id) === String(cls._id) && e.membershipStatus === 'pending',
    );

  return (
    <Card className="rounded-2xl border border-border/70 hover:border-sky-500/40 hover:shadow-sm transition-all overflow-hidden flex flex-col group p-0 bg-card">
      {/* Header bar */}
      <div className="h-11 bg-sky-50/70 dark:bg-sky-950/30 border-b border-sky-100/80 dark:border-sky-900/30 px-4 py-2 flex items-center justify-between">
        <span className="text-[11px] font-semibold text-sky-800 dark:text-sky-300">Classroom</span>

        {isEnrolled && (
          <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
            <CheckCircle2 className="size-3" /> Enrolled
          </Badge>
        )}
        {isPending && !isEnrolled && (
          <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 text-[10px] font-bold">
            Pending
          </Badge>
        )}
      </div>

      {/* Body */}
      <CardContent className="p-4 flex-1 flex flex-col justify-between space-y-3.5">
        <div>
          {isEnrolled ? (
            <Link href={`/student/classes/${cls._id}`}>
              <h3 className="font-bold text-base text-foreground hover:text-sky-600 dark:hover:text-sky-400 transition-colors line-clamp-1 cursor-pointer">
                {cls.name}
              </h3>
            </Link>
          ) : (
            <h3 className="font-bold text-base text-foreground group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors line-clamp-1">
              {cls.name}
            </h3>
          )}
          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
            {cls.description || 'Academic course and examination quizzes.'}
          </p>
        </div>

        {/* Action button */}
        <div className="pt-3 border-t border-border/50">
          {isPending ? (
            <Button
              disabled
              className="w-full h-9 rounded-xl font-semibold text-xs opacity-60 bg-muted text-muted-foreground"
            >
              Pending Approval
            </Button>
          ) : isEnrolled ? (
            <Link href={`/student/classes/${cls._id}`} className="block w-full">
              <Button className="w-full h-9 rounded-xl font-semibold text-xs bg-sky-600 hover:bg-sky-700 text-white shadow-xs transition-all">
                Open Class
              </Button>
            </Link>
          ) : (
            <Button
              disabled={isJoining}
              onClick={() => onJoin?.(cls._id)}
              className="w-full h-9 rounded-xl font-semibold text-xs bg-sky-600 hover:bg-sky-700 text-white shadow-xs transition-all"
            >
              Join Class
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
