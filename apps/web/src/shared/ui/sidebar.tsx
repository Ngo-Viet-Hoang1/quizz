'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useQuiz } from '../lib/quiz-context';
import {
  Compass,
  HelpCircle,
  Users,
  FileCheck,
  ShieldAlert,
  Sparkles,
  FileSpreadsheet,
  Award,
  KeyRound,
} from 'lucide-react';

export function Sidebar() {
  const pathname = usePathname();
  const { activeRole, setAuthModal } = useQuiz();

  const navItems = [
    {
      label: 'Khám phá Quiz',
      href: '/',
      icon: <Compass className="w-5 h-5" />,
      roles: ['Participant', 'Creator', 'Admin', 'Guest'],
    },
    {
      label: 'Quản lý Quiz',
      href: '/quizzes',
      icon: <HelpCircle className="w-5 h-5" />,
      roles: ['Creator', 'Admin', 'Participant'],
    },
    {
      label: 'Phòng thi Live',
      href: '/rooms',
      icon: <Users className="w-5 h-5" />,
      roles: ['Participant', 'Creator', 'Admin'],
    },
    {
      label: 'Bài thi & Kết quả',
      href: '/exams',
      icon: <FileCheck className="w-5 h-5" />,
      roles: ['Participant', 'Creator', 'Admin'],
    },
    {
      label: 'Admin Quản trị',
      href: '/admin',
      icon: <ShieldAlert className="w-5 h-5" />,
      roles: ['Admin'],
    },
  ];

  const visibleNav = navItems.filter((item) => item.roles.includes(activeRole));

  return (
    <aside className="w-64 shrink-0 hidden md:block bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 p-4 min-h-[calc(100vh-4rem)]">
      {/* Quick Action buttons */}
      <div className="space-y-2 mb-6">
        {(activeRole === 'Creator' || activeRole === 'Admin') && (
          <>
            <button
              onClick={() => setAuthModal('ai-generate')}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white font-bold text-xs shadow-lg shadow-indigo-500/25 hover:opacity-95 transition-all"
            >
              <Sparkles className="w-4 h-4 animate-pulse" />
              Tạo Quiz Bằng AI (UC_10)
            </button>

            <button
              onClick={() => setAuthModal('import-export')}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold text-xs border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200 transition-all"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              Nhập / Xuất Quiz (UC_12/13)
            </button>
          </>
        )}

        <button
          onClick={() => setAuthModal('pin-join')}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-amber-500/10 text-amber-600 border border-amber-200 font-bold text-xs hover:bg-amber-500/20 transition-all"
        >
          <KeyRound className="w-4 h-4" />
          Tham Gia Phòng Thi (UC_23)
        </button>
      </div>

      {/* Main Navigation Links */}
      <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-2 px-3">
        Danh Mục Chính
      </div>

      <nav className="space-y-1">
        {visibleNav.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                isActive
                  ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Role Notice Card */}
      <div className="mt-8 p-3.5 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/40 border border-indigo-100 dark:border-indigo-900/40 text-xs">
        <div className="font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5 mb-1">
          <Award className="w-4 h-4 text-indigo-600" />
          Role: {activeRole}
        </div>
        <p className="text-zinc-600 dark:text-zinc-400 text-[11px] leading-relaxed">
          {activeRole === 'Participant' &&
            'Đang đóng vai Người làm bài. Có thể làm quiz, tham gia phòng thi live.'}
          {activeRole === 'Creator' &&
            'Đang đóng vai Tác giả. Có thể tạo quiz AI, chia sẻ, tạo phòng & bài thi.'}
          {activeRole === 'Admin' &&
            'Đang đóng vai Quản trị viên. Có quyền khóa tài khoản, xử lý báo cáo quiz.'}
        </p>
      </div>
    </aside>
  );
}
