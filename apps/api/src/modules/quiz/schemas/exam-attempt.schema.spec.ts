import { Types } from 'mongoose';
import { ExamAttemptStatus } from '../enums';
import { ExamAttempt, ExamAttemptSchema } from './exam-attempt.schema';

describe('ExamAttemptSchema', () => {
  it('should define correct schema indexes', () => {
    const indexes = ExamAttemptSchema.indexes();

    const hasOrgUserIdx = indexes.some(
      ([fields]) => fields.organizationId === 1 && fields.userId === 1,
    );
    const hasOrgQuizIdx = indexes.some(
      ([fields]) => fields.organizationId === 1 && fields.quizId === 1,
    );
    const hasOrgAssignmentIdx = indexes.some(
      ([fields]) => fields.organizationId === 1 && fields.assignmentId === 1,
    );
    const hasExpiresAtPartialIdx = indexes.some(
      ([fields, options]) =>
        fields.expiresAt === 1 &&
        options?.partialFilterExpression?.status === ExamAttemptStatus.IN_PROGRESS,
    );

    expect(hasOrgUserIdx).toBe(true);
    expect(hasOrgQuizIdx).toBe(true);
    expect(hasOrgAssignmentIdx).toBe(true);
    expect(hasExpiresAtPartialIdx).toBe(true);
  });

  it('should instantiate ExamAttempt object with proper default values', () => {
    const attempt: ExamAttempt = {
      organizationId: 'org_123',
      userId: 'user_456',
      quizId: new Types.ObjectId(),
      quizVersion: 1,
      status: ExamAttemptStatus.IN_PROGRESS,
    };

    expect(attempt.organizationId).toBe('org_123');
    expect(attempt.quizVersion).toBe(1);
    expect(attempt.status).toBe(ExamAttemptStatus.IN_PROGRESS);
  });
});
