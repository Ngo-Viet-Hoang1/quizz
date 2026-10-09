import { ExamAttemptSchema } from './schemas/exam-attempt.schema';
import { ExamAttemptStatus } from './enums/exam-attempt-status.enum';
import { ViolationType } from './enums/violation-type.enum';

describe('ExamAttempt Schema and Enums', () => {
  it('should define correct ExamAttemptStatus values', () => {
    expect(ExamAttemptStatus.IN_PROGRESS).toBe('in_progress');
    expect(ExamAttemptStatus.SUBMITTED).toBe('submitted');
    expect(ExamAttemptStatus.ABANDONED).toBe('abandoned');
    expect(ExamAttemptStatus.FORCE_SUBMITTED).toBe('force_submitted');
  });

  it('should define correct ViolationType values', () => {
    expect(ViolationType.TAB_SWITCH).toBe('tab_switch');
    expect(ViolationType.FULLSCREEN_EXIT).toBe('fullscreen_exit');
    expect(ViolationType.WINDOW_BLUR).toBe('window_blur');
    expect(ViolationType.DEVTOOLS_OPEN).toBe('devtools_open');
    expect(ViolationType.COPY_PASTE).toBe('copy_paste');
    expect(ViolationType.OTHER).toBe('other');
  });

  it('should have required indexes on ExamAttemptSchema', () => {
    const indexes = ExamAttemptSchema.indexes();
    expect(indexes).toEqual(
      expect.arrayContaining([
        [{ organizationId: 1, userId: 1 }, expect.anything()],
        [{ organizationId: 1, quizId: 1 }, expect.anything()],
        [{ organizationId: 1, assignmentId: 1 }, expect.anything()],
        [
          { expiresAt: 1 },
          expect.objectContaining({
            partialFilterExpression: { status: ExamAttemptStatus.IN_PROGRESS },
          }),
        ],
      ]),
    );
  });
});
