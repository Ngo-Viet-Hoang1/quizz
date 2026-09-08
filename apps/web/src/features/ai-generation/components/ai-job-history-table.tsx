'use client';

import * as React from 'react';
import Link from 'next/link';
import { formatDate } from '@/shared/lib/date';
import {
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Clock,
  ExternalLink,
  Sparkles,
  RefreshCw,
  Coins,
} from 'lucide-react';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { formatAiErrorMessage } from '../constants';
import { AiGenerationJobItem, AiGenerationJobStatus } from '../types';
import { useAiJobsHistory } from '../hooks';

interface AiJobHistoryTableProps {
  className?: string;
  onSelectJob?: (job: AiGenerationJobItem) => void;
}

export function AiJobHistoryTable({ className, onSelectJob }: AiJobHistoryTableProps) {
  const { data, isLoading, refetch, isRefetching } = useAiJobsHistory({
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  const jobs = data?.items ?? [];

  const renderStatusBadge = (status: AiGenerationJobStatus) => {
    switch (status) {
      case AiGenerationJobStatus.COMPLETED:
        return (
          <Badge
            variant="secondary"
            className="gap-1 bg-emerald-500/15 text-emerald-500 border-emerald-500/30 text-[11px]"
          >
            <CheckCircle2 className="size-3" />
            <span>Completed</span>
          </Badge>
        );
      case AiGenerationJobStatus.PROCESSING:
        return (
          <Badge
            variant="secondary"
            className="gap-1 bg-primary/10 text-primary border-primary/20 text-[11px]"
          >
            <Loader2 className="size-3 animate-spin" />
            <span>Processing</span>
          </Badge>
        );
      case AiGenerationJobStatus.FAILED:
        return (
          <Badge
            variant="secondary"
            className="gap-1 bg-destructive/10 text-destructive border-destructive/20 text-[11px]"
          >
            <AlertTriangle className="size-3" />
            <span>Failed</span>
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="gap-1 text-muted-foreground text-[11px]">
            <Clock className="size-3" />
            <span>Pending</span>
          </Badge>
        );
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="text-base font-semibold">Generation History</CardTitle>
          <CardDescription className="text-xs">
            Recent AI quiz creation requests and draft records
          </CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isLoading || isRefetching}
          className="h-8 gap-1.5 text-xs"
        >
          <RefreshCw className={`size-3.5 ${isRefetching ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </Button>
      </CardHeader>

      <CardContent className="p-0">
        <div className="divide-y divide-border/60">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="p-3.5 flex items-center justify-center gap-2 text-xs text-muted-foreground"
              >
                <Loader2 className="size-4 animate-spin text-primary" />
                <span>Loading job history...</span>
              </div>
            ))
          ) : jobs.length === 0 ? (
            <div className="p-8 flex flex-col items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
              <Sparkles className="size-6 text-muted-foreground/40" />
              <p>No AI generation jobs yet.</p>
            </div>
          ) : (
            jobs.map((job) => (
              <div
                key={job._id}
                className="p-3.5 hover:bg-muted/40 transition-colors flex flex-col gap-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1 min-w-0 flex-1">
                    <p
                      className="text-xs font-medium text-foreground line-clamp-2 leading-relaxed"
                      title={job.prompt}
                    >
                      {job.prompt}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground font-mono">
                      <span>{job.questionCount} Qs</span>
                      <span>•</span>
                      <span>{formatDate(job.createdAt, 'MMM dd, HH:mm')}</span>
                      {job.costUsd !== undefined && job.costUsd > 0 && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-0.5 text-emerald-500">
                            <Coins className="size-2.5" />
                            <span>${job.costUsd.toFixed(5)}</span>
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0">{renderStatusBadge(job.status)}</div>
                </div>

                {job.status === AiGenerationJobStatus.FAILED && (
                  <p className="text-[11px] text-destructive bg-destructive/10 rounded px-2 py-1 line-clamp-2">
                    {formatAiErrorMessage(job.errorMessage)}
                  </p>
                )}

                <div className="flex items-center justify-end gap-2 pt-1">
                  {job.quizId && job.status === AiGenerationJobStatus.COMPLETED ? (
                    <Link href={`/quizzes/${job.quizId}`}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2.5 gap-1 text-xs text-primary font-medium hover:text-primary hover:bg-primary/10"
                      >
                        <span>Open Quiz</span>
                        <ExternalLink className="size-3" />
                      </Button>
                    </Link>
                  ) : (
                    (job.status === AiGenerationJobStatus.PROCESSING ||
                      job.status === AiGenerationJobStatus.PENDING) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onSelectJob?.(job)}
                        className="h-7 px-2.5 text-xs text-primary hover:bg-primary/10"
                      >
                        Track Status
                      </Button>
                    )
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
