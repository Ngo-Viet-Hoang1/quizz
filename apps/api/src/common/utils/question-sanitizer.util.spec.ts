import { Types } from 'mongoose';
import { QuestionType } from '../../modules/quiz/enums';
import { Question } from '../../modules/quiz/schemas/quiz.schema';
import { buildSanitizedQuestions, sanitizeSingleQuestion } from './question-sanitizer.util';
import { shuffleArray } from './shuffle.util';

describe('Common Utils', () => {
  describe('shuffleArray', () => {
    it('should maintain the same length and elements', () => {
      const original = [1, 2, 3, 4, 5];
      const shuffled = shuffleArray(original);

      expect(shuffled).toHaveLength(original.length);
      expect(shuffled.sort()).toEqual(original.sort());
    });

    it('should handle empty array', () => {
      expect(shuffleArray([])).toEqual([]);
    });
  });

  describe('question-sanitizer', () => {
    const qId1 = new Types.ObjectId();
    const optId1 = new Types.ObjectId();
    const optId2 = new Types.ObjectId();

    const sampleQuestion: Question = {
      _id: qId1,
      type: QuestionType.SINGLE_CHOICE,
      content: 'Sample Question Content',
      explanation: 'Secret Explanation',
      points: 2,
      orderIndex: 0,
      metadata: { correctText: 'Secret' },
      options: [
        { _id: optId1, content: 'Opt A', isCorrect: true, orderIndex: 0 },
        { _id: optId2, content: 'Opt B', isCorrect: false, orderIndex: 1 },
      ],
    };

    it('should sanitize a single question stripping answers and explanation', () => {
      const sanitized = sanitizeSingleQuestion(sampleQuestion);
      const sanitizedRecord = sanitized as unknown as Record<string, unknown>;
      const optRecord = sanitized.options?.[0] as unknown as Record<string, unknown>;

      expect(sanitized._id).toBe(qId1.toString());
      expect(sanitized.content).toBe('Sample Question Content');
      expect(sanitizedRecord.explanation).toBeUndefined();
      expect(sanitizedRecord.metadata).toBeUndefined();
      expect(optRecord.isCorrect).toBeUndefined();
      expect(sanitized.options?.[0].content).toBe('Opt A');
    });

    it('should reorder questions according to custom order', () => {
      const qId2 = new Types.ObjectId();
      const question2: Question = {
        _id: qId2,
        type: QuestionType.TRUE_FALSE,
        content: 'Question 2',
      };

      const result = buildSanitizedQuestions([sampleQuestion, question2], [qId2, qId1]);

      expect(result).toHaveLength(2);
      expect(result[0]._id).toBe(qId2.toString());
      expect(result[1]._id).toBe(qId1.toString());
    });
  });
});
