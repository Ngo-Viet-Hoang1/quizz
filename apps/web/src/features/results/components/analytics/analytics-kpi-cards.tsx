'use client';

import * as React from 'react';
import { Card, CardContent } from '@/shared/ui/card';
import { formatDuration } from '@/shared/lib/date';
import { ExamAttemptItem } from '../../types';

interface AnalyticsKPICardsProps {
  attempts: ExamAttemptItem[];
  totalStudents?: number;
}

export function AnalyticsKPICards({ attempts, totalStudents }: AnalyticsKPICardsProps) {
  const totalAttempts = attempts.length;

  // 1. Average Score & Percentage
  const { avgScore, avgPercentage, passCount } = React.useMemo(() => {
    if (totalAttempts === 0) return { avgScore: 0, avgPercentage: 0, passCount: 0 };

    let totalScoreSum = 0;
    let totalMaxScoreSum = 0;
    let passed = 0;

    for (const a of attempts) {
      totalScoreSum += a.score;
      totalMaxScoreSum += a.totalPoints > 0 ? a.totalPoints : 10;
      const pct = a.totalPoints > 0 ? (a.score / a.totalPoints) * 100 : 0;
      if (pct >= 50) passed++;
    }

    const calculatedAvgScore = totalScoreSum / totalAttempts;
    const calculatedAvgPercentage =
      totalMaxScoreSum > 0 ? (totalScoreSum / totalMaxScoreSum) * 100 : 0;

    return {
      avgScore: Math.round(calculatedAvgScore * 10) / 10,
      avgPercentage: Math.round(calculatedAvgPercentage),
      passCount: passed,
    };
  }, [attempts, totalAttempts]);

  // 2. Pass Rate %
  const passRate = totalAttempts > 0 ? Math.round((passCount / totalAttempts) * 100) : 0;

  // 3. Average Duration
  const avgDurationSec = React.useMemo(() => {
    if (totalAttempts === 0) return 0;
    const totalDuration = attempts.reduce((acc, a) => acc + (a.durationSec || 0), 0);
    return Math.round(totalDuration / totalAttempts);
  }, [attempts, totalAttempts]);

  // 4. Proctoring / Violations
  const totalViolations = React.useMemo(() => {
    return attempts.reduce((acc, a) => acc + (a.violations?.length || 0), 0);
  }, [attempts]);

  const submissionRate =
    totalStudents && totalStudents > 0
      ? Math.min(100, Math.round((totalAttempts / totalStudents) * 100))
      : null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
      {/* KPI 1: Average Score */}
      <Card className="border border-border/80 bg-card/60 backdrop-blur-sm shadow-xs">
        <CardContent className="p-4 flex flex-col justify-between h-full space-y-2">
          <span className="text-xs font-medium text-muted-foreground">Class Average</span>
          <div>
            <div className="flex items-baseline gap-1.5 font-mono">
              <span className="text-2xl font-bold text-foreground">{avgPercentage}%</span>
              <span className="text-xs text-muted-foreground">({avgScore} pts)</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              {avgPercentage >= 70 ? 'Strong performance' : 'Room for improvement'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* KPI 2: Pass Rate */}
      <Card className="border border-border/80 bg-card/60 backdrop-blur-sm shadow-xs">
        <CardContent className="p-4 flex flex-col justify-between h-full space-y-2">
          <span className="text-xs font-medium text-muted-foreground">Pass Rate</span>
          <div>
            <div className="flex items-baseline gap-1.5 font-mono">
              <span className="text-2xl font-bold text-foreground">{passRate}%</span>
              <span className="text-xs text-muted-foreground">
                ({passCount}/{totalAttempts} passed)
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">Passing criteria: &ge; 50%</p>
          </div>
        </CardContent>
      </Card>

      {/* KPI 3: Submissions */}
      <Card className="border border-border/80 bg-card/60 backdrop-blur-sm shadow-xs">
        <CardContent className="p-4 flex flex-col justify-between h-full space-y-2">
          <span className="text-xs font-medium text-muted-foreground">Submissions</span>
          <div>
            <div className="flex items-baseline gap-1.5 font-mono">
              <span className="text-2xl font-bold text-foreground">{totalAttempts}</span>
              {totalStudents && (
                <span className="text-xs text-muted-foreground">/ {totalStudents}</span>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              {submissionRate !== null ? `${submissionRate}% completion` : 'Total graded attempts'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* KPI 4: Avg Time */}
      <Card className="border border-border/80 bg-card/60 backdrop-blur-sm shadow-xs">
        <CardContent className="p-4 flex flex-col justify-between h-full space-y-2">
          <span className="text-xs font-medium text-muted-foreground">Avg Time Spent</span>
          <div>
            <div className="flex items-baseline gap-1.5 font-mono">
              <span className="text-2xl font-bold text-foreground">
                {avgDurationSec > 0 ? formatDuration(avgDurationSec) : '0s'}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">Per student attempt</p>
          </div>
        </CardContent>
      </Card>

      {/* KPI 5: Proctoring Alerts */}
      <Card className="border border-border/80 bg-card/60 backdrop-blur-sm shadow-xs">
        <CardContent className="p-4 flex flex-col justify-between h-full space-y-2">
          <span className="text-xs font-medium text-muted-foreground">Integrity Flags</span>
          <div>
            <div className="flex items-baseline gap-1.5 font-mono">
              <span className="text-2xl font-bold text-foreground">{totalViolations}</span>
              <span className="text-xs text-muted-foreground"> incidents</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              {totalViolations === 0 ? 'Clean test environment' : 'Proctoring alerts logged'}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
