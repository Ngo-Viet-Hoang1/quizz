'use client';

import { cn } from '@/shared/lib/utils';
import { Badge } from '@/shared/ui/badge';
import { GraduationCap } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { STUDENT_NAV_ITEMS, isStudentRouteActive } from './student-nav-config';

export function StudentSidebar({ onItemClick }: { onItemClick?: () => void }) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-full flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground select-none overflow-hidden">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-4 py-4 border-b border-sidebar-border/60">
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
          <GraduationCap className="size-4" />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-bold tracking-tight truncate">Student Hub</span>
          <span className="text-[10px] text-muted-foreground font-medium">Learning Portal</span>
        </div>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
        {STUDENT_NAV_ITEMS.map((item) => {
          const isActive = isStudentRouteActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onItemClick}
              className={cn(
                'group flex items-center justify-between gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
              )}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {typeof item.icon !== 'string' &&
                  (() => {
                    const Icon = item.icon;
                    return (
                      <Icon
                        className={cn(
                          'size-4 shrink-0 transition-colors',
                          isActive
                            ? 'text-primary-foreground'
                            : 'text-muted-foreground group-hover:text-foreground',
                        )}
                      />
                    );
                  })()}
                <span className="truncate">{item.title}</span>
              </div>
              {item.badge && (
                <Badge
                  variant={item.badgeVariant ?? 'secondary'}
                  className={cn(
                    'text-[9px] px-1.5 py-0 h-4 font-semibold shrink-0',
                    isActive &&
                      'bg-primary-foreground/20 text-primary-foreground border-transparent',
                  )}
                >
                  {item.badge}
                </Badge>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="shrink-0 border-t border-sidebar-border/60 px-4 py-3">
        <div className="flex items-center gap-2">
          <GraduationCap className="size-3.5 text-muted-foreground/60" />
          <span className="text-[10px] text-muted-foreground/60 font-medium">
            NKT Quiz LMS • Student
          </span>
        </div>
      </div>
    </aside>
  );
}
