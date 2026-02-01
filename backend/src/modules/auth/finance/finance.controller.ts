import { Response, NextFunction } from "express";
import { AuthRequest } from "../../../middleware/auth.middleware";
import * as financeService from "./finance.service";

// Transaction Controllers
export const createTransaction = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const transaction = await financeService.createTransaction(req.user.id, req.body);
    res.status(201).json(transaction);
  } catch (error) {
    next(error);
  }
};

export const getTransactions = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate, type, category, paymentType } = req.query;
    const filters: any = {};
    
    if (startDate) filters.startDate = new Date(startDate as string);
    if (endDate) filters.endDate = new Date(endDate as string);
    if (type) filters.type = type;
    if (category) filters.category = category;
    if (paymentType) filters.paymentType = paymentType;

    const transactions = await financeService.getUserTransactions(req.user.id, filters);
    res.json(transactions);
  } catch (error) {
    next(error);
  }
};

export const updateTransaction = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { transactionId } = req.params;
    const transaction = await financeService.updateTransaction(transactionId, req.user.id, req.body);
    res.json(transaction);
  } catch (error) {
    next(error);
  }
};

export const deleteTransaction = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { transactionId } = req.params;
    await financeService.deleteTransaction(transactionId, req.user.id);
    res.json({ message: "Transaction deleted" });
  } catch (error) {
    next(error);
  }
};

// Budget Controllers
export const createOrUpdateBudget = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { category, monthlyLimit, month } = req.body;
    const budget = await financeService.createOrUpdateBudget(req.user.id, category, monthlyLimit, month);
    res.json(budget);
  } catch (error) {
    next(error);
  }
};

export const getBudgets = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { month } = req.query;
    const budgets = await financeService.getUserBudgets(req.user.id, month as string);
    res.json(budgets);
  } catch (error) {
    next(error);
  }
};

export const deleteBudget = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { budgetId } = req.params;
    await financeService.deleteBudget(budgetId, req.user.id);
    res.json({ message: "Budget deleted" });
  } catch (error) {
    next(error);
  }
};

// Recurring Transaction Controllers
export const createRecurringTransaction = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const recurring = await financeService.createRecurringTransaction(req.user.id, req.body);
    res.status(201).json(recurring);
  } catch (error) {
    next(error);
  }
};

export const getRecurringTransactions = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const recurring = await financeService.getUserRecurringTransactions(req.user.id);
    res.json(recurring);
  } catch (error) {
    next(error);
  }
};

export const updateRecurringTransaction = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { recurringId } = req.params;
    const recurring = await financeService.updateRecurringTransaction(recurringId, req.user.id, req.body);
    res.json(recurring);
  } catch (error) {
    next(error);
  }
};

export const deleteRecurringTransaction = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { recurringId } = req.params;
    await financeService.deleteRecurringTransaction(recurringId, req.user.id);
    res.json({ message: "Recurring transaction deleted" });
  } catch (error) {
    next(error);
  }
};

// Summary and Analytics Controllers
export const getMonthlySummary = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { month } = req.query;
    const summary = await financeService.getMonthlySummary(req.user.id, month as string);
    res.json(summary);
  } catch (error) {
    next(error);
  }
};

export const getPredictions = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const predictions = await financeService.predictNextMonthExpenses(req.user.id);
    res.json(predictions);
  } catch (error) {
    next(error);
  }
};

export const getCategories = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const categories = financeService.getCategories();
    res.json(categories);
  } catch (error) {
    next(error);
  }
};
