import { Habit, HabitFrequency } from "./habit.model";
import { User } from "../auth.model";
import { Types } from "mongoose";
import { logActivity } from "../activity/activity.service";
import { updateGoalFromHabit } from "../goal/goal.service";

export const createHabit = async (
  userId: string,
  data: {
    name: string;
    description?: string;
    frequency: HabitFrequency;
    timesPerWeek?: number;
    graceDays?: number;
    linkedGoals?: string[];
  }
) => {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  const habitData: any = {
    userId: new Types.ObjectId(userId),
    name: data.name,
    description: data.description || "",
    frequency: data.frequency,
    timesPerWeek: data.timesPerWeek,
    graceDays: data.graceDays ?? 1,
    linkedGoals: data.linkedGoals?.map(id => new Types.ObjectId(id)) || []
  };

  if (user.activeTeamId) {
    habitData.teamId = user.activeTeamId;
  }

  return Habit.create(habitData);
};

export const getUserHabits = async (userId: string, includeInactive = false) => {
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

  if (!includeInactive) {
    query.isActive = true;
  }

  return Habit.find(query).sort({ createdAt: -1 });
};

export const completeHabit = async (habitId: string, userId: string, date?: Date, notes?: string) => {
  const habit = await Habit.findOne({ _id: habitId, userId });
  if (!habit) throw new Error("Habit not found");

  const completionDate = date || new Date();
  completionDate.setHours(0, 0, 0, 0);

  // Check if already completed today
  const existing = habit.completions.find(
    c => c.date.toISOString().slice(0, 10) === completionDate.toISOString().slice(0, 10)
  );

  if (existing && existing.completed) {
    throw new Error("Habit already completed for this date");
  }

  // Add completion
  if (existing) {
    existing.completed = true;
    existing.notes = notes || "";
  } else {
    habit.completions.push({
      date: completionDate,
      completed: true,
      notes: notes || ""
    });
  }

  habit.totalCompletions++;
  habit.lastCompletedDate = completionDate;

  // Update streak
  updateStreak(habit, completionDate);

  // Update success rate
  const daysSinceStart = Math.ceil(
    (completionDate.getTime() - habit.createdAt.getTime()) / (1000 * 60 * 60 * 24)
  );
  habit.successRate = (habit.totalCompletions / Math.max(daysSinceStart, 1)) * 100;

  await habit.save();

  // Update linked goals
  for (const goalId of habit.linkedGoals) {
    await updateGoalFromHabit(userId, goalId.toString(), 1);
  }

  // Log activity
  const user = await User.findById(userId);
  if (user?.activeTeamId) {
    await logActivity({
      teamId: user.activeTeamId.toString(),
      userId,
      action: "habit_completed",
      targetType: "habit",
      targetId: habit._id.toString(),
      details: {
        name: habit.name,
        streak: habit.currentStreak
      }
    });

    // Log streak milestone
    if (habit.currentStreak % 7 === 0 && habit.currentStreak > 0) {
      await logActivity({
        teamId: user.activeTeamId.toString(),
        userId,
        action: "habit_streak_milestone",
        targetType: "habit",
        targetId: habit._id.toString(),
        details: {
          name: habit.name,
          streak: habit.currentStreak
        }
      });
    }
  }

  return habit;
};

