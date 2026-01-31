"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTodaysHabits = exports.getHabitCalendar = exports.getHabitStats = exports.deleteHabit = exports.updateHabit = exports.uncompleteHabit = exports.completeHabit = exports.getUserHabits = exports.createHabit = void 0;
const habit_model_1 = require("./habit.model");
const auth_model_1 = require("../auth.model");
const mongoose_1 = require("mongoose");
const activity_service_1 = require("../activity/activity.service");
const goal_service_1 = require("../goal/goal.service");
const createHabit = async (userId, data) => {
    const user = await auth_model_1.User.findById(userId);
    if (!user)
        throw new Error("User not found");
    const habitData = {
        userId: new mongoose_1.Types.ObjectId(userId),
        name: data.name,
        description: data.description || "",
        frequency: data.frequency,
        timesPerWeek: data.timesPerWeek,
        graceDays: data.graceDays ?? 1,
        linkedGoals: data.linkedGoals?.map(id => new mongoose_1.Types.ObjectId(id)) || []
    };
    if (user.activeTeamId) {
        habitData.teamId = user.activeTeamId;
    }
    return habit_model_1.Habit.create(habitData);
};
exports.createHabit = createHabit;
const getUserHabits = async (userId, includeInactive = false) => {
    const user = await auth_model_1.User.findById(userId);
    if (!user)
        throw new Error("User not found");
    const query = {
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
    return habit_model_1.Habit.find(query).sort({ createdAt: -1 });
};
exports.getUserHabits = getUserHabits;
const completeHabit = async (habitId, userId, date, notes) => {
    const habit = await habit_model_1.Habit.findOne({ _id: habitId, userId });
    if (!habit)
        throw new Error("Habit not found");
    const completionDate = date || new Date();
    completionDate.setHours(0, 0, 0, 0);
    // Check if already completed today
    const existing = habit.completions.find(c => c.date.toISOString().slice(0, 10) === completionDate.toISOString().slice(0, 10));
    if (existing && existing.completed) {
        throw new Error("Habit already completed for this date");
    }
    // Add completion
    if (existing) {
        existing.completed = true;
        existing.notes = notes || "";
    }
    else {
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
    const daysSinceStart = Math.ceil((completionDate.getTime() - habit.createdAt.getTime()) / (1000 * 60 * 60 * 24));
    habit.successRate = (habit.totalCompletions / Math.max(daysSinceStart, 1)) * 100;
    await habit.save();
    // Update linked goals
    for (const goalId of habit.linkedGoals) {
        await (0, goal_service_1.updateGoalFromHabit)(userId, goalId.toString(), 1);
    }
    // Log activity
    const user = await auth_model_1.User.findById(userId);
    if (user?.activeTeamId) {
        await (0, activity_service_1.logActivity)({
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
            await (0, activity_service_1.logActivity)({
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
exports.completeHabit = completeHabit;
const updateStreak = (habit, completionDate) => {
    if (!habit.lastCompletedDate) {
        habit.currentStreak = 1;
        habit.longestStreak = 1;
        return;
    }
    const lastDate = new Date(habit.lastCompletedDate);
    lastDate.setHours(0, 0, 0, 0);
    const daysDiff = Math.floor((completionDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff === 1) {
        // Consecutive day
        habit.currentStreak++;
        habit.graceDaysUsed = 0;
    }
    else if (daysDiff <= habit.graceDays + 1) {
        // Within grace period
        habit.currentStreak++;
        habit.graceDaysUsed = daysDiff - 1;
    }
    else {
        // Streak broken
        habit.currentStreak = 1;
        habit.graceDaysUsed = 0;
    }
    if (habit.currentStreak > habit.longestStreak) {
        habit.longestStreak = habit.currentStreak;
    }
};
const uncompleteHabit = async (habitId, userId, date) => {
    const habit = await habit_model_1.Habit.findOne({ _id: habitId, userId });
    if (!habit)
        throw new Error("Habit not found");
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    const completion = habit.completions.find(c => c.date.toISOString().slice(0, 10) === targetDate.toISOString().slice(0, 10));
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
        await (0, goal_service_1.updateGoalFromHabit)(userId, goalId.toString(), -1);
    }
    return habit;
};
exports.uncompleteHabit = uncompleteHabit;
const recalculateStreak = (habit) => {
    if (habit.completions.length === 0) {
        habit.currentStreak = 0;
        return;
    }
    const sortedCompletions = habit.completions
        .filter((c) => c.completed)
        .sort((a, b) => b.date.getTime() - a.date.getTime());
    if (sortedCompletions.length === 0) {
        habit.currentStreak = 0;
        return;
    }
    let streak = 1;
    let prevDate = sortedCompletions[0].date;
    for (let i = 1; i < sortedCompletions.length; i++) {
        const currDate = sortedCompletions[i].date;
        const daysDiff = Math.floor((prevDate.getTime() - currDate.getTime()) / (1000 * 60 * 60 * 24));
        if (daysDiff === 1 || daysDiff <= habit.graceDays + 1) {
            streak++;
            prevDate = currDate;
        }
        else {
            break;
        }
    }
    habit.currentStreak = streak;
};
const updateHabit = async (habitId, userId, updates) => {
    return habit_model_1.Habit.findOneAndUpdate({ _id: habitId, userId }, { $set: updates }, { new: true });
};
exports.updateHabit = updateHabit;
const deleteHabit = async (habitId, userId) => {
    await habit_model_1.Habit.findOneAndUpdate({ _id: habitId, userId }, { $set: { isActive: false } });
};
exports.deleteHabit = deleteHabit;
const getHabitStats = async (habitId, userId) => {
    const habit = await habit_model_1.Habit.findOne({ _id: habitId, userId });
    if (!habit)
        throw new Error("Habit not found");
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
exports.getHabitStats = getHabitStats;
const getHabitCalendar = async (habitId, userId, year, month) => {
    const habit = await habit_model_1.Habit.findOne({ _id: habitId, userId });
    if (!habit)
        throw new Error("Habit not found");
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    const completions = habit.completions.filter(c => {
        const date = new Date(c.date);
        return date >= startDate && date <= endDate;
    });
    const calendar = {};
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
exports.getHabitCalendar = getHabitCalendar;
// Get today's habits
const getTodaysHabits = async (userId) => {
    const habits = await (0, exports.getUserHabits)(userId);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return habits.map(habit => {
        const todayCompletion = habit.completions.find(c => c.date.toISOString().slice(0, 10) === today.toISOString().slice(0, 10));
        return {
            ...habit.toObject(),
            completedToday: todayCompletion?.completed || false
        };
    });
};
exports.getTodaysHabits = getTodaysHabits;
