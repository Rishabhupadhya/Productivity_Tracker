export const formatDate = (date: Date) =>
  date.toISOString().split("T")[0];

export const getWeekDays = (date: Date, weekStartDay: number = 1) => {
  const start = new Date(date);
  const currentDay = date.getDay();
  const diff = currentDay - weekStartDay;
  const adjustedDiff = diff < 0 ? diff + 7 : diff;
  start.setDate(date.getDate() - adjustedDiff);

  return Array.from({ length: 5 }).map((_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
};
