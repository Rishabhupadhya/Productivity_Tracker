import api from "./api";

export type HabitFrequency = "daily" | "weekly" | "monthly";

export interface Habit {
  _id: string;
  userId: string;
  title: string;
  description?: string;
  frequency: HabitFrequency;
  targetDays?: number;
  reminderTime?: string;
  logs: Array<{
    date: Date;
    completed: boolean;
    notes?: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export interface HabitStats {
  habitId: string;
  currentStreak: number;
  longestStreak: number;
  totalCompletions: number;
  completionRate: number;
}

export const getUserHabits = async (): Promise<Habit[]> => {
  const response = await api.get("/habits");
  return response.data;
};

export const createHabit = async (habitData: Partial<Habit>): Promise<Habit> => {
  const response = await api.post("/habits", habitData);
  return response.data;
};

export const updateHabit = async (habitId: string, updates: Partial<Habit>): Promise<Habit> => {
  const response = await api.put(`/habits/${habitId}`, updates);
  return response.data;
};

export const deleteHabit = async (habitId: string): Promise<void> => {
  await api.delete(`/habits/${habitId}`);
};

export const logHabitCompletion = async (
  habitId: string,
  data: { date: Date; completed: boolean; notes?: string }
): Promise<Habit> => {
  const response = await api.post(`/habits/${habitId}/log`, data);
  return response.data;
};

export const getHabitStats = async (habitId: string): Promise<HabitStats> => {
  const response = await api.get(`/habits/${habitId}/stats`);
  return response.data;
};

export const getTodaysHabits = getUserHabits;
export const getStats = getHabitStats;
export const completeHabit = async (habitId: string): Promise<Habit> => {
  return logHabitCompletion(habitId, { date: new Date(), completed: true });
};
export const uncompleteHabit = async (habitId: string): Promise<Habit> => {
  return logHabitCompletion(habitId, { date: new Date(), completed: false });
};
