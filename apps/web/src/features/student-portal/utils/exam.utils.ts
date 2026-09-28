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

/**
 * Safely resolves an identifier or object to a string id.
 */
export function getIdStr(id: unknown): string {
  if (id === null || id === undefined) return '';
  if (typeof id === 'string') return id;
  if (typeof id === 'number') return String(id);
  if (typeof id === 'object') {
    const obj = id as Record<string, unknown>;
    if ('toHexString' in obj && typeof obj.toHexString === 'function') {
      return obj.toHexString() as string;
    }
    if ('_id' in obj && obj._id && obj._id !== id) {
      return getIdStr(obj._id);
    }
    if ('toString' in obj && typeof obj.toString === 'function') {
      const str = obj.toString();
      if (str !== '[object Object]') return str;
    }
  }
  return String(id);
}

/**
 * Formats a duration in seconds to HH:MM:SS string.
 *
 * @param seconds Total seconds to format
 * @returns Formatted time string, e.g. "01:30:05"
 */
export function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}
