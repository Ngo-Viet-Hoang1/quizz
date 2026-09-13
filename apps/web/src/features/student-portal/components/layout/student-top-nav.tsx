'use client';

import { UserButton, useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { studentNavItems } from './student-nav-config';

export function StudentTopNav() {
  const pathname = usePathname();
  const { user } = useUser();

  const displayName =
    user?.fullName ||
    user?.firstName ||
    user?.username ||
    user?.primaryEmailAddress?.emailAddress?.split('@')[0] ||
    '';

  const email = user?.primaryEmailAddress?.emailAddress;

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur-md shadow-xs">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo & Tagline */}
        <div className="flex items-center gap-6">
          <Link href="/student" className="flex flex-col group">
            <span className="text-xl font-black tracking-tight text-foreground group-hover:text-sky-600 transition-colors">
              HKT QUIZZ
            </span>
            <span className="hidden sm:block text-[10px] font-bold text-muted-foreground uppercase tracking-widest -mt-1">
              STUDENT PORTAL
            </span>
          </Link>

          {/* Horizontal Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {studentNavItems.map((item) => {
              const isActive =
                item.href === '/student' ? pathname === '/student' : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3.5 py-1.5 text-sm font-medium rounded-xl transition-all duration-150 ${
                    isActive
                      ? 'bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300 font-semibold'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                >
                  {item.title}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Side Controls: User Profile & Name */}
        <div className="flex items-center gap-3">
          {displayName && (
            <div className="flex flex-col items-end text-right">
              <span className="text-xs sm:text-sm font-bold text-foreground leading-tight">
                {displayName}
              </span>
              {email && (
                <span className="hidden sm:inline-block text-[11px] text-muted-foreground leading-tight truncate max-w-[160px]">
                  {email}
                </span>
              )}
            </div>
          )}

          <UserButton
            appearance={{
              elements: {
                avatarBox: 'size-9 border-2 border-sky-500/20 shadow-xs',
              },
            }}
          />
        </div>
      </div>

      {/* Mobile Horizontal Sub-Navbar */}
      <div className="md:hidden flex items-center justify-around border-t px-2 py-1.5 bg-muted/30">
        {studentNavItems.map((item) => {
          const isActive =
            item.href === '/student' ? pathname === '/student' : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                isActive
                  ? 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 font-semibold'
                  : 'text-muted-foreground'
              }`}
            >
              <span>{item.title}</span>
            </Link>
          );
        })}
      </div>
    </header>
  );
}
