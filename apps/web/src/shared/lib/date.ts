import { format, formatDistanceToNow, isValid, parseISO } from 'date-fns';
import { enUS } from 'date-fns/locale';

/**
 * Formats a date string or Date object with a given format pattern.
 *
 * @param date - The date to format (ISO string, Date instance, or null/undefined).
 * @param formatStr - date-fns format string (default: 'yyyy-MM-dd').
 * @returns Formatted date string, or '-' if date is invalid or absent.
 */
export const formatDate = (
  date: string | Date | null | undefined,
  formatStr = 'yyyy-MM-dd',
): string => {
  if (!date) return '-';
  const d = typeof date === 'string' ? parseISO(date) : date;
  return isValid(d) ? format(d, formatStr, { locale: enUS }) : '-';
};

/**
 * Formats a date into a full date and time string (e.g. "2026-08-16 17:03").
 *
 * @param date - The date to format.
 * @returns Formatted date-time string (yyyy-MM-dd HH:mm), or '-' if invalid.
 */
export const formatDateTime = (date: string | Date | null | undefined): string => {
  return formatDate(date, 'yyyy-MM-dd HH:mm');
};

/**
 * Formats a date as a relative time distance from now (e.g. "5 minutes ago").
 *
 * @param date - The date to compare against current time.
 * @returns Human-readable relative time string, or '-' if invalid.
 */
export const formatRelativeTime = (date: string | Date | null | undefined): string => {
  if (!date) return '-';
  const d = typeof date === 'string' ? parseISO(date) : date;
  return isValid(d) ? formatDistanceToNow(d, { addSuffix: true, locale: enUS }) : '-';
};

/**
 * Formats a duration in seconds into MM:SS format for countdown timers.
 *
 * @param seconds - Total number of seconds.
 * @returns Formatted duration string (e.g. "05:30").
 */
export const formatDuration = (seconds: number): string => {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

/**
 * Formats a Date or ISO string to HTML datetime-local input format (YYYY-MM-DDTHH:mm).
 *
 * @param date - The date to format (defaults to current date).
 * @returns Local datetime string compatible with `<input type="datetime-local" />`.
 */
export const toLocalDatetimeInput = (date: Date | string = new Date()): string => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(d)) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

/**
 * Calculates the minimum allowed due date string for datetime-local input
 * based on start time and quiz duration (in seconds).
 */
export const getMinDueDatetimeInput = (startAt?: string, durationSec: number = 0): string => {
  const baseDate = startAt ? new Date(startAt) : new Date();
  const durationMs = (durationSec || 0) * 1000;
  return toLocalDatetimeInput(new Date(baseDate.getTime() + durationMs));
};

/**
 * Validates startAt and dueAt against current time and quiz duration.
 * Returns an error string if invalid, or null if valid.
 */
export const validateAssignmentDates = (
  startAt?: string,
  dueAt?: string,
  durationSec: number = 0,
): string | null => {
  const now = new Date();
  const nowWithBuffer = new Date(now.getTime() - 2 * 60 * 1000); // 2 mins buffer for network delay

  if (startAt) {
    const startDate = new Date(startAt);
    if (startDate < nowWithBuffer) {
      return 'Start time cannot be set in the past';
    }
  }

  if (dueAt) {
    const effectiveStart = startAt ? new Date(startAt) : now;
    const timeLimitMs = (durationSec || 0) * 1000;
    const minDue = new Date(effectiveStart.getTime() + timeLimitMs);

    if (new Date(dueAt) < minDue) {
      const timeLimitMins = Math.round((durationSec || 0) / 60);
      if (timeLimitMins > 0) {
        return `Due date must be at least ${timeLimitMins} minute(s) after start time to allow full quiz completion`;
      }
      return 'Due date must be after start time';
    }
  }

  return null;
};
