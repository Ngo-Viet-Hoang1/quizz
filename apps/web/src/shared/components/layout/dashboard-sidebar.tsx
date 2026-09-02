'use client';

import { cn } from '@/shared/lib/utils';
import { useUIStore } from '@/shared/stores/ui-store';
import { NavMain } from './nav-main';
import { NavOrg } from './nav-org';
import { SidebarBanner } from './sidebar-banner';
import { SidebarBrand } from './sidebar-brand';

interface DashboardSidebarProps {
  onItemClick?: () => void;
  className?: string;
  forceExpanded?: boolean;
}

export function DashboardSidebar({
  onItemClick,
  className,
  forceExpanded = false,
}: DashboardSidebarProps) {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const collapsed = forceExpanded ? false : !sidebarOpen;

  return (
    <aside
      data-collapsed={collapsed}
      className={cn(
        'group/sidebar flex h-full w-full flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground select-none overflow-hidden',
        className,
      )}
    >
      {/* 1. Header: Organization Switcher */}
      <div className="shrink-0 w-full min-w-0 overflow-hidden">
        <NavOrg />
      </div>

      {/* 2. Middle Scrollable Area */}
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden flex flex-col justify-between py-2">
        <NavMain onItemClick={onItemClick} />
        <SidebarBanner onItemClick={onItemClick} />
      </div>

      {/* 3. Footer: App Branding & Version */}
      <div className="shrink-0">
        <SidebarBrand />
      </div>
    </aside>
  );
}
