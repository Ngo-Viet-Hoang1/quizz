'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuiz } from '@/shared/lib/quiz-context';
import { Lock, Mail, ArrowRight, ShieldCheck, UserCheck, PlusCircle, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useQuiz();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    const res = login(email, password);
    if (res.success) {
      alert(res.message);
      router.push('/');
    } else {
      setErrorMessage(res.message);
    }
  };

  const handleQuickLogin = (testEmail: string) => {
    const res = login(testEmail, '123456');
    if (res.success) {
      alert(res.message);
      router.push('/');
    } else {
      setErrorMessage(res.message);
    }
  };

  const testAccounts = [
    {
      role: 'Participant',
      label: 'Học viên (Student)',
      email: 'student@example.com',
      desc: 'Làm bài thi, tham gia phòng live',
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100',
      icon: <UserCheck className="w-5 h-5 text-emerald-600" />,
    },
    {
      role: 'Creator',
      label: 'Tác giả (Creator)',
      email: 'creator@example.com',
      desc: 'Tạo Quiz AI, tạo phòng & bài thi',
      color: 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100',
      icon: <PlusCircle className="w-5 h-5 text-indigo-600" />,
    },
    {
      role: 'Admin',
      label: 'Quản trị viên (Admin)',
      email: 'admin@quizapp.com',
      desc: 'Quản lý user, duyệt báo cáo Quiz',
      color: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100',
      icon: <ShieldCheck className="w-5 h-5 text-purple-600" />,
    },
  ];

  return (
    <div className="max-w-xl mx-auto py-8 sm:py-12 space-y-8 animate-fadeIn">
      {/* Login Card */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-10 shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-gradient-to-tr from-indigo-600 to-purple-600 text-white rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-indigo-500/30">
            <Lock className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-100">
            Đăng Nhập Hệ Thống (UC_02)
          </h1>
          <p className="text-xs text-zinc-500">
            Đăng nhập tài khoản để quản lý Quiz, bài thi và tham gia phòng live
          </p>
        </div>

        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold text-center">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleLoginSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
              Địa chỉ Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@example.com"
                className="w-full pl-10 pr-4 py-3 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
              Mật khẩu
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm shadow-xl shadow-indigo-500/25 transition-all flex items-center justify-center gap-2"
          >
            Đăng Nhập Ngay
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* 3 Quick Test Accounts */}
        <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Đăng Nhập Thử 1-Click (3 Mock Accounts)
            </span>
          </div>

          <div className="space-y-2">
            {testAccounts.map((acc) => (
              <button
                key={acc.email}
                type="button"
                onClick={() => handleQuickLogin(acc.email)}
                className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all ${acc.color}`}
              >
                <div className="flex items-center gap-3">
                  {acc.icon}
                  <div>
                    <div className="font-extrabold text-xs">{acc.label}</div>
                    <div className="text-[11px] opacity-80">{acc.desc}</div>
                    <div className="text-[10px] font-mono opacity-70">
                      Email: {acc.email} | Mật khẩu: 123456
                    </div>
                  </div>
                </div>

                <span className="text-xs font-black underline shrink-0">Đăng nhập</span>
              </button>
            ))}
          </div>
        </div>

        {/* Footer link to Register */}
        <div className="text-center text-xs text-zinc-500 pt-2">
          Chưa có tài khoản?{' '}
          <Link href="/register" className="font-bold text-indigo-600 hover:underline">
            Đăng ký ngay tại đây (UC_01)
          </Link>
        </div>
      </div>
    </div>
  );
}
