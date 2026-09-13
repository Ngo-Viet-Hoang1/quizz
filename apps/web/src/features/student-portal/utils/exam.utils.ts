/**
 * Calculates the rounded integer percentage score for an exam attempt.
 *
 * @param score Number of points achieved by the student
 * @param totalPoints Total maximum points for the exam
 * @returns Integer score percentage between 0 and 100
 */
export function calculateScorePercentage(score: number, totalPoints: number): number {
  if (!totalPoints || totalPoints <= 0) return 0;
  return Math.round((score / totalPoints) * 100);
}

/**
 * Determines whether an exam attempt passed the required percentage threshold.
 *
 * @param score Number of points achieved by the student
 * @param totalPoints Total maximum points for the exam
 * @param passThreshold Minimum required percentage to pass (default: 50)
 * @returns True if student percentage is greater than or equal to threshold
 */
export function isExamPassed(score: number, totalPoints: number, passThreshold = 50): boolean {
  return calculateScorePercentage(score, totalPoints) >= passThreshold;
}
