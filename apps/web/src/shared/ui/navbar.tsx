'use client';

import React from 'react';
import { useQuiz } from '../lib/quiz-context';
import { UserRole } from '../lib/mock-store';
import {
  Shield,
  UserCheck,
  PlusCircle,
  KeyRound,
  LogIn,
  UserPlus,
  Lock,
  Search,
} from 'lucide-react';

export function Navbar() {
  const { activeRole, setActiveRole, currentUser, setAuthModal } = useQuiz();

  const roles: { role: UserRole; label: string; icon: React.ReactNode; color: string }[] = [
    {
      role: 'Participant',
      label: 'Học viên (Participant)',
      icon: <UserCheck className="w-4 h-4" />,
      color: 'bg-emerald-500/10 text-emerald-600 border-emerald-200',
    },
    {
      role: 'Creator',
      label: 'Tác giả (Creator)',
      icon: <PlusCircle className="w-4 h-4" />,
      color: 'bg-indigo-500/10 text-indigo-600 border-indigo-200',
    },
    {
      role: 'Admin',
      label: 'Quản trị viên (Admin)',
      icon: <Shield className="w-4 h-4" />,
      color: 'bg-purple-500/10 text-purple-600 border-purple-200',
    },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-500/25">
            Q
          </div>
          <div>
            <span className="text-xl font-extrabold bg-gradient-to-r from-indigo-600 via-violet-600 to-pink-500 bg-clip-text text-transparent">
              Quizizz Pro
            </span>
            <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300">
              v2.0
            </span>
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="hidden md:flex flex-1 max-w-md items-center relative">
          <Search className="w-4 h-4 absolute left-3 text-zinc-400" />
          <input
            type="text"
            placeholder="Tìm kiếm Quiz, Phòng thi, Bài thi..."
            className="w-full pl-9 pr-4 py-2 text-sm rounded-full bg-zinc-100 dark:bg-zinc-800/80 border border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-zinc-900 transition-all outline-none"
          />
        </div>

        {/* Role Switcher Pill & User Actions */}
        <div className="flex items-center gap-3">
          {/* Role selector dropdown */}
          <div className="flex items-center gap-1 p-1 bg-zinc-100 dark:bg-zinc-800/80 rounded-xl border border-zinc-200 dark:border-zinc-700/50">
            <span className="text-xs text-zinc-400 font-medium px-2 hidden sm:inline">Role:</span>
            {roles.map((r) => (
              <button
                key={r.role}
                onClick={() => setActiveRole(r.role)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  activeRole === r.role
                    ? `${r.color} shadow-sm border font-bold scale-[1.02]`
                    : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                }`}
              >
                {r.icon}
                <span className="hidden lg:inline">{r.label}</span>
              </button>
            ))}
          </div>

          {/* Quick PIN Join button */}
          <button
            onClick={() => setAuthModal('pin-join')}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-bold shadow-md shadow-amber-500/20 transition-all"
          >
            <KeyRound className="w-4 h-4" />
            Nhập Mã PIN
          </button>

          {/* User profile avatar & Auth controls */}
          <div className="flex items-center gap-2 pl-2 border-l border-zinc-200 dark:border-zinc-800">
            {currentUser.isLocked ? (
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-100 text-red-700 text-xs font-bold">
                <Lock className="w-3.5 h-3.5" /> Khóa
              </span>
            ) : (
              <div className="flex items-center gap-2">
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-8 h-8 rounded-full border-2 border-indigo-500 object-cover"
                />
                <div className="hidden xl:block text-left">
                  <div className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                    {currentUser.name}
                  </div>
                  <div className="text-[10px] text-zinc-400 font-semibold">{activeRole}</div>
                </div>
              </div>
            )}

            {/* Auth Action buttons (UC_01 to UC_04) */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setAuthModal('login')}
                title="Đăng nhập (UC_02)"
                className="p-1.5 rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <LogIn className="w-4 h-4" />
              </button>
              <button
                onClick={() => setAuthModal('register')}
                title="Đăng ký (UC_01)"
                className="p-1.5 rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <UserPlus className="w-4 h-4" />
              </button>
              <button
                onClick={() => setAuthModal('change-password')}
                title="Đổi mật khẩu (UC_04)"
                className="p-1.5 rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <Lock className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
