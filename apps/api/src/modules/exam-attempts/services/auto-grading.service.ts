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

    switch (question.type) {
      case QuestionType.SINGLE_CHOICE:
      case QuestionType.TRUE_FALSE:
        return this.evaluateSingleChoice(question, answer.selectedOptionIds);
      case QuestionType.MULTIPLE_CHOICE:
        return this.evaluateMultipleChoice(question, answer.selectedOptionIds);
      case QuestionType.FILL_BLANK:
        return this.evaluateFillBlank(question, answer.textAnswer);
      case QuestionType.ORDERING:
        return this.evaluateOrdering(question, answer.orderAnswer);
      default:
        return false;
    }
  }

  private evaluateSingleChoice(
    question: Question,
    selectedIds?: (Types.ObjectId | string)[],
  ): boolean {
    if (!selectedIds || selectedIds.length !== 1) return false;
    const correctOption = question.options?.find((opt) => opt.isCorrect);
    if (!correctOption?._id) return false;
    return selectedIds[0].toString() === correctOption._id.toString();
  }

  private evaluateMultipleChoice(
    question: Question,
    selectedIds?: (Types.ObjectId | string)[],
  ): boolean {
    if (!selectedIds || selectedIds.length === 0) return false;

    const correctIds = (question.options ?? [])
      .filter((opt) => opt.isCorrect && opt._id)
      .map((opt) => opt._id!.toString());

    if (correctIds.length !== selectedIds.length) return false;

    const studentSet = new Set(selectedIds.map((id) => id.toString()));
    return correctIds.every((id) => studentSet.has(id));
  }

  private evaluateFillBlank(question: Question, textAnswer?: string | null): boolean {
    if (!textAnswer) return false;
    const normalizedInput = textAnswer.trim().toLowerCase();
    if (!normalizedInput) return false;

    const targetText = question.metadata?.correctText ?? question.options?.[0]?.content;
    if (!targetText) return false;

    return normalizedInput === targetText.trim().toLowerCase();
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
