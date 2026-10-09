'use client';

import {
  useClassAssignments,
  useClassDetail,
  useClassMembers,
  useLeaveClass,
  useMyExamHistory,
  useOrgMembers,
  useStartExamAttempt,
} from '@/features/student-portal/api/student.api';
import { SimplePagination } from '@/features/student-portal/components/common/simple-pagination';
import type { IClassMember, IQuizAssignment } from '@/features/student-portal/types';
import { calculateScorePercentage, getIdStr } from '@/features/student-portal/utils/exam.utils';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { Skeleton } from '@/shared/ui/skeleton';
import { useQueries } from '@tanstack/react-query';
import { useApiClient } from '@/shared/lib/api-client';
import {
  AlertCircle,
  ArrowLeft,
  BookOpenCheck,
  Calendar,
  CheckCircle2,
  Clock,
  GraduationCap,
  Layers,
  LogOut,
  Mail,
  Play,
  ShieldCheck,
  User,
  Users2,
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

interface FetchedQuizDetail {
  _id: string;
  title: string;
  description?: string;
  category?: string;
  questionCount?: number;
  timeLimitSec?: number;
}

export default function ClassDetailPage() {
  const params = useParams();
  const router = useRouter();
  const client = useApiClient();
  const classId = Array.isArray(params?.id) ? params.id[0] : (params?.id as string);

  const [activeTab, setActiveTab] = useState<'ASSIGNMENTS' | 'MEMBERS'>('ASSIGNMENTS');
  const [assignmentPage, setAssignmentPage] = useState(1);
  const [memberPage, setMemberPage] = useState(1);

  const {
    data: classDetail,
    isLoading: isClassLoading,
    error: classError,
  } = useClassDetail(classId);

  const { data: assignmentsResponse, isLoading: isAssignmentsLoading } = useClassAssignments(
    classId,
    { page: assignmentPage, limit: 10 },
  );

  const { data: membersResponse, isLoading: isMembersLoading } = useClassMembers(classId);

  const { data: myHistoryResponse } = useMyExamHistory({ limit: 100 });
  const myAttempts = myHistoryResponse?.data ?? [];

  const assignmentAttemptMap = new Map(myAttempts.map((att) => [getIdStr(att.assignmentId), att]));

  const { data: orgMembers } = useOrgMembers();

  const memberUserMap = new Map((orgMembers ?? []).map((m) => [m.userId, m]));

  const startExamMutation = useStartExamAttempt();
  const leaveClassMutation = useLeaveClass();

  const assignments: IQuizAssignment[] = assignmentsResponse?.data ?? [];
  const assignmentsMeta = assignmentsResponse?.meta;

  const members: IClassMember[] = membersResponse?.data ?? [];
  const membersMeta = membersResponse?.meta;

  const quizQueries = useQueries({
    queries: assignments.map((assignment) => ({
      queryKey: ['quizzes', 'detail', assignment.quizId],
      queryFn: () => client.get<FetchedQuizDetail>(`/quizzes/${assignment.quizId}`),
      enabled: Boolean(assignment.quizId),
      staleTime: 60_000,
    })),
  });

  const handleStartExam = (assignment: IQuizAssignment) => {
    startExamMutation.mutate(
      { quizId: assignment.quizId, assignmentId: assignment._id },
      {
        onSuccess: (data) => {
          toast.success('Starting quiz attempt!');
          router.push(`/student/exam/${data.attempt._id}`);
        },
        onError: (err) => toast.error(err.message || 'Unable to start exam.'),
      },
    );
  };

  const handleLeaveClass = () => {
    if (!classDetail?.name) return;
    if (!confirm(`Are you sure you want to leave "${classDetail.name}"?`)) return;

    leaveClassMutation.mutate(classId, {
      onSuccess: () => {
        toast.success(`Left class ${classDetail.name}`);
        router.push('/student/classes');
      },
      onError: (err) => toast.error(err.message || 'Unable to leave class.'),
    });
  };

  if (isClassLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-40 rounded-xl" />
        <Skeleton className="h-44 rounded-3xl" />
        <Skeleton className="h-64 rounded-3xl" />
      </div>
    );
  }

  if (classError || !classDetail) {
    return (
      <Card className="rounded-3xl border border-dashed p-10 text-center bg-muted/20 space-y-4">
        <Users2 className="size-12 mx-auto text-muted-foreground/40" />
        <h3 className="text-lg font-bold text-foreground">Class not found</h3>
        <p className="text-xs text-muted-foreground max-w-sm mx-auto">
          The class you are looking for may have been removed or you do not have permission to view
          it.
        </p>
        <Link href="/student/classes">
          <Button variant="outline" className="rounded-xl font-semibold text-xs">
            ← Back to Classes
          </Button>
        </Link>
      </Card>
    );
  }

  // Resolve teacher — prefer org member lookup, fall back to embedded owner object
  const teacher = memberUserMap.get(classDetail.ownerId) ?? classDetail.owner ?? null;
  const isPending = classDetail.membershipStatus === 'pending';

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/student/classes"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
          Back to My Classes
        </Link>
      </div>

      <div className="rounded-3xl border border-border/80 bg-card p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <Badge className="bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border-sky-200 font-semibold text-xs px-2.5 py-0.5">
                Classroom
              </Badge>
              {classDetail.membershipStatus === 'active' && (
                <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-xs font-bold flex items-center gap-1">
                  <CheckCircle2 className="size-3" /> Enrolled
                </Badge>
              )}
              {isPending && (
                <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 text-xs font-bold">
                  Pending Approval
                </Badge>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              {classDetail.name}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl">
              {classDetail.description ||
                'Academic course and examination quizzes in your organization.'}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {classDetail.membershipStatus === 'active' && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleLeaveClass}
                disabled={leaveClassMutation.isPending}
                className="rounded-xl text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 border-red-200 dark:border-red-900 gap-1.5"
              >
                <LogOut className="size-3.5" />
                Leave Class
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-border/60">
          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-muted/30 border border-border/50">
            <div className="flex size-10 items-center justify-center rounded-xl bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 shrink-0 overflow-hidden">
              {teacher?.avatarUrl ? (
                <img
                  src={teacher.avatarUrl}
                  alt={teacher.fullName}
                  className="size-10 object-cover"
                />
              ) : (
                <GraduationCap className="size-5" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                Instructor
              </p>
              <h4 className="font-bold text-xs text-foreground truncate">
                {teacher?.fullName ||
                  (classDetail.ownerId
                    ? `Teacher #${classDetail.ownerId.slice(-6)}`
                    : 'Assigned Teacher')}
              </h4>
              {teacher?.email && (
                <p className="text-[11px] text-muted-foreground truncate">{teacher.email}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-muted/30 border border-border/50">
            <div className="flex size-10 items-center justify-center rounded-xl bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 shrink-0">
              <Users2 className="size-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                Class Members
              </p>
              <h4 className="font-bold text-base text-foreground">
                {classDetail.memberCount ?? members.length} Students
              </h4>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-muted/30 border border-border/50">
            <div className="flex size-10 items-center justify-center rounded-xl bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 shrink-0">
              <BookOpenCheck className="size-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                Assigned Quizzes
              </p>
              <h4 className="font-bold text-base text-foreground">
                {classDetail.assignmentCount ?? assignments.length} Quizzes
              </h4>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 border-b pb-2">
        {(['ASSIGNMENTS', 'MEMBERS'] as const).map((tab) => (
          <Button
            key={tab}
            variant={activeTab === tab ? 'default' : 'ghost'}
            onClick={() => setActiveTab(tab)}
            className={`rounded-xl font-semibold text-xs ${
              activeTab === tab
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab === 'ASSIGNMENTS'
              ? `Assigned Quizzes (${assignmentsMeta?.total ?? assignments.length})`
              : `Class Members (${membersMeta?.total ?? members.length})`}
          </Button>
        ))}
      </div>

      {activeTab === 'ASSIGNMENTS' && (
        <div className="space-y-4">
          {isAssignmentsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-36 rounded-2xl" />
              ))}
            </div>
          ) : isPending ? (
            <Card className="rounded-2xl border border-dashed p-10 text-center bg-amber-500/5">
              <Clock className="size-10 mx-auto text-amber-500/60 mb-2.5" />
              <h3 className="font-bold text-sm text-amber-800 dark:text-amber-300">
                Awaiting Teacher Approval
              </h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                Your request to join this class has been sent. You will be able to take quizzes once
                the teacher approves your membership.
              </p>
            </Card>
          ) : assignments.length === 0 ? (
            <Card className="rounded-2xl border border-dashed p-10 text-center bg-muted/20">
              <BookOpenCheck className="size-10 mx-auto text-muted-foreground/40 mb-2.5" />
              <h3 className="font-bold text-sm text-foreground">No quizzes assigned yet</h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                Your teacher has not published any quizzes for this class yet.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {assignments.map((assignment: IQuizAssignment, index: number) => {
                const fetchedQuiz = quizQueries[index]?.data as FetchedQuizDetail | undefined;
                const quiz = fetchedQuiz ?? assignment.quiz;
                const quizTitle =
                  quiz?.title ??
                  (assignment.quizId ? `Quiz #${assignment.quizId.slice(-6)}` : 'Class Quiz');
                const durationMins = quiz?.timeLimitSec ? Math.round(quiz.timeLimitSec / 60) : null;
                const questionCount = quiz?.questionCount ?? 0;
                const category = quiz?.category ?? 'Assignment';
                const isPastDue = Boolean(
                  assignment.dueAt && new Date(assignment.dueAt).getTime() < Date.now(),
                );
                const isExpired = isPastDue && !assignment.allowLateSubmit;

                // Check student attempt state for this specific class assignment
                const userAttempt = assignmentAttemptMap.get(getIdStr(assignment._id));
                const isSubmitted =
                  userAttempt?.status === 'submitted' || userAttempt?.status === 'force_submitted';
                const isInProgress = userAttempt?.status === 'in_progress';

                return (
                  <Card
                    key={assignment._id}
                    className={`rounded-2xl border transition-all overflow-hidden flex flex-col justify-between p-5 bg-card space-y-4 ${
                      isSubmitted
                        ? 'border-emerald-500/40 bg-emerald-500/[0.02]'
                        : isInProgress
                          ? 'border-amber-500/40 bg-amber-500/[0.02]'
                          : 'border-border/70 hover:border-sky-500/40 hover:shadow-sm'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Badge
                            variant="outline"
                            className="bg-sky-50/60 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border-sky-200 text-[10px] font-bold"
                          >
                            {category}
                          </Badge>

                          {isSubmitted && (
                            <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-[10px] font-bold flex items-center gap-1">
                              <CheckCircle2 className="size-3" />
                              Completed:{' '}
                              {calculateScorePercentage(userAttempt.score, userAttempt.totalPoints)}
                              %
                            </Badge>
                          )}

                          {isInProgress && (
                            <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 text-[10px] font-bold flex items-center gap-1">
                              <Clock className="size-3" />
                              In Progress
                            </Badge>
                          )}
                        </div>

                        {assignment.dueAt && (
                          <span
                            className={`text-[11px] font-semibold flex items-center gap-1 ${
                              isExpired && !isSubmitted
                                ? 'text-rose-600 dark:text-rose-400'
                                : isPastDue && !isSubmitted
                                  ? 'text-amber-600 dark:text-amber-400'
                                  : 'text-muted-foreground'
                            }`}
                          >
                            {isExpired && !isSubmitted ? (
                              <AlertCircle className="size-3 text-rose-600 dark:text-rose-400" />
                            ) : (
                              <Clock className="size-3" />
                            )}
                            {isExpired && !isSubmitted
                              ? `Expired: ${new Date(assignment.dueAt).toLocaleDateString()}`
                              : `Due: ${new Date(assignment.dueAt).toLocaleDateString()}`}
                          </span>
                        )}
                      </div>

                      <h3 className="font-bold text-base text-foreground line-clamp-1">
                        {quizTitle}
                      </h3>
                      {quiz?.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {quiz.description}
                        </p>
                      )}

                      <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1 font-medium">
                        <span className="flex items-center gap-1">
                          <Layers className="size-3.5 text-sky-600" />
                          {questionCount} Questions
                        </span>
                        {durationMins && (
                          <span className="flex items-center gap-1">
                            <Clock className="size-3.5 text-amber-600" />
                            {durationMins} mins
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-border/50">
                      {isSubmitted ? (
                        <Link
                          href={`/student/exam/${userAttempt._id}/result`}
                          className="w-full block"
                        >
                          <Button
                            variant="outline"
                            className="w-full h-9 rounded-xl font-semibold text-xs border-emerald-500/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 gap-1.5 transition-all"
                          >
                            <CheckCircle2 className="size-3.5 text-emerald-600" />
                            View Result ({userAttempt.score}/{userAttempt.totalPoints} pts)
                          </Button>
                        </Link>
                      ) : isInProgress ? (
                        <Link href={`/student/exam/${userAttempt._id}`} className="w-full block">
                          <Button className="w-full h-9 rounded-xl font-semibold text-xs bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition-all gap-1.5">
                            <Play className="size-3.5 fill-current" />
                            Continue Exam
                          </Button>
                        </Link>
                      ) : isExpired ? (
                        <Button
                          disabled
                          className="w-full h-9 rounded-xl font-semibold text-xs opacity-60 bg-muted text-muted-foreground cursor-not-allowed"
                        >
                          Deadline Passed
                        </Button>
                      ) : (
                        <Button
                          onClick={() => handleStartExam(assignment)}
                          disabled={startExamMutation.isPending}
                          className="w-full h-9 rounded-xl font-semibold text-xs bg-sky-600 hover:bg-sky-700 text-white shadow-xs transition-all gap-1.5"
                        >
                          <Play className="size-3.5 fill-current" />
                          {isPastDue && assignment.allowLateSubmit
                            ? 'Start Late Exam'
                            : 'Start Exam'}
                        </Button>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          <SimplePagination
            page={assignmentPage}
            totalPages={assignmentsMeta?.totalPages ?? 1}
            onPageChange={setAssignmentPage}
          />
        </div>
      )}

      {/* ═══ TAB: Class Members ═══ */}
      {activeTab === 'MEMBERS' && (
        <div className="space-y-4">
          {isMembersLoading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-2xl" />
              ))}
            </div>
          ) : members.length === 0 ? (
            <Card className="rounded-2xl border border-dashed p-10 text-center bg-muted/20">
              <Users2 className="size-10 mx-auto text-muted-foreground/40 mb-2.5" />
              <h3 className="font-bold text-sm text-foreground">No members found</h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                No active students or assistants enrolled in this class yet.
              </p>
            </Card>
          ) : (
            <Card className="rounded-2xl border border-border/70 bg-card overflow-hidden">
              <div className="divide-y divide-border/50">
                {members.map((member: IClassMember) => {
                  const u = member.user ?? memberUserMap.get(member.userId);
                  const isAssistant = member.role === 'assistant';

                  return (
                    <div
                      key={member._id}
                      className="p-4 flex items-center justify-between gap-3 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex size-9 items-center justify-center rounded-xl bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 shrink-0 overflow-hidden">
                          {u?.avatarUrl ? (
                            <img
                              src={u.avatarUrl}
                              alt={u.fullName}
                              className="size-9 object-cover"
                            />
                          ) : (
                            <User className="size-4" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm text-foreground truncate">
                              {u?.fullName ?? `User #${member.userId.slice(-6)}`}
                            </h4>
                            {isAssistant && (
                              <Badge className="bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30 text-[10px] font-bold flex items-center gap-1">
                                <ShieldCheck className="size-3" /> Assistant
                              </Badge>
                            )}
                          </div>
                          {u?.email && (
                            <p className="text-xs text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                              <Mail className="size-3" /> {u.email}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="text-right text-[11px] text-muted-foreground shrink-0 flex items-center gap-1 font-medium">
                        <Calendar className="size-3" />
                        Joined:{' '}
                        {member.joinedAt ? new Date(member.joinedAt).toLocaleDateString() : 'N/A'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          <SimplePagination
            page={memberPage}
            totalPages={membersMeta?.totalPages ?? 1}
            onPageChange={setMemberPage}
          />
        </div>
      )}
    </div>
  );
}
