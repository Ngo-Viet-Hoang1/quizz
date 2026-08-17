'use client';

import React from 'react';
import { useQuiz } from '@/shared/lib/quiz-context';
import { Quiz } from '@/shared/lib/mock-store';
import { Sparkles, Play, Share2, AlertTriangle, KeyRound, BookOpen, Zap } from 'lucide-react';

export default function HomePage() {
  const { quizzes, setAuthModal, setSelectedQuizForAction, reportQuiz, setActiveExam, exams } =
    useQuiz();

  const handleShare = (quiz: Quiz) => {
    setSelectedQuizForAction(quiz);
    setAuthModal('share-quiz');
  };

  const handleReport = (quizId: string) => {
    const reason = prompt('Nhập lý do báo cáo Quiz này:');
    if (reason) {
      reportQuiz(quizId, reason);
      alert('Đã gửi báo cáo Quiz tới quản trị viên thành công!');
    }
  };

  const handlePlayQuiz = (quiz: Quiz) => {
    const matchingExam = exams.find((e) => e.quizId === quiz.id) || {
      id: `ex-temp-${quiz.id}`,
      title: `Bài Thi: ${quiz.title}`,
      quizId: quiz.id,
      creatorId: quiz.creatorId,
      timeLimitMinutes: 10,
      totalQuestions: quiz.questions.length,
      maxAttempts: 3,
      passPercentage: 70,
    };
    setActiveExam(matchingExam, quiz);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Banner with PIN Join Widget */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-indigo-900 via-purple-900 to-slate-900 text-white p-6 sm:p-10 shadow-2xl border border-indigo-500/20">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 font-bold text-xs">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            Nền Tảng Trắc Nghiệm Trực Truyền Thế Hệ Mới
          </div>

          <h1 className="text-3xl sm:text-5xl font-black leading-tight tracking-tight">
            Học Tập & Kiểm Tra Sinh Động Với{' '}
            <span className="bg-gradient-to-r from-amber-400 via-pink-400 to-indigo-300 bg-clip-text text-transparent">
              Quizizz Pro
            </span>
          </h1>

          <p className="text-sm text-zinc-300 font-medium leading-relaxed">
            Khám phá hàng ngàn bộ Quiz chất lượng, tạo bài thi bằng AI trong 5 giây, tham gia phòng
            thi trực tuyến live cùng bạn bè.
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              onClick={() => setAuthModal('pin-join')}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-sm shadow-xl shadow-amber-500/25 transition-all flex items-center gap-2"
            >
              <KeyRound className="w-4 h-4" />
              Nhập Mã PIN Phòng Thi (UC_23)
            </button>

            <button
              onClick={() => setAuthModal('ai-generate')}
              className="px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-black text-sm border border-white/20 transition-all flex items-center gap-2 backdrop-blur-md"
            >
              <Sparkles className="w-4 h-4 text-purple-400" />
              Tạo Quiz Bằng AI (UC_10)
            </button>
          </div>
        </div>
      </div>

      {/* Featured Quizzes Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-600" />
            Danh Sách Bộ Quiz Nổi Bật (UC_09 / UC_18)
          </h2>
          <p className="text-xs text-zinc-500">
            Lựa chọn bộ câu hỏi trắc nghiệm để bắt đầu ôn tập hoặc thi thử
          </p>
        </div>
      </div>

      {/* Quizzes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {quizzes.map((quiz) => (
          <div
            key={quiz.id}
            className="group rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
          >
            <div>
              {/* Cover Image & Category Badge */}
              <div className="relative h-44 overflow-hidden">
                <img
                  src={quiz.coverImage}
                  alt={quiz.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-white font-bold text-[11px]">
                  {quiz.category}
                </span>

                {quiz.isReported && (
                  <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-red-500 text-white font-bold text-[10px] flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Đang báo cáo
                  </span>
                )}
              </div>

              {/* Quiz Info */}
              <div className="p-5 space-y-2">
                <h3 className="font-extrabold text-base text-zinc-900 dark:text-zinc-100 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                  {quiz.title}
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                  {quiz.description}
                </p>

                <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-400 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                  <span>
                    Tác giả:{' '}
                    <strong className="text-zinc-700 dark:text-zinc-300">{quiz.creatorName}</strong>
                  </span>
                  <span>{quiz.questionCount} Câu hỏi</span>
                </div>
              </div>
            </div>

            {/* Quiz Card Action buttons */}
            <div className="p-5 pt-0 flex items-center gap-2">
              <button
                onClick={() => handlePlayQuiz(quiz)}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-indigo-500/20"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Vào Làm Bài
              </button>

              <button
                onClick={() => handleShare(quiz)}
                title="Chia sẻ Quiz (UC_11)"
                className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-600 dark:text-zinc-300 transition-colors"
              >
                <Share2 className="w-4 h-4" />
              </button>

              <button
                onClick={() => handleReport(quiz.id)}
                title="Báo cáo Quiz (UC_08)"
                className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 hover:bg-red-100 text-red-600 transition-colors"
              >
                <AlertTriangle className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
