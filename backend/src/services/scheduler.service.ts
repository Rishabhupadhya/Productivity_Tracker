import cron from "node-cron";
import { Task } from "../modules/auth/task/task.model";
import { Habit } from "../modules/auth/habit/habit.model";
import { Goal } from "../modules/auth/goal/goal.model";
import {
  sendTaskReminderEmail,
  sendHabitReminderEmail,
  sendGoalProgressEmail,
} from "./email.service";

// Email throttle settings
const EMAIL_COOLDOWN_HOURS = 12; // Don't send more than 1 email per 12 hours
const GOAL_PROGRESS_THRESHOLD = 80; // Send email at 80% progress

/**
 * Check if enough time has passed since last email
 */
const canSendEmail = (lastEmailSentAt?: Date): boolean => {
  if (!lastEmailSentAt) return true;

  const hoursSinceLastEmail =
    (Date.now() - lastEmailSentAt.getTime()) / (1000 * 60 * 60);
  return hoursSinceLastEmail >= EMAIL_COOLDOWN_HOURS;
};

/**
 * Check and send reminders for incomplete tasks
 * Runs every 15 minutes
 */
const checkTaskReminders = async () => {
  try {
    console.log("🔍 Checking task reminders...");
    const now = new Date();
    const currentDate = now.toISOString().split("T")[0];
    const currentTime = now.toTimeString().split(" ")[0].substring(0, 5); // HH:mm

    // Find incomplete tasks for today
    const tasks = await Task.find({
      day: currentDate,
      completed: false,
      $or: [
        { lastEmailSentAt: { $exists: false } },
        {
          lastEmailSentAt: {
            $lt: new Date(Date.now() - EMAIL_COOLDOWN_HOURS * 60 * 60 * 1000),
          },
        },
      ],
    });

    for (const task of tasks) {
      try {
        // Parse task start time
        const taskTime = task.startTime; // HH:mm format
        const taskDateTime = new Date(`${currentDate}T${taskTime}`);
        const currentDateTime = now;

        // Check if task is overdue (current time > task time + 30 minutes)
        const overdueThreshold = new Date(taskDateTime.getTime() + 30 * 60 * 1000);

        if (currentDateTime > overdueThreshold) {
          // Task is overdue
          if (canSendEmail(task.lastEmailSentAt)) {
            await sendTaskReminderEmail(
              task.userId.toString(),
              task,
              "overdue"
            );

            // Update email tracking
            await Task.findByIdAndUpdate(task._id, {
              lastEmailSentAt: now,
              $inc: { emailsSentCount: 1 },
              status: "overdue",
            });

            console.log(`✅ Sent overdue email for task: ${task.title}`);
          }
        } else if (currentDateTime >= taskDateTime) {
          // Task time has arrived, send reminder
          if (canSendEmail(task.lastEmailSentAt)) {
            await sendTaskReminderEmail(
              task.userId.toString(),
              task,
              "reminder"
            );

            // Update email tracking
            await Task.findByIdAndUpdate(task._id, {
              lastEmailSentAt: now,
              $inc: { emailsSentCount: 1 },
            });

            console.log(`✅ Sent reminder email for task: ${task.title}`);
          }
        }
      } catch (error) {
        console.error(`❌ Error processing task ${task._id}:`, error);
      }
    }

    console.log(`✅ Task reminder check complete. Processed ${tasks.length} tasks.`);
  } catch (error) {
    console.error("❌ Error checking task reminders:", error);
  }
};

/**
 * Check and send reminders for incomplete habits
 * Runs every 30 minutes
 */
