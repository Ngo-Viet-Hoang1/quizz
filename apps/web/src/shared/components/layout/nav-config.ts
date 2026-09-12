import {
  BarChart3,
  BookOpenCheck,
  FileSpreadsheet,
  GraduationCap,
  Layers,
  LayoutDashboard,
  Radio,
  Settings,
  ShieldCheck,
  Sparkles,
  Users2,
} from 'lucide-react';
import { type ComponentType } from 'react';

export interface NavItem {
  title: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  badge?: string;
  badgeVariant?: 'default' | 'secondary' | 'outline';
}

export interface NavGroup {
  id: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  items: NavItem[];
}

export const isRouteActive = (pathname: string, href: string): boolean =>
  pathname === href || (href !== '/dashboard' && pathname.startsWith(href));

export const NAV_GROUPS: NavGroup[] = [
  {
    id: 'quizzes',
    label: 'Assessments & Rooms',
    icon: Layers,
    items: [
      { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { title: 'Quiz Bank', href: '/quizzes', icon: BookOpenCheck },
      { title: 'Live Rooms', href: '/rooms', icon: Radio, badge: 'Live', badgeVariant: 'default' },
      {
        title: 'AI Generator',
        href: '/ai-generate',
        icon: Sparkles,
        badge: 'AI',
        badgeVariant: 'secondary',
      },
    ],
  },
  {
    id: 'classes',
    label: 'Classes & Candidates',
    icon: Users2,
    items: [
      { title: 'Classes & Groups', href: '/classes', icon: Users2 },
      { title: 'Candidates', href: '/candidates', icon: GraduationCap },
      { title: 'Results & History', href: '/results', icon: FileSpreadsheet },
      { title: 'Analytics', href: '/analytics', icon: BarChart3 },
    ],
  },
  {
    id: 'system',
    label: 'Administration',
    icon: ShieldCheck,
    items: [
      { title: 'Quiz Reports', href: '/quiz-reports', icon: ShieldCheck },
      { title: 'Audit Logs', href: '/audit-logs', icon: ShieldCheck },
      { title: 'Settings', href: '/settings', icon: Settings },
    ],
  },
];
