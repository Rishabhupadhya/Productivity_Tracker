export const formatDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getWeekDays = (date: Date, _weekStartDay: number = 1) => {
  // Create a copy to avoid mutating the input date
  const referenceDate = new Date(date);
  referenceDate.setHours(0, 0, 0, 0);

  // Instead of finding the Monday of the week, 
  // we start from the provided date (which will be today on load)
  // to satisfy the "start with today's date" requirement.
  const weekStart = new Date(referenceDate);

  // Generate 5 days starting from the provided date
  return Array.from({ length: 5 }).map((_, i) => {
    const day = new Date(weekStart);
    day.setDate(weekStart.getDate() + i);
    day.setHours(0, 0, 0, 0);
    return day;
  });
};
