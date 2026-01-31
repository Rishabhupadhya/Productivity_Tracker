import { api } from "./api";

export type GoalType = "financial" | "time" | "count" | "binary";
export type GoalStatus = "active" | "completed" | "archived";

export interface Milestone {
  title: string;
  targetValue: number;
  completed: boolean;
  completedAt?: string;
}

export interface GoalReview {
  date: string;
  whatHelped: string;
  whatBlocked: string;
  notes: string;
}

export interface Goal {
  _id: string;
  userId: string;
  teamId?: string;
  title: string;
  description: string;
  type: GoalType;
  status: GoalStatus;
  targetValue: number;
  currentValue: number;
  unit: string;
  startDate: string;
  targetDate?: string;
  completedAt?: string;
  milestones: Milestone[];
  linkedHabits: string[];
  linkedFinanceCategory?: string;
  linkedTasks: string[];
  reviews: GoalReview[];
  createdAt: string;
  updatedAt: string;
}

export interface GoalProgress {
  goal: Goal;
  progress: number;
  daysRemaining: number | null;
  completedMilestones: number;
  totalMilestones: number;
}

export const createGoal = async (data: {
  title: string;
  description?: string;
  type: GoalType;
  targetValue: number;
  unit?: string;
  targetDate?: Date;
  milestones?: { title: string; targetValue: number }[];
  linkedHabits?: string[];
  linkedFinanceCategory?: string;
}): Promise<Goal> => {
  const res = await api.post("/goals", data);
  return res.data;
};

export const getGoals = async (status?: string): Promise<Goal[]> => {
  const res = await api.get("/goals", { params: { status } });
  return res.data;
};

export const updateGoal = async (goalId: string, updates: Partial<Goal>): Promise<Goal> => {
  const res = await api.patch(`/goals/${goalId}`, updates);
  return res.data;
};

export const updateProgress = async (goalId: string, incrementValue: number): Promise<Goal> => {
  const res = await api.post(`/goals/${goalId}/progress`, { incrementValue });
  return res.data;
};

export const deleteGoal = async (goalId: string): Promise<void> => {
  await api.delete(`/goals/${goalId}`);
};

export const addReview = async (
  goalId: string,
  review: { whatHelped: string; whatBlocked: string; notes: string }
): Promise<Goal> => {
  const res = await api.post(`/goals/${goalId}/reviews`, review);
  return res.data;
};

export const getReviews = async (goalId: string): Promise<GoalReview[]> => {
  const res = await api.get(`/goals/${goalId}/reviews`);
  return res.data;
};

export const getProgress = async (goalId: string): Promise<GoalProgress> => {
  const res = await api.get(`/goals/${goalId}/progress`);
  return res.data;
};
