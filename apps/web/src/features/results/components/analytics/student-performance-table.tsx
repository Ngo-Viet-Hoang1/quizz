'use client';

import * as React from 'react';
import { AlertTriangle, Eye } from 'lucide-react';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';
import { formatDuration } from '@/shared/lib/date';
import { cn } from '@/shared/lib/utils';
import { ExamAttemptItem } from '../../types';

interface StudentPerformanceTableProps {
  attempts: ExamAttemptItem[];
  onViewScorecard: (attemptId: string) => void;
}

export function StudentPerformanceTable({
  attempts,
  onViewScorecard,
}: StudentPerformanceTableProps) {
  const rankedAttempts = React.useMemo(() => {
    return [...attempts].sort((a, b) => {
      const pctA = a.totalPoints > 0 ? (a.score / a.totalPoints) * 100 : 0;
      const pctB = b.totalPoints > 0 ? (b.score / b.totalPoints) * 100 : 0;
      if (pctB !== pctA) return pctB - pctA;
      // If tied on score, faster time ranks higher
      return (a.durationSec || 0) - (b.durationSec || 0);
    });
  }, [attempts]);

  return (
    <Card className="border border-border/80 bg-card/60 backdrop-blur-sm shadow-xs">
      <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-semibold">Student Performance Ranking</CardTitle>
        <span className="text-xs text-muted-foreground font-mono">
          {rankedAttempts.length} submissions
        </span>
      </CardHeader>
      <CardContent className="p-4 pt-2">
        {rankedAttempts.length === 0 ? (
          <div className="py-12 text-center text-xs text-muted-foreground">
            No student attempts submitted yet.
          </div>
        ) : (
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/40 text-xs">
                <TableRow>
                  <TableHead className="w-14">Rank</TableHead>
                  <TableHead>Student ID / Ref</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Percentage</TableHead>
                  <TableHead>Time Spent</TableHead>
                  <TableHead>Integrity</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="text-xs divide-y divide-border/60">
                {rankedAttempts.map((item, index) => {
                  const percentage =
                    item.totalPoints > 0 ? Math.round((item.score / item.totalPoints) * 100) : 0;
                  const isPassed = percentage >= 50;
                  const violationCount = item.violations?.length ?? 0;

                  return (
                    <TableRow key={item._id} className="hover:bg-muted/30">
                      {/* 1. Rank */}
                      <TableCell>
                        <div
                          className={cn(
                            'flex size-6 items-center justify-center rounded-full font-mono text-xs font-bold',
                            index === 0 && 'bg-amber-500/20 text-amber-500',
                            index === 1 && 'bg-slate-300/20 text-slate-300',
                            index === 2 && 'bg-amber-700/20 text-amber-600',
                            index > 2 && 'text-muted-foreground',
                          )}
                        >
                          {index + 1}
                        </div>
                      </TableCell>

                      {/* 2. Student ID */}
                      <TableCell className="font-mono text-xs font-medium text-foreground">
                        #{item._id.substring(item._id.length - 8)}
                      </TableCell>

                      {/* 3. Score */}
                      <TableCell className="font-mono font-semibold text-foreground">
                        {item.score} / {item.totalPoints}
                      </TableCell>

                      {/* 4. Percentage */}
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-[10px] px-1.5 py-0 font-mono',
                            isPassed
                              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500'
                              : 'border-rose-500/30 bg-rose-500/10 text-rose-500',
                          )}
                        >
                          {percentage}%
                        </Badge>
                      </TableCell>

                      {/* 5. Duration */}
                      <TableCell className="font-mono text-muted-foreground">
                        {item.durationSec ? formatDuration(item.durationSec) : '0s'}
                      </TableCell>

                      {/* 6. Violations */}
                      <TableCell>
                        {violationCount > 0 ? (
                          <Badge
                            variant="outline"
                            className="border-rose-500/30 bg-rose-500/10 text-rose-500 gap-1 text-[10px]"
                          >
                            <AlertTriangle className="h-3 w-3" />
                            {violationCount}
                          </Badge>
                        ) : (
                          <span className="text-[11px] text-muted-foreground">Clean</span>
                        )}
                      </TableCell>

                      {/* 7. Action */}
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs gap-1 px-2 text-primary hover:text-primary hover:bg-primary/10"
                          onClick={() => onViewScorecard(item._id)}
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>Scorecard</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
