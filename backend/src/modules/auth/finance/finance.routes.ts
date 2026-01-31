import { Router } from "express";
import { authMiddleware } from "../../../middleware/auth.middleware";
import * as financeController from "./finance.controller";
import creditCardRoutes from "./creditCard.routes";

const router = Router();

// Transaction routes
router.post("/transactions", authMiddleware, financeController.createTransaction);
router.get("/transactions", authMiddleware, financeController.getTransactions);
router.patch("/transactions/:transactionId", authMiddleware, financeController.updateTransaction);
router.delete("/transactions/:transactionId", authMiddleware, financeController.deleteTransaction);

// Budget routes
router.post("/budgets", authMiddleware, financeController.createOrUpdateBudget);
router.get("/budgets", authMiddleware, financeController.getBudgets);
router.delete("/budgets/:budgetId", authMiddleware, financeController.deleteBudget);

// Recurring transaction routes
router.post("/recurring", authMiddleware, financeController.createRecurringTransaction);
router.get("/recurring", authMiddleware, financeController.getRecurringTransactions);
router.patch("/recurring/:recurringId", authMiddleware, financeController.updateRecurringTransaction);
router.delete("/recurring/:recurringId", authMiddleware, financeController.deleteRecurringTransaction);

// Credit card routes
router.use("/credit-cards", creditCardRoutes);

// Summary and analytics
router.get("/summary", authMiddleware, financeController.getMonthlySummary);
router.get("/predictions", authMiddleware, financeController.getPredictions);
router.get("/categories", authMiddleware, financeController.getCategories);

export default router;
