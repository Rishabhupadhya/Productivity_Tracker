export const minutesFromStart = (
  time: Date,
  startHour = 9
) => {
  return (time.getHours() - startHour) * 60 + time.getMinutes();
};
