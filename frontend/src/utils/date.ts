export const formatDate = (date: Date) =>
  date.toISOString().split("T")[0];

export const getWeekDays = (date: Date, weekStartDay: number = 1) => {
  // Create a copy to avoid mutating the input date
  const referenceDate = new Date(date);
  referenceDate.setHours(0, 0, 0, 0);

  const currentDay = referenceDate.getDay();
  const diff = currentDay - weekStartDay;
  const adjustedDiff = diff < 0 ? diff + 7 : diff;

  // Calculate the start of the week
  const weekStart = new Date(referenceDate);
  weekStart.setDate(referenceDate.getDate() - adjustedDiff);

  // Generate 5 weekdays (Mon-Fri)
  return Array.from({ length: 5 }).map((_, i) => {
    const day = new Date(weekStart);
    day.setDate(weekStart.getDate() + i);
    day.setHours(0, 0, 0, 0); // Ensure time is always midnight in local timezone
    return day;
  });
};
