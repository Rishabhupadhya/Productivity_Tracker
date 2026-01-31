import { Types } from "mongoose";
import { CreditCard, ICreditCard } from "./creditCard.model";
import { Transaction } from "./finance.model";

// Types for credit card intelligence
export interface CardUtilization {
  cardId: string;
  cardName: string;
  bankName: string;
  last4Digits: string;
  creditLimit: number;
  outstanding: number;
  utilizationPercent: number;
  status: "healthy" | "caution" | "warning" | "critical";
  currentBillingPeriod: {
    start: Date;
    end: Date;
  };
  dueDate: Date;
  daysUntilDue: number;
}

export interface UtilizationOverview {
  totalCreditLimit: number;
  totalOutstanding: number;
  overallUtilization: number;
  overallStatus: "healthy" | "caution" | "warning" | "critical";
  cardCount: number;
  activeCardCount: number;
  cards: CardUtilization[];
}

export interface CreditAlert {
  id: string;
  type: "HIGH_UTILIZATION" | "NEAR_LIMIT" | "DUE_DATE_APPROACHING" | "SPENDING_SPIKE";
  severity: "info" | "warning" | "critical";
  message: string;
  cardId?: string;
  cardName?: string;
  timestamp: Date;
}

// CRUD Operations
export const createCreditCard = async (userId: string, data: {
  teamId?: string;
  cardName: string;
  bankName: string;
  last4Digits: string;
  creditLimit: number;
  outstandingAmount?: number;
  billingCycleStartDay: number;
  dueDateDay: number;
  interestRate?: number;
}): Promise<ICreditCard> => {
  const card = await CreditCard.create({
    userId: new Types.ObjectId(userId),
    teamId: data.teamId ? new Types.ObjectId(data.teamId) : undefined,
    ownerId: new Types.ObjectId(userId),
    cardName: data.cardName,
    bankName: data.bankName,
    last4Digits: data.last4Digits,
    creditLimit: data.creditLimit,
    outstandingAmount: data.outstandingAmount || 0,
    billingCycleStartDay: data.billingCycleStartDay,
    dueDateDay: data.dueDateDay,
    interestRate: data.interestRate,
    isActive: true
  });

  return card;
};

export const getCreditCards = async (userId: string, teamId?: string): Promise<ICreditCard[]> => {
  const query: any = { 
    userId: new Types.ObjectId(userId),
    isActive: true 
  };

  if (teamId) {
    query.teamId = new Types.ObjectId(teamId);
  }

  return await CreditCard.find(query).sort({ createdAt: -1 });
};

export const getCreditCardById = async (cardId: string, userId: string): Promise<ICreditCard | null> => {
  return await CreditCard.findOne({
    _id: new Types.ObjectId(cardId),
    userId: new Types.ObjectId(userId),
    isActive: true
  });
};

export const updateCreditCard = async (
  cardId: string,
  userId: string,
  updates: Partial<ICreditCard>
): Promise<ICreditCard | null> => {
  return await CreditCard.findOneAndUpdate(
    { _id: new Types.ObjectId(cardId), userId: new Types.ObjectId(userId) },
    { $set: updates },
    { new: true, runValidators: true }
  );
};

export const deleteCreditCard = async (cardId: string, userId: string): Promise<void> => {
  await CreditCard.findOneAndUpdate(
    { _id: new Types.ObjectId(cardId), userId: new Types.ObjectId(userId) },
    { $set: { isActive: false } }
  );
};

