'use client';

import React, { useState } from 'react';
import { useQuiz } from '@/shared/lib/quiz-context';
import { HelpCircle, PlusCircle, Sparkles, FileSpreadsheet, Share2, Trash2 } from 'lucide-react';

export default function QuizzesPage() {
  const { quizzes, deleteQuiz, setAuthModal, setSelectedQuizForAction, addQuiz, currentUser } =
    useQuiz();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState('Lập trình');

  const handleCreateManualQuiz = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    addQuiz({
      id: `qz-${Date.now()}`,
      title: newTitle,
      description: newDesc || 'Bộ câu hỏi trắc nghiệm mới được khởi tạo thủ công.',
      category: newCategory,
      questionCount: 3,
      creatorName: currentUser.name,
      creatorId: currentUser.id,
      plays: 0,
      rating: 5.0,
      coverImage: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600',
      createdAt: new Date().toISOString().substring(0, 10),
      questions: [
        {
          id: 'q1',
          text: 'Câu hỏi mẫu 1?',
          options: ['Đáp án A', 'Đáp án B (Đúng)', 'Đáp án C', 'Đáp án D'],
          correctOptionIndex: 1,
          timeLimitSeconds: 20,
          points: 100,
        },
        {
          id: 'q2',
          text: 'Câu hỏi mẫu 2?',
          options: ['Đáp án A (Đúng)', 'Đáp án B', 'Đáp án C', 'Đáp án D'],
          correctOptionIndex: 0,
          timeLimitSeconds: 20,
          points: 100,
        },
        {
          id: 'q3',
          text: 'Câu hỏi mẫu 3?',
          options: ['Đáp án A', 'Đáp án B', 'Đáp án C (Đúng)', 'Đáp án D'],
          correctOptionIndex: 2,
          timeLimitSeconds: 20,
          points: 100,
        },
      ],
    });

    setNewTitle('');
    setNewDesc('');
    setShowCreateForm(false);
    alert('Đã tạo thành công bộ Quiz mới!');
  };

  return (
    <div className="space-y-6">
      {/* Header & Quick Action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <HelpCircle className="w-6 h-6 text-indigo-600" />
            Quản Lý Bộ Quiz (UC_09 - UC_13)
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Tạo mới, biên tập, tạo tự động bằng AI, chia sẻ và xuất/nhập dữ liệu Quiz
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setAuthModal('ai-generate')}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-500/20"
          >
            <Sparkles className="w-4 h-4" />
            Tạo Bằng AI (UC_10)
          </button>

          <button
            onClick={() => setAuthModal('import-export')}
            className="px-4 py-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-200 font-bold text-xs flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Import / Export (UC_12/13)
          </button>

          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="px-4 py-2.5 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold text-xs flex items-center gap-1.5"
          >
            <PlusCircle className="w-4 h-4" />
            Tạo Thủ Công (UC_09)
          </button>
        </div>
      </div>

      {/* Manual Creation Form */}
      {showCreateForm && (
        <form
          onSubmit={handleCreateManualQuiz}
          className="p-6 rounded-3xl bg-indigo-50/50 dark:bg-zinc-900 border-2 border-indigo-200 dark:border-indigo-800 space-y-4 animate-fadeIn"
        >
          <h3 className="text-base font-black text-indigo-900 dark:text-indigo-200">
            Tạo Bộ Quiz Mới (CRUD Quiz - UC_09)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                Tên bộ Quiz
              </label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="VD: Kiểm Tra Lập Trình Python"
                className="w-full px-3 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                Thể loại
              </label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800"
              >
                <option value="Lập trình">Lập trình</option>
                <option value="Ngoại ngữ">Ngoại ngữ</option>
                <option value="Văn hóa">Văn hóa</option>
                <option value="Khoa học">Khoa học</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
              Mô tả ngắn
            </label>
            <textarea
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Nhập mô tả bộ câu hỏi..."
              rows={2}
              className="w-full px-3 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="px-4 py-2 rounded-xl bg-zinc-200 dark:bg-zinc-800 text-xs font-bold"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs"
            >
              Lưu & Tạo Quiz
            </button>
          </div>
        </form>
      )}

      {/* Quizzes Table List */}
      <div className="rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 font-bold text-xs text-zinc-500 uppercase tracking-wider">
          Danh Sách Bộ Quiz Đang Có ({quizzes.length})
        </div>
        <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {quizzes.map((quiz) => (
            <div
              key={quiz.id}
              className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <img
                  src={quiz.coverImage}
                  alt={quiz.title}
                  className="w-14 h-14 rounded-2xl object-cover shrink-0"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100">
                      {quiz.title}
                    </h4>
                    <span className="px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold text-[10px]">
                      {quiz.category}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 line-clamp-1 mt-0.5">{quiz.description}</p>
                  <div className="flex items-center gap-3 text-[11px] text-zinc-400 font-medium mt-1">
                    <span>{quiz.questionCount} câu hỏi</span>
                    <span>•</span>
                    <span>Tác giả: {quiz.creatorName}</span>
                    <span>•</span>
                    <span>Lượt chơi: {quiz.plays}</span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => {
                    setSelectedQuizForAction(quiz);
                    setAuthModal('share-quiz');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1"
                >
                  <Share2 className="w-3.5 h-3.5" /> Chia sẻ (UC_11)
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Bạn có chắc muốn xóa Quiz "${quiz.title}"?`)) {
                      deleteQuiz(quiz.id);
                    }
                  }}
                  className="p-2 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 hover:bg-red-100 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
