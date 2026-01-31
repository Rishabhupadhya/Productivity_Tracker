/**
 * Credit Utilization Intelligence Analyzer
 * 
 * Real-time credit utilization tracking with risk categorization.
 * 
 * Key Metrics:
 * - Current utilization = (outstanding + current month spending) / credit limit
 * - Trend analysis (vs last 3 months)
 * - Risk categorization
 * - Actionable recommendations
 * 
 * Why this matters:
 * - High utilization (>75%) negatively impacts credit score
 * - Persistent high utilization may indicate financial stress
 * - Early warnings help users take corrective action
 */

import { Types } from "mongoose";
import { CreditCard } from "../creditCard.model";
import { Transaction } from "../finance.model";
import { UtilizationAnalysis } from "./intelligence.types";
import { getCurrentMonth } from "../sms/monthlySpending.service";
import { logger } from "../../../../utils/logger";

/**
 * Get utilization for a specific month
 */
const getMonthUtilization = async (
  userId: string,
  creditCardId: string,
  monthDate: Date,
  creditLimit: number
): Promise<number> => {
  const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
  
  const transactions = await Transaction.find({
    userId: new Types.ObjectId(userId),
    creditCardId: new Types.ObjectId(creditCardId),
    type: "expense",
    paymentType: "credit",
    date: { $gte: monthStart, $lte: monthEnd }
  });
  
  const monthSpend = transactions.reduce((sum, t) => sum + t.amount, 0);
  return creditLimit > 0 ? (monthSpend / creditLimit) * 100 : 0;
};

/**
 * Analyze credit utilization with trend and risk assessment
 * 
 * @param userId User ID
 * @param creditCardId Credit card ID
 * @param referenceDate Date for analysis (defaults to now)
 * @returns Utilization analysis with recommendations
 */
export const analyzeUtilization = async (
  userId: string,
  creditCardId: string,
  referenceDate: Date = new Date()
): Promise<UtilizationAnalysis | null> => {
  logger.info(`Analyzing utilization for card ${creditCardId}`);
  
  // Get card details
  const card = await CreditCard.findOne({
    _id: new Types.ObjectId(creditCardId),
    userId: new Types.ObjectId(userId),
    isActive: true
  });
  
  if (!card || !card.creditLimit || card.creditLimit <= 0) {
    logger.warn(`Card not found or invalid credit limit: ${creditCardId}`);
    return null;
  }
  
  const month = getCurrentMonth(referenceDate);
  const monthStart = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1);
  
  // Get current month transactions
  const currentMonthTransactions = await Transaction.find({
    userId: new Types.ObjectId(userId),
    creditCardId: new Types.ObjectId(creditCardId),
    type: "expense",
    paymentType: "credit",
    date: { $gte: monthStart, $lte: referenceDate }
  });
  
  const currentMonthSpending = currentMonthTransactions.reduce((sum, t) => sum + t.amount, 0);
  
  // Calculate current balance (outstanding from previous periods + current month)
  const currentBalance = (card.outstandingAmount || 0) + currentMonthSpending;
  const utilizationPercent = (currentBalance / card.creditLimit) * 100;
  
  // === RISK CATEGORIZATION ===
  
  let riskCategory: UtilizationAnalysis["riskCategory"];
  if (utilizationPercent < 30) riskCategory = "healthy";
  else if (utilizationPercent < 50) riskCategory = "moderate";
  else if (utilizationPercent < 75) riskCategory = "risky";
  else riskCategory = "critical";
  
  // === HISTORICAL TREND ANALYSIS ===
  
  // Get last 6 months utilization
  const historicalUtilization: number[] = [];
  for (let i = 1; i <= 6; i++) {
    const pastDate = new Date(referenceDate.getFullYear(), referenceDate.getMonth() - i, 15);
    const utilization = await getMonthUtilization(userId, creditCardId, pastDate, card.creditLimit);
    historicalUtilization.push(utilization);
  }
  
  const validHistory = historicalUtilization.filter(u => u > 0);
  const averageUtilization = validHistory.length > 0
    ? validHistory.reduce((sum, u) => sum + u, 0) / validHistory.length
    : utilizationPercent;
  
  const peakUtilization = Math.max(...validHistory, utilizationPercent);
  const lowestUtilization = validHistory.length > 0 
    ? Math.min(...validHistory, utilizationPercent)
    : utilizationPercent;
  
  // Determine trend (compare current with last 3 months average)
  const recentHistory = historicalUtilization.slice(0, 3).filter(u => u > 0);
  const recentAverage = recentHistory.length > 0
    ? recentHistory.reduce((sum, u) => sum + u, 0) / recentHistory.length
    : utilizationPercent;
  
  let trend: UtilizationAnalysis["trend"];
  const trendThreshold = 5; // 5% change to be considered trend
  
  if (utilizationPercent < recentAverage - trendThreshold) {
    trend = "improving";
  } else if (utilizationPercent > recentAverage + trendThreshold) {
    trend = "worsening";
  } else {
    trend = "stable";
  }
  
  // === RECOMMENDATIONS ===
  
  let recommendation: string;
  let actionRequired: boolean;
  
  if (riskCategory === "critical") {
    recommendation = `⚠️ URGENT: Your utilization is at ${utilizationPercent.toFixed(1)}%, which can significantly harm your credit score. Pay down ₹${Math.round(currentBalance - card.creditLimit * 0.3).toLocaleString()} to bring it below 30%.`;
    actionRequired = true;
  } else if (riskCategory === "risky") {
    recommendation = `Your utilization is ${utilizationPercent.toFixed(1)}%, which is in the risky zone. Try to pay down ₹${Math.round(currentBalance - card.creditLimit * 0.3).toLocaleString()} before your billing cycle ends to protect your credit score.`;
    actionRequired = true;
  } else if (riskCategory === "moderate") {
    if (trend === "worsening") {
      recommendation = `Your utilization (${utilizationPercent.toFixed(1)}%) is trending upward. Consider making a payment soon to keep it below 50%.`;
      actionRequired = false;
    } else {
      recommendation = `Your utilization of ${utilizationPercent.toFixed(1)}% is in the safe zone. Aim to keep it below 30% for optimal credit health.`;
      actionRequired = false;
    }
  } else {
    recommendation = `Excellent! Your utilization is ${utilizationPercent.toFixed(1)}%, which is ideal for maintaining a strong credit score. Keep it up!`;
    actionRequired = false;
  }
  
  // Add trend-specific advice
  if (trend === "worsening" && riskCategory !== "healthy") {
    recommendation += ` Note: Your utilization has increased by ${(utilizationPercent - recentAverage).toFixed(1)}% compared to recent months.`;
  } else if (trend === "improving") {
    recommendation += ` Great job! Your utilization has improved by ${(recentAverage - utilizationPercent).toFixed(1)}% compared to recent months.`;
  }
  
  return {
    creditCardId,
    userId,
    month,
    currentBalance: Math.round(currentBalance),
    creditLimit: card.creditLimit,
    utilizationPercent: Math.round(utilizationPercent * 100) / 100,
    riskCategory,
    trend,
    averageUtilization: Math.round(averageUtilization * 100) / 100,
    peakUtilization: Math.round(peakUtilization * 100) / 100,
    lowestUtilization: Math.round(lowestUtilization * 100) / 100,
    recommendation,
    actionRequired,
    generatedAt: new Date()
  };
};

