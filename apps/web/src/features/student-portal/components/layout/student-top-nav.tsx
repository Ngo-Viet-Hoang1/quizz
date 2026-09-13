'use client';

import { useOrganization, useOrganizationList, UserButton } from '@clerk/nextjs';
import { Building2, ShieldCheck, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { studentNavItems } from './student-nav-config';
import { isAdminRole } from '@/shared/lib/role-utils';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';

export function StudentTopNav() {
  const pathname = usePathname();
  const { organization, membership } = useOrganization();
  const { userMemberships } = useOrganizationList({ userMemberships: { infinite: true } });

  const hasAdminAccess =
    isAdminRole(membership?.role) ||
    (userMemberships.data ?? []).some((mem) => isAdminRole(mem.role));

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur-md shadow-xs">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo & Tagline */}
        <div className="flex items-center gap-6">
          <Link href="/student" className="flex items-center gap-2.5 group">
            <div className="flex size-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs group-hover:bg-indigo-700 transition-colors">
              <Sparkles className="size-5" />
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight text-foreground">
                HKT QUIZZ
              </span>
              <span className="hidden sm:block text-[10px] font-bold text-muted-foreground uppercase tracking-widest -mt-1">
                STUDENT PORTAL
              </span>
            </div>
          </Link>

          {/* Current Active Org Badge */}
          {organization && (
            <Link
              href="/onboarding"
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-muted/60 hover:bg-muted transition-colors border text-xs font-semibold text-muted-foreground"
            >
              <Building2 className="size-3.5 text-indigo-600" />
              <span className="truncate max-w-[140px] text-foreground">{organization.name}</span>
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200"
              >
                Student
              </Badge>
            </Link>
          )}

          {/* Horizontal Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5">
            {studentNavItems.map((item) => {
              const isActive =
                item.href === '/student' ? pathname === '/student' : pathname.startsWith(item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition-all duration-150 ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 font-bold'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                >
                  <span
                    className={
                      isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-muted-foreground'
                    }
                  >
                    <Icon className="size-4" />
                  </span>
                  {item.title}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Side Controls: Role Switch & Profile */}
        <div className="flex items-center gap-3">
          {hasAdminAccess && (
            <Link href={isAdminRole(membership?.role) ? '/dashboard' : '/onboarding'}>
              <Button
                variant="outline"
                size="sm"
                className="hidden sm:flex items-center gap-1.5 rounded-xl font-bold text-xs border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50"
              >
                <ShieldCheck className="size-4" />
                <span>Admin / Teacher Portal</span>
              </Button>
            </Link>
          )}

          {/* User Button */}
          <UserButton
            appearance={{
              elements: {
                avatarBox: 'size-9 border-2 border-purple-500/30 shadow-xs',
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
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                isActive
                  ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40'
                  : 'text-muted-foreground'
              }`}
            >
              <Icon className="size-4" />
              <span>{item.title}</span>
            </Link>
          );
        })}
      </div>
    </header>
  );
}
