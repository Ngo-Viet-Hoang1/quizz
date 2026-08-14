'use client';

import React, { useState, useEffect } from 'react';
import { useQuiz } from '../lib/quiz-context';
import { Clock, CheckCircle2, XCircle, Trophy, ArrowRight } from 'lucide-react';

export function ExamPlayer() {
  const { activeExam, activeExamQuiz, setActiveExam, saveExamResult, currentUser } = useQuiz();

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<Record<number, number>>({});
  const [timeLeft, setTimeLeft] = useState<number>(300); // 5 minutes timer
  const [isFinished, setIsFinished] = useState(false);
  const [finalScore, setFinalScore] = useState<{
    score: number;
    total: number;
    percentage: number;
    passed: boolean;
  } | null>(null);

  useEffect(() => {
    if (isFinished || !activeExam) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isFinished, activeExam]);

  if (!activeExam || !activeExamQuiz) return null;

  const questions = activeExamQuiz.questions;
  const currentQ = questions[currentQuestionIndex];

  const handleSelectOption = (optionIndex: number) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [currentQuestionIndex]: optionIndex,
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      handleSubmitExam();
    }
  };

  const handleSubmitExam = () => {
    let earnedPoints = 0;
    const totalPoints = questions.length * 100;

    questions.forEach((q, idx) => {
      if (selectedOptions[idx] === q.correctOptionIndex) {
        earnedPoints += q.points || 100;
      }
    });

    const pct = Math.round((earnedPoints / totalPoints) * 100);
    const passed = pct >= activeExam.passPercentage;

    const result = {
      score: earnedPoints,
      total: totalPoints,
      percentage: pct,
      passed,
    };

    setFinalScore(result);
    setIsFinished(true);

    saveExamResult({
      examId: activeExam.id,
      examTitle: activeExam.title,
      participantName: currentUser.name,
      score: earnedPoints,
      totalScore: totalPoints,
      percentage: pct,
      passed,
      timeSpentSeconds: 300 - timeLeft,
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950 text-white flex flex-col animate-fadeIn">
      {/* Top Header */}
      <header className="h-16 border-b border-zinc-800 px-6 flex items-center justify-between bg-zinc-900/50">
        <div>
          <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
            Đang Làm Bài Thi (UC_29)
          </div>
          <h2 className="text-base font-black truncate max-w-md">{activeExam.title}</h2>
        </div>

        {!isFinished && (
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-zinc-800 border border-zinc-700 font-mono font-bold text-amber-400 text-sm">
            <Clock className="w-4 h-4 animate-pulse" />
            {formatTime(timeLeft)}
          </div>
        )}

        <button
          onClick={() => setActiveExam(null, null)}
          className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-300"
        >
          Thoát
        </button>
      </header>

      {/* Main Body */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-8 max-w-4xl mx-auto w-full flex flex-col justify-center">
        {!isFinished ? (
          <div className="space-y-6">
            {/* Question Progress bar */}
            <div className="flex items-center justify-between text-xs font-bold text-zinc-400 mb-2">
              <span>
                Câu hỏi {currentQuestionIndex + 1} / {questions.length}
              </span>
              <span>
                {Math.round(((currentQuestionIndex + 1) / questions.length) * 100)}% Hoàn thành
              </span>
            </div>
            <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
                style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
              />
            </div>

            {/* Question Text */}
            <div className="p-6 sm:p-8 rounded-3xl bg-zinc-900 border border-zinc-800 shadow-xl">
              <h3 className="text-lg sm:text-xl font-black text-white leading-relaxed">
                {currentQ.text}
              </h3>
            </div>

            {/* Options grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {currentQ.options.map((opt, idx) => {
                const isSelected = selectedOptions[currentQuestionIndex] === idx;
                return (
                  <button
                    key={idx}
                    onClick={() => handleSelectOption(idx)}
                    className={`p-4 rounded-2xl border text-left font-semibold text-sm transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-500/30 scale-[1.01]'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-800/80'
                    }`}
                  >
                    <span>{opt}</span>
                    <span
                      className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs font-bold ${
                        isSelected
                          ? 'bg-white text-indigo-600 border-white'
                          : 'border-zinc-700 text-zinc-500'
                      }`}
                    >
                      {String.fromCharCode(65 + idx)}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Navigation buttons */}
            <div className="flex justify-end pt-4">
              <button
                onClick={handleNext}
                disabled={selectedOptions[currentQuestionIndex] === undefined}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-95 text-white font-black text-sm shadow-xl shadow-indigo-500/25 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {currentQuestionIndex < questions.length - 1 ? 'Câu tiếp theo' : 'Nộp bài thi'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          /* UC_28: Xem kết quả thi */
          <div className="text-center p-8 rounded-3xl bg-zinc-900 border border-zinc-800 shadow-2xl max-w-xl mx-auto space-y-6">
            <div className="w-20 h-20 bg-gradient-to-tr from-amber-500 to-orange-500 text-white rounded-3xl flex items-center justify-center mx-auto shadow-xl shadow-amber-500/30">
              <Trophy className="w-10 h-10 animate-bounce" />
            </div>

            <div>
              <div className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-1">
                Kết Quả Bài Thi (UC_28)
              </div>
              <h2 className="text-2xl font-black">{activeExam.title}</h2>
              <p className="text-xs text-zinc-400 mt-1">
                Thực hiện bởi: <span className="font-bold text-white">{currentUser.name}</span>
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-zinc-950 border border-zinc-800/80 grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-zinc-400 font-semibold">Điểm số đạt được</div>
                <div className="text-3xl font-black text-indigo-400 mt-1">
                  {finalScore?.score} / {finalScore?.total}
                </div>
              </div>
              <div>
                <div className="text-xs text-zinc-400 font-semibold">Tỷ lệ chính xác</div>
                <div
                  className={`text-3xl font-black mt-1 ${finalScore?.passed ? 'text-emerald-400' : 'text-red-400'}`}
                >
                  {finalScore?.percentage}%
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <span
                className={`px-4 py-2 rounded-full font-black text-xs uppercase tracking-wider flex items-center gap-1.5 ${
                  finalScore?.passed
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    : 'bg-red-500/10 text-red-400 border border-red-500/30'
                }`}
              >
                {finalScore?.passed ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <XCircle className="w-4 h-4" />
                )}
                {finalScore?.passed ? 'ĐẠT (PASSED)' : 'KHÔNG ĐẠT (FAILED)'}
              </span>
            </div>

            <div className="flex justify-center gap-3 pt-4">
              <button
                onClick={() => setActiveExam(null, null)}
                className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold text-xs text-white transition-all"
              >
                Về Trang Quản Lý
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
