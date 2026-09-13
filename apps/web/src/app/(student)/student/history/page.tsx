'use client';

import { useMyExamHistory } from '@/features/student-portal/api/student.api';
import { calculateScorePercentage, isExamPassed } from '@/features/student-portal/utils/exam.utils';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardContent } from '@/shared/ui/card';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Skeleton } from '@/shared/ui/skeleton';
import {
  BookOpenCheck,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  History,
  Target,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

export default function StudentHistoryPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const limit = 10;

  const { data, isLoading } = useMyExamHistory({
    page,
    limit,
    status: statusFilter === 'all' ? undefined : statusFilter,
  });

  const attempts = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <History className="size-6 text-primary" />
          Results & History
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          View all your exam attempts and detailed results
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <Select
          value={statusFilter}
          onValueChange={(val) => {
            if (val) {
              setStatusFilter(val);
              setPage(1);
            }
          }}
        >
          <SelectTrigger className="w-40 rounded-lg text-sm">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="submitted">Submitted</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="abandoned">Abandoned</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* History Table */}
      <Card className="rounded-xl border shadow-sm">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-lg" />
              ))}
            </div>
          ) : attempts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <BookOpenCheck className="size-12 text-muted-foreground/30 mb-4" />
              <p className="text-sm font-medium text-muted-foreground">No exam history found</p>
              <p className="text-xs text-muted-foreground/80 mt-1">
                Complete your first exam to see results here
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="text-left font-semibold text-xs px-5 py-3 text-muted-foreground uppercase tracking-wider">
                      Exam
                    </th>
                    <th className="text-left font-semibold text-xs px-5 py-3 text-muted-foreground uppercase tracking-wider">
                      Score
                    </th>
                    <th className="text-left font-semibold text-xs px-5 py-3 text-muted-foreground uppercase tracking-wider hidden sm:table-cell">
                      Correct
                    </th>
                    <th className="text-left font-semibold text-xs px-5 py-3 text-muted-foreground uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-left font-semibold text-xs px-5 py-3 text-muted-foreground uppercase tracking-wider hidden md:table-cell">
                      Date
                    </th>
                    <th className="text-right font-semibold text-xs px-5 py-3 text-muted-foreground uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {attempts.map((attempt) => {
                    const pct = calculateScorePercentage(attempt.score, attempt.totalPoints);
                    const isPassed = isExamPassed(attempt.score, attempt.totalPoints);
                    const totalQ = attempt.correctCount + attempt.wrongCount;

                    const quizTitle =
                      typeof attempt.quizId === 'object' && attempt.quizId?.title
                        ? attempt.quizId.title
                        : attempt.quizTitle ||
                          `Quiz #${(typeof attempt.quizId === 'string' ? attempt.quizId : (attempt.quizId?._id ?? '')).slice(-6)}`;

                    return (
                      <tr key={attempt._id} className="hover:bg-muted/30 transition-colors">
                        {/* Exam */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`flex size-8 items-center justify-center rounded-lg shrink-0 ${
                                isPassed ? 'bg-emerald-500/15' : 'bg-red-500/15'
                              }`}
                            >
                              <Target
                                className={`size-3.5 ${
                                  isPassed
                                    ? 'text-emerald-600 dark:text-emerald-400'
                                    : 'text-red-600 dark:text-red-400'
                                }`}
                              />
                            </div>
                            <div>
                              <p className="font-medium text-foreground text-sm">{quizTitle}</p>
                              <p className="text-[10px] text-muted-foreground font-mono">
                                ID: {attempt._id.slice(-8)}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Score */}
                        <td className="px-5 py-3.5">
                          <span
                            className={`text-lg font-bold font-mono ${
                              isPassed
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-red-600 dark:text-red-400'
                            }`}
                          >
                            {pct}%
                          </span>
                        </td>

                        {/* Correct */}
                        <td className="px-5 py-3.5 hidden sm:table-cell">
                          <span className="text-sm font-medium text-foreground">
                            {attempt.correctCount}/{totalQ}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-5 py-3.5">
                          <Badge
                            className={
                              attempt.status === 'submitted'
                                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-[10px]'
                                : attempt.status === 'in_progress'
                                  ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 text-[10px]'
                                  : 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30 text-[10px]'
                            }
                          >
                            {attempt.status === 'submitted'
                              ? 'Completed'
                              : attempt.status === 'in_progress'
                                ? 'In Progress'
                                : attempt.status === 'force_submitted'
                                  ? 'Force Submitted'
                                  : 'Abandoned'}
                          </Badge>
                        </td>

                        {/* Date */}
                        <td className="px-5 py-3.5 hidden md:table-cell">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="size-3" />
                            {attempt.submittedAt
                              ? new Date(attempt.submittedAt).toLocaleDateString()
                              : new Date(attempt.startedAt).toLocaleDateString()}
                          </div>
                        </td>

                        {/* Action */}
                        <td className="px-5 py-3.5 text-right">
                          {attempt.status === 'in_progress' ? (
                            <Link href={`/student/exam/${attempt._id}`}>
                              <Button size="sm" className="h-7 text-[11px] rounded-md gap-1 px-3">
                                Continue
                              </Button>
                            </Link>
                          ) : (
                            <Link href={`/student/exam/${attempt._id}/result`}>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-[11px] rounded-md gap-1 px-3"
                              >
                                <Eye className="size-3" />
                                Review
                              </Button>
                            </Link>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-between border-t px-5 py-3">
              <span className="text-xs text-muted-foreground">
                Page {meta.page} of {meta.totalPages} • {meta.total} results
              </span>
              <div className="flex gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 px-2.5 rounded-md"
                  disabled={meta.page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="size-3.5" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 px-2.5 rounded-md"
                  disabled={meta.page >= meta.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight className="size-3.5" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
