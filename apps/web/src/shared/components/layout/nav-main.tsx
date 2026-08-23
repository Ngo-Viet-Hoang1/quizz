'use client';

import { cn } from '@/shared/lib/utils';
import { Badge } from '@/shared/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import { ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { NAV_GROUPS, isRouteActive, type NavGroup, type NavItem } from './nav-config';

interface NavMainProps {
  onItemClick?: () => void;
}

export function NavMain({ onItemClick }: NavMainProps) {
  const pathname = usePathname();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    quizzes: true,
    classes: true,
    system: true,
  });

  const toggleGroup = (id: string) => setOpenGroups((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="flex flex-col gap-3 px-3 py-2 group-data-[collapsed=true]/sidebar:px-2 group-data-[collapsed=true]/sidebar:items-center">
      {NAV_GROUPS.map((group) => {
        const isGroupActive = group.items.some((item) => isRouteActive(pathname, item.href));

        return (
          <div
            key={group.id}
            className="w-full flex flex-col group-data-[collapsed=true]/sidebar:items-center"
          >
            {/* 1. Collapsed Mode: Icon Trigger + Flyout Popup */}
            <NavGroupCollapsed
              group={group}
              pathname={pathname}
              isGroupActive={isGroupActive}
              onItemClick={onItemClick}
            />

            {/* 2. Expanded Mode: Tree Rail Accordion */}
            <NavGroupExpanded
              group={group}
              pathname={pathname}
              isOpen={openGroups[group.id] ?? true}
              isGroupActive={isGroupActive}
              onToggle={() => toggleGroup(group.id)}
              onItemClick={onItemClick}
            />
          </div>
        );
      })}
    </div>
  );
}

function NavGroupCollapsed({
  group,
  pathname,
  isGroupActive,
  onItemClick,
}: {
  group: NavGroup;
  pathname: string;
  isGroupActive: boolean;
  onItemClick?: () => void;
}) {
  return (
    <div className="hidden group-data-[collapsed=true]/sidebar:flex justify-center w-full relative">
      {isGroupActive && (
        <span className="absolute -left-2 top-1/2 -translate-y-1/2 w-[3.5px] h-6 bg-primary rounded-r-full shadow-xs" />
      )}

      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <button
              type="button"
              className={cn(
                'flex size-9 items-center justify-center rounded-lg border transition-colors cursor-pointer',
                isGroupActive
                  ? 'border-primary bg-primary text-primary-foreground font-semibold shadow-xs'
                  : 'border-sidebar-border bg-background/50 text-muted-foreground hover:bg-sidebar-accent hover:text-foreground',
              )}
            >
              <group.icon className="size-4 shrink-0" />
              <span className="sr-only">{group.label}</span>
            </button>
          }
        />
        <DropdownMenuContent
          side="right"
          align="start"
          sideOffset={12}
          className="w-56 p-1.5 shadow-xl rounded-xl border bg-popover text-popover-foreground"
        >
          <div className="flex items-center justify-between px-2.5 py-1.5 text-xs font-bold text-muted-foreground uppercase tracking-wider">
            <span>{group.label}</span>
            <span className="text-[10px] font-mono text-muted-foreground/60">
              {group.items.length}
            </span>
          </div>
          <DropdownMenuSeparator className="my-1" />
          {group.items.map((item) => {
            const isActive = isRouteActive(pathname, item.href);

            return (
              <Link key={item.href} href={item.href} onClick={onItemClick}>
                <DropdownMenuItem
                  className={cn(
                    'cursor-pointer gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium justify-between',
                    isActive
                      ? 'bg-primary text-primary-foreground font-semibold'
                      : 'hover:bg-accent',
                  )}
                >
                  <NavItemContent item={item} isActive={isActive} />
                </DropdownMenuItem>
              </Link>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function NavGroupExpanded({
  group,
  pathname,
  isOpen,
  isGroupActive,
  onToggle,
  onItemClick,
}: {
  group: NavGroup;
  pathname: string;
  isOpen: boolean;
  isGroupActive: boolean;
  onToggle: () => void;
  onItemClick?: () => void;
}) {
  return (
    <div className="flex flex-col w-full group-data-[collapsed=true]/sidebar:hidden">
      {/* Category Header Button */}
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between px-2 py-1 rounded-lg text-xs font-bold hover:bg-sidebar-accent/50 transition-colors cursor-pointer group select-none"
      >
        <div className="flex items-center gap-2 min-w-0">
          <div
            className={cn(
              'flex size-5.5 items-center justify-center rounded-md border text-muted-foreground transition-colors shrink-0 shadow-2xs',
              isGroupActive
                ? 'border-primary/40 bg-primary/10 text-primary'
                : 'border-sidebar-border/80 bg-muted/40 group-hover:border-foreground/20 group-hover:text-foreground',
            )}
          >
            <group.icon className="size-3" />
          </div>
          <span className="truncate uppercase text-[11px] font-bold tracking-wider text-muted-foreground/90 group-hover:text-foreground">
            {group.label}
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[10px] font-mono text-muted-foreground/60 font-medium">
            {group.items.length}
          </span>
          <ChevronDown
            className={cn(
              'size-3 text-muted-foreground/60 transition-transform duration-200 group-hover:text-foreground',
              isOpen ? 'rotate-0' : '-rotate-90',
            )}
          />
        </div>
      </button>

      {/* Sub-items in Nested Tree Rail Layout */}
      {isOpen && (
        <div className="ml-4.5 pl-2.5 border-l border-sidebar-border/70 space-y-0.5 mt-1 animate-in fade-in-50 duration-150">
          {group.items.map((item) => {
            const isActive = isRouteActive(pathname, item.href);

            return (
              <div key={item.href} className="relative w-full">
                {isActive && (
                  <span className="absolute left-[-11.5px] top-1/2 -translate-y-1/2 size-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                )}

                <Link
                  href={item.href}
                  onClick={onItemClick}
                  className={cn(
                    'group/item flex items-center justify-between gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors w-full',
                    isActive
                      ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                      : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                  )}
                >
                  <NavItemContent item={item} isActive={isActive} />
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function NavItemContent({ item, isActive }: { item: NavItem; isActive: boolean }) {
  return (
    <>
      <div className="flex items-center gap-2 min-w-0">
        <item.icon
          className={cn(
            'size-3.5 shrink-0 transition-colors',
            isActive
              ? 'text-primary-foreground'
              : 'text-muted-foreground group-hover/item:text-foreground',
          )}
        />
        <span className="truncate">{item.title}</span>
      </div>
      {item.badge && (
        <Badge
          variant={item.badgeVariant ?? 'secondary'}
          className={cn(
            'text-[9px] px-1 py-0 h-3.5 font-semibold shrink-0',
            isActive && 'bg-primary-foreground/20 text-primary-foreground border-transparent',
          )}
        >
          {item.badge}
        </Badge>
      )}
    </>
  );
}
