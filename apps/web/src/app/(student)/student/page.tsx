'use client';

import {
  useEnrolledClasses,
  useJoinClass,
  useMyExamHistory,
} from '@/features/student-portal/api/student.api';
import type { IClass, IExamAttempt } from '@/features/student-portal/types';
import { calculateScorePercentage, isExamPassed } from '@/features/student-portal/utils/exam.utils';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardContent } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';

import {
  Award,
  BookOpenCheck,
  CheckCircle2,
  ChevronRight,
  Clock,
  GraduationCap,
  Play,
  Sparkles,
  Trophy,
  Users2,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';

export default function StudentDashboardPage() {
  const [classCode, setClassCode] = useState('');
  const { data: classesResponse, isLoading: isClassesLoading } = useEnrolledClasses();
  const { data: historyData } = useMyExamHistory({ limit: 5 });

  const joinClassMutation = useJoinClass();

  const handleJoinClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!classCode.trim()) {
      toast.error('Please enter a class join code!');
      return;
    }
    joinClassMutation.mutate(classCode.trim(), {
      onSuccess: () => {
        toast.success('Joined class successfully! 🎉');
        setClassCode('');
      },
      onError: (err) => {
        toast.error(err.message || 'Invalid class code or you have already joined this class.');
      },
    });
  };

  const classes: IClass[] = classesResponse?.data ?? [];
  const recentAttempts: IExamAttempt[] = historyData?.data ?? [];

  // Calculate high-level stats
  const totalAttempts = historyData?.meta?.total ?? recentAttempts.length;
  const avgScore =
    recentAttempts.length > 0
      ? Math.round(
          recentAttempts.reduce(
            (acc, curr) => acc + calculateScorePercentage(curr.score, curr.totalPoints),
            0,
          ) / recentAttempts.length,
        )
      : 0;

  return (
    <div className="space-y-8">
      {/* HERO BANNER & JOIN CLASS CODE BOX */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 text-white p-8 sm:p-12 shadow-xl border border-slate-800">
        <div className="relative z-10 max-w-3xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-slate-200 text-xs font-bold border border-white/10">
            <Sparkles className="size-4 text-amber-400 fill-amber-400" />
            <span>STUDENT LEARNING PORTAL</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Welcome back! 👋 <br />
            <span className="text-indigo-300">Ready for your next exam?</span>
          </h1>

          <p className="text-slate-300 text-sm sm:text-base max-w-xl mx-auto font-medium">
            Enter the Join Code provided by your teacher to attempt online quizzes instantly.
          </p>

          {/* Join Box */}
          <form
            onSubmit={handleJoinClass}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-xl mx-auto pt-2"
          >
            <div className="relative w-full sm:flex-1">
              <Input
                type="text"
                placeholder="Enter class join code (e.g. CLASS123)..."
                value={classCode}
                onChange={(e) => setClassCode(e.target.value)}
                className="h-14 px-6 rounded-2xl bg-white text-slate-900 placeholder:text-slate-400 font-bold text-base shadow-md border-2 border-transparent focus-visible:border-indigo-500 focus-visible:ring-0"
              />
            </div>
            <Button
              type="submit"
              size="lg"
              disabled={joinClassMutation.isPending}
              className="h-14 px-8 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-base shadow-md transition-all w-full sm:w-auto gap-2"
            >
              <Play className="size-5 fill-current" />
              <span>{joinClassMutation.isPending ? 'Joining...' : 'Join'}</span>
            </Button>
          </form>
        </div>
      </div>

      {/* 📊 REAL STATS OVERVIEW */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Stat 1 */}
        <Card className="rounded-2xl border bg-card/60 backdrop-blur-sm p-5 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Users2 className="size-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Enrolled Classes
              </p>
              <h3 className="text-2xl font-black tracking-tight">{classes.length}</h3>
            </div>
          </div>
        </Card>

        {/* Stat 2 */}
        <Card className="rounded-2xl border bg-card/60 backdrop-blur-sm p-5 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <BookOpenCheck className="size-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Exams Attempted
              </p>
              <h3 className="text-2xl font-black tracking-tight">{totalAttempts}</h3>
            </div>
          </div>
        </Card>

        {/* Stat 3 */}
        <Card className="rounded-2xl border bg-card/60 backdrop-blur-sm p-5 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Trophy className="size-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Average Score
              </p>
              <h3 className="text-2xl font-black tracking-tight">{avgScore}%</h3>
            </div>
          </div>
        </Card>
      </div>

      {/* 📚 ENROLLED CLASSES SECTION */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold tracking-tight flex items-center gap-2">
              <GraduationCap className="size-6 text-indigo-600" />
              My Classes
            </h2>
            <p className="text-xs text-muted-foreground">
              Classes you have joined and assigned quizzes
            </p>
          </div>
          <Link href="/student/classes">
            <Button
              variant="ghost"
              size="sm"
              className="text-indigo-600 font-bold gap-1 hover:text-indigo-700"
            >
              View All <ChevronRight className="size-4" />
            </Button>
          </Link>
        </div>

        {isClassesLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-40 rounded-2xl bg-muted/40 animate-pulse" />
            ))}
          </div>
        ) : classes.length === 0 ? (
          <Card className="rounded-2xl border border-dashed p-8 text-center bg-muted/20">
            <Users2 className="size-12 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-sm font-bold text-foreground">No enrolled classes yet</p>
            <p className="text-xs text-muted-foreground mt-1 mb-4">
              Enter a class code in the box above to get started!
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {classes.slice(0, 3).map((cls: IClass) => (
              <Card
                key={cls._id}
                className="rounded-2xl border border-border/60 hover:border-indigo-500/50 hover:shadow-md transition-all overflow-hidden flex flex-col group p-0"
              >
                <div className="h-20 bg-indigo-600 p-4 flex items-end justify-between relative">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-white/20 backdrop-blur-md text-white border-none font-bold text-xs">
                      Code: {cls.code ?? cls._id.slice(-6).toUpperCase()}
                    </Badge>
                    {cls.membershipStatus === 'pending' && (
                      <Badge className="bg-amber-500/80 backdrop-blur-md text-white border-none font-bold text-xs">
                        Pending
                      </Badge>
                    )}
                  </div>
                  <Users2 className="size-8 text-white/30 absolute top-3 right-3" />
                </div>

                <CardContent className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="font-extrabold text-base text-foreground group-hover:text-indigo-600 transition-colors">
                      {cls.name}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                      {cls.description || 'No description provided'}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-border/60">
                    {cls.membershipStatus === 'pending' ? (
                      <Button
                        disabled
                        className="w-full h-10 rounded-xl font-bold text-xs gap-1.5 opacity-60 bg-muted text-muted-foreground"
                      >
                        Pending Approval
                      </Button>
                    ) : (
                      <Link href="/student/classes" className="w-full block">
                        <Button className="w-full h-10 rounded-xl font-bold text-xs gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-all">
                          <Play className="size-3.5 fill-current" /> Start Exam
                        </Button>
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* ⏱️ RECENT QUIZ ATTEMPTS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold tracking-tight flex items-center gap-2">
              <Award className="size-6 text-indigo-600" />
              Recent Exam Results
            </h2>
            <p className="text-xs text-muted-foreground">
              Track your progress and review detailed explanations
            </p>
          </div>
          <Link href="/student/history">
            <Button
              variant="ghost"
              size="sm"
              className="text-indigo-600 font-bold gap-1 hover:text-indigo-700"
            >
              Full History <ChevronRight className="size-4" />
            </Button>
          </Link>
        </div>

        {recentAttempts.length === 0 ? (
          <Card className="rounded-2xl border p-8 text-center text-muted-foreground">
            <BookOpenCheck className="size-10 mx-auto text-muted-foreground/30 mb-2" />
            <p className="text-sm font-semibold">No exam attempts completed yet</p>
          </Card>
        ) : (
          <Card className="rounded-2xl border p-0 overflow-hidden bg-card/60 backdrop-blur-sm shadow-xs">
            <div className="divide-y divide-border/60">
              {recentAttempts.map((attempt: IExamAttempt) => {
                const pct = calculateScorePercentage(attempt.score, attempt.totalPoints);
                const isPassed = isExamPassed(attempt.score, attempt.totalPoints);

                const quizTitle =
                  typeof attempt.quizId === 'object' && attempt.quizId?.title
                    ? attempt.quizId.title
                    : attempt.quizTitle ||
                      `Quiz #${(typeof attempt.quizId === 'string' ? attempt.quizId : (attempt.quizId?._id ?? '')).slice(-6)}`;

                return (
                  <div
                    key={attempt._id}
                    className="p-3.5 sm:px-5 hover:bg-muted/40 transition-colors flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div
                        className={`flex size-10 items-center justify-center rounded-xl shrink-0 font-extrabold text-xs ${
                          isPassed
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                            : 'bg-red-500/15 text-red-600 dark:text-red-400'
                        }`}
                      >
                        {pct}%
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-sm text-foreground truncate max-w-xs sm:max-w-md">
                          {quizTitle}
                        </h4>
                        <div className="flex items-center gap-2.5 text-xs text-muted-foreground font-medium mt-0.5">
                          <span className="flex items-center gap-1">
                            <CheckCircle2 className="size-3 text-emerald-500 shrink-0" />{' '}
                            {attempt.correctCount} correct
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="size-3 shrink-0" />{' '}
                            {attempt.submittedAt
                              ? new Date(attempt.submittedAt).toLocaleDateString()
                              : 'Just now'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <Link href={`/student/exam/${attempt._id}/result`} className="shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-xl font-bold text-xs h-8 px-3 gap-1.5"
                      >
                        View Details
                      </Button>
                    </Link>
                  </div>
                );
              })}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
