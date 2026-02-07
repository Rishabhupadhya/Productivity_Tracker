import { formatDate } from "../utils/date";
import { useDate } from "../contexts/DateContext";

/**
 * Custom hook for managing the selected date in the calendar
 * ALWAYS syncs with device date, respects user timezone
 * Provides navigation functions (today, next, previous)
 */
export function useSelectedDate() {
  const { selectedDate } = useDate();
  return selectedDate;
}

/**
 * Navigate to today (device date)
 */
export function navigateToToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  window.dispatchEvent(
    new CustomEvent("date-change", { detail: formatDate(today) })
  );
}

/**
 * Navigate to previous day
 */
export function navigateToPreviousDay(currentDate?: Date) {
  // If no date provided, use today
  const baseDate = currentDate || new Date();
  baseDate.setHours(0, 0, 0, 0);

  // Go back one day
  baseDate.setDate(baseDate.getDate() - 1);

  window.dispatchEvent(
    new CustomEvent("date-change", { detail: formatDate(baseDate) })
  );
}

/**
 * Navigate to next day
 */
export function navigateToNextDay(currentDate?: Date) {
  // If no date provided, use today
  const baseDate = currentDate || new Date();
  baseDate.setHours(0, 0, 0, 0);

  // Go forward one day
  baseDate.setDate(baseDate.getDate() + 1);

  window.dispatchEvent(
    new CustomEvent("date-change", { detail: formatDate(baseDate) })
  );
}

/**
 * Navigate to a specific date
 */
export function navigateToDate(date: Date | string) {
  const targetDate = typeof date === 'string' ? new Date(date) : date;
  targetDate.setHours(0, 0, 0, 0);


  window.dispatchEvent(
    new CustomEvent("date-change", { detail: formatDate(targetDate) })
  );
}
