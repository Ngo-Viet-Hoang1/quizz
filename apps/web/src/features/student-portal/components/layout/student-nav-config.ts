import type { LucideIcon } from 'lucide-react';
import { History, LayoutDashboard, Users2 } from 'lucide-react';

export interface StudentNavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  badgeVariant?: 'default' | 'secondary' | 'outline';
}

export const STUDENT_NAV_ITEMS: StudentNavItem[] = [
  { title: 'Home', href: '/student', icon: LayoutDashboard },
  { title: 'My Classes', href: '/student/classes', icon: Users2 },
  { title: 'Exam History', href: '/student/history', icon: History },
];

export const studentNavItems = STUDENT_NAV_ITEMS;

export const isStudentRouteActive = (pathname: string, href: string): boolean =>
  href === '/student' ? pathname === '/student' : pathname.startsWith(href);
