'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuiz } from '@/shared/lib/quiz-context';
import { UserRole } from '@/shared/lib/mock-store';
import { User, Mail, Lock, UserCheck, PlusCircle, ArrowRight } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const { registerUser } = useQuiz();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('Participant');
  const [errorMessage, setErrorMessage] = useState('');

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!name.trim() || !email.trim() || !password.trim()) {
      setErrorMessage('Vui lòng điền đầy đủ thông tin!');
      return;
    }

    const res = registerUser(name, email, password, role);
    if (res.success) {
      alert(res.message);
      router.push('/');
    } else {
      setErrorMessage(res.message);
    }
  };

  return (
    <div className="max-w-xl mx-auto py-8 sm:py-12 space-y-8 animate-fadeIn">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-10 shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-gradient-to-tr from-purple-600 to-pink-600 text-white rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-purple-500/30">
            <User className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-100">
            Đăng Ký Tài Khoản Mới (UC_01)
          </h1>
          <p className="text-xs text-zinc-500">
            Tạo tài khoản học viên hoặc người sáng tạo bộ Quiz
          </p>
        </div>

        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold text-center">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleRegisterSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
              Họ và Tên
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="VD: Trần Văn Minh"
                className="w-full pl-10 pr-4 py-3 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

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
                placeholder="user@example.com"
                className="w-full pl-10 pr-4 py-3 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 focus:outline-none focus:border-purple-500"
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
                className="w-full pl-10 pr-4 py-3 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Chọn vai trò chính (Role)
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole('Participant')}
                className={`p-3 rounded-2xl border text-left font-bold text-xs flex items-center gap-2 transition-all ${
                  role === 'Participant'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-400 shadow-md'
                    : 'bg-zinc-50 text-zinc-600 border-zinc-200'
                }`}
              >
                <UserCheck className="w-4 h-4 text-emerald-600" />
                Học viên (Student)
              </button>

              <button
                type="button"
                onClick={() => setRole('Creator')}
                className={`p-3 rounded-2xl border text-left font-bold text-xs flex items-center gap-2 transition-all ${
                  role === 'Creator'
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-400 shadow-md'
                    : 'bg-zinc-50 text-zinc-600 border-zinc-200'
                }`}
              >
                <PlusCircle className="w-4 h-4 text-indigo-600" />
                Tác giả (Creator)
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-sm shadow-xl shadow-purple-500/25 transition-all flex items-center justify-center gap-2"
          >
            Tạo Tài Khoản
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center text-xs text-zinc-500 pt-2 border-t border-zinc-100 dark:border-zinc-800">
          Đã có tài khoản?{' '}
          <Link href="/login" className="font-bold text-purple-600 hover:underline">
            Đăng nhập ngay tại đây (UC_02)
          </Link>
        </div>
      </div>
    </div>
  );
}
