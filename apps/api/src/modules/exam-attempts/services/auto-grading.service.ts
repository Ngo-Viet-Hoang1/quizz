import { Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { Question } from '../../quiz/schemas/quiz.schema';
import { GradingResult, IExamAttemptAnswer } from '../interfaces/exam-attempt.interface';

function toIdStr(id: unknown): string {
  if (id === null || id === undefined) return '';
  if (typeof id === 'string') return id;
  if (typeof id === 'number') return String(id);
  if (id instanceof Types.ObjectId) return id.toHexString();
  if (typeof id === 'object') {
    const obj = id as Record<string, unknown>;
    if ('toHexString' in obj && typeof obj.toHexString === 'function') {
      return (obj.toHexString as () => string)();
    }
    if ('_id' in obj && obj._id && obj._id !== id) {
      return toIdStr(obj._id);
    }
    if ('toString' in obj && typeof obj.toString === 'function') {
      const str = (obj.toString as () => string)();
      if (str !== '[object Object]') return str;
    }
  }
  return String(id);
}

@Injectable()
export class AutoGradingService {
  gradeAttempt(
    questionOrder: (Types.ObjectId | string)[],
    answers: IExamAttemptAnswer[],
    questions: Question[],
  ): GradingResult {
    const questionMap = new Map<string, Question>();
    for (const q of questions) {
      if (q._id) {
        questionMap.set(toIdStr(q._id), q);
      }
    }

    const answerMap = new Map<string, IExamAttemptAnswer>();
    for (const ans of answers) {
      answerMap.set(toIdStr(ans.questionId), ans);
    }

    let totalPoints = 0;
    let score = 0;
    let correctCount = 0;
    let wrongCount = 0;
    const updatedAnswers: IExamAttemptAnswer[] = [];

    for (const qId of questionOrder) {
      const questionIdStr = toIdStr(qId);
      const question = questionMap.get(questionIdStr);
      const points = question?.points ?? 1;
      totalPoints += points;

      if (!question) {
        wrongCount += 1;
        continue;
      }

      const answer = answerMap.get(questionIdStr);
      const isCorrect = this.evaluateQuestion(question, answer);

      if (isCorrect) {
        correctCount += 1;
        score += points;
      } else {
        wrongCount += 1;
      }

      if (answer) {
        answer.isCorrect = isCorrect;
        updatedAnswers.push(answer);
      } else {
        updatedAnswers.push(this.createEmptyAnswer(questionIdStr));
      }
    }

    return {
      score,
      totalPoints,
      correctCount,
      wrongCount,
      answers: updatedAnswers,
    };
  }

  evaluateQuestion(question: Question, answer?: IExamAttemptAnswer): boolean {
    if (!answer) return false;

    const qType = String(question.type ?? '').toLowerCase();
    const correctOptions = (question.options ?? []).filter((o) => Boolean(o.isCorrect));
    const correctCount = correctOptions.length;

    // 1. Ordering questions
    if (qType === 'ordering') {
      return this.evaluateOrdering(question, answer.orderAnswer);
    }

    // 2. Text / Fill in blank questions
    if (
      qType === 'fill_blank' ||
      qType === 'fill_in_blank' ||
      qType === 'short_answer' ||
      qType === 'text' ||
      qType === 'essay' ||
      !question.options ||
      question.options.length === 0
    ) {
      return this.evaluateFillBlank(question, answer.textAnswer);
    }

    // 3. Option-based questions (single choice, multiple choice, true/false)
    const selectedIds = (answer.selectedOptionIds ?? []).map(toIdStr).filter(Boolean);
    if (selectedIds.length === 0) return false;

    const correctIdSet = new Set(correctOptions.map((opt) => toIdStr(opt._id)).filter(Boolean));

    if (correctIdSet.size === 0) return false;

    // Check if student selected any wrong option
    const hasWrongChoice = selectedIds.some((id) => !correctIdSet.has(id));
    if (hasWrongChoice) return false;

    // Single choice / true-false with exactly 1 correct option
    if ((qType === 'single_choice' || qType === 'true_false') && correctCount === 1) {
      return selectedIds.length === 1 && correctIdSet.has(selectedIds[0]);
    }

    // For multiple choice (or questions with multiple correct options):
    // Student must select ALL correct options and ZERO wrong options
    return (
      selectedIds.length === correctIdSet.size && selectedIds.every((id) => correctIdSet.has(id))
    );
  }

  private evaluateFillBlank(question: Question, textAnswer?: string | null): boolean {
    if (!textAnswer) return false;
    const normalizedInput = this.normalizeText(textAnswer);
    if (!normalizedInput) return false;

    const targets: string[] = [];
    if (question.metadata?.correctText) {
      targets.push(question.metadata.correctText);
    }
    if ((question as { correctAnswer?: string }).correctAnswer) {
      targets.push((question as { correctAnswer?: string }).correctAnswer!);
    }
    if (question.options && question.options.length > 0) {
      for (const opt of question.options) {
        if (opt.isCorrect !== false && opt.content) targets.push(opt.content);
      }
    }

    if (targets.length === 0) return false;

    return targets.some((target) => this.normalizeText(target) === normalizedInput);
  }

  private normalizeText(str: string): string {
    return str.trim().toLowerCase().replace(/\s+/g, ' ');
  }

  private evaluateOrdering(question: Question, orderAnswer?: (Types.ObjectId | string)[]): boolean {
    if (!orderAnswer || orderAnswer.length === 0) return false;

    const expectedOrderIds = this.getExpectedOrderIds(question);
    if (expectedOrderIds.length === 0 || expectedOrderIds.length !== orderAnswer.length) {
      return false;
    }

    return expectedOrderIds.every((id, idx) => id === toIdStr(orderAnswer[idx]));
  }

  private getExpectedOrderIds(question: Question): string[] {
    if (question.metadata?.correctOrder && question.metadata.correctOrder.length > 0) {
      return question.metadata.correctOrder.map((id) => toIdStr(id));
    }

    if (!question.options || question.options.length === 0) {
      return [];
    }

    const sortedOptions = [...question.options].sort(
      (a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0),
    );

    return sortedOptions.map((opt) => toIdStr(opt._id)).filter((id): id is string => Boolean(id));
  }

  private createEmptyAnswer(questionId: string): IExamAttemptAnswer {
    return {
      questionId: new Types.ObjectId(questionId),
      selectedOptionIds: [],
      textAnswer: null,
      orderAnswer: [],
      isCorrect: false,
      timeSpentSec: 0,
      answeredAt: new Date(),
    };
  }
}
