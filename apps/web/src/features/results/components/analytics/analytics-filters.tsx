'use client';

import * as React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import { useClasses, useClassAssignments } from '@/features/classes/hooks';
import { useQuizzes } from '@/features/quizzes/hooks';

interface AnalyticsFiltersProps {
  selectedClassId: string;
  onSelectClassId: (classId: string) => void;
  selectedAssignmentId: string;
  onSelectAssignmentId: (assignmentId: string) => void;
}

export function AnalyticsFilters({
  selectedClassId,
  onSelectClassId,
  selectedAssignmentId,
  onSelectAssignmentId,
}: AnalyticsFiltersProps) {
  const { data: classes = [], isLoading: loadingClasses } = useClasses({ limit: 100 });
  const { data: assignments = [], isLoading: loadingAssignments } =
    useClassAssignments(selectedClassId);
  const { data: quizzes = [] } = useQuizzes();

  const quizMap = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const q of quizzes) {
      const id = q._id || '';
      if (id) map.set(id, q.title);
    }
    return map;
  }, [quizzes]);

  const selectedClass = classes.find((c) => (c._id || c.id) === selectedClassId);
  const selectedAssignment = assignments.find((a) => (a.id || a._id) === selectedAssignmentId);
  const selectedQuizTitle = selectedAssignment
    ? quizMap.get(selectedAssignment.quizId) || `Quiz #${selectedAssignment.quizId.slice(-6)}`
    : 'All Assigned Quizzes';

  return (
    <div className="bg-card/70 p-4 rounded-xl border border-border shadow-xs">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* 1. Class Selector */}
        <div className="w-full sm:w-64">
          <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block mb-1.5">
            Classroom
          </label>
          <Select
            value={selectedClassId || 'none'}
            onValueChange={(val: string | null) => {
              const newClassId = !val || val === 'none' ? '' : val;
              onSelectClassId(newClassId);
              onSelectAssignmentId(''); // reset assignment when class changes
            }}
            disabled={loadingClasses}
          >
            <SelectTrigger className="w-full h-9 px-3 text-xs bg-background/60 hover:bg-background/90 transition-colors border-input">
              <SelectValue placeholder="Select a classroom">
                {selectedClass ? selectedClass.name : 'Select a classroom'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="min-w-64 p-1.5 shadow-xl border border-border bg-popover">
              {classes.length === 0 ? (
                <div className="py-3 text-center text-xs text-muted-foreground">
                  No classrooms found
                </div>
              ) : (
                classes.map((c) => {
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
                })
              )}
            </SelectContent>
          </Select>
        </div>

        {/* 2. Assignment / Quiz Selector */}
        <div className="w-full sm:w-72">
          <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block mb-1.5">
            Assigned Quiz Assessment
          </label>
          <Select
            value={selectedAssignmentId || 'all'}
            onValueChange={(val: string | null) => {
              onSelectAssignmentId(!val || val === 'all' ? '' : val);
            }}
            disabled={!selectedClassId || loadingAssignments}
          >
            <SelectTrigger className="w-full h-9 px-3 text-xs bg-background/60 hover:bg-background/90 transition-colors border-input">
              <SelectValue
                placeholder={selectedClassId ? 'All Assigned Quizzes' : 'Select class first'}
              >
                {selectedQuizTitle}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="min-w-72 p-1.5 shadow-xl border border-border bg-popover">
              <SelectItem value="all" className="py-2 px-2.5 rounded-md cursor-pointer">
                <span className="font-medium text-xs">All Quizzes in Classroom</span>
              </SelectItem>
              {assignments.length > 0 && <SelectSeparator />}
              {assignments.map((a) => {
                const aId = a.id || a._id || '';
                const title = quizMap.get(a.quizId) || `Quiz #${a.quizId.slice(-6)}`;
                return (
                  <SelectItem
                    key={aId}
                    value={aId}
                    className="py-2 px-2.5 rounded-md cursor-pointer my-0.5"
                  >
                    <div className="flex items-center justify-between w-full gap-3">
                      <span className="font-medium text-xs truncate max-w-48 text-foreground">
                        {title}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-mono bg-muted/80 px-1.5 py-0.5 rounded shrink-0">
                        v{a.quizVersion}
                      </span>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
