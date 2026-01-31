/**
 * SMS Processing Routes
 */

import { Router } from "express";
import { authMiddleware } from "../../../../middleware/auth.middleware";
import * as smsController from "./sms.controller";

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Process incoming SMS
router.post("/process", smsController.processSmsMessage);

// Test SMS parsing (without saving)
router.post("/test-parse", smsController.testSmsParser);

// Get supported banks
router.get("/supported-banks", smsController.getSupportedBanksList);

// Get monthly spending overview
router.get("/monthly-spending", smsController.getMonthlySpendingOverview);

export default router;
