'use client';

import { Button } from '@/shared/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface SimplePaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
}

export function SimplePagination({ page, totalPages, onPageChange }: SimplePaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 pt-4">
      <Button
        variant="outline"
        size="sm"
        disabled={page <= 1}
        onClick={() => onPageChange(Math.max(1, page - 1))}
        className="rounded-xl font-semibold text-xs gap-1"
      >
        <ChevronLeft className="size-4" /> Previous
      </Button>
      <span className="text-xs font-semibold text-muted-foreground px-3">
        Page {page} of {totalPages}
      </span>
      <Button
        variant="outline"
        size="sm"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        className="rounded-xl font-semibold text-xs gap-1"
      >
        Next <ChevronRight className="size-4" />
      </Button>
    </div>
  );
}
