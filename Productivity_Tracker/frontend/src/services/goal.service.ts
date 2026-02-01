import api from "./api";

export type GoalType = "binary" | "count" | "percentage" | "time";
export type GoalStatus = "active" | "completed" | "failed" | "abandoned";

export interface Goal {
  _id: string;
  userId: string;
  title: string;
  description?: string;
  type: GoalType;
  targetValue?: number;
  currentValue?: number;
  unit?: string;
  targetDate?: Date;
  status: GoalStatus;
  reviews?: Array<{
    date: Date;
    whatHelped: string;
    whatBlocked: string;
    notes?: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export const getUserGoals = async (): Promise<Goal[]> => {
  const response = await api.get("/goals");
  return response.data;
};

export const createGoal = async (goalData: Partial<Goal>): Promise<Goal> => {
  const response = await api.post("/goals", goalData);
  return response.data;
};

export const updateGoal = async (goalId: string, updates: Partial<Goal>): Promise<Goal> => {
  const response = await api.put(`/goals/${goalId}`, updates);
  return response.data;
};

export const deleteGoal = async (goalId: string): Promise<void> => {
  await api.delete(`/goals/${goalId}`);
};

export const updateGoalProgress = async (goalId: string, currentValue: number): Promise<Goal> => {
  const response = await api.put(`/goals/${goalId}/progress`, { currentValue });
  return response.data;
};

export const addGoalReview = async (
  goalId: string,
  review: { whatHelped: string; whatBlocked: string; notes?: string }
): Promise<Goal> => {
  const response = await api.post(`/goals/${goalId}/review`, review);
  return response.data;
};

export const completeGoal = async (goalId: string): Promise<Goal> => {
  const response = await api.put(`/goals/${goalId}/complete`);
  return response.data;
};

export const getGoals = getUserGoals;
export const addReview = addGoalReview;
