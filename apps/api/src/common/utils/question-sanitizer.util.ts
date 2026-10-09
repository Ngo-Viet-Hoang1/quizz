import { Types } from 'mongoose';
import { SanitizedQuestion } from '../../modules/exam-attempts/interfaces/exam-attempt.interface';
import { Question } from '../../modules/quiz/schemas/quiz.schema';

export function sanitizeSingleQuestion(q: Question): SanitizedQuestion {
  return {
    _id: (q._id as Types.ObjectId).toString(),
    type: q.type,
    content: q.content,
    difficulty: q.difficulty,
    points: q.points ?? 1,
    orderIndex: q.orderIndex,
    options: q.options?.map((opt) => ({
      _id: (opt._id as Types.ObjectId).toString(),
      content: opt.content,
      orderIndex: opt.orderIndex,
    })),
  };
}

export function buildSanitizedQuestions(
  questions: Question[] = [],
  order: (Types.ObjectId | string)[] = [],
): SanitizedQuestion[] {
  const questionMap = new Map<string, Question>();
  for (const q of questions) {
    if (q._id) questionMap.set(q._id.toString(), q);
  }

  const orderedQuestions: SanitizedQuestion[] = [];
  const orderedIds = new Set<string>();

  for (const qId of order) {
    const idStr = qId.toString();
    const q = questionMap.get(idStr);
    if (q) {
      orderedQuestions.push(sanitizeSingleQuestion(q));
      orderedIds.add(idStr);
    }
  }

  for (const q of questions) {
    if (q._id && !orderedIds.has(q._id.toString())) {
      orderedQuestions.push(sanitizeSingleQuestion(q));
    }
  }

  return orderedQuestions;
}