const checkHabitReminders = async () => {
  try {
    console.log("🔍 Checking habit reminders...");
    const now = new Date();
    const today = now.toISOString().split("T")[0];
    const currentHour = now.getHours();

    // Only send habit reminders after 6 PM
    if (currentHour < 18) {
      console.log("⏰ Too early for habit reminders (before 6 PM)");
      return;
    }

    // Find active habits that haven't been completed today
    const habits = await Habit.find({
      isActive: true,
      $or: [
        { lastEmailSentAt: { $exists: false } },
        {
          lastEmailSentAt: {
            $lt: new Date(Date.now() - EMAIL_COOLDOWN_HOURS * 60 * 60 * 1000),
          },
        },
      ],
    });

    for (const habit of habits) {
      try {
        // Check if completed today
        const completedToday = habit.completions.some((c) => {
          const completionDate = new Date(c.date).toISOString().split("T")[0];
          return completionDate === today && c.completed;
        });

        if (!completedToday && canSendEmail(habit.lastEmailSentAt)) {
          await sendHabitReminderEmail(habit.userId.toString(), habit);

          // Update email tracking
          await Habit.findByIdAndUpdate(habit._id, {
            lastEmailSentAt: now,
            $inc: { emailsSentCount: 1 },
          });

          console.log(`✅ Sent habit reminder email for: ${habit.name}`);
        }
      } catch (error) {
        console.error(`❌ Error processing habit ${habit._id}:`, error);
      }
    }

    console.log(`✅ Habit reminder check complete. Processed ${habits.length} habits.`);
  } catch (error) {
    console.error("❌ Error checking habit reminders:", error);
  }
};

/**
 * Check and send progress emails for goals
 * Runs once per day at 9 AM
 */
const checkGoalProgress = async () => {
  try {
    console.log("🔍 Checking goal progress...");
    const now = new Date();

    // Find goals that are near completion (80-90%)
    const goals = await Goal.find({
      status: { $in: ["active", "in_progress"] },
      $or: [
        { lastEmailSentAt: { $exists: false } },
        {
          lastEmailSentAt: {
            $lt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours
          },
        },
      ],
    });

    for (const goal of goals) {
      try {
        // Calculate progress percentage
        const progress =
          goal.targetValue > 0
            ? (goal.currentValue / goal.targetValue) * 100
            : 0;

        // Send email if progress is between 80-100% and we haven't sent recently
        if (
          progress >= GOAL_PROGRESS_THRESHOLD &&
          progress < 100 &&
          canSendEmail(goal.lastEmailSentAt)
        ) {
          await sendGoalProgressEmail(
            goal.userId.toString(),
            goal,
            Math.round(progress)
          );

          // Update email tracking
          await Goal.findByIdAndUpdate(goal._id, {
            lastEmailSentAt: now,
            $inc: { emailsSentCount: 1 },
          });

          console.log(`✅ Sent goal progress email for: ${goal.title}`);
        }
      } catch (error) {
        console.error(`❌ Error processing goal ${goal._id}:`, error);
      }
    }

    console.log(`✅ Goal progress check complete. Processed ${goals.length} goals.`);
  } catch (error) {
    console.error("❌ Error checking goal progress:", error);
  }
};

/**
 * Initialize all cron jobs
 */
export const initializeScheduler = () => {
  console.log("🚀 Initializing notification scheduler...");

  // Check task reminders every 15 minutes
  cron.schedule("*/15 * * * *", checkTaskReminders);
  console.log("✅ Task reminder cron job scheduled (every 15 minutes)");

  // Check habit reminders every 30 minutes (after 6 PM)
  cron.schedule("*/30 * * * *", checkHabitReminders);
  console.log("✅ Habit reminder cron job scheduled (every 30 minutes after 6 PM)");

  // Check goal progress once per day at 9 AM
  cron.schedule("0 9 * * *", checkGoalProgress);
  console.log("✅ Goal progress cron job scheduled (daily at 9 AM)");

  console.log("✅ All notification schedulers initialized successfully");
};

/**
 * Run all checks immediately (for testing)
 */
export const runAllChecksNow = async () => {
  console.log("🔄 Running all notification checks immediately...");
  await checkTaskReminders();
  await checkHabitReminders();
  await checkGoalProgress();
  console.log("✅ All checks completed");
};
