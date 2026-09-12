'use client';

import {
  useAttemptDetail,
  useRecordViolation,
  useSaveAnswer,
  useSubmitExam,
} from '@/features/student-portal/api/student.api';
import {
  ExamHeader,
  QuestionCard,
  QuestionPalette,
  SubmitConfirmModal,
  ViolationWarningModal,
} from '@/features/student-portal/components/exam-player';
import type { SanitizedQuestion } from '@/features/student-portal/types';
import { Skeleton } from '@/shared/ui/skeleton';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

export default function ExamPlayerPage() {
  const params = useParams();
  const router = useRouter();
  const attemptId = params.attemptId as string;

  const { data: detail, isLoading } = useAttemptDetail(attemptId);
  const saveAnswer = useSaveAnswer(attemptId);
  const submitExam = useSubmitExam();
  const recordViolation = useRecordViolation(attemptId);

  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [textAnswers, setTextAnswers] = useState<Record<string, string>>({});
  const [flagged, setFlagged] = useState<Set<string>>(new Set());
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [showViolationWarning, setShowViolationWarning] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  const violationCountRef = useRef(0);
  const lastViolationTimeRef = useRef(0);
  const isSubmittedRef = useRef(false);

  const attempt = detail?.attempt;
  const questions = (detail?.questions ?? []) as SanitizedQuestion[];

  // Save answer to API
  const handleSaveAnswer = useCallback(
    async (questionId: string, selectedOptionIds?: string[], textAnswer?: string) => {
      try {
        await saveAnswer.mutateAsync({
          questionId,
          selectedOptionIds,
          textAnswer,
        });
      } catch {
        // Error handled by API client
      }
    },
    [saveAnswer],
  );

  // Submit exam with double-submit guard & text answer flush
  const handleSubmit = useCallback(async () => {
    if (isSubmittedRef.current) return;
    isSubmittedRef.current = true;

    try {
      // Flush pending text answers before submitting
      const textSavePromises = Object.entries(textAnswers).map(([qId, text]) =>
        saveAnswer.mutateAsync({ questionId: qId, textAnswer: text }).catch(() => {}),
      );
      if (textSavePromises.length > 0) {
        await Promise.all(textSavePromises);
      }

      await submitExam.mutateAsync(attemptId);
      toast.success('Exam submitted successfully!');
      router.push(`/student/exam/${attemptId}/result`);
    } catch {
      isSubmittedRef.current = false;
    }
  }, [attemptId, saveAnswer, submitExam, router, textAnswers]);

  // Timer countdown
  useEffect(() => {
    if (!attempt?.expiresAt || isSubmittedRef.current) return;

    const updateTimer = () => {
      const remaining = Math.max(
        0,
        Math.floor((new Date(attempt.expiresAt).getTime() - Date.now()) / 1000),
      );
      setTimeLeft(remaining);
      if (remaining <= 0 && !isSubmittedRef.current) {
        handleSubmit();
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [attempt?.expiresAt, handleSubmit]);

  // Load existing answers from attempt
  useEffect(() => {
    if (!attempt) return;
    const loadedAnswers: Record<string, string[]> = {};
    const loadedText: Record<string, string> = {};
    for (const ans of attempt.answers) {
      if (ans.selectedOptionIds && ans.selectedOptionIds.length > 0) {
        loadedAnswers[ans.questionId] = ans.selectedOptionIds;
      }
      if (ans.textAnswer) {
        loadedText[ans.questionId] = ans.textAnswer;
      }
    }
    setAnswers(loadedAnswers);
    setTextAnswers(loadedText);
  }, [attempt]);

  // Anti-cheat: detect tab switch (visibilitychange only, debounced)
  useEffect(() => {
    if (!attemptId || attempt?.status !== 'in_progress') return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        const now = Date.now();
        if (now - lastViolationTimeRef.current > 2000) {
          lastViolationTimeRef.current = now;
          violationCountRef.current += 1;
          setShowViolationWarning(true);
          recordViolation.mutate({ type: 'tab_switch' });
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [attemptId, attempt?.status, recordViolation]);

  const answeredCount = useMemo(
    () =>
      questions.filter(
        (q) =>
          (answers[q._id] && answers[q._id].length > 0) ||
          (textAnswers[q._id] && textAnswers[q._id].trim().length > 0),
      ).length,
    [questions, answers, textAnswers],
  );

  // Select option for choice questions
  const handleSelectOption = (questionId: string, optionId: string, isMultiple: boolean) => {
    setAnswers((prev) => {
      const current = prev[questionId] ?? [];
      let updated: string[];
      if (isMultiple) {
        updated = current.includes(optionId)
          ? current.filter((id) => id !== optionId)
          : [...current, optionId];
      } else {
        updated = [optionId];
      }
      handleSaveAnswer(questionId, updated);
      return { ...prev, [questionId]: updated };
    });
  };

  // Text answer for fill-in / short answer
  const handleTextAnswer = (questionId: string, text: string) => {
    setTextAnswers((prev) => ({ ...prev, [questionId]: text }));
  };

  const handleTextBlur = (questionId: string) => {
    const text = textAnswers[questionId];
    if (text !== undefined) {
      handleSaveAnswer(questionId, undefined, text);
    }
  };

  // Toggle flag
  const toggleFlag = (questionId: string) => {
    setFlagged((prev) => {
      const next = new Set(prev);
      if (next.has(questionId)) next.delete(questionId);
      else next.add(questionId);
      return next;
    });
  };

  // Format time
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Redirect if submitted
  useEffect(() => {
    if (attempt && attempt.status !== 'in_progress') {
      router.replace(`/student/exam/${attemptId}/result`);
    }
  }, [attempt, attemptId, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <Skeleton className="h-10 w-48 mx-auto rounded-xl" />
          <Skeleton className="h-4 w-64 mx-auto rounded-lg" />
          <Skeleton className="h-72 w-full max-w-2xl mx-auto rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!attempt || questions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-muted-foreground">
        <p>Exam not found or no questions available.</p>
      </div>
    );
  }

  const isTimeLow = timeLeft !== null && timeLeft < 300;

  const scrollToQuestion = (qId: string) => {
    const el = document.getElementById(`question-${qId}`);
    if (el) {
      const yOffset = -90;
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  const isQuestionAnswered = (qId: string) =>
    (answers[qId] && answers[qId].length > 0) ||
    (textAnswers[qId] && textAnswers[qId].trim().length > 0);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Sticky Header */}
      <ExamHeader timeLeft={timeLeft} isTimeLow={isTimeLow} formatTime={formatTime} />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6 items-start">
        {/* Questions list */}
        <div className="space-y-6">
          {questions.map((question, qIdx) => (
            <QuestionCard
              key={question._id}
              question={question}
              qIdx={qIdx}
              selectedOptions={answers[question._id] ?? []}
              textAnswer={textAnswers[question._id] ?? ''}
              isFlagged={flagged.has(question._id)}
              isAnswered={Boolean(isQuestionAnswered(question._id))}
              onSelectOption={handleSelectOption}
              onTextAnswerChange={handleTextAnswer}
              onTextAnswerBlur={handleTextBlur}
              onToggleFlag={toggleFlag}
            />
          ))}
        </div>

        {/* Right Sticky Palette */}
        <QuestionPalette
          questions={questions}
          answeredCount={answeredCount}
          isQuestionAnswered={(qId) => Boolean(isQuestionAnswered(qId))}
          isQuestionFlagged={(qId) => flagged.has(qId)}
          onScrollToQuestion={scrollToQuestion}
          onSubmitClick={() => setShowSubmitConfirm(true)}
        />
      </div>

      {/* Modals */}
      <SubmitConfirmModal
        open={showSubmitConfirm}
        answeredCount={answeredCount}
        totalQuestions={questions.length}
        isPending={submitExam.isPending}
        onClose={() => setShowSubmitConfirm(false)}
        onSubmit={handleSubmit}
      />

      <ViolationWarningModal
        open={showViolationWarning}
        violationCount={violationCountRef.current}
        onClose={() => setShowViolationWarning(false)}
      />
    </div>
  );
}
