import api from "./api";

export type HabitFrequency = "daily" | "weekly" | "monthly";

export interface Habit {
  _id: string;
  userId: string;
  name: string;
  title: string;
  description?: string;
  frequency: HabitFrequency;
  targetDays?: number;
  timesPerWeek?: number;
  graceDays?: number;
  reminderTime?: string;
  currentStreak: number;
  successRate: number;
  completedToday: boolean;
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
  successRate: number;
  last7DaysCount: number;
  last30DaysCount: number;
  completionHistory: Array<{
    date: string;
    completed: boolean;
    notes?: string;
  }>;
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
  const response = await api.post(`/habits/${habitId}/complete`, {
    date: new Date().toISOString(),
    notes: ""
  });
  return response.data;
};
export const uncompleteHabit = async (habitId: string): Promise<Habit> => {
  const response = await api.post(`/habits/${habitId}/uncomplete`, {
    date: new Date().toISOString()
  });
  return response.data;
};
