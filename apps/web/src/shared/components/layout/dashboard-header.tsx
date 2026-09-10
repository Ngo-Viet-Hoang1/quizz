'use client';

import { useUIStore } from '@/shared/stores/ui-store';
import { Button } from '@/shared/ui/button';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/shared/ui/sheet';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui/tooltip';
import { useQuiz } from '@/features/quizzes/hooks';
import { useClass } from '@/features/classes/hooks';
import {
  Bell,
  ChevronRight,
  HelpCircle,
  Home,
  Menu,
  PanelLeft,
  PanelLeftClose,
  Search,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Fragment, useState } from 'react';
import { CommandPalette } from './command-palette';
import { DashboardSidebar } from './dashboard-sidebar';
import { HeaderUserMenu } from './header-user-menu';

const pathNameMap: Record<string, string> = {
  dashboard: 'Dashboard',
  quizzes: 'Quiz Bank',
  rooms: 'Live Rooms',
  'ai-generate': 'AI Generator',
  classes: 'Classes & Groups',
  candidates: 'Candidates',
  results: 'Results & History',
  analytics: 'Analytics',
  'audit-logs': 'Audit Logs',
  settings: 'Settings',
  billing: 'Billing & Plans',
  create: 'Create',
  edit: 'Edit',
};

function QuizBreadcrumbTitle({ id }: { id: string }) {
  const { data: quiz, isLoading } = useQuiz(id);
  if (isLoading && !quiz) {
    return <span className="opacity-60">Loading...</span>;
  }
  return <>{quiz?.title || 'Quiz Details'}</>;
}

function ClassBreadcrumbTitle({ id }: { id: string }) {
  const { data: classItem, isLoading } = useClass(id);
  if (isLoading && !classItem) {
    return <span className="opacity-60">Loading...</span>;
  }
  return <>{classItem?.name || 'Class Details'}</>;
}

function BreadcrumbTitle({ segment, prevSegment }: { segment: string; prevSegment?: string }) {
  if (pathNameMap[segment]) {
    return <>{pathNameMap[segment]}</>;
  }

  if (prevSegment === 'quizzes') {
    return <QuizBreadcrumbTitle id={segment} />;
  }

  if (prevSegment === 'classes') {
    return <ClassBreadcrumbTitle id={segment} />;
  }

  return <>{segment}</>;
}

