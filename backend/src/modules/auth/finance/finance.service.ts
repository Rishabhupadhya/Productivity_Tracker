import { Transaction, Budget, RecurringTransaction, DEFAULT_CATEGORIES } from "./finance.model";
import { User } from "../auth.model";
import { Types } from "mongoose";
import { logActivity } from "../activity/activity.service";

// Transaction Services
export const createTransaction = async (
  userId: string,
  data: {
    type: "income" | "expense";
    amount: number;
    category: string;
    description?: string;
    date?: Date;
    isRecurring?: boolean;
    recurringId?: string;
  }
) => {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  const transactionData: any = {
    userId: new Types.ObjectId(userId),
    type: data.type,
    amount: data.amount,
    category: data.category,
    description: data.description || "",
    date: data.date ? new Date(data.date) : new Date(),
    isRecurring: data.isRecurring || false
  };

  if (data.recurringId) {
    transactionData.recurringId = new Types.ObjectId(data.recurringId);
  }

  if (user.activeTeamId) {
    transactionData.teamId = user.activeTeamId;
  }

  const transaction = await Transaction.create(transactionData);

  // Update budget spent amount
  if (data.type === "expense") {
    await updateBudgetSpent(userId, data.category, data.amount, data.date ? new Date(data.date) : new Date());
  }

  // Log activity
  if (user.activeTeamId) {
    await logActivity({
      teamId: user.activeTeamId.toString(),
      userId,
      action: "finance_transaction_added",
      targetType: "transaction",
      targetId: transaction._id.toString(),
      details: {
        type: data.type,
        amount: data.amount,
        category: data.category
      }
    });
  }

  return transaction;
};

export const getUserTransactions = async (
  userId: string,
  filters?: { startDate?: Date; endDate?: Date; type?: string; category?: string; paymentType?: string }
) => {
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

  if (filters?.startDate || filters?.endDate) {
    query.date = {};
    if (filters.startDate) query.date.$gte = filters.startDate;
    if (filters.endDate) query.date.$lte = filters.endDate;
  }

  if (filters?.type) query.type = filters.type;
  if (filters?.category) query.category = filters.category;
  if (filters?.paymentType) query.paymentType = filters.paymentType;

  return Transaction.find(query).sort({ date: -1 }).populate('creditCardId');
};

export const updateTransaction = async (transactionId: string, userId: string, updates: any) => {
  const transaction = await Transaction.findOne({ _id: transactionId, userId });
  if (!transaction) throw new Error("Transaction not found");

  const oldAmount = transaction.amount;
  const oldCategory = transaction.category;

  Object.assign(transaction, updates);
  await transaction.save();

  // Update budget if expense category or amount changed
  if (transaction.type === "expense" && (updates.amount || updates.category)) {
    // Revert old budget
    await updateBudgetSpent(userId, oldCategory, -oldAmount, transaction.date);
    // Apply new budget
    await updateBudgetSpent(userId, transaction.category, transaction.amount, transaction.date);
  }

  return transaction;
};

export const deleteTransaction = async (transactionId: string, userId: string) => {
  const transaction = await Transaction.findOne({ _id: transactionId, userId });
  if (!transaction) throw new Error("Transaction not found");

  // Revert budget
  if (transaction.type === "expense") {
    await updateBudgetSpent(userId, transaction.category, -transaction.amount, transaction.date);
  }

  await Transaction.findByIdAndDelete(transactionId);
};

// Budget Services
export const createOrUpdateBudget = async (
  userId: string,
  category: string,
  monthlyLimit: number,
  month?: string
) => {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  const targetMonth = month || new Date().toISOString().slice(0, 7);

  const budgetData: any = {
    userId: new Types.ObjectId(userId),
    category,
    monthlyLimit,
    month: targetMonth
  };

  if (user.activeTeamId) {
    budgetData.teamId = user.activeTeamId;
  }

  const budget = await Budget.findOneAndUpdate(
    { userId, category, month: targetMonth },
    { $set: budgetData },
    { upsert: true, new: true }
  );

  // Recalculate spent
  const monthStart = new Date(targetMonth + "-01");
  const monthEnd = new Date(monthStart);
  monthEnd.setMonth(monthEnd.getMonth() + 1);

  const transactions = await Transaction.find({
    userId,
    type: "expense",
    category,
    date: { $gte: monthStart, $lt: monthEnd }
  });

  budget.spent = transactions.reduce((sum, t) => sum + t.amount, 0);
  await budget.save();

  return budget;
};

export const getUserBudgets = async (userId: string, month?: string) => {
  const targetMonth = month || new Date().toISOString().slice(0, 7);
  return Budget.find({ userId, month: targetMonth });
};

const updateBudgetSpent = async (userId: string, category: string, amount: number, date: Date) => {
  const month = date.toISOString().slice(0, 7);
  const budget = await Budget.findOne({ userId, category, month });
  
  if (budget) {
    budget.spent += amount;
    await budget.save();
  }
};

export const deleteBudget = async (budgetId: string, userId: string) => {
  await Budget.findOneAndDelete({ _id: budgetId, userId });
};

// Recurring Transaction Services
export const createRecurringTransaction = async (
  userId: string,
  data: {
    type: "income" | "expense";
    amount: number;
    category: string;
    description?: string;
    frequency: "daily" | "weekly" | "monthly" | "yearly";
    dayOfMonth?: number;
    dayOfWeek?: number;
    startDate: Date;
    endDate?: Date;
  }
) => {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  const recurringData: any = {
    userId: new Types.ObjectId(userId),
    ...data
  };

  if (user.activeTeamId) {
    recurringData.teamId = user.activeTeamId;
  }

  return RecurringTransaction.create(recurringData);
};

