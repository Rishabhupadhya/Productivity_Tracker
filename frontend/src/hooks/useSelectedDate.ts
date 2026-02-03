import { useEffect, useState } from "react";

/**
 * Custom hook for managing the selected date in the calendar
 * ALWAYS syncs with device date, respects user timezone
 * Provides navigation functions (today, next, previous)
 */
export function useSelectedDate() {
  // Initialize with TODAY (device timezone)
  const [date, setDate] = useState(() => {
    const today = new Date();
    // Reset time to midnight in local timezone to avoid time drift
    today.setHours(0, 0, 0, 0);
    return today;
  });

  useEffect(() => {
    const handler = (e: any) => {
      console.log('Date change event received:', e.detail);
      const newDate = new Date(e.detail);
      // Ensure we're working in local timezone
      newDate.setHours(0, 0, 0, 0);
      console.log('Setting date to:', newDate);
      setDate(newDate);
    };

    window.addEventListener("date-change", handler);
    return () =>
      window.removeEventListener("date-change", handler);
  }, []);

  return date;
}

/**
 * Navigate to today (device date)
 */
export function navigateToToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  window.dispatchEvent(
    new CustomEvent("date-change", { detail: today.toISOString() })
  );
}

/**
 * Navigate to previous day
 */
export function navigateToPreviousDay() {
  const currentDateStr = localStorage.getItem("selectedDate");
  const currentDate = currentDateStr ? new Date(currentDateStr) : new Date();
  currentDate.setHours(0, 0, 0, 0);
  
  // Go back one day
  currentDate.setDate(currentDate.getDate() - 1);
  
  localStorage.setItem("selectedDate", currentDate.toISOString());
  window.dispatchEvent(
    new CustomEvent("date-change", { detail: currentDate.toISOString() })
  );
}

/**
 * Navigate to next day
 */
export function navigateToNextDay() {
  const currentDateStr = localStorage.getItem("selectedDate");
  const currentDate = currentDateStr ? new Date(currentDateStr) : new Date();
  currentDate.setHours(0, 0, 0, 0);
  
  // Go forward one day
  currentDate.setDate(currentDate.getDate() + 1);
  
  localStorage.setItem("selectedDate", currentDate.toISOString());
  window.dispatchEvent(
    new CustomEvent("date-change", { detail: currentDate.toISOString() })
  );
}

/**
 * Navigate to a specific date
 */
export function navigateToDate(date: Date | string) {
  const targetDate = typeof date === 'string' ? new Date(date) : date;
  targetDate.setHours(0, 0, 0, 0);
  
  localStorage.setItem("selectedDate", targetDate.toISOString());
  window.dispatchEvent(
    new CustomEvent("date-change", { detail: targetDate.toISOString() })
  );
}