export function DashboardHeader() {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar, setCommandPaletteOpen } = useUIStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Generate breadcrumbs from pathname
  const segments = pathname.split('/').filter(Boolean);

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b bg-background/95 px-4 lg:px-6 backdrop-blur-md supports-backdrop-filter:bg-background/60">
      {/* 1. Left: Sidebar Toggle + Separator + Breadcrumbs */}
      <div className="flex items-center gap-2.5 shrink-0 min-w-0">
        {/* Desktop Sidebar Collapse Toggle */}
        <div className="hidden md:block">
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleSidebar}
                  className="h-8.5 w-8.5 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  {sidebarOpen ? (
                    <PanelLeftClose className="size-4" />
                  ) : (
                    <PanelLeft className="size-4" />
                  )}
                  <span className="sr-only">Toggle Sidebar</span>
                </Button>
              }
            />
            <TooltipContent side="bottom">
              <span>{sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}</span>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Mobile Sidebar Sheet */}
        <div className="md:hidden">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger
              render={
                <Button variant="outline" size="icon" className="h-9 w-9">
                  <Menu className="h-4 w-4" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              }
            />
            <SheetContent
              side="left"
              showCloseButton={false}
              className="p-0 w-72 max-w-[85vw] border-r border-sidebar-border bg-sidebar"
            >
              <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
              <DashboardSidebar onItemClick={() => setMobileOpen(false)} forceExpanded />
            </SheetContent>
          </Sheet>
        </div>

        {/* Vertical Divider Line between Toggle button and Breadcrumb */}
        <div className="hidden md:block h-4 w-px bg-border shrink-0 mx-1" />

        {/* Hierarchical Breadcrumb Navigation */}
        <nav className="flex items-center gap-1.5 text-xs text-muted-foreground min-w-0">
          <Link
            href="/dashboard"
            className="flex items-center gap-1 hover:text-foreground transition-colors font-medium shrink-0"
          >
            <Home className="size-3.5" />
            <span className="hidden sm:inline">Home</span>
          </Link>
          {segments.map((segment, index) => {
            const isLast = index === segments.length - 1;
            const prevSegment = index > 0 ? segments[index - 1] : undefined;
            const href = '/' + segments.slice(0, index + 1).join('/');

            return (
              <Fragment key={href}>
                <ChevronRight className="size-3 text-muted-foreground/50 shrink-0" />
                {isLast ? (
                  <span className="font-semibold text-foreground truncate max-w-35 sm:max-w-60 lg:max-w-80">
                    <BreadcrumbTitle segment={segment} prevSegment={prevSegment} />
                  </span>
                ) : (
                  <Link
                    href={href}
                    className="hover:text-foreground transition-colors truncate max-w-20 sm:max-w-35"
                  >
                    <BreadcrumbTitle segment={segment} prevSegment={prevSegment} />
                  </Link>
                )}
              </Fragment>
            );
          })}
        </nav>
      </div>

      {/* 2. Middle: Search Bar (Opens Command Palette on click or ⌘K) */}
      <div className="hidden md:flex flex-1 justify-center px-4 max-w-md mx-auto min-w-0">
        <button
          type="button"
          onClick={() => setCommandPaletteOpen(true)}
          className="flex items-center justify-between w-full max-w-sm h-9 px-3 text-xs text-muted-foreground bg-muted/40 hover:bg-muted/70 border rounded-lg transition-colors cursor-pointer shadow-2xs hover:border-foreground/30 hover:text-foreground min-w-0"
        >
          <div className="flex items-center gap-2 min-w-0 mr-2">
            <Search className="size-3.5 shrink-0" />
            <span className="truncate hidden xl:inline">Search quizzes, rooms, candidates...</span>
            <span className="truncate inline xl:hidden">Search...</span>
          </div>
          <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground shadow-2xs shrink-0">
            ⌘ K
          </kbd>
        </button>
      </div>

      {/* 3. Right: Mobile Search Icon + Help (?) + Notifications (🔔) + User Profile Menu */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Mobile Search Trigger Icon */}
        <div className="md:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCommandPaletteOpen(true)}
            className="h-8.5 w-8.5 text-muted-foreground hover:text-foreground"
          >
            <Search className="size-4" />
            <span className="sr-only">Search</span>
          </Button>
        </div>

        {/* Help & Docs button */}
        <Tooltip>
          <TooltipTrigger
            render={
              <Link href="/docs">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8.5 w-8.5 text-muted-foreground hover:text-foreground"
                >
                  <HelpCircle className="size-4" />
                  <span className="sr-only">Help & Docs</span>
                </Button>
              </Link>
            }
          />
          <TooltipContent side="bottom">
            <span>Documentation & Support</span>
          </TooltipContent>
        </Tooltip>

        {/* Notification Bell */}
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="h-8.5 w-8.5 text-muted-foreground hover:text-foreground"
              >
                <Bell className="size-4" />
                <span className="sr-only">Notifications</span>
              </Button>
            }
          />
          <TooltipContent side="bottom">
            <span>Notifications</span>
          </TooltipContent>
        </Tooltip>

        {/* Vertical Divider Line before User Avatar */}
        <div className="h-4 w-px bg-border shrink-0 mx-1" />

        {/* User Profile Avatar with Dropdown Menu & Theme Switcher */}
        <HeaderUserMenu />
      </div>

      {/* Global Interactive Command Palette Modal */}
      <CommandPalette />
    </header>
  );
}
