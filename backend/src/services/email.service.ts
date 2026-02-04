import nodemailer from "nodemailer";
import { User } from "../modules/auth/auth.model";

// Email configuration from environment variables
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD;
const EMAIL_FROM = process.env.EMAIL_FROM || EMAIL_USER;
const EMAIL_SERVICE = process.env.EMAIL_SERVICE || "gmail";

// Create reusable transporter with explicit SMTP settings for reliability
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // Use SSL/TLS
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASSWORD,
  },
  // Added for better performance in serverless
  pool: true,
  maxConnections: 3,
  maxMessages: 100
});

// Transporter verification moved to testEmailConnection function to avoid initialization issues in serverless

/**
 * Send task reminder email
 * @param userId User ID
 * @param task Task object
 * @param type 'reminder' or 'overdue'
 */
export const sendTaskReminderEmail = async (
  userId: string,
  task: any,
  type: "reminder" | "overdue"
) => {
  try {
    const user = await User.findById(userId);
    if (!user || !user.email) {
      throw new Error("User not found or email not available");
    }

    const subject =
      type === "reminder"
        ? `⏰ Task Reminder: ${task.title}`
        : `⚠️ Overdue Task: ${task.title}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .task-card { background: white; padding: 20px; border-left: 4px solid ${type === "reminder" ? "#667eea" : "#f56565"
      }; margin: 20px 0; border-radius: 5px; }
          .btn { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>${type === "reminder" ? "⏰ Task Reminder" : "⚠️ Overdue Task"}</h2>
          </div>
          <div class="content">
            <p>Hi ${user.name},</p>
            <p>${type === "reminder"
        ? `This is a friendly reminder about your upcoming task:`
        : `You have an overdue task that needs your attention:`
      }</p>
            
            <div class="task-card">
              <h3>${task.title}</h3>
              <p><strong>Scheduled:</strong> ${task.day} at ${task.startTime}</p>
              <p><strong>Duration:</strong> ${task.duration}</p>
              ${task.description ? `<p><strong>Details:</strong> ${task.description}</p>` : ""}
            </div>

            <p>${type === "reminder"
        ? "Don't forget to complete this task on time!"
        : "Please complete this task as soon as possible."
      }</p>

            <a href="${process.env.FRONTEND_URL || "https://momentum12.vercel.app"}/dashboard" class="btn">
              View Dashboard
            </a>

            <div class="footer">
              <p>This is an automated reminder from Momentum Productivity Tracker</p>
              <p>You're receiving this because you have notifications enabled</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    await transporter.sendMail({
      from: `"Momentum Tracker" <${EMAIL_FROM}>`,
      to: user.email,
      subject,
      html,
    });

    console.log(`✅ ${type} email sent to ${user.email} for task: ${task.title}`);
    return true;
  } catch (error) {
    console.error(`❌ Error sending task ${type} email:`, error);
    throw error;
  }
};

/**
 * Send habit reminder email
 * @param userId User ID
 * @param habit Habit object
 */
export const sendHabitReminderEmail = async (userId: string, habit: any) => {
  try {
    const user = await User.findById(userId);
    if (!user || !user.email) {
      throw new Error("User not found or email not available");
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 20px; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .habit-card { background: white; padding: 20px; border-left: 4px solid #f5576c; margin: 20px 0; border-radius: 5px; }
          .streak-badge { display: inline-block; padding: 8px 16px; background: #48bb78; color: white; border-radius: 20px; font-weight: bold; }
          .btn { display: inline-block; padding: 12px 24px; background: #f5576c; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>🎯 Daily Habit Reminder</h2>
          </div>
          <div class="content">
            <p>Hi ${user.name},</p>
            <p>Don't forget to complete your habit today!</p>
            
            <div class="habit-card">
              <h3>${habit.name}</h3>
              ${habit.description ? `<p>${habit.description}</p>` : ""}
              <p><strong>Frequency:</strong> ${habit.frequency}</p>
              <p><strong>Current Streak:</strong> <span class="streak-badge">🔥 ${habit.currentStreak} days</span></p>
              ${habit.longestStreak > 0 ? `<p><strong>Longest Streak:</strong> ${habit.longestStreak} days</p>` : ""}
            </div>

            <p>Keep your streak alive! Complete this habit before the day ends.</p>

            <a href="${process.env.FRONTEND_URL || "https://momentum12.vercel.app"}/habits" class="btn">
              Complete Habit
            </a>

            <div class="footer">
              <p>This is an automated reminder from Momentum Productivity Tracker</p>
              <p>Keep building those healthy habits! 💪</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    await transporter.sendMail({
      from: `"Momentum Tracker" <${EMAIL_FROM}>`,
      to: user.email,
      subject: `🎯 Habit Reminder: ${habit.name}`,
      html,
    });

    console.log(`✅ Habit reminder email sent to ${user.email} for: ${habit.name}`);
    return true;
  } catch (error) {
    console.error("❌ Error sending habit reminder email:", error);
    throw error;
  }
};

/**
 * Send goal progress email
 * @param userId User ID
 * @param goal Goal object
 * @param progressPercentage Current progress percentage
 */
export const sendGoalProgressEmail = async (
  userId: string,
  goal: any,
  progressPercentage: number
) => {
  try {
    const user = await User.findById(userId);
    if (!user || !user.email) {
      throw new Error("User not found or email not available");
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; padding: 20px; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .goal-card { background: white; padding: 20px; border-left: 4px solid #4facfe; margin: 20px 0; border-radius: 5px; }
          .progress-bar { width: 100%; height: 30px; background: #e2e8f0; border-radius: 15px; overflow: hidden; margin: 15px 0; }
          .progress-fill { height: 100%; background: linear-gradient(90deg, #4facfe 0%, #00f2fe 100%); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; }
          .btn { display: inline-block; padding: 12px 24px; background: #4facfe; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>🎉 Goal Progress Update</h2>
          </div>
          <div class="content">
            <p>Hi ${user.name},</p>
            <p>Great progress on your goal! You're ${progressPercentage}% there!</p>
            
            <div class="goal-card">
              <h3>${goal.title}</h3>
              ${goal.description ? `<p>${goal.description}</p>` : ""}
              
              <div class="progress-bar">
                <div class="progress-fill" style="width: ${progressPercentage}%">
                  ${progressPercentage}%
                </div>
              </div>

              <p><strong>Target:</strong> ${goal.targetValue} ${goal.unit || ""}</p>
              <p><strong>Current:</strong> ${goal.currentValue} ${goal.unit || ""}</p>
              ${goal.deadline ? `<p><strong>Deadline:</strong> ${new Date(goal.deadline).toLocaleDateString()}</p>` : ""}
            </div>

            <p>${progressPercentage >= 80
        ? "You're almost there! Keep pushing to reach your goal! 🚀"
        : "You're making great progress! Keep up the excellent work! 💪"
      }</p>

            <a href="${process.env.FRONTEND_URL || "https://momentum12.vercel.app"}/goals" class="btn">
              View Goals
            </a>

            <div class="footer">
              <p>This is an automated update from Momentum Productivity Tracker</p>
              <p>Stay motivated and achieve your goals! 🎯</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    await transporter.sendMail({
      from: `"Momentum Tracker" <${EMAIL_FROM}>`,
      to: user.email,
      subject: `🎉 Goal Progress: ${goal.title} - ${progressPercentage}% Complete`,
      html,
    });

    console.log(`✅ Goal progress email sent to ${user.email} for: ${goal.title}`);
    return true;
  } catch (error) {
    console.error("❌ Error sending goal progress email:", error);
    throw error;
  }
};

/**
 * Test email configuration
 */
export const testEmailConnection = async () => {
  try {
    await transporter.verify();
    console.log("✅ Email server connection verified");
    return true;
  } catch (error) {
    console.error("❌ Email server connection failed:", error);
    return false;
  }
};

/**
 * Send a summary of pending tasks for the day
 */
export const sendDailySummaryEmail = async (userId: string, tasks: any[]) => {
  try {
    const user = await User.findById(userId);
    if (!user || !user.email) return;

    const html = `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Arial, sans-serif; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px; overflow: hidden;">
          <div style="background: #667eea; color: white; padding: 20px; text-align: center;">
            <h2>🌓 Evening Recap</h2>
            <p>You have ${tasks.length} tasks remaining for today</p>
          </div>
          <div style="padding: 20px;">
            <p>Hi ${user.name},</p>
            <p>Here's a quick look at what's still on your plate before the day ends:</p>
            
            <div style="background: #fdfdfd; border: 1px solid #f0f0f0; border-radius: 8px; padding: 15px;">
              ${tasks.map(t => `
                <div style="padding: 10px 0; border-bottom: 1px solid #eee;">
                  <strong>• ${t.title}</strong> <span style="color: #666; font-size: 12px;">(${t.startTime})</span>
                </div>
              `).join('')}
            </div>

            <p style="margin-top: 20px;">You've got this! A little push now makes for a better tomorrow.</p>
            
            <a href="${process.env.FRONTEND_URL}/dashboard" style="display: block; width: 200px; margin: 20px auto; padding: 12px; background: #667eea; color: white; text-decoration: none; text-align: center; border-radius: 5px;">
              Go to Dashboard
            </a>
          </div>
        </div>
      </body>
      </html>
    `;

    await transporter.sendMail({
      from: `"Momentum Tracker" <${EMAIL_FROM}>`,
      to: user.email,
      subject: `🌓 Evening Recap: ${tasks.length} tasks remaining`,
      html,
    });
    return true;
  } catch (error) {
    console.error("❌ Daily summary email failed:", error);
  }
};

/**
 * Send reminder for upcoming task/habit/goal (30m or 1h before)
 */
export const sendUpcomingReminderEmail = async (userId: string, item: any, type: 'task' | 'habit' | 'goal', minutesLeft: number) => {
  try {
    const user = await User.findById(userId);
    if (!user || !user.email) return;

    const subject = `⚠️ ${item.title || item.name} is starting in ${minutesLeft} minutes!`;
    const label = type.charAt(0).toUpperCase() + type.slice(1);

    const html = `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Arial, sans-serif; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px;">
          <div style="background: #ff9800; color: white; padding: 20px; text-align: center;">
            <h2>🔔 Quick Alert</h2>
            <p>Your ${type} starts in ${minutesLeft} minutes</p>
          </div>
          <div style="padding: 20px; text-align: center;">
            <h3 style="color: #333;">${item.title || item.name}</h3>
            <p>This is a quick <strong>${minutesLeft}-minute</strong> heads up.</p>
            <p style="color: #666;">${item.description || ''}</p>
            
            <a href="${process.env.FRONTEND_URL}/dashboard" style="display: inline-block; margin-top: 15px; padding: 10px 20px; background: #333; color: white; text-decoration: none; border-radius: 4px;">
              View Details
            </a>
          </div>
        </div>
      </body>
      </html>
    `;

    await transporter.sendMail({
      from: `"Momentum Tracker" <${EMAIL_FROM}>`,
      to: user.email,
      subject,
      html,
    });
    return true;
  } catch (error) {
    console.error("❌ Upcoming reminder email failed:", error);
  }
};
