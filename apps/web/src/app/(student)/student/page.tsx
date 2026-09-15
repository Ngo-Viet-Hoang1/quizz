'use client';

import {
  useAllClasses,
  useEnrolledClasses,
  useJoinClass,
  useMyExamHistory,
  usePublishedQuizzes,
  useStartPracticeQuiz,
} from '@/features/student-portal/api/student.api';
import {
  DashboardEnrolledClasses,
  DashboardHero,
  DashboardPublishedQuizzes,
  DashboardRecentAttempts,
  DashboardStats,
} from '@/features/student-portal/components/dashboard';
import type { IClass, IExamAttempt, IPublishedQuiz } from '@/features/student-portal/types';
import { calculateScorePercentage } from '@/features/student-portal/utils/exam.utils';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function StudentDashboardPage() {
  const router = useRouter();

  const { data: allClassesResponse, isLoading: isAllClassesLoading } = useAllClasses({ limit: 6 });
  const { data: enrolledClassesResponse } = useEnrolledClasses();
  const { data: publishedQuizzesResponse, isLoading: isQuizzesLoading } = usePublishedQuizzes({
    limit: 6,
  });
  const { data: historyData } = useMyExamHistory({ limit: 5 });

  const [joiningClassId, setJoiningClassId] = useState<string | null>(null);
  const joinClassMutation = useJoinClass();
  const startPracticeMutation = useStartPracticeQuiz();

  const handleJoinClass = async (code: string) => {
    setJoiningClassId(code);
    try {
      await joinClassMutation.mutateAsync(code);
      toast.success('Yêu cầu tham gia đã được gửi! Đang chờ giáo viên duyệt.');
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error
          ? err.message
          : 'Mã lớp không hợp lệ hoặc bạn đã gửi yêu cầu tham gia lớp này rồi.';
      toast.error(errorMsg);
    } finally {
      setJoiningClassId(null);
    }
  };

  const handleStartPractice = (quizId: string, title: string) => {
    startPracticeMutation.mutate(quizId, {
      onSuccess: (data) => {
        toast.success(`Starting quiz: "${title}"`);
        router.push(`/student/exam/${data.attempt._id}`);
      },
      onError: (err) => {
        toast.error(err.message || 'Failed to start quiz attempt.');
      },
    });
  };

  const orgClasses: IClass[] = allClassesResponse?.data ?? [];
  const enrolledClasses: IClass[] = enrolledClassesResponse?.data ?? [];
  const publishedQuizzes: IPublishedQuiz[] = publishedQuizzesResponse?.data ?? [];
  const recentAttempts: IExamAttempt[] = historyData?.data ?? [];

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
      <DashboardHero />

      <DashboardStats
        enrolledCount={enrolledClasses.length}
        totalAttempts={totalAttempts}
        avgScore={avgScore}
      />

      <DashboardEnrolledClasses
        classes={orgClasses.length > 0 ? orgClasses : enrolledClasses}
        isLoading={isAllClassesLoading}
        onJoinClass={handleJoinClass}
        joiningClassId={joiningClassId}
      />

      <DashboardPublishedQuizzes
        quizzes={publishedQuizzes}
        isLoading={isQuizzesLoading}
        onStartPractice={handleStartPractice}
        isStarting={startPracticeMutation.isPending}
      />

      <DashboardRecentAttempts recentAttempts={recentAttempts} />
    </div>
  );
}
