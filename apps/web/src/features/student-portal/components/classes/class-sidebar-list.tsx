'use client';

import type { IClass } from '@/features/student-portal/types';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { LogOut } from 'lucide-react';

interface ClassSidebarListProps {
  classes: IClass[];
  selectedClassId: string | undefined;
  onSelectClass: (classId: string) => void;
  onLeaveClass: (classId: string, className: string) => void;
}

export function ClassSidebarList({
  classes,
  selectedClassId,
  onSelectClass,
  onLeaveClass,
}: ClassSidebarListProps) {
  return (
    <div className="lg:col-span-4 space-y-3">
      <h3 className="text-xs font-black uppercase text-muted-foreground tracking-wider px-1">
        Classes List
      </h3>

      {classes.map((cls: IClass) => {
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
      })}
    </div>
  );
}
