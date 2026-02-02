import api from "./api";

export interface Transaction {
  _id: string;
  userId: string;
  type: "income" | "expense";
  amount: number;
  category: string;
  description?: string;
  date: Date;
  paymentType?: "cash" | "debit" | "credit";
  creditCardId?: string;
  isRecurring?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Budget {
  _id: string;
  userId: string;
  category: string;
  limit: number;
  spent: number;
  month: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MonthlySummary {
  month: string;
  totalIncome: number;
  totalExpense: number;
  netSavings: number;
  categoryBreakdown: Array<{
    category: string;
    amount: number;
    percentage: number;
  }>;
}

export const getUserTransactions = async (filters?: any): Promise<Transaction[]> => {
  const response = await api.get("/finance/transactions", { params: filters });
  return response.data;
};

export const createTransaction = async (transactionData: Partial<Transaction>): Promise<Transaction> => {
  const response = await api.post("/finance/transactions", transactionData);
  return response.data;
};

export const updateTransaction = async (transactionId: string, updates: Partial<Transaction>): Promise<Transaction> => {
  const response = await api.put(`/finance/transactions/${transactionId}`, updates);
  return response.data;
};

export const deleteTransaction = async (transactionId: string): Promise<void> => {
  await api.delete(`/finance/transactions/${transactionId}`);
};

export const getUserBudgets = async (month?: string): Promise<Budget[]> => {
  const response = await api.get("/finance/budgets", { params: { month } });
  return response.data;
};

export const createBudget = async (budgetData: Partial<Budget>): Promise<Budget> => {
  const response = await api.post("/finance/budgets", budgetData);
  return response.data;
};

export const updateBudget = async (budgetId: string, updates: Partial<Budget>): Promise<Budget> => {
  const response = await api.put(`/finance/budgets/${budgetId}`, updates);
  return response.data;
};

export const deleteBudget = async (budgetId: string): Promise<void> => {
  await api.delete(`/finance/budgets/${budgetId}`);
};

export const getMonthlySummary = async (month: string): Promise<MonthlySummary> => {
  const response = await api.get(`/finance/summary/${month}`);
  return response.data;
};