export const getUserRecurringTransactions = async (userId: string) => {
  return RecurringTransaction.find({ userId, isActive: true }).sort({ createdAt: -1 });
};

export const updateRecurringTransaction = async (
  recurringId: string,
  userId: string,
  updates: any
) => {
  return RecurringTransaction.findOneAndUpdate(
    { _id: recurringId, userId },
    { $set: updates },
    { new: true }
  );
};

export const deleteRecurringTransaction = async (recurringId: string, userId: string) => {
  await RecurringTransaction.findOneAndUpdate(
    { _id: recurringId, userId },
    { $set: { isActive: false } }
  );
};

export const processRecurringTransactions = async () => {
  const now = new Date();
  const recurring = await RecurringTransaction.find({ isActive: true });

  for (const r of recurring) {
    const shouldProcess = checkIfDue(r, now);
    if (shouldProcess) {
      await createTransaction(r.userId.toString(), {
        type: r.type,
        amount: r.amount,
        category: r.category,
        description: r.description + " (Recurring)",
        date: now,
        isRecurring: true,
        recurringId: r._id.toString()
      });

      r.lastProcessed = now;
      await r.save();
    }
  }
};

const checkIfDue = (recurring: any, now: Date): boolean => {
  if (!recurring.lastProcessed) return true;

  const lastProcessed = new Date(recurring.lastProcessed);
  const daysSince = (now.getTime() - lastProcessed.getTime()) / (1000 * 60 * 60 * 24);

  switch (recurring.frequency) {
    case "daily":
      return daysSince >= 1;
    case "weekly":
      return daysSince >= 7 && now.getDay() === recurring.dayOfWeek;
    case "monthly":
      return now.getDate() === recurring.dayOfMonth && now.getMonth() !== lastProcessed.getMonth();
    case "yearly":
      return now.getMonth() === lastProcessed.getMonth() && 
             now.getDate() === recurring.dayOfMonth && 
             now.getFullYear() > lastProcessed.getFullYear();
    default:
      return false;
  }
};

// Monthly Summary
export const getMonthlySummary = async (userId: string, month?: string) => {
  const targetMonth = month || new Date().toISOString().slice(0, 7);
  const monthStart = new Date(targetMonth + "-01");
  const monthEnd = new Date(monthStart);
  monthEnd.setMonth(monthEnd.getMonth() + 1);

  const transactions = await Transaction.find({
    userId,
    date: { $gte: monthStart, $lt: monthEnd }
  });

  const income = transactions.filter(t => t.type === "income").reduce((sum, t) => sum + t.amount, 0);
  const expenses = transactions.filter(t => t.type === "expense").reduce((sum, t) => sum + t.amount, 0);
  const savings = income - expenses;
  const savingsRate = income > 0 ? (savings / income) * 100 : 0;

  // Category breakdown
  const categoryBreakdown: any = {};
  transactions.filter(t => t.type === "expense").forEach(t => {
    categoryBreakdown[t.category] = (categoryBreakdown[t.category] || 0) + t.amount;
  });

  const highestCategory = Object.entries(categoryBreakdown).sort((a: any, b: any) => b[1] - a[1])[0];

  // Compare with last month
  const lastMonthStart = new Date(monthStart);
  lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);
  const lastMonthEnd = new Date(lastMonthStart);
  lastMonthEnd.setMonth(lastMonthEnd.getMonth() + 1);

  const lastMonthTransactions = await Transaction.find({
    userId,
    date: { $gte: lastMonthStart, $lt: lastMonthEnd }
  });

  const lastMonthExpenses = lastMonthTransactions
    .filter(t => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const expenseChange = lastMonthExpenses > 0 
    ? ((expenses - lastMonthExpenses) / lastMonthExpenses) * 100 
    : 0;

  return {
    month: targetMonth,
    income,
    expenses,
    savings,
    savingsRate,
    categoryBreakdown,
    highestCategory: highestCategory ? { category: highestCategory[0], amount: highestCategory[1] } : null,
    comparison: {
      lastMonthExpenses,
      expenseChange
    }
  };
};

// Expense Prediction (Simple Moving Average)
export const predictNextMonthExpenses = async (userId: string) => {
  const now = new Date();
  const months = [];
  
  for (let i = 0; i < 3; i++) {
    const month = new Date(now);
    month.setMonth(month.getMonth() - i);
    months.push(month.toISOString().slice(0, 7));
  }

  const predictions: any = {};

  for (const month of months) {
    const summary = await getMonthlySummary(userId, month);
    Object.entries(summary.categoryBreakdown).forEach(([category, amount]: any) => {
      if (!predictions[category]) predictions[category] = [];
      predictions[category].push(amount);
    });
  }

  const predicted: any = {};
  Object.entries(predictions).forEach(([category, amounts]: any) => {
    predicted[category] = amounts.reduce((sum: number, amt: number) => sum + amt, 0) / amounts.length;
  });

  const totalPredicted = Object.values(predicted).reduce((sum: any, amt: any) => sum + amt, 0);

  return {
    predictions: predicted,
    total: totalPredicted
  };
};

export const getCategories = () => DEFAULT_CATEGORIES;
