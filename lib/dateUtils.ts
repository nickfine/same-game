/**
 * Shared Date Utilities
 * 
 * Centralized date functions to avoid duplication across the codebase.
 * Used by: firestore.ts, useCompliance.ts, useDopamineFeatures.ts, 
 *          useStreakManager.ts, and Cloud Functions.
 */

/**
 * Get today's date as ISO string (YYYY-MM-DD)
 */
export function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Get the start of the current week (Monday) as ISO date string
 */
export function getWeekStart(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
  const monday = new Date(now.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString().split('T')[0];
}

/**
 * Calculate the number of days between two ISO date strings
 */
export function daysBetween(date1: string, date2: string): number {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Check if a date is today
 */
export function isToday(dateString: string): boolean {
  return dateString === getTodayDate();
}

