'use client';

import React, { useState } from 'react';
import {
  Calendar,
  Trophy,
  Download,
  Copy,
  Check,
  AlertCircle,
  TrendingUp,
  Percent,
  Users,
  PowerOff,
} from 'lucide-react';
import { RoomResultItem } from '@repo/shared-types';
import { useCloseRoom } from '../hooks/use-rooms';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/shared/ui/sheet';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { cn } from '@/shared/lib/utils';
import { formatDate } from '@/shared/lib/date';
import { toast } from 'sonner';

interface RoomLeaderboardSheetProps {
  room: RoomResultItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RoomLeaderboardSheet({ room, open, onOpenChange }: RoomLeaderboardSheetProps) {
  const [copied, setCopied] = useState(false);
  const closeRoomMutation = useCloseRoom();

  if (!room) return null;

  const totalQuestions = room.totalQuestions || 1;
  const leaderboard = room.leaderboard || [];
  const participantsCount = room.participantsCount || leaderboard.length;

  // Compute Room Analytics
  let totalCorrectAnswers = 0;
  leaderboard.forEach((entry) => {
    totalCorrectAnswers += entry.correctAnswersCount || 0;
  });

  const totalPossibleAnswers = leaderboard.length * totalQuestions;
  const accuracyRate =
    totalPossibleAnswers > 0 ? Math.round((totalCorrectAnswers / totalPossibleAnswers) * 100) : 0;

  const averageScore =
    leaderboard.length > 0
      ? Math.round(leaderboard.reduce((sum, e) => sum + e.score, 0) / leaderboard.length)
      : 0;

  // Segment Candidates
  const excellentList = leaderboard.filter(
    (e) => (e.correctAnswersCount / totalQuestions) * 100 >= 80,
  );
  const passingList = leaderboard.filter((e) => {
    const rate = (e.correctAnswersCount / totalQuestions) * 100;
    return rate >= 50 && rate < 80;
  });
  const needsSupportList = leaderboard.filter(
    (e) => (e.correctAnswersCount / totalQuestions) * 100 < 50,
  );

  // 1. Export CSV
  const handleExportCsv = () => {
    if (leaderboard.length === 0) {
      toast.error('No leaderboard data to export');
      return;
    }

    const headers = [
      'Rank',
      'Nickname',
      'Score (pts)',
      'Correct Answers',
      'Total Questions',
      'Accuracy (%)',
    ];
    const rows = leaderboard.map((e) => {
      const acc =
        totalQuestions > 0 ? Math.round((e.correctAnswersCount / totalQuestions) * 100) : 0;
      return [
        e.rank,
        `"${e.nickname.replace(/"/g, '""')}"`,
        e.score,
        e.correctAnswersCount,
        totalQuestions,
        `${acc}%`,
      ].join(',');
    });

    // Add UTF-8 BOM for flawless Excel compatibility
    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `quiz-room-${room.pin}-report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Room report exported to CSV');
  };

  // 2. Quick Copy Summary
  const handleCopySummary = () => {
    const winner = leaderboard[0];
    const text = [
      `📊 QUIZ SESSION REPORT: ${room.quizTitle} (PIN: ${room.pin})`,
      `• Date: ${formatDate(room.createdAt)}`,
      `• Total Candidates: ${participantsCount} students`,
      `• Class Accuracy: ${accuracyRate}%`,
      `• Average Score: ${averageScore.toLocaleString()} pts`,
      winner
        ? `• Winner: 🏆 ${winner.nickname} (${winner.score.toLocaleString()} pts, ${winner.correctAnswersCount}/${totalQuestions} correct)`
        : '',
      needsSupportList.length > 0
        ? `• Students Needing Support (<50%): ${needsSupportList.map((s) => s.nickname).join(', ')}`
        : '• All students achieved passing accuracy!',
    ]
      .filter(Boolean)
      .join('\n');

    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Session summary copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl md:max-w-3xl lg:max-w-4xl flex flex-col h-full p-0 gap-0">
        {/* Sheet Header */}
        <SheetHeader className="p-5 border-b border-border text-left space-y-3 bg-muted/10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge
                variant="outline"
                className="font-mono text-xs border-indigo-500/30 text-indigo-600 dark:text-indigo-400 bg-indigo-500/10"
              >
                PIN: {room.pin}
              </Badge>
              <span className="text-xs text-muted-foreground font-mono">v{room.quizVersion}</span>
              <span className="text-muted-foreground/40">•</span>
              <span className="text-xs font-mono text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDate(room.createdAt)}
              </span>
            </div>

            {/* Action Buttons in Header */}
            <div className="flex items-center gap-2">
              {!room.endedAt && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    await closeRoomMutation.mutateAsync(room.pin);
                    onOpenChange(false);
                  }}
                  disabled={closeRoomMutation.isPending}
                  className="h-8 gap-1.5 text-xs font-medium text-destructive hover:bg-destructive/10 border-destructive/30 cursor-pointer"
                >
                  <PowerOff className="h-3.5 w-3.5" />
                  <span>{closeRoomMutation.isPending ? 'Closing...' : 'Close Room'}</span>
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCsv}
                className="h-8 gap-1.5 text-xs font-medium cursor-pointer"
              >
                <Download className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Export CSV</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopySummary}
                className="h-8 gap-1.5 text-xs font-medium cursor-pointer"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                ) : (
                  <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                )}
                <span>{copied ? 'Copied' : 'Copy Summary'}</span>
              </Button>
            </div>
          </div>

          <div>
            <SheetTitle className="text-xl font-bold text-foreground line-clamp-2">
              {room.quizTitle}
            </SheetTitle>
            <SheetDescription className="text-xs text-muted-foreground pt-0.5">
              Comprehensive multiplayer session results, candidate standings, and performance
              analytics.
            </SheetDescription>
          </div>
        </SheetHeader>

        {/* Spacious 4-Column Analytics Summary Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-border border-b border-border bg-card/60">
          {/* 1. Candidates Count */}
          <div className="p-3.5 text-center space-y-0.5">
            <span className="text-[10px] font-mono uppercase text-muted-foreground tracking-wider flex items-center justify-center gap-1">
              <Users className="h-3 w-3 text-sky-500" />
              <span>Candidates</span>
            </span>
            <div className="text-xl font-black font-mono text-foreground tabular-nums">
              {participantsCount}
            </div>
            <p className="text-[11px] text-muted-foreground">Total participants</p>
          </div>

          {/* 2. Accuracy Rate */}
          <div className="p-3.5 text-center space-y-0.5">
            <span className="text-[10px] font-mono uppercase text-muted-foreground tracking-wider flex items-center justify-center gap-1">
              <Percent className="h-3 w-3 text-emerald-500" />
              <span>Accuracy</span>
            </span>
            <div
              className={cn(
                'text-xl font-black font-mono tabular-nums',
                accuracyRate >= 70
                  ? 'text-emerald-600'
                  : accuracyRate >= 50
                    ? 'text-amber-600'
                    : 'text-rose-600',
              )}
            >
              {accuracyRate}%
            </div>
            <p className="text-[11px] text-muted-foreground">Class average</p>
          </div>

          {/* 3. Average Score */}
          <div className="p-3.5 text-center space-y-0.5">
            <span className="text-[10px] font-mono uppercase text-muted-foreground tracking-wider flex items-center justify-center gap-1">
              <TrendingUp className="h-3 w-3 text-indigo-500" />
              <span>Avg Score</span>
            </span>
            <div className="text-xl font-black font-mono text-foreground tabular-nums">
              {averageScore.toLocaleString()}
            </div>
            <p className="text-[11px] text-muted-foreground">Points / student</p>
          </div>

          {/* 4. Needs Support Counter */}
          <div className="p-3.5 text-center space-y-0.5">
            <span className="text-[10px] font-mono uppercase text-muted-foreground tracking-wider flex items-center justify-center gap-1">
              <AlertCircle className="h-3 w-3 text-amber-500" />
              <span>Review (&lt;50%)</span>
            </span>
            <div
              className={cn(
                'text-xl font-black font-mono tabular-nums',
                needsSupportList.length > 0 ? 'text-amber-600' : 'text-emerald-600',
              )}
            >
              {needsSupportList.length}
            </div>
            <p className="text-[11px] text-muted-foreground">Students need support</p>
          </div>
        </div>

        {/* Single-Scroll Executive Report Flow (Zero Tab Switching Friction) */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Section 1: Actionable Insights / 3-Tier Performance Breakdown */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-indigo-500" />
                <h3 className="text-sm font-semibold text-foreground">
                  Class Performance Segmentation
                </h3>
              </div>
              <span className="text-xs font-mono text-muted-foreground">3 accuracy tiers</span>
            </div>

            {/* 3-Column Performance Tiers on Desktop */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {/* High Tier */}
              <div className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 flex flex-col justify-between space-y-2.5">
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                      <Trophy className="h-3.5 w-3.5" />
                      <span>Mastery (&ge; 80%)</span>
                    </div>
                    <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
                      {excellentList.length}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Exceptional command of the quiz material.
                  </p>
                </div>
                <div className="pt-2 border-t border-emerald-500/15">
                  <p className="text-[11px] text-foreground font-medium leading-relaxed">
                    {excellentList.length > 0 ? (
                      excellentList.map((c) => c.nickname).join(', ')
                    ) : (
                      <span className="text-muted-foreground italic font-normal">None</span>
                    )}
                  </p>
                </div>
              </div>

              {/* Mid Tier */}
              <div className="p-3.5 rounded-xl border border-border bg-card flex flex-col justify-between space-y-2.5">
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <div className="flex items-center gap-1.5 text-foreground">
                      <TrendingUp className="h-3.5 w-3.5 text-indigo-500" />
                      <span>Proficient (50-79%)</span>
                    </div>
                    <span className="font-mono font-bold text-foreground tabular-nums">
                      {passingList.length}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Satisfactory grasp with room for refinement.
                  </p>
                </div>
                <div className="pt-2 border-t border-border">
                  <p className="text-[11px] text-foreground font-medium leading-relaxed">
                    {passingList.length > 0 ? (
                      passingList.map((c) => c.nickname).join(', ')
                    ) : (
                      <span className="text-muted-foreground italic font-normal">None</span>
                    )}
                  </p>
                </div>
              </div>

              {/* Needs Support Tier */}
              <div className="p-3.5 rounded-xl border border-rose-500/20 bg-rose-500/5 flex flex-col justify-between space-y-2.5">
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <div className="flex items-center gap-1.5 text-rose-700 dark:text-rose-400">
                      <AlertCircle className="h-3.5 w-3.5" />
                      <span>Needs Review (&lt; 50%)</span>
                    </div>
                    <span className="font-mono font-bold text-rose-700 dark:text-rose-400 tabular-nums">
                      {needsSupportList.length}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Requires immediate review and support.
                  </p>
                </div>
                <div className="pt-2 border-t border-rose-500/15">
                  <p className="text-[11px] text-foreground font-medium leading-relaxed">
                    {needsSupportList.length > 0 ? (
                      needsSupportList.map((c) => c.nickname).join(', ')
                    ) : (
                      <span className="text-emerald-600 italic font-normal">
                        Great job! Zero students below 50%
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Detailed Candidate Standings Data Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-emerald-500" />
                <h3 className="text-sm font-semibold text-foreground">
                  Candidate Standings Roster
                </h3>
              </div>
              <span className="text-xs font-mono text-muted-foreground">
                {leaderboard.length} candidates listed
              </span>
            </div>

            {leaderboard.length === 0 ? (
              <div className="p-12 text-center text-xs text-muted-foreground border border-dashed border-border/80 rounded-lg space-y-1">
                <p className="text-sm font-semibold text-foreground">
                  No participant scores recorded
                </p>
                <p>No candidates joined or submitted answers during this room session.</p>
              </div>
            ) : (
              <div className="border border-border/70 rounded-lg overflow-hidden">
                {/* Table Header */}
                <div className="grid grid-cols-12 gap-2 px-4 py-2.5 bg-muted/40 text-xs font-mono font-medium text-muted-foreground border-b border-border/60 uppercase tracking-wider">
                  <span className="col-span-1 text-center">Rank</span>
                  <span className="col-span-4">Candidate</span>
                  <span className="col-span-2 text-right">Correct Qs</span>
                  <span className="col-span-3 text-center">Accuracy</span>
                  <span className="col-span-2 text-right">Score</span>
                </div>

                {/* Table Rows */}
                <div className="divide-y divide-border/40">
                  {leaderboard.map((entry) => {
                    const studentAcc =
                      totalQuestions > 0
                        ? Math.round((entry.correctAnswersCount / totalQuestions) * 100)
                        : 0;
                    const isLow = studentAcc < 50;

                    return (
                      <div
                        key={`${entry.rank}-${entry.nickname}`}
                        className="grid grid-cols-12 gap-2 px-4 py-3 items-center hover:bg-muted/20 transition-colors text-xs"
                      >
                        {/* 1. Rank */}
                        <div className="col-span-1 flex justify-center">
                          <span
                            className={cn(
                              'size-6 rounded-full flex items-center justify-center font-mono font-bold text-xs',
                              entry.rank === 1 &&
                                'bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/40',
                              entry.rank === 2 &&
                                'bg-slate-300/30 text-slate-700 dark:text-slate-300 border border-slate-300/50',
                              entry.rank === 3 &&
                                'bg-amber-700/20 text-amber-800 dark:text-amber-500 border border-amber-700/40',
                              entry.rank > 3 && 'bg-muted text-muted-foreground',
                            )}
                          >
                            {entry.rank}
                          </span>
                        </div>

                        {/* 2. Candidate Name */}
                        <div className="col-span-4 flex items-center gap-2 min-w-0">
                          <span
                            className="font-semibold text-foreground truncate"
                            title={entry.nickname}
                          >
                            {entry.nickname}
                          </span>
                          {isLow && (
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-rose-500/10 text-rose-600 border border-rose-500/20 shrink-0">
                              Review
                            </span>
                          )}
                        </div>

                        {/* 3. Correct Qs */}
                        <div className="col-span-2 text-right font-mono text-muted-foreground">
                          <strong className="text-foreground font-semibold">
                            {entry.correctAnswersCount}
                          </strong>{' '}
                          / {totalQuestions}
                        </div>

                        {/* 4. Accuracy with Visual Indicator */}
                        <div className="col-span-3 flex items-center justify-center gap-2">
                          <div className="w-16 bg-muted rounded-full h-1.5 overflow-hidden hidden sm:block">
                            <div
                              className={cn(
                                'h-full rounded-full',
                                studentAcc >= 70
                                  ? 'bg-emerald-500'
                                  : studentAcc >= 50
                                    ? 'bg-amber-500'
                                    : 'bg-rose-500',
                              )}
                              style={{ width: `${studentAcc}%` }}
                            />
                          </div>
                          <span
                            className={cn(
                              'font-mono font-semibold tabular-nums text-xs',
                              studentAcc >= 70
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : studentAcc >= 50
                                  ? 'text-amber-600'
                                  : 'text-rose-600',
                            )}
                          >
                            {studentAcc}%
                          </span>
                        </div>

                        {/* 5. Score */}
                        <div className="col-span-2 text-right font-mono tabular-nums">
                          <strong className="text-sm font-bold text-foreground">
                            {entry.score.toLocaleString()}
                          </strong>{' '}
                          <span className="text-[11px] text-muted-foreground font-normal">pts</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Room Metadata Information Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl border border-border bg-muted/20 text-xs font-mono">
            <div>
              <span className="text-muted-foreground block text-[10px] uppercase">
                Total Questions
              </span>
              <span className="font-semibold text-foreground text-sm">
                {room.totalQuestions} questions
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[10px] uppercase">
                Total Candidates
              </span>
              <span className="font-semibold text-foreground text-sm">
                {participantsCount} joined
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[10px] uppercase">
                Quiz Version
              </span>
              <span className="font-semibold text-foreground text-sm">v{room.quizVersion}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[10px] uppercase">
                Session Date
              </span>
              <span className="font-semibold text-foreground text-sm">
                {formatDate(room.createdAt)}
              </span>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
