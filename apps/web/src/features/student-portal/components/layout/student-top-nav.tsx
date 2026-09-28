'use client';

import { UserButton, useUser, useOrganization } from '@clerk/nextjs';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Building2, ShieldCheck } from 'lucide-react';
import { isAdminRole } from '@/shared/lib/role-utils';
import { studentNavItems } from './student-nav-config';

export function StudentTopNav() {
  const pathname = usePathname();
  const { user } = useUser();
  const { membership, organization } = useOrganization();

  const isOrgAdmin = isAdminRole(membership?.role);

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

        {/* Right Side Controls: Admin Switcher, Workspace Switcher, User Profile & Name */}
        <div className="flex items-center gap-3">
          {/* Admin Switcher Button (Only visible to Org Admins/Teachers) */}
          {isOrgAdmin && (
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:hover:bg-purple-900/60 dark:text-purple-300 text-xs font-bold border border-purple-200 dark:border-purple-800 transition-all shadow-2xs"
            >
              <ShieldCheck className="size-3.5 text-purple-600 dark:text-purple-400" />
              <span className="hidden sm:inline">Trang Quản Trị</span>
              <span className="sm:hidden">Admin</span>
            </Link>
          )}

          {/* Change Workspace / Organization Button */}
          <Link
            href="/onboarding"
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 border border-transparent hover:border-border transition-all"
            title="Đổi Workspace / Tổ chức"
          >
            <Building2 className="size-3.5" />
            <span className="hidden md:inline">{organization?.name || 'Đổi Workspace'}</span>
          </Link>

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

        <Link
          href="/onboarding"
          className="flex flex-col items-center gap-0.5 px-3 py-1 text-xs font-medium rounded-lg text-muted-foreground transition-colors"
        >
          <Building2 className="size-3.5" />
          <span>Workspace</span>
        </Link>
      </div>
    </header>
  );
}
