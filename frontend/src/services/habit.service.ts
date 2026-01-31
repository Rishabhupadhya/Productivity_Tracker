import { api } from "./api";

export type HabitFrequency = "daily" | "weekly" | "custom";

export interface HabitCompletion {
  date: string;
  completed: boolean;
  notes?: string;
}

export interface Habit {
  _id: string;
  userId: string;
  teamId?: string;
  name: string;
  description: string;
  frequency: HabitFrequency;
  timesPerWeek?: number;
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate?: string;
  graceDays: number;
  graceDaysUsed: number;
  completions: HabitCompletion[];
  linkedGoals: string[];
  totalCompletions: number;
  successRate: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  completedToday?: boolean;
}

export interface HabitStats {
  habit: Habit;
  currentStreak: number;
  longestStreak: number;
  totalCompletions: number;
  successRate: number;
  last30DaysCount: number;
  last7DaysCount: number;
  completionHistory: HabitCompletion[];
}

export interface HabitCalendar {
  year: number;
  month: number;
  calendar: Record<string, boolean>;
  streak: number;
  totalDays: number;
}

export const createHabit = async (data: {
  name: string;
  description?: string;
  frequency: HabitFrequency;
  timesPerWeek?: number;
  graceDays?: number;
  linkedGoals?: string[];
}): Promise<Habit> => {
  const res = await api.post("/habits", data);
  return res.data;
};

export const getHabits = async (includeInactive = false): Promise<Habit[]> => {
  const res = await api.get("/habits", { params: { includeInactive } });
  return res.data;
};

export const getTodaysHabits = async (): Promise<Habit[]> => {
  const res = await api.get("/habits/today");
  return res.data;
};

export const completeHabit = async (habitId: string, date?: Date, notes?: string): Promise<Habit> => {
  const res = await api.post(`/habits/${habitId}/complete`, { date, notes });
  return res.data;
};

export const uncompleteHabit = async (habitId: string, date: Date): Promise<Habit> => {
  const res = await api.post(`/habits/${habitId}/uncomplete`, { date });
  return res.data;
};

export const updateHabit = async (habitId: string, updates: Partial<Habit>): Promise<Habit> => {
  const res = await api.patch(`/habits/${habitId}`, updates);
  return res.data;
};

export const deleteHabit = async (habitId: string): Promise<void> => {
  await api.delete(`/habits/${habitId}`);
};

export const getStats = async (habitId: string): Promise<HabitStats> => {
  const res = await api.get(`/habits/${habitId}/stats`);
  return res.data;
};

export const getCalendar = async (habitId: string, year: number, month: number): Promise<HabitCalendar> => {
  const res = await api.get(`/habits/${habitId}/calendar`, { params: { year, month } });
  return res.data;
};
