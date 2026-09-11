'use client';

import * as React from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/shared/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';
import { cn } from '@/shared/lib/utils';
import { ExamAttemptItem } from '../../types';

interface HardestQuestionsMatrixProps {
  attempts: ExamAttemptItem[];
}

interface AggregatedQuestionStat {
  questionId: string;
  questionNumber: number;
  questionTitle: string;
  totalAttempts: number;
  correctAttempts: number;
  accuracyRate: number;
}

export function HardestQuestionsMatrix({ attempts }: HardestQuestionsMatrixProps) {
  const questionStats: AggregatedQuestionStat[] = React.useMemo(() => {
    if (attempts.length === 0) return [];

    const statsMap = new Map<string, { total: number; correct: number; index: number }>();

    let maxQuestions = 0;
    for (const a of attempts) {
      if (a.answers && a.answers.length > 0) {
        maxQuestions = Math.max(maxQuestions, a.answers.length);
        a.answers.forEach((ans, idx) => {
          const qId = ans.questionId || `q-${idx + 1}`;
          const current = statsMap.get(qId) || { total: 0, correct: 0, index: idx + 1 };
          current.total++;
          if (ans.isCorrect) current.correct++;
          statsMap.set(qId, current);
        });
      }
    }

    if (statsMap.size === 0) {
      return [];
    }

    const list: AggregatedQuestionStat[] = [];
    statsMap.forEach((val, key) => {
      const accuracy = val.total > 0 ? Math.round((val.correct / val.total) * 100) : 0;
      list.push({
        questionId: key,
        questionNumber: val.index,
        questionTitle: `Question #${val.index}`,
        totalAttempts: val.total,
        correctAttempts: val.correct,
        accuracyRate: accuracy,
      });
    });

    // Sort by lowest accuracy first (hardest questions at top)
    return list.sort((a, b) => a.accuracyRate - b.accuracyRate);
  }, [attempts]);

  return (
    <Card className="border border-border/80 bg-card/60 backdrop-blur-sm shadow-xs">
      <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-semibold">Question Item Analysis</CardTitle>
        <span className="text-xs text-muted-foreground">Sorted by lowest accuracy</span>
      </CardHeader>
      <CardContent className="p-4 pt-2">
        {questionStats.length === 0 ? (
          <div className="py-12 text-center text-xs text-muted-foreground">
            No per-question detailed answer breakdown recorded yet.
          </div>
        ) : (
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/40 text-xs">
                <TableRow>
                  <TableHead className="w-20">Item #</TableHead>
                  <TableHead>Accuracy Rate</TableHead>
                  <TableHead className="text-center w-28">Correct / Total</TableHead>
                  <TableHead className="text-right w-32">Status Flag</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="text-xs divide-y divide-border/60">
                {questionStats.map((item) => {
                  const isHard = item.accuracyRate < 50;
                  const isGood = item.accuracyRate >= 75;

                  return (
                    <TableRow key={item.questionId} className="hover:bg-muted/30">
                      <TableCell className="font-mono font-bold text-foreground">
                        Q{item.questionNumber}
                      </TableCell>

                      {/* Accuracy Progress Bar */}
                      <TableCell>
                        <div className="space-y-1 max-w-xs">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-medium text-foreground">
                              {item.accuracyRate}%
                            </span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                            <div
                              className={cn(
                                'h-full transition-all rounded-full',
                                isHard && 'bg-rose-500',
                                !isHard && !isGood && 'bg-amber-500',
                                isGood && 'bg-emerald-500',
                              )}
                              style={{ width: `${item.accuracyRate}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>

                      {/* Correct / Total */}
                      <TableCell className="text-center font-mono text-muted-foreground">
                        {item.correctAttempts} / {item.totalAttempts}
                      </TableCell>

                      {/* Status */}
                      <TableCell className="text-right">
                        {isHard ? (
                          <Badge
                            variant="outline"
                            className="border-rose-500/30 bg-rose-500/10 text-rose-500 gap-1 text-[10px]"
                          >
                            <AlertCircle className="h-3 w-3" />
                            Needs Review
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="border-emerald-500/30 bg-emerald-500/10 text-emerald-500 gap-1 text-[10px]"
                          >
                            <CheckCircle2 className="h-3 w-3" />
                            Well Grasped
                          </Badge>
                        )}
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
