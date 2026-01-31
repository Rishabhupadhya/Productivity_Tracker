"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../../middleware/auth.middleware");
const financeController = __importStar(require("./finance.controller"));
const router = (0, express_1.Router)();
// Transaction routes
router.post("/transactions", auth_middleware_1.authMiddleware, financeController.createTransaction);
router.get("/transactions", auth_middleware_1.authMiddleware, financeController.getTransactions);
router.patch("/transactions/:transactionId", auth_middleware_1.authMiddleware, financeController.updateTransaction);
router.delete("/transactions/:transactionId", auth_middleware_1.authMiddleware, financeController.deleteTransaction);
// Budget routes
router.post("/budgets", auth_middleware_1.authMiddleware, financeController.createOrUpdateBudget);
router.get("/budgets", auth_middleware_1.authMiddleware, financeController.getBudgets);
router.delete("/budgets/:budgetId", auth_middleware_1.authMiddleware, financeController.deleteBudget);
// Recurring transaction routes
router.post("/recurring", auth_middleware_1.authMiddleware, financeController.createRecurringTransaction);
router.get("/recurring", auth_middleware_1.authMiddleware, financeController.getRecurringTransactions);
router.patch("/recurring/:recurringId", auth_middleware_1.authMiddleware, financeController.updateRecurringTransaction);
router.delete("/recurring/:recurringId", auth_middleware_1.authMiddleware, financeController.deleteRecurringTransaction);
// Summary and analytics
router.get("/summary", auth_middleware_1.authMiddleware, financeController.getMonthlySummary);
router.get("/predictions", auth_middleware_1.authMiddleware, financeController.getPredictions);
router.get("/categories", auth_middleware_1.authMiddleware, financeController.getCategories);
exports.default = router;
