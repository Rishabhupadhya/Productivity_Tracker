/**
 * SMS Processing Controller
 * 
 * HTTP handlers for SMS processing endpoints
 */

import { Request, Response } from "express";
import { processSms, testSmsParsing, getSupportedBanks } from "./smsProcessing.service";
import { getUserMonthlySpending, getCurrentMonth } from "./monthlySpending.service";
import { logger } from "../../../../utils/logger";

/**
 * POST /sms/process
 * Process incoming credit card SMS
 * 
 * Body: { smsText: string, receivedAt?: string }
 */
export const processSmsMessage = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { smsText, receivedAt } = req.body;

    if (!smsText || typeof smsText !== "string") {
      return res.status(400).json({ message: "smsText is required and must be a string" });
    }

    const receivedDate = receivedAt ? new Date(receivedAt) : new Date();

    const result = await processSms(userId, smsText, receivedDate);

    if (result.success) {
      logger.info(`SMS processed successfully for user ${userId}`);
      return res.status(200).json(result);
    } else {
      return res.status(400).json(result);
    }
  } catch (error) {
    logger.error("Error in processSmsMessage controller:", error);
    return res.status(500).json({ 
      success: false,
      message: "Failed to process SMS", 
      error: (error as Error).message 
    });
  }
};

/**
 * POST /sms/test-parse
 * Test SMS parsing without saving to database
 * 
 * Body: { smsText: string }
 */
export const testSmsParser = async (req: Request, res: Response) => {
  try {
    const { smsText } = req.body;

    if (!smsText || typeof smsText !== "string") {
      return res.status(400).json({ message: "smsText is required and must be a string" });
    }

    const parsedData = testSmsParsing(smsText);

    if (parsedData) {
      return res.status(200).json({
        success: true,
        message: "SMS parsed successfully",
        parsedData
      });
    } else {
      return res.status(200).json({
        success: false,
        message: "SMS could not be parsed or is not a valid transaction SMS"
      });
    }
  } catch (error) {
    logger.error("Error in testSmsParser controller:", error);
    return res.status(500).json({ 
      success: false,
      message: "Failed to test SMS parsing", 
      error: (error as Error).message 
    });
  }
};

/**
 * GET /sms/supported-banks
 * Get list of supported banks
 */
export const getSupportedBanksList = async (req: Request, res: Response) => {
  try {
    const banks = getSupportedBanks();
    return res.status(200).json({
      success: true,
      banks,
      count: banks.length
    });
  } catch (error) {
    logger.error("Error in getSupportedBanksList controller:", error);
    return res.status(500).json({ 
      success: false,
      message: "Failed to get supported banks", 
      error: (error as Error).message 
    });
  }
};

/**
 * GET /sms/monthly-spending
 * Get user's monthly spending across all cards
 * 
 * Query: { month?: string } (YYYY-MM format)
 */
export const getMonthlySpendingOverview = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const month = (req.query.month as string) || getCurrentMonth();

    const spendingRecords = await getUserMonthlySpending(userId, month);

    const totalSpent = spendingRecords.reduce((sum, record) => sum + record.totalSpent, 0);
    const totalTransactions = spendingRecords.reduce((sum, record) => sum + record.transactionCount, 0);

    return res.status(200).json({
      success: true,
      month,
      totalSpent,
      totalTransactions,
      cards: spendingRecords
    });
  } catch (error) {
    logger.error("Error in getMonthlySpendingOverview controller:", error);
    return res.status(500).json({ 
      success: false,
      message: "Failed to get monthly spending", 
      error: (error as Error).message 
    });
  }
};