// Billing Cycle Calculations
export const getBillingPeriod = (card: ICreditCard, referenceDate: Date = new Date()): { start: Date; end: Date } => {
  const { billingCycleStartDay } = card;
  const refYear = referenceDate.getFullYear();
  const refMonth = referenceDate.getMonth();
  const refDay = referenceDate.getDate();

  let startYear = refYear;
  let startMonth = refMonth;

  // If reference day is before cycle start, billing period is previous month
  if (refDay < billingCycleStartDay) {
    startMonth -= 1;
    if (startMonth < 0) {
      startMonth = 11;
      startYear -= 1;
    }
  }

  // Handle case where billing day doesn't exist in month (e.g., 31st in Feb)
  const startDay = Math.min(billingCycleStartDay, new Date(startYear, startMonth + 1, 0).getDate());
  const start = new Date(startYear, startMonth, startDay);

  // End is one day before next cycle start
  let endMonth = startMonth + 1;
  let endYear = startYear;
  if (endMonth > 11) {
    endMonth = 0;
    endYear += 1;
  }

  const endDay = Math.min(billingCycleStartDay, new Date(endYear, endMonth + 1, 0).getDate());
  const end = new Date(endYear, endMonth, endDay);
  end.setDate(end.getDate() - 1);
  end.setHours(23, 59, 59, 999);

  return { start, end };
};

export const getDueDate = (card: ICreditCard, referenceDate: Date = new Date()): Date => {
  const { dueDateDay } = card;
  const billingPeriod = getBillingPeriod(card, referenceDate);

  // Due date is in the month after billing period ends
  const billingEndMonth = billingPeriod.end.getMonth();
  const billingEndYear = billingPeriod.end.getFullYear();

  let dueMonth = billingEndMonth + 1;
  let dueYear = billingEndYear;
  if (dueMonth > 11) {
    dueMonth = 0;
    dueYear += 1;
  }

  const dueDay = Math.min(dueDateDay, new Date(dueYear, dueMonth + 1, 0).getDate());
  return new Date(dueYear, dueMonth, dueDay);
};

// Utilization Calculation
export const calculateCardUtilization = async (
  card: ICreditCard,
  referenceDate: Date = new Date()
): Promise<CardUtilization> => {
  const billingPeriod = getBillingPeriod(card, referenceDate);
  const dueDate = getDueDate(card, referenceDate);

  // Get all credit transactions for this card in current billing period
  const transactions = await Transaction.find({
    creditCardId: card._id,
    paymentType: "credit",
    type: "expense",
    date: { $gte: billingPeriod.start, $lte: billingPeriod.end }
  });

  // Calculate transaction-based spending in current billing period
  const transactionSpending = transactions.reduce((sum, t) => sum + t.amount, 0);
  
  // Add the stored outstanding amount (existing balance before this billing cycle)
  const outstanding = card.outstandingAmount + transactionSpending;
  
  const utilizationPercent = card.creditLimit > 0 ? (outstanding / card.creditLimit) * 100 : 0;

  // Determine status based on utilization
  let status: CardUtilization["status"];
  if (utilizationPercent < 30) status = "healthy";
  else if (utilizationPercent < 50) status = "caution";
  else if (utilizationPercent < 70) status = "warning";
  else status = "critical";

  const now = new Date();
  const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  return {
    cardId: card._id.toString(),
    cardName: card.cardName,
    bankName: card.bankName,
    last4Digits: card.last4Digits,
    creditLimit: card.creditLimit,
    outstanding,
    utilizationPercent: Math.round(utilizationPercent * 10) / 10,
    status,
    currentBillingPeriod: billingPeriod,
    dueDate,
    daysUntilDue
  };
};

export const calculateOverallUtilization = async (
  userId: string,
  teamId?: string,
  referenceDate: Date = new Date()
): Promise<UtilizationOverview> => {
  const cards = await getCreditCards(userId, teamId);
  const activeCards = cards.filter(c => c.isActive);

  const cardUtilizations = await Promise.all(
    activeCards.map(card => calculateCardUtilization(card, referenceDate))
  );

  const totalCreditLimit = cardUtilizations.reduce((sum, c) => sum + c.creditLimit, 0);
  const totalOutstanding = cardUtilizations.reduce((sum, c) => sum + c.outstanding, 0);
  const overallUtilization = totalCreditLimit > 0 
    ? Math.round((totalOutstanding / totalCreditLimit) * 1000) / 10 
    : 0;

  let overallStatus: UtilizationOverview["overallStatus"];
  if (overallUtilization < 30) overallStatus = "healthy";
  else if (overallUtilization < 50) overallStatus = "caution";
  else if (overallUtilization < 70) overallStatus = "warning";
  else overallStatus = "critical";

  return {
    totalCreditLimit,
    totalOutstanding,
    overallUtilization,
    overallStatus,
    cardCount: cards.length,
    activeCardCount: activeCards.length,
    cards: cardUtilizations
  };
};

