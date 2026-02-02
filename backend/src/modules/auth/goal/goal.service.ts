import { Goal, GoalType, IGoalReview } from "./goal.model";
import { User } from "../auth.model";
import { Types } from "mongoose";
import { logActivity } from "../activity/activity.service";

export const createGoal = async (
  userId: string,
  data: {
    title: string;
    description?: string;
    type: GoalType;
    targetValue: number;
    unit?: string;
    targetDate?: Date;
    milestones?: { title: string; targetValue: number }[];
    linkedHabits?: string[];
    linkedFinanceCategory?: string;
  }
) => {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  const goalData: any = {
    userId: new Types.ObjectId(userId),
    title: data.title,
    description: data.description || "",
    type: data.type,
    targetValue: data.targetValue,
    unit: data.unit || getDefaultUnit(data.type),
    targetDate: data.targetDate,
    milestones: data.milestones || [],
    linkedHabits: data.linkedHabits?.map(id => new Types.ObjectId(id)) || [],
    linkedFinanceCategory: data.linkedFinanceCategory
  };

  if (user.activeTeamId) {
    goalData.teamId = user.activeTeamId;
  }

  const goal = await Goal.create(goalData);

  // Log activity
  if (user.activeTeamId) {
    await logActivity({
      teamId: user.activeTeamId.toString(),
      userId,
      action: "goal_created",
      targetType: "goal",
      targetId: goal._id.toString(),
      details: {
        title: data.title,
        type: data.type,
        targetValue: data.targetValue
      }
    });
  }

  return goal;
};

const getDefaultUnit = (type: GoalType): string => {
  switch (type) {
    case "financial": return "₹";
    case "time": return "hours";
    case "count": return "times";
    case "binary": return "";
    default: return "";
  }
};

export const getUserGoals = async (userId: string, status?: string) => {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  const query: any = {
    $or: [
      { userId, teamId: { $exists: false } },
      { userId, teamId: null }
    ]
  };

  if (user.activeTeamId) {
    query.$or.push({ teamId: user.activeTeamId });
  }

  if (status) {
    query.status = status;
  }

  return Goal.find(query).sort({ createdAt: -1 });
};

export const updateGoalProgress = async (
  goalId: string,
  userId: string,
  incrementValue: number,
  source?: string
) => {
  const goal = await Goal.findOne({ _id: goalId, userId });
  if (!goal) throw new Error("Goal not found");

  goal.currentValue += incrementValue;

  // Check milestones
  goal.milestones.forEach(milestone => {
    if (!milestone.completed && goal.currentValue >= milestone.targetValue) {
      milestone.completed = true;
      milestone.completedAt = new Date();
    }
  });

  // Check if goal is complete
  if (goal.type === "binary") {
    if (incrementValue > 0) {
      goal.status = "completed";
      goal.completedAt = new Date();
      goal.currentValue = goal.targetValue;
    }
  } else if (goal.currentValue >= goal.targetValue) {
    goal.status = "completed";
    goal.completedAt = new Date();
    
    // Log completion
    const user = await User.findById(userId);
    if (user?.activeTeamId) {
      await logActivity({
        teamId: user.activeTeamId.toString(),
        userId,
        action: "goal_completed",
        targetType: "goal",
        targetId: goal._id.toString(),
        details: {
          title: goal.title,
          finalValue: goal.currentValue
        }
      });
    }
  }

  await goal.save();
  return goal;
};

export const updateGoal = async (goalId: string, userId: string, updates: any) => {
  const goal = await Goal.findOne({ _id: goalId, userId });
  if (!goal) throw new Error("Goal not found");

  Object.assign(goal, updates);
  await goal.save();

  return goal;
};

export const deleteGoal = async (goalId: string, userId: string) => {
  await Goal.findOneAndDelete({ _id: goalId, userId });
};

export const addGoalReview = async (
  goalId: string,
  userId: string,
  review: { whatHelped: string; whatBlocked: string; notes: string }
) => {
  const goal = await Goal.findOne({ _id: goalId, userId });
  if (!goal) throw new Error("Goal not found");

  goal.reviews.push({
    date: new Date(),
    whatHelped: review.whatHelped,
    whatBlocked: review.whatBlocked,
    notes: review.notes
  });

  await goal.save();
  return goal;
};

export const getGoalReviews = async (goalId: string, userId: string) => {
  const goal = await Goal.findOne({ _id: goalId, userId });
  if (!goal) throw new Error("Goal not found");

  return goal.reviews;
};

export const deleteGoalReview = async (goalId: string, userId: string, reviewId: string) => {
  console.log("Backend deleteGoalReview:", { goalId, userId, reviewId });
  
  const goal = await Goal.findOne({ _id: goalId, userId });
  if (!goal) throw new Error("Goal not found");
  
  console.log("Reviews before deletion:", goal.reviews.length);
  console.log("Review IDs before:", goal.reviews.map((r: any) => r._id?.toString()));
  
  // Find the index of the review to remove
  const reviewIndex = goal.reviews.findIndex((r: any) => r._id?.toString() === reviewId);
  
  if (reviewIndex === -1) {
    console.log("Review not found with ID:", reviewId);
    throw new Error("Review not found");
  }
  
  // Use splice to remove the review
  goal.reviews.splice(reviewIndex, 1);
  await goal.save();
  
  console.log("Reviews after deletion:", goal.reviews.length);
  console.log("Review IDs after:", goal.reviews.map((r: any) => r._id?.toString()));
  
  return goal;
};

// Auto-update from habits
export const updateGoalFromHabit = async (userId: string, habitId: string, value: number = 1) => {
  const goals = await Goal.find({
    userId,
    linkedHabits: habitId,
    status: "active"
  });

  for (const goal of goals) {
    await updateGoalProgress(goal._id.toString(), userId, value, "habit");
  }
};

// Auto-update from finance
export const updateGoalFromFinance = async (userId: string, category: string, amount: number) => {
  const goals = await Goal.find({
    userId,
    linkedFinanceCategory: category,
    status: "active",
    type: "financial"
  });

  for (const goal of goals) {
    await updateGoalProgress(goal._id.toString(), userId, amount, "finance");
  }
};

// Auto-update from tasks
export const updateGoalFromTask = async (userId: string, taskId: string, value: number = 1) => {
  const goals = await Goal.find({
    userId,
    linkedTasks: taskId,
    status: "active"
  });

  for (const goal of goals) {
    await updateGoalProgress(goal._id.toString(), userId, value, "task");
  }
};

export const getGoalProgress = async (goalId: string, userId: string) => {
  const goal = await Goal.findOne({ _id: goalId, userId });
  if (!goal) throw new Error("Goal not found");

  const progress = goal.targetValue > 0 ? (goal.currentValue / goal.targetValue) * 100 : 0;
  const daysRemaining = goal.targetDate 
    ? Math.ceil((goal.targetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return {
    goal,
    progress: Math.min(progress, 100),
    daysRemaining,
    completedMilestones: goal.milestones.filter(m => m.completed).length,
    totalMilestones: goal.milestones.length
  };
};
