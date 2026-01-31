/**
 * Monthly Spending Tracker Service
 * 
 * Tracks and updates monthly spending for credit cards.
 * Automatically handles month rollovers.
 */

import { Types } from "mongoose";
import { MonthlySpending, IMonthlySpending } from "./monthlySpending.model";
import { logger } from "../../../../utils/logger";

/**
 * Get current month string in YYYY-MM format
 */
export const getCurrentMonth = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
};

/**
 * Get or create monthly spending record for a card
 */
export const getOrCreateMonthlySpending = async (
  userId: string,
  creditCardId: string,
  month: string = getCurrentMonth()
): Promise<IMonthlySpending> => {
  let spending = await MonthlySpending.findOne({
    userId: new Types.ObjectId(userId),
    creditCardId: new Types.ObjectId(creditCardId),
    month
  });

  if (!spending) {
    spending = await MonthlySpending.create({
      userId: new Types.ObjectId(userId),
      creditCardId: new Types.ObjectId(creditCardId),
      month,
      totalSpent: 0,
      transactionCount: 0,
      lastUpdated: new Date()
    });
    logger.info(`Created new monthly spending record for card ${creditCardId}, month ${month}`);
  }

  return spending;
};

/**
 * Add transaction amount to monthly spending
 * 
 * @param userId User ID
 * @param creditCardId Credit card ID
 * @param amount Transaction amount
 * @param transactionDate Transaction date (defaults to now)
 * @returns Updated monthly spending record
 */
export const addTransactionToMonthly = async (
  userId: string,
  creditCardId: string,
  amount: number,
  transactionDate: Date = new Date()
): Promise<IMonthlySpending> => {
  const month = getCurrentMonth(transactionDate);
  
  const spending = await getOrCreateMonthlySpending(userId, creditCardId, month);
  
  spending.totalSpent += amount;
  spending.transactionCount += 1;
  spending.lastUpdated = new Date();
  
  await spending.save();
  
  logger.info(`Updated monthly spending for card ${creditCardId}: +₹${amount}, total: ₹${spending.totalSpent}`);
  
  return spending;
};

/**
 * Get monthly spending for a specific card and month
 */
export const getMonthlySpending = async (
  userId: string,
  creditCardId: string,
  month: string = getCurrentMonth()
): Promise<IMonthlySpending | null> => {
  return await MonthlySpending.findOne({
    userId: new Types.ObjectId(userId),
    creditCardId: new Types.ObjectId(creditCardId),
    month
  });
};

/**
 * Get all monthly spending records for a user (optionally filtered by month)
 */
export const getUserMonthlySpending = async (
  userId: string,
  month?: string
): Promise<IMonthlySpending[]> => {
  const query: any = { userId: new Types.ObjectId(userId) };
  if (month) {
    query.month = month;
  }
  
  return await MonthlySpending.find(query)
    .populate("creditCardId")
    .sort({ month: -1, totalSpent: -1 });
};

/**
 * Check if monthly limit is breached for a card
 * 
 * @returns Object with breach status and details
 */
export interface LimitCheckResult {
  isBreached: boolean;
  currentSpent: number;
  monthlyLimit: number;
  percentageUsed: number;
  amountOver: number;
}

export const checkMonthlyLimit = async (
  userId: string,
  creditCardId: string,
  monthlyLimit: number,
  month: string = getCurrentMonth()
): Promise<LimitCheckResult> => {
  const spending = await getMonthlySpending(userId, creditCardId, month);
  const currentSpent = spending?.totalSpent || 0;
  
  const isBreached = currentSpent >= monthlyLimit;
  const percentageUsed = monthlyLimit > 0 ? (currentSpent / monthlyLimit) * 100 : 0;
  const amountOver = Math.max(0, currentSpent - monthlyLimit);
  
  return {
    isBreached,
    currentSpent,
    monthlyLimit,
    percentageUsed: Math.round(percentageUsed * 10) / 10,
    amountOver
  };
};

/**
 * Reset monthly spending (typically not needed as new month creates new record)
 * Useful for testing or manual resets
 */
export const resetMonthlySpending = async (
  userId: string,
  creditCardId: string,
  month: string = getCurrentMonth()
): Promise<void> => {
  await MonthlySpending.findOneAndUpdate(
    {
      userId: new Types.ObjectId(userId),
      creditCardId: new Types.ObjectId(creditCardId),
      month
    },
    {
      totalSpent: 0,
      transactionCount: 0,
      lastUpdated: new Date()
    }
  );
  
  logger.info(`Reset monthly spending for card ${creditCardId}, month ${month}`);
};