// Alert Generation
export const generateCreditAlerts = async (
  userId: string,
  teamId?: string
): Promise<CreditAlert[]> => {
  const overview = await calculateOverallUtilization(userId, teamId);
  const alerts: CreditAlert[] = [];

  overview.cards.forEach(card => {
    // High utilization alert
    if (card.utilizationPercent >= 70) {
      alerts.push({
        id: `HIGH_UTIL_${card.cardId}`,
        type: "HIGH_UTILIZATION",
        severity: "critical",
        message: `${card.cardName} (${card.last4Digits}) is at ${card.utilizationPercent}% utilization. Consider reducing usage.`,
        cardId: card.cardId,
        cardName: card.cardName,
        timestamp: new Date()
      });
    } else if (card.utilizationPercent >= 50) {
      alerts.push({
        id: `HIGH_UTIL_${card.cardId}`,
        type: "HIGH_UTILIZATION",
        severity: "warning",
        message: `${card.cardName} (${card.last4Digits}) is at ${card.utilizationPercent}% utilization. Approaching high usage.`,
        cardId: card.cardId,
        cardName: card.cardName,
        timestamp: new Date()
      });
    }

    // Near credit limit alert
    const remaining = card.creditLimit - card.outstanding;
    if (remaining < card.creditLimit * 0.1 && card.utilizationPercent > 0) {
      alerts.push({
        id: `NEAR_LIMIT_${card.cardId}`,
        type: "NEAR_LIMIT",
        severity: "critical",
        message: `${card.cardName} (${card.last4Digits}) has only ₹${remaining.toLocaleString()} remaining.`,
        cardId: card.cardId,
        cardName: card.cardName,
        timestamp: new Date()
      });
    }

    // Due date approaching
    if (card.daysUntilDue <= 7 && card.outstanding > 0) {
      const severity = card.daysUntilDue <= 3 ? "critical" : "warning";
      alerts.push({
        id: `DUE_DATE_${card.cardId}`,
        type: "DUE_DATE_APPROACHING",
        severity,
        message: `Payment due in ${card.daysUntilDue} days for ${card.cardName} (${card.last4Digits}). Outstanding: ₹${card.outstanding.toLocaleString()}`,
        cardId: card.cardId,
        cardName: card.cardName,
        timestamp: new Date()
      });
    }
  });

  // Sort by severity (critical first)
  return alerts.sort((a, b) => {
    const severityOrder = { critical: 0, warning: 1, info: 2 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });
};

// Spending spike detection (compare last 7 days vs previous 7 days)
export const detectSpendingSpike = async (
  cardId: string,
  userId: string
): Promise<CreditAlert | null> => {
  const card = await getCreditCardById(cardId, userId);
  if (!card) return null;

  const now = new Date();
  const last7DaysStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const prev7DaysStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const [last7Days, prev7Days] = await Promise.all([
    Transaction.find({
      creditCardId: card._id,
      paymentType: "credit",
      type: "expense",
      date: { $gte: last7DaysStart, $lte: now }
    }),
    Transaction.find({
      creditCardId: card._id,
      paymentType: "credit",
      type: "expense",
      date: { $gte: prev7DaysStart, $lt: last7DaysStart }
    })
  ]);

  const recentSpend = last7Days.reduce((sum, t) => sum + t.amount, 0);
  const previousSpend = prev7Days.reduce((sum, t) => sum + t.amount, 0);

  // Alert if spending increased by 50% or more
  if (previousSpend > 0 && recentSpend / previousSpend >= 1.5) {
    const increasePercent = Math.round(((recentSpend - previousSpend) / previousSpend) * 100);
    return {
      id: `SPIKE_${cardId}`,
      type: "SPENDING_SPIKE",
      severity: "warning",
      message: `Spending on ${card.cardName} increased by ${increasePercent}% in the last 7 days.`,
      cardId: card._id.toString(),
      cardName: card.cardName,
      timestamp: new Date()
    };
  }

  return null;
};
