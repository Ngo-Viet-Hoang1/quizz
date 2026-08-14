'use client';

import React, { useState } from 'react';
import { useQuiz } from '@/shared/lib/quiz-context';
import { Exam } from '@/shared/lib/mock-store';
import {
  FileCheck,
  PlusCircle,
  Search,
  Play,
  Trophy,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';

export default function ExamsPage() {
  const { exams, examResults, quizzes, createExam, setActiveExam, activeRole } = useQuiz();

  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateExamForm, setShowCreateExamForm] = useState(false);
  const [examTitle, setExamTitle] = useState('');
  const [selectedQuizId, setSelectedQuizId] = useState(quizzes[0]?.id || '');
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(15);
  const [passPercentage, setPassPercentage] = useState(80);

  const filteredExams = exams.filter((e) =>
    e.title.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleCreateExamSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!examTitle.trim()) return;

    const quiz = quizzes.find((q) => q.id === selectedQuizId) || quizzes[0];
    createExam({
      title: examTitle,
      quizId: quiz.id,
      creatorId: 'usr-1',
      timeLimitMinutes: Number(timeLimitMinutes),
      totalQuestions: quiz.questionCount,
      maxAttempts: 2,
      passPercentage: Number(passPercentage),
    });

    setExamTitle('');
    setShowCreateExamForm(false);
    alert('Đã tạo bài thi mới thành công!');
  };

  const handleStartExam = (exam: Exam) => {
    const quiz = quizzes.find((q) => q.id === exam.quizId) || quizzes[0];
    setActiveExam(exam, quiz);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <FileCheck className="w-6 h-6 text-indigo-600" />
            Quản Lý Bài Thi & Kết Quả (UC_24 - UC_29)
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Tạo bài thi chính thức, thực hiện thi trực tiếp và xem báo cáo kết quả chi tiết
          </p>
        </div>

        {(activeRole === 'Creator' || activeRole === 'Admin') && (
          <button
            onClick={() => setShowCreateExamForm(!showCreateExamForm)}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-500/20"
          >
            <PlusCircle className="w-4 h-4" />
            Tạo Bài Thi Mới (UC_24)
          </button>
        )}
      </div>

      {/* Exam Search Bar (UC_27) */}
      <div className="relative">
        <Search className="w-4 h-4 text-zinc-400 absolute left-4 top-3.5" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Tìm kiếm bài thi... (UC_27)"
          className="w-full pl-11 pr-4 py-3 text-sm rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:border-indigo-500 shadow-sm"
        />
      </div>

      {/* Create Exam Form Modal (UC_24) */}
      {showCreateExamForm && (
        <form
          onSubmit={handleCreateExamSubmit}
          className="p-6 rounded-3xl bg-indigo-50/50 dark:bg-zinc-900 border-2 border-indigo-200 dark:border-indigo-800 space-y-4 animate-fadeIn"
        >
          <h3 className="text-base font-black text-indigo-900 dark:text-indigo-200">
            Tạo Bài Thi Mới (UC_24)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                Tên bài thi
              </label>
              <input
                type="text"
                required
                value={examTitle}
                onChange={(e) => setExamTitle(e.target.value)}
                placeholder="VD: Bài Kiểm Tra Giữa Kỳ Lập Trình"
                className="w-full px-3 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                Chọn bộ Quiz nguồn
              </label>
              <select
                value={selectedQuizId}
                onChange={(e) => setSelectedQuizId(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800"
              >
                {quizzes.map((q) => (
                  <option key={q.id} value={q.id}>
                    {q.title} ({q.questionCount} câu)
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                Thời gian làm bài (Phút)
              </label>
              <input
                type="number"
                value={timeLimitMinutes}
                onChange={(e) => setTimeLimitMinutes(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                Điểm đạt (%)
              </label>
              <input
                type="number"
                value={passPercentage}
                onChange={(e) => setPassPercentage(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowCreateExamForm(false)}
              className="px-4 py-2 rounded-xl bg-zinc-200 dark:bg-zinc-800 text-xs font-bold"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs"
            >
              Lưu & Xuất Bản Bài Thi
            </button>
          </div>
        </form>
      )}

      {/* Available Exams Grid (UC_29) */}
      <div className="space-y-3">
        <h3 className="text-sm font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
          Danh Sách Bài Thi Đang Mở
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredExams.map((exam) => (
            <div
              key={exam.id}
              className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center justify-between gap-4"
            >
              <div>
                <h4 className="font-extrabold text-base text-zinc-900 dark:text-zinc-100">
                  {exam.title}
                </h4>
                <div className="flex items-center gap-3 text-xs text-zinc-500 font-medium mt-2">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-indigo-500" /> {exam.timeLimitMinutes} Phút
                  </span>
                  <span>•</span>
                  <span>{exam.totalQuestions} Câu hỏi</span>
                  <span>•</span>
                  <span>Đạt: &ge;{exam.passPercentage}%</span>
                </div>
              </div>

              <button
                onClick={() => handleStartExam(exam)}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-95 text-white font-extrabold text-xs shadow-md shadow-indigo-500/20 flex items-center gap-1.5 shrink-0"
              >
                <Play className="w-3.5 h-3.5 fill-current" /> Làm Bài (UC_29)
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Exam Results Table (UC_28) */}
      <div className="rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm space-y-2">
        <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <div className="font-bold text-xs text-zinc-500 uppercase tracking-wider flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-500" />
            Lịch Sử & Báo Cáo Kết Quả Thi (UC_28)
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-400 font-bold uppercase tracking-wider border-b border-zinc-100 dark:border-zinc-800">
              <tr>
                <th className="p-3.5 pl-6">Thí sinh</th>
                <th className="p-3.5">Bài thi</th>
                <th className="p-3.5">Điểm số</th>
                <th className="p-3.5">Tỷ lệ</th>
                <th className="p-3.5">Trạng thái</th>
                <th className="p-3.5 pr-6">Thời gian hoàn thành</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 font-medium">
              {examResults.map((res) => (
                <tr key={res.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                  <td className="p-3.5 pl-6 font-bold text-zinc-900 dark:text-zinc-100">
                    {res.participantName}
                  </td>
                  <td className="p-3.5 text-zinc-600 dark:text-zinc-300">{res.examTitle}</td>
                  <td className="p-3.5 font-mono font-bold text-indigo-600">
                    {res.score} / {res.totalScore}
                  </td>
                  <td className="p-3.5 font-bold">{res.percentage}%</td>
                  <td className="p-3.5">
                    <span
                      className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] inline-flex items-center gap-1 ${
                        res.passed ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {res.passed ? (
                        <CheckCircle className="w-3 h-3" />
                      ) : (
                        <XCircle className="w-3 h-3" />
                      )}
                      {res.passed ? 'ĐẠT' : 'KHÔNG ĐẠT'}
                    </span>
                  </td>
                  <td className="p-3.5 pr-6 text-zinc-400">{res.completedAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
