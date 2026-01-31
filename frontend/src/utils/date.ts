export const formatDate = (date: Date) =>
  date.toISOString().split("T")[0];

export const getWeekDays = (date: Date) => {
  const start = new Date(date);
  start.setDate(date.getDate() - date.getDay() + 1); // Monday

  return Array.from({ length: 5 }).map((_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
};
