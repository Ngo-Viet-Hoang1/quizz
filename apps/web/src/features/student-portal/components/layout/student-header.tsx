'use client';

import { Button } from '@/shared/ui/button';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/shared/ui/sheet';
import { GraduationCap, Home, ChevronRight, Menu } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Fragment, useState } from 'react';
import { StudentSidebar } from './student-sidebar';
import { HeaderUserMenu } from '@/shared/components/layout/header-user-menu';

const studentPathNameMap: Record<string, string> = {
  student: 'Dashboard',
  classes: 'My Classes',
  quizzes: 'Quiz Bank',
  rooms: 'Live Rooms',
  history: 'My Results',
  exam: 'Exam',
  result: 'Result',
};

export function StudentHeader() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const segments = pathname.split('/').filter(Boolean);

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between border-b bg-background/95 px-4 lg:px-6 backdrop-blur-md">
      {/* Left: Mobile menu + Breadcrumbs */}
      <div className="flex items-center gap-2.5 min-w-0">
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
              <SheetTitle className="sr-only">Student Navigation</SheetTitle>
              <StudentSidebar onItemClick={() => setMobileOpen(false)} />
            </SheetContent>
          </Sheet>
        </div>

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-muted-foreground min-w-0">
          <Link
            href="/student"
            className="flex items-center gap-1 hover:text-foreground transition-colors font-medium shrink-0"
          >
            <Home className="size-3.5" />
            <span className="hidden sm:inline">Home</span>
          </Link>
          {segments.map((segment, index) => {
            const isLast = index === segments.length - 1;
            const href = '/' + segments.slice(0, index + 1).join('/');
            const label = studentPathNameMap[segment] || segment;

            return (
              <Fragment key={href}>
                <ChevronRight className="size-3 text-muted-foreground/50 shrink-0" />
                {isLast ? (
                  <span className="font-semibold text-foreground truncate max-w-40 sm:max-w-60">
                    {label}
                  </span>
                ) : (
                  <Link
                    href={href}
                    className="hover:text-foreground transition-colors truncate max-w-24 sm:max-w-40"
                  >
                    {label}
                  </Link>
                )}
              </Fragment>
            );
          })}
        </nav>
      </div>

      {/* Right: User Menu */}
      <div className="flex items-center gap-2 shrink-0">
        <Link href="/dashboard">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground hover:text-foreground gap-1.5 h-8"
          >
            <GraduationCap className="size-3.5" />
            <span className="hidden sm:inline">Teacher Portal</span>
          </Button>
        </Link>
        <div className="h-4 w-px bg-border shrink-0" />
        <HeaderUserMenu />
      </div>
    </header>
  );
}
