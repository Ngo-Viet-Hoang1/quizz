import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { QuestionDifficulty, QuestionType } from '../../quiz/enums';
import { Question } from '../../quiz/schemas/quiz.schema';
import { IExamAttemptAnswer } from '../interfaces/exam-attempt.interface';
import { AutoGradingService } from './auto-grading.service';

describe('AutoGradingService', () => {
  let service: AutoGradingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AutoGradingService],
    }).compile();

    service = module.get<AutoGradingService>(AutoGradingService);
  });

  describe('Single Choice & True/False Grading', () => {
    const correctOptId = new Types.ObjectId();
    const wrongOptId = new Types.ObjectId();

    const singleChoiceQuestion: Question = {
      _id: new Types.ObjectId(),
      type: QuestionType.SINGLE_CHOICE,
      content: 'What is 2 + 2?',
      points: 2,
      difficulty: QuestionDifficulty.EASY,
      options: [
        { _id: correctOptId, content: '4', isCorrect: true, orderIndex: 0 },
        { _id: wrongOptId, content: '5', isCorrect: false, orderIndex: 1 },
      ],
    };

    it('should return true for correct single choice option', () => {
      const answer: IExamAttemptAnswer = {
        questionId: singleChoiceQuestion._id!,
        selectedOptionIds: [correctOptId],
      };
      expect(service.evaluateQuestion(singleChoiceQuestion, answer)).toBe(true);
    });

    it('should return false for wrong single choice option', () => {
      const answer: IExamAttemptAnswer = {
        questionId: singleChoiceQuestion._id!,
        selectedOptionIds: [wrongOptId],
      };
      expect(service.evaluateQuestion(singleChoiceQuestion, answer)).toBe(false);
    });

    it('should return false if multiple options are submitted for single choice', () => {
      const answer: IExamAttemptAnswer = {
        questionId: singleChoiceQuestion._id!,
        selectedOptionIds: [correctOptId, wrongOptId],
      };
      expect(service.evaluateQuestion(singleChoiceQuestion, answer)).toBe(false);
    });
  });

  describe('Multiple Choice Grading', () => {
    const correctOpt1 = new Types.ObjectId();
    const correctOpt2 = new Types.ObjectId();
    const wrongOpt = new Types.ObjectId();

    const multiChoiceQuestion: Question = {
      _id: new Types.ObjectId(),
      type: QuestionType.MULTIPLE_CHOICE,
      content: 'Select even numbers',
      points: 3,
      options: [
        { _id: correctOpt1, content: '2', isCorrect: true },
        { _id: correctOpt2, content: '4', isCorrect: true },
        { _id: wrongOpt, content: '3', isCorrect: false },
      ],
    };

    it('should return true when all and only correct options are selected', () => {
      const answer: IExamAttemptAnswer = {
        questionId: multiChoiceQuestion._id!,
        selectedOptionIds: [correctOpt2, correctOpt1],
      };
      expect(service.evaluateQuestion(multiChoiceQuestion, answer)).toBe(true);
    });

    it('should return false when a partial set of correct options is selected', () => {
      const answer: IExamAttemptAnswer = {
        questionId: multiChoiceQuestion._id!,
        selectedOptionIds: [correctOpt1],
      };
      expect(service.evaluateQuestion(multiChoiceQuestion, answer)).toBe(false);
    });

    it('should return false when wrong option is included', () => {
      const answer: IExamAttemptAnswer = {
        questionId: multiChoiceQuestion._id!,
        selectedOptionIds: [correctOpt1, correctOpt2, wrongOpt],
      };
      expect(service.evaluateQuestion(multiChoiceQuestion, answer)).toBe(false);
    });
  });

  describe('Fill In The Blank Grading', () => {
    const fillBlankQuestion: Question = {
      _id: new Types.ObjectId(),
      type: QuestionType.FILL_BLANK,
      content: 'The capital of France is ______',
      points: 1,
      metadata: {
        correctText: 'Paris',
      },
    };

    it('should return true for exact text match', () => {
      const answer: IExamAttemptAnswer = {
        questionId: fillBlankQuestion._id!,
        textAnswer: 'Paris',
      };
      expect(service.evaluateQuestion(fillBlankQuestion, answer)).toBe(true);
    });

    it('should return true for case-insensitive and trimmed match', () => {
      const answer: IExamAttemptAnswer = {
        questionId: fillBlankQuestion._id!,
        textAnswer: '  pArIs  ',
      };
      expect(service.evaluateQuestion(fillBlankQuestion, answer)).toBe(true);
    });

    it('should return false for incorrect text', () => {
      const answer: IExamAttemptAnswer = {
        questionId: fillBlankQuestion._id!,
        textAnswer: 'London',
      };
      expect(service.evaluateQuestion(fillBlankQuestion, answer)).toBe(false);
    });
  });

  describe('Ordering Question Grading', () => {
    const item1 = new Types.ObjectId();
    const item2 = new Types.ObjectId();
    const item3 = new Types.ObjectId();

    const orderingQuestionWithMeta: Question = {
      _id: new Types.ObjectId(),
      type: QuestionType.ORDERING,
      content: 'Sort ascending',
      points: 2,
      metadata: {
        correctOrder: [item1, item2, item3],
      },
    };

    const orderingQuestionWithOpts: Question = {
      _id: new Types.ObjectId(),
      type: QuestionType.ORDERING,
      content: 'Sort ascending',
      points: 2,
      options: [
        { _id: item2, content: 'B', orderIndex: 1 },
        { _id: item1, content: 'A', orderIndex: 0 },
        { _id: item3, content: 'C', orderIndex: 2 },
      ],
    };

    it('should return true for correct ordering with metadata.correctOrder', () => {
      const answer: IExamAttemptAnswer = {
        questionId: orderingQuestionWithMeta._id!,
        orderAnswer: [item1, item2, item3],
      };
      expect(service.evaluateQuestion(orderingQuestionWithMeta, answer)).toBe(true);
    });

    it('should return true for correct ordering with options orderIndex', () => {
      const answer: IExamAttemptAnswer = {
        questionId: orderingQuestionWithOpts._id!,
        orderAnswer: [item1, item2, item3],
      };
      expect(service.evaluateQuestion(orderingQuestionWithOpts, answer)).toBe(true);
    });

    it('should return false for incorrect sequence', () => {
      const answer: IExamAttemptAnswer = {
        questionId: orderingQuestionWithMeta._id!,
        orderAnswer: [item2, item1, item3],
      };
      expect(service.evaluateQuestion(orderingQuestionWithMeta, answer)).toBe(false);
    });
  });

  describe('gradeAttempt', () => {
    it('should correctly calculate totalPoints, score, correctCount, wrongCount and update answers', () => {
      const opt1 = new Types.ObjectId();
      const q1Id = new Types.ObjectId();
      const q2Id = new Types.ObjectId();

      const questions: Question[] = [
        {
          _id: q1Id,
          type: QuestionType.SINGLE_CHOICE,
          content: 'Q1',
          points: 5,
          options: [{ _id: opt1, content: 'A', isCorrect: true }],
        },
        {
          _id: q2Id,
          type: QuestionType.FILL_BLANK,
          content: 'Q2',
          points: 3,
          metadata: { correctText: 'Hello' },
        },
      ];

      const answers: IExamAttemptAnswer[] = [
        {
          questionId: q1Id,
          selectedOptionIds: [opt1],
          timeSpentSec: 10,
        },
        // q2 left unanswered
      ];

      const result = service.gradeAttempt([q1Id, q2Id], answers, questions);

      expect(result.totalPoints).toBe(8);
      expect(result.score).toBe(5);
      expect(result.correctCount).toBe(1);
      expect(result.wrongCount).toBe(1);
      expect(result.answers).toHaveLength(2);
      expect(result.answers[0].isCorrect).toBe(true);
      expect(result.answers[1].isCorrect).toBe(false);
    });
  });
});
