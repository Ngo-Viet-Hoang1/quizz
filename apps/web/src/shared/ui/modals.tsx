'use client';

import React, { useState } from 'react';
import { useQuiz } from '../lib/quiz-context';
import {
  X,
  Sparkles,
  KeyRound,
  FileSpreadsheet,
  Share2,
  Lock,
  Mail,
  User,
  CheckCircle,
  Copy,
  Upload,
  Download,
  Wand2,
} from 'lucide-react';

export function Modals() {
  const { authModal, setAuthModal, joinRoomByCode, addQuiz, currentUser, selectedQuizForAction } =
    useQuiz();

  // Local form states
  const [pinCode, setPinCode] = useState('');
  const [pinError, setPinError] = useState('');
  const [copied, setCopied] = useState(false);

  // AI Prompt generator state
  const [aiTopic, setAiTopic] = useState('');
  const [aiNumQuestions, setAiNumQuestions] = useState(5);
  const [aiDifficulty, setAiDifficulty] = useState('Trung bình');
  const [isGenerating, setIsGenerating] = useState(false);

  if (!authModal) return null;

  const handleJoinPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinCode.trim()) {
      setPinError('Vui lòng nhập mã PIN');
      return;
    }
    const room = joinRoomByCode(pinCode.trim());
    if (room) {
      setAuthModal(null);
      setPinCode('');
      setPinError('');
      alert(`Đã tham gia phòng: "${room.name}" thành công!`);
    } else {
      setPinError('Không tìm thấy phòng với mã PIN này (Thử mã: 884920 hoặc 120593)');
    }
  };

  const handleAiGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiTopic.trim()) return;
    setIsGenerating(true);
    setTimeout(() => {
      addQuiz({
        id: `qz-ai-${Date.now()}`,
        title: `Quiz AI: ${aiTopic}`,
        description: `Quiz được tạo tự động bởi AI với chủ đề ${aiTopic} (Độ khó: ${aiDifficulty})`,
        category: 'Công nghệ / AI',
        questionCount: Number(aiNumQuestions),
        creatorName: currentUser.name,
        creatorId: currentUser.id,
        plays: 0,
        rating: 5.0,
        coverImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600',
        createdAt: new Date().toISOString().substring(0, 10),
        questions: Array.from({ length: Number(aiNumQuestions) }).map((_, idx) => ({
          id: `ai-q-${idx}`,
          text: `[AI Generator] Câu hỏi số ${idx + 1} về chủ đề: ${aiTopic}?`,
          options: [
            `Đáp án A cho câu ${idx + 1}`,
            `Đáp án B cho câu ${idx + 1} (Đúng)`,
            `Đáp án C cho câu ${idx + 1}`,
            `Đáp án D cho câu ${idx + 1}`,
          ],
          correctOptionIndex: 1,
          timeLimitSeconds: 20,
          points: 100,
        })),
      });
      setIsGenerating(false);
      setAuthModal(null);
      setAiTopic('');
      alert(`Đã tạo thành công bộ Quiz AI "${aiTopic}" với ${aiNumQuestions} câu hỏi!`);
    }, 1200);
  };

  const handleCopyShareLink = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden relative">
        {/* Close Button */}
        <button
          onClick={() => setAuthModal(null)}
          className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Content depending on authModal */}

        {/* UC_02: Đăng nhập */}
        {authModal === 'login' && (
          <div className="p-6 sm:p-8">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-3 font-bold">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-100">
                Đăng Nhập Tài Khoản (UC_02)
              </h3>
              <p className="text-xs text-zinc-500 mt-1">
                Nhập thông tin để đăng nhập vào hệ thống Quiz
              </p>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setAuthModal(null);
                alert('Đăng nhập thành công!');
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Email / Tên đăng nhập
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    placeholder="user@example.com"
                    className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Mật khẩu
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition-all shadow-lg shadow-indigo-500/25"
              >
                Xác Nhận Đăng Nhập
              </button>
            </form>
          </div>
        )}

        {/* UC_01: Đăng ký */}
        {authModal === 'register' && (
          <div className="p-6 sm:p-8">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-3 font-bold">
                <User className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-100">
                Đăng Ký Tài Khoản Mới (UC_01)
              </h3>
              <p className="text-xs text-zinc-500 mt-1">
                Tạo tài khoản học viên hoặc người sáng tạo Quiz
              </p>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setAuthModal(null);
                alert('Đăng ký tài khoản thành công!');
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Họ và Tên
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nguyễn Văn A"
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="email@example.com"
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Mật khẩu
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 focus:outline-none focus:border-purple-500"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm transition-all shadow-lg shadow-purple-500/25"
              >
                Tạo Tài Khoản
              </button>
            </form>
          </div>
        )}

        {/* UC_04: Đổi mật khẩu */}
        {authModal === 'change-password' && (
          <div className="p-6 sm:p-8">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-3 font-bold">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-100">
                Đổi Mật Khẩu (UC_04)
              </h3>
              <p className="text-xs text-zinc-500 mt-1">
                Cập nhật mật khẩu bảo vệ tài khoản của bạn
              </p>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setAuthModal(null);
                alert('Đổi mật khẩu thành công!');
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Mật khẩu hiện tại
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Mật khẩu mới
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm transition-all shadow-lg shadow-amber-500/25"
              >
                Cập Nhật Mật Khẩu
              </button>
            </form>
          </div>
        )}

        {/* UC_23: Nhập Mã PIN Tham Gia Phòng Thi */}
        {authModal === 'pin-join' && (
          <div className="p-6 sm:p-8">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-tr from-amber-500 to-orange-500 text-white rounded-2xl flex items-center justify-center mx-auto mb-3 font-bold shadow-lg shadow-amber-500/30">
                <KeyRound className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-100">
                Tham Gia Phòng Thi (UC_23)
              </h3>
              <p className="text-xs text-zinc-500 mt-1">
                Nhập 6 chữ số mã PIN từ giáo viên hoặc người chủ phòng
              </p>
            </div>
            <form onSubmit={handleJoinPin} className="space-y-4">
              <div>
                <input
                  type="text"
                  maxLength={6}
                  value={pinCode}
                  onChange={(e) => {
                    setPinCode(e.target.value);
                    setPinError('');
                  }}
                  placeholder="Ví dụ: 884920"
                  className="w-full tracking-widest text-center text-3xl font-black py-4 rounded-2xl border-2 border-amber-300 dark:border-amber-700 dark:bg-zinc-800 focus:border-amber-500 focus:outline-none"
                />
                {pinError && (
                  <p className="text-xs text-red-500 font-semibold text-center mt-2">{pinError}</p>
                )}
                <p className="text-[11px] text-zinc-400 text-center mt-2">
                  Thử mã PIN có sẵn:{' '}
                  <span className="font-mono font-bold text-amber-600">884920</span> hoặc{' '}
                  <span className="font-mono font-bold text-amber-600">120593</span>
                </p>
              </div>
              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-sm shadow-xl shadow-amber-500/25 transition-all"
              >
                Vào Phòng Ngay
              </button>
            </form>
          </div>
        )}

        {/* UC_10: Tạo Quiz bằng AI */}
        {authModal === 'ai-generate' && (
          <div className="p-6 sm:p-8">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-tr from-indigo-600 to-purple-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-3 font-bold shadow-lg shadow-indigo-500/30">
                <Sparkles className="w-6 h-6 animate-spin-slow" />
              </div>
              <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-100">
                Tạo Quiz Tự Động Bằng AI (UC_10)
              </h3>
              <p className="text-xs text-zinc-500 mt-1">
                Nhập chủ đề bất kỳ, trí tuệ nhân tạo sẽ tự tạo bộ câu hỏi hoàn chỉnh
              </p>
            </div>
            <form onSubmit={handleAiGenerate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Chủ đề hoặc Nội dung Quiz
                </label>
                <input
                  type="text"
                  required
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                  placeholder="VD: Lập trình Python cơ bản, Lịch sử Thế giới 1945..."
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Số lượng câu hỏi
                  </label>
                  <select
                    value={aiNumQuestions}
                    onChange={(e) => setAiNumQuestions(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800"
                  >
                    <option value={3}>3 câu</option>
                    <option value={5}>5 câu</option>
                    <option value={10}>10 câu</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Độ khó
                  </label>
                  <select
                    value={aiDifficulty}
                    onChange={(e) => setAiDifficulty(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800"
                  >
                    <option value="Dễ">Dễ</option>
                    <option value="Trung bình">Trung bình</option>
                    <option value="Nâng cao">Nâng cao</option>
                  </select>
                </div>
              </div>
              <button
                type="submit"
                disabled={isGenerating}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:opacity-95 text-white font-black text-sm shadow-xl shadow-indigo-500/25 transition-all flex items-center justify-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <Wand2 className="w-4 h-4 animate-spin" /> AI đang soạn câu hỏi...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" /> Sinh Bộ Quiz Bằng AI
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* UC_11: Chia sẻ Quiz */}
        {authModal === 'share-quiz' && (
          <div className="p-6 sm:p-8">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-3 font-bold">
                <Share2 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-100">
                Chia Sẻ Quiz (UC_11)
              </h3>
              <p className="text-xs text-zinc-500 mt-1">
                Sao chép liên kết chia sẻ cho người làm bài hoặc học sinh
              </p>
            </div>
            <div className="space-y-4">
              <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl flex items-center justify-between text-xs font-mono border border-zinc-200 dark:border-zinc-700">
                <span className="truncate pr-2">{`https://quizapp.com/share/${selectedQuizForAction?.id || 'qz-1'}`}</span>
                <button
                  onClick={handleCopyShareLink}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white font-sans font-bold text-xs flex items-center gap-1 shrink-0"
                >
                  {copied ? (
                    <CheckCircle className="w-3.5 h-3.5" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  {copied ? 'Đã sao chép' : 'Copy'}
                </button>
              </div>
              <button
                onClick={() => setAuthModal(null)}
                className="w-full py-2.5 rounded-xl bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-bold text-xs"
              >
                Đóng
              </button>
            </div>
          </div>
        )}

        {/* UC_12 & UC_13: Import / Export Quiz */}
        {authModal === 'import-export' && (
          <div className="p-6 sm:p-8">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-3 font-bold">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-100">
                Nhập & Xuất Quiz (UC_12 / UC_13)
              </h3>
              <p className="text-xs text-zinc-500 mt-1">
                Nhập bộ câu hỏi từ file JSON/Excel hoặc xuất dữ liệu Quiz
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => {
                  alert('Nhập Quiz từ tệp Excel/JSON thành công!');
                  setAuthModal(null);
                }}
                className="p-5 rounded-2xl border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 font-bold text-xs flex flex-col items-center gap-2 transition-all"
              >
                <Upload className="w-6 h-6 text-emerald-600" />
                Nhập Quiz (Import UC_12)
              </button>
              <button
                onClick={() => {
                  alert('Đã tải xuống file Quiz (JSON/Excel)!');
                  setAuthModal(null);
                }}
                className="p-5 rounded-2xl border-2 border-zinc-200 dark:border-zinc-700 hover:border-indigo-500 bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-bold text-xs flex flex-col items-center gap-2 transition-all"
              >
                <Download className="w-6 h-6 text-indigo-600" />
                Xuất Quiz (Export UC_13)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
