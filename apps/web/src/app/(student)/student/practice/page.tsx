'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { BookOpenCheck, Clock, Layers, Play, Search, Tag, X } from 'lucide-react';

import {
  usePublishedQuizzes,
  useStartPracticeQuiz,
} from '@/features/student-portal/api/student.api';
import type { IPublishedQuiz } from '@/features/student-portal/types';

import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardContent } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';

// ─── Difficulty color mapping ───
const DIFFICULTY_STYLES: Record<string, string> = {
  easy: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
  medium: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30',
  hard: 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30',
};

function formatTimeLimit(sec?: number): string {
  if (!sec) return 'No limit';
  if (sec < 60) return `${sec}s`;
  return `${Math.round(sec / 60)} min`;
}

export default function PracticePage() {
  const router = useRouter();

  // ─── Search & Filter State ───
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const limit = 12;

  const queryParams = {
    page,
    limit,
    ...(search.trim() && { search: search.trim() }),
    ...(category.trim() && { category: category.trim() }),
  };

  const { data: quizzesResponse, isLoading } = usePublishedQuizzes(queryParams);
  const startPractice = useStartPracticeQuiz();

  const quizzes: IPublishedQuiz[] = quizzesResponse?.data ?? [];
  const totalPages = quizzesResponse?.meta?.totalPages ?? 1;

  // ─── Collect unique categories from loaded quizzes for quick filter chips ───
  const uniqueCategories = Array.from(
    new Set(quizzes.map((q) => q.category).filter(Boolean)),
  ) as string[];

  const handleStartPractice = (quizId: string, quizTitle: string) => {
    startPractice.mutate(quizId, {
      onSuccess: (data) => {
        toast.success(`Starting practice: "${quizTitle}"`);
        router.push(`/student/exam/${data.attempt._id}`);
      },
      onError: (err) => {
        toast.error(err.message || 'Failed to start practice quiz.');
      },
    });
  };

  const handleClearFilters = () => {
    setSearch('');
    setCategory('');
    setPage(1);
  };

  const hasActiveFilters = search.trim() !== '' || category.trim() !== '';

  return (
    <div className="space-y-8">
      {/* ═══ Page Header ═══ */}
      <div className="space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-xs">
            <BookOpenCheck className="size-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Practice & Review
            </h1>
          </div>
        </div>
      </div>

      {/* ═══ Search & Category Filter Bar ═══ */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <Input
              type="text"
              placeholder="Tìm kiếm quiz theo tên..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="h-11 pl-10 pr-4 rounded-xl bg-background border text-sm font-medium placeholder:text-muted-foreground/60 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:border-indigo-500"
            />
          </div>

          {/* Category Filter Input */}
          <div className="relative sm:w-64">
            <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <Input
              type="text"
              placeholder="Lọc theo danh mục..."
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
              className="h-11 pl-10 pr-4 rounded-xl bg-background border text-sm font-medium placeholder:text-muted-foreground/60 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:border-indigo-500"
            />
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="h-11 px-4 rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground gap-1.5 shrink-0"
            >
              <X className="size-4" />
              Xóa bộ lọc
            </Button>
          )}
        </div>

        {/* Category Chips (quick filter from loaded data) */}
        {uniqueCategories.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-semibold text-muted-foreground mr-1">Danh mục:</span>
            {uniqueCategories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  setCategory(category === cat ? '' : cat);
                  setPage(1);
                }}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all border cursor-pointer ${
                  category === cat
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-muted/60 text-muted-foreground border-border hover:bg-muted hover:text-foreground'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ═══ Quiz Grid ═══ */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-56 rounded-2xl bg-muted/40 animate-pulse border" />
          ))}
        </div>
      ) : quizzes.length === 0 ? (
        <Card className="rounded-2xl border border-dashed p-12 text-center bg-muted/20">
          <BookOpenCheck className="size-16 mx-auto text-muted-foreground/30 mb-4" />
          <h3 className="font-extrabold text-lg text-foreground">Không tìm thấy quiz nào</h3>
          <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
            {hasActiveFilters
              ? 'Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc danh mục.'
              : 'Chưa có quiz nào được publish trong tổ chức. Vui lòng liên hệ giáo viên!'}
          </p>
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearFilters}
              className="mt-5 rounded-xl font-bold text-xs gap-1.5"
            >
              <X className="size-3.5" />
              Xóa bộ lọc
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {quizzes.map((quiz) => (
            <Card
              key={quiz._id}
              className="rounded-2xl border border-border/60 hover:border-indigo-500/50 hover:shadow-md transition-all overflow-hidden flex flex-col group p-0"
            >
              {/* Card Top Accent Bar */}
              <div className="h-2 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-500" />

              <CardContent className="p-5 flex-1 flex flex-col justify-between space-y-4">
                {/* Quiz Info */}
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-extrabold text-base text-foreground leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">
                      {quiz.title}
                    </h3>
                  </div>

                  {quiz.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {quiz.description}
                    </p>
                  )}

                  {/* Metadata Tags */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {quiz.category && (
                      <Badge
                        variant="outline"
                        className="text-[11px] font-bold gap-1 bg-muted/60 border-border"
                      >
                        <Tag className="size-3" />
                        {quiz.category}
                      </Badge>
                    )}
                    <Badge
                      className={`text-[11px] font-bold capitalize ${DIFFICULTY_STYLES[quiz.difficulty] || DIFFICULTY_STYLES.medium}`}
                    >
                      {quiz.difficulty}
                    </Badge>
                  </div>
                </div>

                {/* Stats Row */}
                <div className="flex items-center gap-4 text-xs text-muted-foreground font-medium pt-2 border-t border-border/50">
                  <span className="flex items-center gap-1.5">
                    <Layers className="size-3.5 text-indigo-600" />
                    {quiz.questionCount} câu hỏi
                  </span>
                  {Boolean(quiz.timeLimitSec) && (
                    <span className="flex items-center gap-1.5">
                      <Clock className="size-3.5 text-amber-600" />
                      {formatTimeLimit(quiz.timeLimitSec)}
                    </span>
                  )}
                </div>

                {/* Start Practice Button */}
                <Button
                  onClick={() => handleStartPractice(quiz._id, quiz.title)}
                  disabled={startPractice.isPending}
                  className="w-full h-10 rounded-xl font-bold text-xs gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-all"
                >
                  <Play className="size-3.5 fill-current" />
                  {startPractice.isPending ? 'Đang bắt đầu...' : 'Luyện tập ngay'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ═══ Pagination ═══ */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-xl font-bold text-xs"
          >
            ← Trang trước
          </Button>
          <span className="text-xs font-bold text-muted-foreground px-3">
            Trang {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-xl font-bold text-xs"
          >
            Trang sau →
          </Button>
        </div>
      )}
    </div>
  );
}
