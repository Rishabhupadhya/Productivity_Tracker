import { User } from "../auth.model";

// XP Rules
const XP_RULES = {
  HABIT_COMPLETE: 10,
  TASK_COMPLETE: 15,
  GOAL_MILESTONE: 50,
  GOAL_COMPLETE: 100,
  STREAK_BONUS_PER_DAY: 2, // +2 XP per day in streak
  TEAM_HABIT_MULTIPLIER: 1.5 // 50% bonus for team habits
};

// Level calculation: Level = floor(sqrt(XP / 100)) + 1
const calculateLevel = (xp: number): number => {
  return Math.floor(Math.sqrt(xp / 100)) + 1;
};

const getXPForNextLevel = (currentLevel: number): number => {
  return Math.pow(currentLevel, 2) * 100;
};

// Reset momentum if it's a new day/week
const checkAndResetMomentum = async (userId: string) => {
  const user = await User.findById(userId);
  if (!user) return;

  const now = new Date();
  const lastUpdated = new Date(user.momentum.lastUpdated);

  // Check if it's a new day
  const isNewDay = now.toDateString() !== lastUpdated.toDateString();
  
  // Check if it's a new week (Monday)
  const currentWeekStart = getWeekStart(now);
  const lastWeekStart = getWeekStart(lastUpdated);
  const isNewWeek = currentWeekStart.getTime() !== lastWeekStart.getTime();

  if (isNewDay) {
    user.momentum.today = 0;
  }

  if (isNewWeek) {
    user.momentum.week = 0;
  }

  if (isNewDay || isNewWeek) {
    user.momentum.lastUpdated = now;
    await user.save();
  }
};

const getWeekStart = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
  return new Date(d.setDate(diff));
};

// Award XP and update momentum
export const awardXP = async (
  userId: string,
  type: 'HABIT' | 'TASK' | 'GOAL_MILESTONE' | 'GOAL_COMPLETE',
  options?: {
    streakDays?: number;
    isTeamHabit?: boolean;
  }
) => {
  await checkAndResetMomentum(userId);

  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  let xpToAward = 0;

  switch (type) {
    case 'HABIT':
      xpToAward = XP_RULES.HABIT_COMPLETE;
      if (options?.streakDays) {
        xpToAward += options.streakDays * XP_RULES.STREAK_BONUS_PER_DAY;
      }
      if (options?.isTeamHabit) {
        xpToAward = Math.floor(xpToAward * XP_RULES.TEAM_HABIT_MULTIPLIER);
      }
      break;
    case 'TASK':
      xpToAward = XP_RULES.TASK_COMPLETE;
      break;
    case 'GOAL_MILESTONE':
      xpToAward = XP_RULES.GOAL_MILESTONE;
      break;
    case 'GOAL_COMPLETE':
      xpToAward = XP_RULES.GOAL_COMPLETE;
      break;
  }

  user.xp += xpToAward;
  user.level = calculateLevel(user.xp);
  user.momentum.today += xpToAward;
  user.momentum.week += xpToAward;
  user.momentum.lastUpdated = new Date();

  await user.save();

  return {
    xpAwarded: xpToAward,
    totalXP: user.xp,
    level: user.level,
    xpForNextLevel: getXPForNextLevel(user.level),
    momentumToday: user.momentum.today,
    momentumWeek: user.momentum.week
  };
};

// Get user momentum stats
export const getMomentumStats = async (userId: string) => {
  await checkAndResetMomentum(userId);

  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  const xpForNextLevel = getXPForNextLevel(user.level);
  const xpForCurrentLevel = user.level > 1 ? getXPForNextLevel(user.level - 1) : 0;
  const xpProgressInLevel = user.xp - xpForCurrentLevel;
  const xpNeededForLevel = xpForNextLevel - xpForCurrentLevel;
  const levelProgress = (xpProgressInLevel / xpNeededForLevel) * 100;

  return {
    xp: user.xp,
    level: user.level,
    xpForNextLevel,
    levelProgress: Math.min(levelProgress, 100),
    momentumToday: user.momentum.today,
    momentumWeek: user.momentum.week
  };
};

export { XP_RULES, calculateLevel };
