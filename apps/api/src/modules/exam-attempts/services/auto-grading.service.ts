import { Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { QuestionType } from '../../quiz/enums/question-type.enum';
import { Question } from '../../quiz/schemas/quiz.schema';
import { GradingResult, IExamAttemptAnswer } from '../interfaces/exam-attempt.interface';

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
        questionMap.set(q._id.toString(), q);
      }
    }

    const answerMap = new Map<string, IExamAttemptAnswer>();
    for (const ans of answers) {
      answerMap.set(ans.questionId.toString(), ans);
    }

    let totalPoints = 0;
    let score = 0;
    let correctCount = 0;
    let wrongCount = 0;
    const updatedAnswers: IExamAttemptAnswer[] = [];

    for (const qId of questionOrder) {
      const questionIdStr = qId.toString();
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

    // 1. Text / Fill in blank questions
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

    // 2. Ordering questions
    if (qType === 'ordering') {
      return this.evaluateOrdering(question, answer.orderAnswer);
    }

    // 3. Option-based questions (single choice, multiple choice, true/false)
    const selectedIds = (answer.selectedOptionIds ?? []).map((id) => String(id));
    if (selectedIds.length === 0) return false;

    const correctIdSet = new Set(
      correctOptions.map((opt) => String(opt._id)).filter(Boolean),
    );

    if (correctIdSet.size === 0) return false;

    // Check if student selected any wrong option
    const hasWrongChoice = selectedIds.some((id) => !correctIdSet.has(id));
    if (hasWrongChoice) return false;

    // Single choice / true-false with exactly 1 correct option
    if ((qType === 'single_choice' || qType === 'true_false') && correctCount === 1) {
      return selectedIds.length === 1 && correctIdSet.has(selectedIds[0]);
    }

    // For questions with multiple correct options (or multiple choice):
    // Student selected at least 1 correct option and ZERO wrong options!
    return selectedIds.length > 0;
  }

  private evaluateSingleChoice(
    question: Question,
    selectedIds?: (Types.ObjectId | string)[],
  ): boolean {
    if (!selectedIds || selectedIds.length !== 1) return false;
    const correctOption = question.options?.find((opt) => opt.isCorrect);
    if (!correctOption?._id) return false;
    return String(selectedIds[0]) === String(correctOption._id);
  }

  private evaluateMultipleChoice(
    question: Question,
    selectedIds?: (Types.ObjectId | string)[],
  ): boolean {
    if (!selectedIds || selectedIds.length === 0) return false;

    const correctIds = (question.options ?? [])
      .filter((opt) => Boolean(opt.isCorrect) && opt._id)
      .map((opt) => String(opt._id));

    if (correctIds.length === 0) return false;
    if (correctIds.length !== selectedIds.length) return false;

    const studentSet = new Set(selectedIds.map((id) => String(id)));
    return correctIds.every((id) => studentSet.has(id));
  }

  private evaluateFillBlank(question: Question, textAnswer?: string | null): boolean {
    if (!textAnswer) return false;
    const normalizedInput = this.normalizeText(textAnswer);
    if (!normalizedInput) return false;

    const targets: string[] = [];
    if (question.metadata?.correctText) {
      targets.push(question.metadata.correctText);
    }
    if (question.options && question.options.length > 0) {
      for (const opt of question.options) {
        if (opt.content) targets.push(opt.content);
      }
    }

    if (targets.length === 0) return false;

    return targets.some((target) => this.normalizeText(target) === normalizedInput);
  }

  private normalizeText(str: string): string {
    return str
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ');
  }

  private evaluateOrdering(question: Question, orderAnswer?: (Types.ObjectId | string)[]): boolean {
    if (!orderAnswer || orderAnswer.length === 0) return false;

    const expectedOrderIds = this.getExpectedOrderIds(question);
    if (expectedOrderIds.length === 0 || expectedOrderIds.length !== orderAnswer.length) {
      return false;
    }

    return expectedOrderIds.every((id, idx) => id === orderAnswer[idx]?.toString());
  }

  private getExpectedOrderIds(question: Question): string[] {
    if (question.metadata?.correctOrder && question.metadata.correctOrder.length > 0) {
      return question.metadata.correctOrder.map((id) => id.toString());
    }

    if (!question.options || question.options.length === 0) {
      return [];
    }

    const sortedOptions = [...question.options].sort(
      (a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0),
    );

    return sortedOptions
      .map((opt) => opt._id?.toString())
      .filter((id): id is string => Boolean(id));
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