const updateStreak = (habit: any, completionDate: Date) => {
  if (!habit.lastCompletedDate) {
    habit.currentStreak = 1;
    habit.longestStreak = 1;
    return;
  }

  const lastDate = new Date(habit.lastCompletedDate);
  lastDate.setHours(0, 0, 0, 0);
  
  const daysDiff = Math.floor(
    (completionDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysDiff === 1) {
    // Consecutive day
    habit.currentStreak++;
    habit.graceDaysUsed = 0;
  } else if (daysDiff <= habit.graceDays + 1) {
    // Within grace period
    habit.currentStreak++;
    habit.graceDaysUsed = daysDiff - 1;
  } else {
    // Streak broken
    habit.currentStreak = 1;
    habit.graceDaysUsed = 0;
  }

  if (habit.currentStreak > habit.longestStreak) {
    habit.longestStreak = habit.currentStreak;
  }
};

export const uncompleteHabit = async (habitId: string, userId: string, date: Date) => {
  const habit = await Habit.findOne({ _id: habitId, userId });
  if (!habit) throw new Error("Habit not found");

  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);

  const completion = habit.completions.find(
    c => c.date.toISOString().slice(0, 10) === targetDate.toISOString().slice(0, 10)
  );

  if (!completion || !completion.completed) {
    throw new Error("No completion found for this date");
  }

  completion.completed = false;
  habit.totalCompletions = Math.max(0, habit.totalCompletions - 1);

  // Recalculate streak
  recalculateStreak(habit);

  await habit.save();

  // Update linked goals (decrement)
  for (const goalId of habit.linkedGoals) {
    await updateGoalFromHabit(userId, goalId.toString(), -1);
  }

  return habit;
};

const recalculateStreak = (habit: any) => {
  if (habit.completions.length === 0) {
    habit.currentStreak = 0;
    return;
  }

  const sortedCompletions = habit.completions
    .filter((c: any) => c.completed)
    .sort((a: any, b: any) => b.date.getTime() - a.date.getTime());

  if (sortedCompletions.length === 0) {
    habit.currentStreak = 0;
    return;
  }

  let streak = 1;
  let prevDate = sortedCompletions[0].date;

  for (let i = 1; i < sortedCompletions.length; i++) {
    const currDate = sortedCompletions[i].date;
    const daysDiff = Math.floor(
      (prevDate.getTime() - currDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysDiff === 1 || daysDiff <= habit.graceDays + 1) {
      streak++;
      prevDate = currDate;
    } else {
      break;
    }
  }

  habit.currentStreak = streak;
};

export const updateHabit = async (habitId: string, userId: string, updates: any) => {
  return Habit.findOneAndUpdate({ _id: habitId, userId }, { $set: updates }, { new: true });
};

export const deleteHabit = async (habitId: string, userId: string) => {
  await Habit.findOneAndUpdate({ _id: habitId, userId }, { $set: { isActive: false } });
};

export const getHabitStats = async (habitId: string, userId: string) => {
  const habit = await Habit.findOne({ _id: habitId, userId });
  if (!habit) throw new Error("Habit not found");

  const last30Days = habit.completions.filter(c => {
    const daysDiff = (Date.now() - c.date.getTime()) / (1000 * 60 * 60 * 24);
    return daysDiff <= 30 && c.completed;
  });

  const last7Days = habit.completions.filter(c => {
    const daysDiff = (Date.now() - c.date.getTime()) / (1000 * 60 * 60 * 24);
    return daysDiff <= 7 && c.completed;
  });

  return {
    habit,
    currentStreak: habit.currentStreak,
    longestStreak: habit.longestStreak,
    totalCompletions: habit.totalCompletions,
    successRate: habit.successRate,
    last30DaysCount: last30Days.length,
    last7DaysCount: last7Days.length,
    completionHistory: habit.completions.slice(-90) // Last 90 days
  };
};

export const getHabitCalendar = async (habitId: string, userId: string, year: number, month: number) => {
  const habit = await Habit.findOne({ _id: habitId, userId });
  if (!habit) throw new Error("Habit not found");

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);

  const completions = habit.completions.filter(c => {
    const date = new Date(c.date);
    return date >= startDate && date <= endDate;
  });

  const calendar: any = {};
  completions.forEach(c => {
    const dateStr = c.date.toISOString().slice(0, 10);
    calendar[dateStr] = c.completed;
  });

  return {
    year,
    month,
    calendar,
    streak: habit.currentStreak,
    totalDays: endDate.getDate()
  };
};

// Get today's habits
export const getTodaysHabits = async (userId: string) => {
  const habits = await getUserHabits(userId);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return habits.map(habit => {
    const todayCompletion = habit.completions.find(
      c => c.date.toISOString().slice(0, 10) === today.toISOString().slice(0, 10)
    );

    return {
      ...habit.toObject(),
      completedToday: todayCompletion?.completed || false
    };
  });
};
