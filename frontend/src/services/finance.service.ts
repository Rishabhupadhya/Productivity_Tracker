import { api } from "./api";

export interface Transaction {
  _id: string;
  userId: string;
  teamId?: string;
  type: "income" | "expense";
  amount: number;
  category: string;
  description: string;
  date: string;
  paymentType: "cash" | "debit" | "credit";
  creditCardId?: string;
  isRecurring: boolean;
  recurringId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Budget {
  _id: string;
  userId: string;
  teamId?: string;
  category: string;
  monthlyLimit: number;
  month: string;
  spent: number;
  createdAt: string;
  updatedAt: string;
}

export interface RecurringTransaction {
  _id: string;
  userId: string;
  teamId?: string;
  type: "income" | "expense";
  amount: number;
  category: string;
  description: string;
  frequency: "daily" | "weekly" | "monthly" | "yearly";
  dayOfMonth?: number;
  dayOfWeek?: number;
  startDate: string;
  endDate?: string;
  isActive: boolean;
  lastProcessed?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MonthlySummary {
  month: string;
  income: number;
  expenses: number;
  savings: number;
  savingsRate: number;
  categoryBreakdown: Record<string, number>;
  highestCategory: { category: string; amount: number } | null;
  comparison: {
    lastMonthExpenses: number;
    expenseChange: number;
  };
}

export interface ExpensePrediction {
  predictions: Record<string, number>;
  total: number;
}

export interface Categories {
  expense: string[];
  income: string[];
}

// Transactions
export const createTransaction = async (data: {
  type: "income" | "expense";
  amount: number;
  category: string;
  description?: string;
  date?: string | Date;
  paymentType?: "cash" | "debit" | "credit";
  creditCardId?: string;
  isRecurring?: boolean;
}): Promise<Transaction> => {
  const res = await api.post("/finance/transactions", data);
  return res.data;
};

export const getTransactions = async (filters?: {
  startDate?: string;
  endDate?: string;
  type?: string;
  category?: string;
}): Promise<Transaction[]> => {
  const res = await api.get("/finance/transactions", { params: filters });
  return res.data;
};

export const updateTransaction = async (transactionId: string, updates: Partial<Transaction>): Promise<Transaction> => {
  const res = await api.patch(`/finance/transactions/${transactionId}`, updates);
  return res.data;
};

export const deleteTransaction = async (transactionId: string): Promise<void> => {
  await api.delete(`/finance/transactions/${transactionId}`);
};

// Budgets
export const createOrUpdateBudget = async (data: {
  category: string;
  monthlyLimit: number;
  month?: string;
}): Promise<Budget> => {
  const res = await api.post("/finance/budgets", data);
  return res.data;
};

export const getBudgets = async (month?: string): Promise<Budget[]> => {
  const res = await api.get("/finance/budgets", { params: { month } });
  return res.data;
};

export const deleteBudget = async (budgetId: string): Promise<void> => {
  await api.delete(`/finance/budgets/${budgetId}`);
};

// Recurring Transactions
export const createRecurringTransaction = async (data: {
  type: "income" | "expense";
  amount: number;
  category: string;
  description?: string;
  frequency: "daily" | "weekly" | "monthly" | "yearly";
  dayOfMonth?: number;
  dayOfWeek?: number;
  startDate: Date;
  endDate?: Date;
}): Promise<RecurringTransaction> => {
  const res = await api.post("/finance/recurring", data);
  return res.data;
};

export const getRecurringTransactions = async (): Promise<RecurringTransaction[]> => {
  const res = await api.get("/finance/recurring");
  return res.data;
};

export const updateRecurringTransaction = async (
  recurringId: string,
  updates: Partial<RecurringTransaction>
): Promise<RecurringTransaction> => {
  const res = await api.patch(`/finance/recurring/${recurringId}`, updates);
  return res.data;
};

export const deleteRecurringTransaction = async (recurringId: string): Promise<void> => {
  await api.delete(`/finance/recurring/${recurringId}`);
};

// Summary and Analytics
export const getMonthlySummary = async (month?: string): Promise<MonthlySummary> => {
  const res = await api.get("/finance/summary", { params: { month } });
  return res.data;
};

export const getPredictions = async (): Promise<ExpensePrediction> => {
  const res = await api.get("/finance/predictions");
  return res.data;
};

export const getCategories = async (): Promise<Categories> => {
  const res = await api.get("/finance/categories");
  return res.data;
};
