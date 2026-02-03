import nodemailer from "nodemailer";
import { User } from "../modules/auth/auth.model";

// Email configuration from environment variables
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD;
const EMAIL_FROM = process.env.EMAIL_FROM || EMAIL_USER;
const EMAIL_SERVICE = process.env.EMAIL_SERVICE || "gmail";

// Create reusable transporter
const transporter = nodemailer.createTransport({
  service: EMAIL_SERVICE,
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASSWORD,
  },
});

// Verify transporter configuration
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ Email transporter configuration error:", error);
  } else {
    console.log("✅ Email server is ready to send messages");
  }
});

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
          .task-card { background: white; padding: 20px; border-left: 4px solid ${
            type === "reminder" ? "#667eea" : "#f56565"
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
            <p>${
              type === "reminder"
                ? `This is a friendly reminder about your upcoming task:`
                : `You have an overdue task that needs your attention:`
            }</p>
            
            <div class="task-card">
              <h3>${task.title}</h3>
              <p><strong>Scheduled:</strong> ${task.day} at ${task.startTime}</p>
              <p><strong>Duration:</strong> ${task.duration}</p>
              ${task.description ? `<p><strong>Details:</strong> ${task.description}</p>` : ""}
            </div>

            <p>${
              type === "reminder"
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

            <p>${
              progressPercentage >= 80
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
