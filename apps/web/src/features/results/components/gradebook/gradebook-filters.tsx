'use client';

import * as React from 'react';
import { GraduationCap, Search } from 'lucide-react';
import { Input } from '@/shared/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import { useClasses } from '@/features/classes/hooks';

interface GradebookFiltersProps {
  selectedClassId: string;
  onSelectClassId: (classId: string) => void;
  searchQuery: string;
  onSearchChange: (search: string) => void;
}

export function GradebookFilters({
  selectedClassId,
  onSelectClassId,
  searchQuery,
  onSearchChange,
}: GradebookFiltersProps) {
  const { data: classes = [], isLoading: loadingClasses } = useClasses({ limit: 100 });
  const selectedClass = classes.find((c) => (c._id || c.id) === selectedClassId);

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-card/70 p-3.5 rounded-xl border border-border shadow-xs">
      {/* 1. Search Box */}
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Search assigned quizzes or classrooms..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 h-9 text-xs bg-background/60"
        />
      </div>

      {/* 2. Class Selector */}
      <div className="w-full sm:w-72">
        <Select
          value={selectedClassId || 'all'}
          onValueChange={(val: string | null) => {
            onSelectClassId(!val || val === 'all' ? '' : val);
          }}
          disabled={loadingClasses}
        >
          <SelectTrigger className="w-full h-9 px-3 text-xs bg-background/60 hover:bg-background/90 transition-colors border-input">
            <div className="flex items-center gap-2 truncate">
              <GraduationCap className="h-4 w-4 text-primary shrink-0" />
              <SelectValue placeholder="All Classrooms">
                {selectedClass ? selectedClass.name : 'All Classrooms'}
              </SelectValue>
            </div>
          </SelectTrigger>
          <SelectContent className="min-w-64 p-1.5 shadow-xl border border-border bg-popover">
            <SelectItem value="all" className="py-2 px-2.5 rounded-md cursor-pointer">
              <div className="flex items-center gap-2 font-medium text-xs">
                <GraduationCap className="h-4 w-4 text-primary" />
                <span>All Classrooms</span>
              </div>
            </SelectItem>
            {classes.length > 0 && <SelectSeparator />}
            {classes.map((c) => {
              const id = c._id || c.id || '';
              return (
                <SelectItem
                  key={id}
                  value={id}
                  className="py-2 px-2.5 rounded-md cursor-pointer my-0.5"
                >
                  <div className="flex items-center justify-between w-full gap-3">
                    <span className="font-medium text-xs truncate max-w-44 text-foreground">
                      {c.name}
                    </span>
                    {c.memberCount !== undefined && (
                      <span className="text-[10px] text-muted-foreground font-mono bg-muted/80 px-1.5 py-0.5 rounded shrink-0">
                        {c.memberCount} students
                      </span>
                    )}
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