/**
 * Analyze utilization for multiple cards
 */
export const analyzeUtilizationMultiple = async (
  userId: string,
  creditCardIds: string[],
  referenceDate: Date = new Date()
): Promise<(UtilizationAnalysis | null)[]> => {
  return Promise.all(
    creditCardIds.map(cardId => analyzeUtilization(userId, cardId, referenceDate))
  );
};

/**
 * Get utilization summary across all user cards
 */
export const getUserUtilizationSummary = async (
  userId: string,
  referenceDate: Date = new Date()
): Promise<{
  totalBalance: number;
  totalCreditLimit: number;
  overallUtilization: number;
  cardsAtRisk: number;
  highestUtilizationCard: string | null;
}> => {
  const cards = await CreditCard.find({
    userId: new Types.ObjectId(userId),
    isActive: true
  });
  
  let totalBalance = 0;
  let totalCreditLimit = 0;
  let cardsAtRisk = 0;
  let highestUtilization = 0;
  let highestUtilizationCard: string | null = null;
  
  for (const card of cards) {
    if (!card.creditLimit || card.creditLimit <= 0) continue;
    
    const monthStart = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1);
    const transactions = await Transaction.find({
      userId: new Types.ObjectId(userId),
      creditCardId: card._id,
      type: "expense",
      paymentType: "credit",
      date: { $gte: monthStart, $lte: referenceDate }
    });
    
    const monthSpend = transactions.reduce((sum, t) => sum + t.amount, 0);
    const balance = (card.outstandingAmount || 0) + monthSpend;
    const utilization = (balance / card.creditLimit) * 100;
    
    totalBalance += balance;
    totalCreditLimit += card.creditLimit;
    
    if (utilization >= 50) cardsAtRisk++;
    if (utilization > highestUtilization) {
      highestUtilization = utilization;
      highestUtilizationCard = card._id.toString();
    }
  }
  
  return {
    totalBalance: Math.round(totalBalance),
    totalCreditLimit,
    overallUtilization: totalCreditLimit > 0 
      ? Math.round((totalBalance / totalCreditLimit) * 10000) / 100 
      : 0,
    cardsAtRisk,
    highestUtilizationCard
  };
};
