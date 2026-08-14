'use client';

import React from 'react';
import { useQuiz } from '@/shared/lib/quiz-context';
import {
  ShieldAlert,
  Lock,
  Unlock,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Users,
  ShieldCheck,
} from 'lucide-react';

export default function AdminPage() {
  const { users, lockUser, unlockUser, quizzes, resolveReportedQuiz, deleteQuiz, activeRole } =
    useQuiz();

  const reportedQuizzes = quizzes.filter((q) => q.isReported);

  if (activeRole !== 'Admin') {
    return (
      <div className="p-12 text-center rounded-3xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 text-amber-800 dark:text-amber-200 space-y-3">
        <ShieldAlert className="w-12 h-12 text-amber-500 mx-auto" />
        <h2 className="text-xl font-black">Yêu Cầu Quyền Quản Trị Viên (Admin)</h2>
        <p className="text-xs">
          Vui lòng chuyển role sang "Admin" trên thanh điều hướng góc trên bên phải để trải nghiệm
          các tính năng Admin.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-purple-600" />
          Bảng Quản Trị Hệ Thống (UC_05 - UC_08)
        </h1>
        <p className="text-xs text-zinc-500 mt-1">
          Quản lý tài khoản người dùng, khóa/mở khóa tài khoản và duyệt báo cáo vi phạm Quiz
        </p>
      </div>

      {/* Admin UC_05 - UC_07: Manage Users */}
      <div className="rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm space-y-2">
        <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 font-bold text-xs text-zinc-500 uppercase tracking-wider flex items-center gap-2">
          <Users className="w-4 h-4 text-indigo-500" />
          Danh Sách Người Dùng Hàng Thức (UC_05)
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-400 font-bold uppercase tracking-wider border-b border-zinc-100 dark:border-zinc-800">
              <tr>
                <th className="p-3.5 pl-6">Người dùng</th>
                <th className="p-3.5">Email</th>
                <th className="p-3.5">Vai trò (Role)</th>
                <th className="p-3.5">Trạng thái</th>
                <th className="p-3.5 pr-6 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 font-medium">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                  <td className="p-3.5 pl-6 flex items-center gap-3 font-bold text-zinc-900 dark:text-zinc-100">
                    <img
                      src={u.avatar}
                      alt={u.name}
                      className="w-7 h-7 rounded-full object-cover"
                    />
                    <span>{u.name}</span>
                  </td>
                  <td className="p-3.5 text-zinc-500">{u.email}</td>
                  <td className="p-3.5">
                    <span className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 font-bold text-[10px] text-zinc-700 dark:text-zinc-300">
                      {u.role}
                    </span>
                  </td>
                  <td className="p-3.5">
                    {u.isLocked ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 font-bold text-[10px] inline-flex items-center gap-1">
                        <Lock className="w-3 h-3" /> Đã bị khóa (UC_06)
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold text-[10px] inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Hoạt động
                      </span>
                    )}
                  </td>
                  <td className="p-3.5 pr-6 text-right">
                    {u.isLocked ? (
                      <button
                        onClick={() => unlockUser(u.id)}
                        className="px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs inline-flex items-center gap-1 shadow-sm"
                      >
                        <Unlock className="w-3.5 h-3.5" /> Mở khóa (UC_07)
                      </button>
                    ) : (
                      <button
                        onClick={() => lockUser(u.id)}
                        className="px-3 py-1 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs inline-flex items-center gap-1 shadow-sm"
                      >
                        <Lock className="w-3.5 h-3.5" /> Khóa tài khoản (UC_06)
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Admin UC_08: Reported Quizzes List */}
      <div className="rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm space-y-2">
        <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 font-bold text-xs text-zinc-500 uppercase tracking-wider flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          Danh Sách Quiz Bị Báo Cáo Vi Phạm (UC_08) ({reportedQuizzes.length})
        </div>

        {reportedQuizzes.length === 0 ? (
          <div className="p-8 text-center text-xs text-zinc-400 font-semibold">
            Hiện không có bộ Quiz nào bị báo cáo vi phạm.
          </div>
        ) : (
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {reportedQuizzes.map((quiz) => (
              <div
                key={quiz.id}
                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100">
                      {quiz.title}
                    </h4>
                    <span className="px-2 py-0.5 rounded bg-red-100 text-red-700 font-bold text-[10px]">
                      Báo cáo vi phạm
                    </span>
                  </div>
                  <p className="text-xs text-amber-600 font-medium">
                    Lý do báo cáo: "{quiz.reportReason}"
                  </p>
                  <p className="text-[11px] text-zinc-400">
                    Tác giả: {quiz.creatorName} • Ngày tạo: {quiz.createdAt}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => resolveReportedQuiz(quiz.id)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-700 hover:bg-emerald-200 font-bold text-xs flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Bỏ qua báo cáo
                  </button>

                  <button
                    onClick={() => {
                      if (confirm(`Xóa vĩnh viễn Quiz vi phạm "${quiz.title}"?`)) {
                        deleteQuiz(quiz.id);
                      }
                    }}
                    className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Xóa Quiz vi phạm
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
