import cron from "node-cron";
import { Task } from "../modules/auth/task/task.model";
import { Habit } from "../modules/auth/habit/habit.model";
import { Goal } from "../modules/auth/goal/goal.model";
import { User } from "../modules/auth/auth.model";
import {
  sendTaskReminderEmail,
  sendHabitReminderEmail,
  sendGoalProgressEmail,
  sendDailySummaryEmail,
  sendUpcomingReminderEmail
} from "./email.service";

/**
 * Check if a reminder was already sent for a specific window
 */
const alreadySentReminder = (item: any, windowMinutes: number): boolean => {
  return item.lastReminderWindow === windowMinutes;
};

/**
 * Check for tasks starting in exactly 30m or 1h
 * Runs every 5 minutes
 */
const checkUpcomingItemReminders = async () => {
  try {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    // ✅ Only fetch INCOMPLETE tasks for today
    const tasks = await Task.find({ day: todayStr, completed: false });

    for (const task of tasks) {
      if (!task.startTime) continue;

      const [hours, minutes] = task.startTime.split(':').map(Number);
      const taskTime = new Date(now);
      taskTime.setHours(hours, minutes, 0, 0);

      const diffMinutes = Math.round((taskTime.getTime() - now.getTime()) / 60000);

      // 1 hour reminder (window: 56 to 65 mins)
      if (diffMinutes > 55 && diffMinutes <= 65 && !alreadySentReminder(task, 60)) {
        await sendUpcomingReminderEmail(task.userId.toString(), task, 'task', 60);
        await Task.findByIdAndUpdate(task._id, { lastReminderWindow: 60 });
      }
      // 30 min reminder (window: 26 to 35 mins)
      else if (diffMinutes > 25 && diffMinutes <= 35 && !alreadySentReminder(task, 30)) {
        await sendUpcomingReminderEmail(task.userId.toString(), task, 'task', 30);
        await Task.findByIdAndUpdate(task._id, { lastReminderWindow: 30 });
      }
    }
  } catch (error) {
    console.error("❌ Upcoming Task Check Error:", error);
  }
};

/**
 * Check for pending tasks at 6 PM (Evening Recap)
 */
const checkDailyEveningSummaries = async (force: boolean = false) => {
  try {
    const now = new Date();
    const currentHour = now.getHours();

    // Trigger exactly at 6 PM (18:00) unless forced for testing
    if (currentHour !== 18 && !force) return;

    const todayStr = now.toISOString().split('T')[0];
    const users = await User.find({ "settings.dailySummary": true });

    for (const user of users) {
      const pendingTasks = await Task.find({
        userId: user._id,
        day: todayStr,
        completed: false
      });

      if (pendingTasks.length > 0) {
        await sendDailySummaryEmail(user._id.toString(), pendingTasks);
      }
    }
  } catch (error) {
    console.error("❌ Evening Summary Error:", error);
  }
};

/**
 * Habits: Evening nudge for incomplete habits
 */
const checkHabitReminders = async (force: boolean = false) => {
  try {
    const now = new Date();
    const currentHour = now.getHours();

    if (currentHour < 18 && !force) return;

    const todayStr = now.toISOString().split('T')[0];
    const habits = await Habit.find({ isActive: true });

    for (const habit of habits) {
      const isDoneToday = habit.completions.some(c =>
        new Date(c.date).toISOString().split('T')[0] === todayStr && c.completed
      );

      if (!isDoneToday && (!habit.lastEmailSentAt ||
        new Date(habit.lastEmailSentAt).toISOString().split('T')[0] !== todayStr)) {

        await sendHabitReminderEmail(habit.userId.toString(), habit);
        await Habit.findByIdAndUpdate(habit._id, { lastEmailSentAt: now });
      }
    }
  } catch (error) {
    console.error("❌ Habit Check Error:", error);
  }
};

/**
 * Goals: Progress alerts
 */
const checkGoalAlerts = async () => {
  try {
    const goals = await Goal.find({ status: "active" });
    const todayStr = new Date().toISOString().split('T')[0];

    for (const goal of goals) {
      const progress = (goal.currentValue / goal.targetValue) * 100;
      if (progress >= 80 && progress < 100) {
        if (!goal.lastEmailSentAt || new Date(goal.lastEmailSentAt).toISOString().split('T')[0] !== todayStr) {
          await sendGoalProgressEmail(goal.userId.toString(), goal, Math.round(progress));
          await Goal.findByIdAndUpdate(goal._id, { lastEmailSentAt: new Date() });
        }
      }
    }
  } catch (error) {
    console.error("❌ Goal Check Error:", error);
  }
};

/**
 * Initialize all cron jobs
 */
export const initializeScheduler = () => {
  console.log("🚀 Initializing Notification Scheduler...");

  // Task Alerts (30m/1h) - Every 5m
  cron.schedule("*/5 * * * *", checkUpcomingItemReminders);

  // Evening Recap (6 PM) - Every hour check
  cron.schedule("0 * * * *", () => checkDailyEveningSummaries(false));

  // Habit Evening Nudge - Every 30m starting at 6 PM
  cron.schedule("*/30 18-23 * * *", () => checkHabitReminders(false));

  // Goal Progress - Daily at 9 AM
  cron.schedule("0 9 * * *", checkGoalAlerts);
};

/**
 * Core manual trigger for testing
 */
export const runAllChecksNow = async (force: boolean = false) => {
  console.log(`🔄 Triggering notifications (force=${force})...`);
  await checkUpcomingItemReminders();
  await checkDailyEveningSummaries(force);
  await checkHabitReminders(force);
  await checkGoalAlerts();
  console.log("✅ All checks complete");
};
