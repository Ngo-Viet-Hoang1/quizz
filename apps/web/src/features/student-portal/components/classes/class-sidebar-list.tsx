'use client';

import type { IClass } from '@/features/student-portal/types';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { ChevronLeft, ChevronRight, LogOut, Search } from 'lucide-react';

interface ClassSidebarListProps {
  classes: IClass[];
  selectedClassId: string | undefined;
  onSelectClass: (classId: string) => void;
  onLeaveClass: (classId: string, className: string) => void;
  page?: number;
  totalPages?: number;
  total?: number;
  onPageChange?: (newPage: number) => void;
  search?: string;
  onSearchChange?: (val: string) => void;
}

export function ClassSidebarList({
  classes,
  selectedClassId,
  onSelectClass,
  onLeaveClass,
  page = 1,
  totalPages = 1,
  total = 0,
  onPageChange,
  search = '',
  onSearchChange,
}: ClassSidebarListProps) {
  return (
    <div className="lg:col-span-4 space-y-3">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-xs font-black uppercase text-muted-foreground tracking-wider">
          Classes List ({total})
        </h3>
      </div>

      {/* Search Bar */}
      {onSearchChange && (
        <div className="relative">
          <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Search class..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 h-9 text-xs rounded-xl border-border/60 bg-card/60"
          />
        </div>
      )}

      {classes.length === 0 ? (
        <div className="p-6 text-center text-xs text-muted-foreground border rounded-2xl bg-card/40">
          No classes match your query.
        </div>
      ) : (
        classes.map((cls: IClass) => {
          const isSelected = cls._id === selectedClassId;

          return (
            <div
              key={cls._id}
              onClick={() => onSelectClass(cls._id)}
              className={`p-4 rounded-2xl cursor-pointer transition-all border ${
                isSelected
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                  : 'bg-card/80 hover:bg-card border-border/60 hover:border-indigo-400'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-extrabold text-base leading-snug">{cls.name}</h4>
                    {cls.membershipStatus === 'pending' && (
                      <Badge
                        variant="outline"
                        className={`text-[10px] h-5 px-1.5 ${
                          isSelected
                            ? 'border-purple-200 text-purple-100'
                            : 'border-amber-500/50 text-amber-600'
                        }`}
                      >
                        Pending
                      </Badge>
                    )}
                  </div>
                  <p
                    className={`text-xs mt-0.5 font-mono ${
                      isSelected ? 'text-indigo-200' : 'text-muted-foreground'
                    }`}
                  >
                    Code: {cls.code}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    onLeaveClass(cls._id, cls.name);
                  }}
                  className={`size-8 rounded-xl ${
                    isSelected
                      ? 'text-indigo-200 hover:text-white hover:bg-indigo-700'
                      : 'text-muted-foreground hover:text-red-500'
                  }`}
                  title="Leave Class"
                >
                  <LogOut className="size-4" />
                </Button>
              </div>

              <div className="flex items-center justify-end mt-4 text-xs font-semibold">
                <span className={isSelected ? 'text-indigo-200' : 'text-muted-foreground'}>
                  ID: {cls._id.slice(-6)}
                </span>
              </div>
            </div>
          );
        })
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && onPageChange && (
        <div className="flex items-center justify-between border-t border-border/40 pt-3 px-1">
          <span className="text-[11px] font-semibold text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              className="size-7 rounded-lg"
              title="Previous Page"
            >
              <ChevronLeft className="size-3.5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
              className="size-7 rounded-lg"
              title="Next Page"
            >
              <ChevronRight className="size-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
