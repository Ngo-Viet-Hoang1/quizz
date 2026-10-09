'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { BookOpenCheck, Search, X } from 'lucide-react';

import {
  usePublishedQuizzes,
  useStartPracticeQuiz,
} from '@/features/student-portal/api/student.api';
import {
  CategoryFilterPopover,
  PracticeQuizCard,
} from '@/features/student-portal/components/practice';
import type { IPublishedQuiz } from '@/features/student-portal/types';

import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';

export default function PracticePage() {
  const router = useRouter();

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const limit = 12;

  const { data: allQuizzesResponse } = usePublishedQuizzes({ limit: 100 });
  const allCategories = Array.from(
    new Set((allQuizzesResponse?.data ?? []).map((q) => q.category).filter(Boolean)),
  ) as string[];

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
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          Practice & Review
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
          Self-study and sharpen your knowledge with public practice quizzes
        </p>
      </div>

      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <Input
              type="text"
              placeholder="Search quiz by title..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="h-10 pl-10 pr-4 rounded-xl bg-background border text-xs sm:text-sm font-medium placeholder:text-muted-foreground/60 focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:border-sky-500"
            />
          </div>

          <CategoryFilterPopover
            category={category}
            allCategories={allCategories}
            onSelectCategory={(cat) => {
              setCategory(cat);
              setPage(1);
            }}
          />

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="h-10 px-3.5 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground gap-1.5 shrink-0"
            >
              <X className="size-4" />
              Clear Filters
            </Button>
          )}
        </div>

        {allCategories.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-medium text-muted-foreground mr-1">Popular:</span>
            {allCategories.slice(0, 8).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  setCategory(category.toLowerCase() === cat.toLowerCase() ? '' : cat);
                  setPage(1);
                }}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all border cursor-pointer ${
                  category.toLowerCase() === cat.toLowerCase()
                    ? 'bg-sky-600 text-white border-sky-600'
                    : 'bg-muted/60 text-muted-foreground border-border hover:bg-muted hover:text-foreground'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-56 rounded-2xl bg-muted/40 animate-pulse border" />
          ))}
        </div>
      ) : quizzes.length === 0 ? (
        <Card className="rounded-2xl border border-dashed p-12 text-center bg-muted/20">
          <BookOpenCheck className="size-16 mx-auto text-muted-foreground/30 mb-4" />
          <h3 className="font-extrabold text-lg text-foreground">No quizzes found</h3>
          <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
            {hasActiveFilters
              ? 'Try adjusting your search query or category filter.'
              : 'No published quizzes are currently available in your organization.'}
          </p>
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearFilters}
              className="mt-5 rounded-xl font-bold text-xs gap-1.5"
            >
              <X className="size-3.5" />
              Clear Filters
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {quizzes.map((quiz) => (
            <PracticeQuizCard
              key={quiz._id}
              quiz={quiz}
              isStarting={startPractice.isPending}
              onStart={handleStartPractice}
            />
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
            ← Previous
          </Button>
          <span className="text-xs font-bold text-muted-foreground px-3">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-xl font-bold text-xs"
          >
            Next →
          </Button>
        </div>
      )}
    </div>
  );
}
