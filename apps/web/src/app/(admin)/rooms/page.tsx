'use client';

import { CreateRoomDialog } from '@/features/rooms/components/create-room-dialog';
import { RoomLeaderboardSheet } from '@/features/rooms/components/room-leaderboard-sheet';
import { useCloseRoom, useHostRooms, useHostRoomStats } from '@/features/rooms/hooks/use-rooms';
import { CopyableBadge } from '@/shared/components';
import { formatDate } from '@/shared/lib/date';
import { cn } from '@/shared/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/ui/alert-dialog';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { RoomResultItem } from '@repo/shared-types';
import {
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Percent,
  Plus,
  Radio,
  RefreshCw,
  Users,
} from 'lucide-react';
import { useState } from 'react';

export default function RoomsPage() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<RoomResultItem | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [roomToClose, setRoomToClose] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(9);

  const closeRoomMutation = useCloseRoom();
  const { data: response, isLoading, refetch, isFetching } = useHostRooms({ page, limit });
  const { data: stats } = useHostRoomStats();

  const rooms = response?.data || [];
  const meta = response?.meta;

  // Accurate Server-side Aggregates
  const totalRooms = stats?.totalRooms ?? meta?.total ?? rooms.length;
  const liveRoomsCount = stats?.liveRooms ?? 0;
  const totalParticipants = stats?.totalCandidates ?? 0;
  const overallAccuracy = stats?.overallAccuracy ?? null;
  const totalPages = meta?.totalPages ?? (Math.ceil(totalRooms / limit) || 1);

  const handleInspectRoom = (room: RoomResultItem) => {
    setSelectedRoom(room);
    setSheetOpen(true);
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* 1. Page Header with Clean Crisp Spacing */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Live Quiz Rooms
            </h1>
            <Badge
              variant="outline"
              className="border-emerald-500/30 text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 text-xs font-mono px-2.5 py-0.5"
            >
              Live Engine
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Host and manage interactive, real-time multiplayer assessment rooms with your students.
          </p>
        </div>

        {/* Header Action Buttons with Breathable Gap */}
        <div className="flex items-center gap-3 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="gap-2 h-9 px-3.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>

          <Button
            onClick={() => setCreateDialogOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 h-9 px-4 font-medium shadow-xs"
          >
            <Plus className="h-4 w-4" />
            <span>Host New Room</span>
          </Button>
        </div>
      </div>

      {/* 2. Sleek Unified KPI Bar with Light Annotations (2-tier layout, no truncation) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-border/60 rounded-xl border border-border/70 bg-card/70 backdrop-blur-sm shadow-2xs overflow-hidden">
        {/* Hosted Sessions */}
        <div
          className="p-3 sm:px-4 sm:py-2.5 flex flex-col justify-between hover:bg-muted/20 transition-colors"
          title="Total multiplayer quiz rooms you have hosted"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <Radio className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
              <span className="text-xs font-mono font-medium text-foreground uppercase tracking-wider truncate">
                Hosted
              </span>
            </div>
            <span className="text-base sm:text-lg font-bold font-mono text-foreground tabular-nums shrink-0">
              {totalRooms.toLocaleString()}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5 truncate">Total rooms created</p>
        </div>

        {/* Live Now */}
        <div
          className="p-3 sm:px-4 sm:py-2.5 flex flex-col justify-between hover:bg-muted/20 transition-colors"
          title="Multiplayer rooms currently open or in progress"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <span
                className={cn(
                  'size-2 rounded-full shrink-0',
                  liveRoomsCount > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-muted-foreground/40',
                )}
              />
              <span className="text-xs font-mono font-medium text-foreground uppercase tracking-wider truncate">
                Live Now
              </span>
            </div>
            <span
              className={cn(
                'text-base sm:text-lg font-bold font-mono tabular-nums shrink-0',
                liveRoomsCount > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground',
              )}
            >
              {liveRoomsCount}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
            {liveRoomsCount > 0 ? 'Active in session' : 'No active rooms'}
          </p>
        </div>

        {/* Candidates */}
        <div
          className="p-3 sm:px-4 sm:py-2.5 flex flex-col justify-between hover:bg-muted/20 transition-colors"
          title="Total student entries across all hosted sessions"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <Users className="h-3.5 w-3.5 text-sky-500 shrink-0" />
              <span className="text-xs font-mono font-medium text-foreground uppercase tracking-wider truncate">
                Candidates
              </span>
            </div>
            <span className="text-base sm:text-lg font-bold font-mono text-foreground tabular-nums shrink-0">
              {totalParticipants.toLocaleString()}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
            Total student participations
          </p>
        </div>

        {/* Class Accuracy */}
        <div
          className="p-3 sm:px-4 sm:py-2.5 flex flex-col justify-between hover:bg-muted/20 transition-colors"
          title="Average percentage of correct answers across all completed rooms"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <Percent className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
              <span className="text-xs font-mono font-medium text-foreground uppercase tracking-wider truncate">
                Accuracy
              </span>
            </div>
            <span
              className={cn(
                'text-base sm:text-lg font-bold font-mono tabular-nums shrink-0',
                overallAccuracy !== null && overallAccuracy >= 70
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : overallAccuracy !== null && overallAccuracy >= 50
                    ? 'text-amber-600'
                    : 'text-foreground',
              )}
            >
              {overallAccuracy !== null ? `${overallAccuracy}%` : '---'}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
            Class average answer rate
          </p>
        </div>
      </div>

      {/* 3. Session Cards: Modern, Relaxed, Interactive Grid (No rigid DataTable) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-emerald-500" />
            <h2 className="text-base font-semibold text-foreground">Recent Live Sessions</h2>
          </div>
          <span className="text-xs font-mono text-muted-foreground">
            {rooms.length} sessions listed
          </span>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-48 rounded-xl border border-border/60 bg-muted/20 animate-pulse"
              />
            ))}
          </div>
        ) : rooms.length === 0 ? (
          <Card className="p-12 text-center border-dashed border-border/80 space-y-4">
            <div className="size-12 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mx-auto">
              <Radio className="h-6 w-6" />
            </div>
            <div className="space-y-1 max-w-sm mx-auto">
              <h3 className="text-base font-semibold text-foreground">No live rooms hosted yet</h3>
              <p className="text-xs text-muted-foreground">
                Launch your first interactive room session directly from here or from any assessment
                in your Quiz Bank.
              </p>
            </div>
            <div className="pt-2">
              <Button
                onClick={() => setCreateDialogOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 h-9 px-4 font-medium"
              >
                <Plus className="h-4 w-4" />
                <span>Host Your First Quiz</span>
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {rooms.map((room) => {
              const winner = room.leaderboard?.[0];
              const isEnded = Boolean(room.endedAt);

              // Calculate room accuracy
              const roomCorrect =
                room.leaderboard?.reduce((sum, e) => sum + (e.correctAnswersCount || 0), 0) || 0;
              const roomPossible = (room.leaderboard?.length || 0) * (room.totalQuestions || 1);
              const roomAccuracy =
                roomPossible > 0 ? Math.round((roomCorrect / roomPossible) * 100) : null;

              return (
                <Card
                  key={room._id}
                  onClick={() => handleInspectRoom(room)}
                  className="p-4 sm:p-5 flex flex-col justify-between hover:border-primary/50 hover:shadow-xs transition-all bg-card border-border/70 cursor-pointer group select-none"
                >
                  {/* Card Body: Header, 3-Line Reserved Title, Hairline Stats, Minimal Outcome */}
                  <div className="space-y-3">
                    {/* 1. Header: PIN, Version, Status, Date */}
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {isEnded ? (
                          <span className="font-mono text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded text-[11px] border border-border/50">
                            PIN {room.pin}
                          </span>
                        ) : (
                          <CopyableBadge value={room.pin} prefix="PIN:" label="Room PIN" />
                        )}

                        <span
                          className={cn(
                            'text-[11px] font-mono px-1.5 py-0.5 rounded border inline-flex items-center gap-1 shrink-0',
                            isEnded
                              ? 'bg-muted/40 text-muted-foreground border-border/50'
                              : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 font-medium',
                          )}
                        >
                          {!isEnded && (
                            <span className="size-1.5 rounded-full bg-emerald-600 animate-pulse" />
                          )}
                          {isEnded ? 'Concluded' : 'Live Now'}
                        </span>

                        <span className="text-[10px] font-mono text-muted-foreground border border-border/40 px-1 rounded shrink-0">
                          v{room.quizVersion}
                        </span>
                      </div>

                      <span className="font-mono text-muted-foreground text-[11px] shrink-0">
                        {formatDate(room.createdAt)}
                      </span>
                    </div>

                    {/* 2. Quiz Title: Strictly reserved 3-line height (60px = 3 x 20px leading-5). 
                         If 1 or 2 lines, remaining space stays blank to guarantee 100% vertical alignment across all cards. */}
                    <div className="h-[60px] flex flex-col justify-start">
                      <h3
                        className="text-sm font-semibold text-foreground leading-5 line-clamp-3 group-hover:text-primary transition-colors"
                        title={room.quizTitle}
                      >
                        {room.quizTitle}
                      </h3>
                    </div>

                    {/* 3. Hairline Minimal Metrics (Balanced 3-column grid, no loud backgrounds) */}
                    <div className="grid grid-cols-3 divide-x divide-border/50 py-2 border-y border-border/40 text-xs font-mono text-muted-foreground text-center">
                      <div>
                        <strong className="text-foreground font-semibold">
                          {room.totalQuestions}
                        </strong>{' '}
                        Qs
                      </div>
                      <div>
                        <strong className="text-foreground font-semibold">
                          {room.participantsCount}
                        </strong>{' '}
                        joined
                      </div>
                      <div>
                        <strong
                          className={cn(
                            'font-semibold',
                            roomAccuracy !== null && roomAccuracy >= 70
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-foreground',
                          )}
                        >
                          {roomAccuracy !== null ? `${roomAccuracy}%` : '—'}
                        </strong>{' '}
                        acc
                      </div>
                    </div>

                    {/* 4. Compact Bottom Row: Status / Winner + Action Affordance */}
                    <div className="h-7 flex items-center justify-between text-xs pt-0.5">
                      <div className="min-w-0 flex-1 pr-2">
                        {winner ? (
                          <div className="flex items-center gap-1 text-muted-foreground truncate font-mono text-[11px]">
                            <span>Top:</span>
                            <span className="text-foreground font-medium truncate">
                              {winner.nickname}
                            </span>
                            <span className="tabular-nums text-muted-foreground shrink-0">
                              ({winner.score.toLocaleString()} pts)
                            </span>
                          </div>
                        ) : !isEnded ? (
                          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-sans text-xs">
                            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span>In progress</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-[11px] font-mono">
                            No submissions
                          </span>
                        )}
                      </div>

                      <div className="shrink-0 flex items-center gap-1.5">
                        {!isEnded ? (
                          <>
                            <Button
                              variant="default"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(`/room/host?pin=${room.pin}`, '_blank');
                              }}
                              className="gap-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white h-7 px-2.5 font-medium cursor-pointer shadow-xs"
                            >
                              <Radio className="h-3 w-3" />
                              <span>Host</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setRoomToClose(room.pin);
                              }}
                              className="text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 hover:border-destructive/30 h-7 px-2 font-mono cursor-pointer"
                              title="End and close live session"
                            >
                              Close
                            </Button>
                            <span className="text-xs text-muted-foreground group-hover:text-primary transition-colors flex items-center gap-0.5 font-mono">
                              Report <ArrowUpRight className="h-3 w-3" />
                            </span>
                          </>
                        ) : (
                          <span className="text-xs font-mono font-medium text-muted-foreground group-hover:text-primary transition-colors flex items-center gap-0.5">
                            <span>Report</span>
                            <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* 4. Responsive Server-side Pagination Bar */}
        {totalRooms > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-border">
            <div className="text-xs font-mono text-muted-foreground">
              Showing <strong className="text-foreground">{(page - 1) * limit + 1}</strong> to{' '}
              <strong className="text-foreground">{Math.min(page * limit, totalRooms)}</strong> of{' '}
              <strong className="text-foreground">{totalRooms}</strong> rooms
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 mr-2">
                <span className="text-xs font-mono text-muted-foreground hidden xs:inline">
                  Per page:
                </span>
                <Select
                  value={String(limit)}
                  onValueChange={(val) => {
                    if (val) {
                      setLimit(Number(val));
                      setPage(1);
                    }
                  }}
                >
                  <SelectTrigger size="sm" className="h-8 w-16 font-mono text-xs">
                    <SelectValue>{String(limit)}</SelectValue>
                  </SelectTrigger>
                  <SelectContent side="top" className="font-mono text-xs">
                    {[6, 9, 18, 30].map((size) => (
                      <SelectItem key={size} value={String(size)}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1 || isFetching}
                  title="Previous page"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <div className="px-2.5 text-xs font-mono font-medium text-foreground">
                  {page} / {totalPages}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages || isFetching}
                  title="Next page"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Dialogs */}
      <CreateRoomDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />

      <RoomLeaderboardSheet room={selectedRoom} open={sheetOpen} onOpenChange={setSheetOpen} />

      {/* Confirmation Dialog to Close Live Room */}
      <AlertDialog
        open={Boolean(roomToClose)}
        onOpenChange={(open) => {
          if (!open && !closeRoomMutation.isPending) {
            setRoomToClose(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Close Live Room PIN: {roomToClose}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will immediately conclude the live quiz session, finalize participants&apos;
              scores, and mark this room as concluded. Connected players will transition to the
              final podium.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={closeRoomMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (roomToClose) {
                  try {
                    await closeRoomMutation.mutateAsync(roomToClose);
                    setRoomToClose(null);
                  } catch {
                    // Error handled in hook toast
                  }
                }
              }}
              disabled={closeRoomMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {closeRoomMutation.isPending ? 'Closing...' : 'Close Room'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
