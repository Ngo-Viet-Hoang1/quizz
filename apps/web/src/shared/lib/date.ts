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
