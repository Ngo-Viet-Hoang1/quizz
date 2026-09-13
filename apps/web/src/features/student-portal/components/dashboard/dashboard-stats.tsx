'use client';

import { Card } from '@/shared/ui/card';
import { BookOpenCheck, Trophy, Users2, type LucideIcon } from 'lucide-react';

interface DashboardStatsProps {
  enrolledCount: number;
  totalAttempts: number;
  avgScore: number;
}

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  colorClass: string;
}

function StatCard({ icon: Icon, label, value, colorClass }: StatCardProps) {
  return (
    <Card className="rounded-2xl border bg-card/60 backdrop-blur-sm p-5 shadow-xs hover:shadow-sm transition-shadow">
      <div className="flex items-center gap-4">
        <div className={`flex size-11 items-center justify-center rounded-2xl ${colorClass}`}>
          <Icon className="size-5" />
        </div>
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {label}
          </p>
          <h3 className="text-2xl font-bold tracking-tight">{value}</h3>
        </div>
      </div>
    </Card>
  );
}

export function DashboardStats({ enrolledCount, totalAttempts, avgScore }: DashboardStatsProps) {
  const stats: StatCardProps[] = [
    {
      icon: Users2,
      label: 'Enrolled Classes',
      value: enrolledCount,
      colorClass: 'bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400',
    },
    {
      icon: BookOpenCheck,
      label: 'Exams Attempted',
      value: totalAttempts,
      colorClass: 'bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400',
    },
    {
      icon: Trophy,
      label: 'Average Score',
      value: `${avgScore}%`,
      colorClass: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {stats.map((stat) => (
        <StatCard key={stat.label} {...stat} />
      ))}
    </div>
  );
}
