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
import { formatTime, getIdStr } from '@/features/student-portal/utils/exam.utils';
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

  const answersRef = useRef<Record<string, string[]>>({});
  answersRef.current = answers;

  const textAnswersRef = useRef<Record<string, string>>({});
  textAnswersRef.current = textAnswers;

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

  // Submit exam with double-submit guard & reliable sequential answer flush
  const handleSubmit = useCallback(async () => {
    if (isSubmittedRef.current) return;
    isSubmittedRef.current = true;

    try {
      const currentAnswers = answersRef.current;
      const currentText = textAnswersRef.current;

      // 1. Ensure all chosen option answers are saved before grading
      for (const [qId, optionIds] of Object.entries(currentAnswers)) {
        if (optionIds && optionIds.length > 0) {
          try {
            await saveAnswer.mutateAsync({ questionId: qId, selectedOptionIds: optionIds });
          } catch {
            // Ignore retry error
          }
        }
      }

      // 2. Ensure all text answers are saved before grading
      for (const [qId, text] of Object.entries(currentText)) {
        if (text && text.trim().length > 0) {
          try {
            await saveAnswer.mutateAsync({ questionId: qId, textAnswer: text.trim() });
          } catch {
            // Ignore retry error
          }
        }
      }

      await submitExam.mutateAsync(attemptId);
      toast.success('Exam submitted successfully!');
      router.push(`/student/exam/${attemptId}/result`);
    } catch {
      isSubmittedRef.current = false;
    }
  }, [attemptId, saveAnswer, submitExam, router]);

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
    if (!attempt || !attempt.answers) return;
    const loadedAnswers: Record<string, string[]> = {};
    const loadedText: Record<string, string> = {};
    for (const ans of attempt.answers) {
      const qId = getIdStr(ans.questionId);
      if (ans.selectedOptionIds && ans.selectedOptionIds.length > 0) {
        loadedAnswers[qId] = ans.selectedOptionIds.map(getIdStr);
      }
      if (ans.textAnswer) {
        loadedText[qId] = ans.textAnswer;
      }
    }
    answersRef.current = { ...loadedAnswers, ...answersRef.current };
    textAnswersRef.current = { ...loadedText, ...textAnswersRef.current };
    setAnswers((prev) => ({ ...loadedAnswers, ...prev }));
    setTextAnswers((prev) => ({ ...loadedText, ...prev }));
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

  // Check if a specific question has been answered
  const isQuestionAnswered = useCallback(
    (qId: string) =>
      (answers[qId] && answers[qId].length > 0) ||
      (textAnswers[qId] && textAnswers[qId].trim().length > 0),
    [answers, textAnswers],
  );

  const answeredCount = useMemo(
    () => questions.filter((q) => isQuestionAnswered(q._id)).length,
    [questions, isQuestionAnswered],
  );

  // Select option for choice questions
  const handleSelectOption = (questionId: string, optionId: string, isMultiple: boolean) => {
    const current = answersRef.current[questionId] ?? [];
    let updated: string[];
    if (isMultiple) {
      updated = current.includes(optionId)
        ? current.filter((id) => id !== optionId)
        : [...current, optionId];
    } else {
      updated = [optionId];
    }
    answersRef.current[questionId] = updated;
    setAnswers((prev) => ({ ...prev, [questionId]: updated }));
    handleSaveAnswer(questionId, updated);
  };

  // Text answer for fill-in / short answer
  const handleTextAnswer = (questionId: string, text: string) => {
    textAnswersRef.current[questionId] = text;
    setTextAnswers((prev) => ({ ...prev, [questionId]: text }));
  };

  const handleTextBlur = (questionId: string, text?: string) => {
    const val = text ?? textAnswersRef.current[questionId];
    if (val !== undefined && val.trim().length > 0) {
      handleSaveAnswer(questionId, undefined, val.trim());
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
      const y = el.getBoundingClientRect().top + window.pageYOffset - 90;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

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
