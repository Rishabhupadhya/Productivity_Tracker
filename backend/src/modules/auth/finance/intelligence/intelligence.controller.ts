/**
 * Intelligence API Controller
 * 
 * HTTP handlers for ML/intelligence endpoints
 */

import { Response } from "express";
import { AuthRequest } from "../../../../middleware/auth.middleware";
import { generateSpendingProfile } from "./spendingProfile.service";
import { predictOverspending, predictOverspendingMultiple } from "./overspendingPrediction.service";
import { 
  analyzeUtilization, 
  analyzeUtilizationMultiple, 
  getUserUtilizationSummary 
} from "./utilizationAnalysis.service";
import { 
  detectTransactionAnomaly,
  detectRecentAnomalies, 
  detectAnomaliesAllCards,
  getAnomalyStatistics 
} from "./anomalyDetection.service";
import {
  generateIntelligenceInsights,
  generateInsightsAllCards,
  getAggregatedIntelligence
} from "./intelligenceOrchestration.service";
import { IntelligenceConfig } from "./intelligenceConfig.model";
import { Transaction } from "../finance.model";
import { Types } from "mongoose";
import { logger } from "../../../../utils/logger";
import creditScorePlannerService from "./creditScorePlanner.service";
import paymentPriorityService from "./paymentPriority.service";
import cashFlowAnalysisService from "./cashFlowAnalysis.service";
import recoveryPlannerService from "./recoveryPlanner.service";

/**
 * GET /intelligence/profile/:cardId
 * Get spending behavior profile for a card
 */
export const getSpendingProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { cardId } = req.params;
    const { months = 6 } = req.query;
    
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    const profile = await generateSpendingProfile(
      userId,
      cardId,
      parseInt(months as string) || 6
    );
    
    res.json(profile);
  } catch (error) {
    logger.error("Error fetching spending profile:", error);
    res.status(500).json({ error: "Failed to generate spending profile" });
  }
};

/**
 * GET /intelligence/prediction/:cardId
 * Get overspending prediction for a card
 */
export const getOverspendingPrediction = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { cardId } = req.params;
    
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    const prediction = await predictOverspending(userId, cardId);
    
    if (!prediction) {
      return res.status(404).json({ error: "Card not found or no monthly limit set" });
    }
    
    res.json(prediction);
  } catch (error) {
    logger.error("Error generating prediction:", error);
    res.status(500).json({ error: "Failed to generate overspending prediction" });
  }
};

/**
 * POST /intelligence/prediction/batch
 * Get predictions for multiple cards
 */
export const getPredictionsBatch = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { cardIds } = req.body;
    
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    if (!Array.isArray(cardIds)) {
      return res.status(400).json({ error: "cardIds must be an array" });
    }
    
    const predictions = await predictOverspendingMultiple(userId, cardIds);
    
    res.json(predictions);
  } catch (error) {
    logger.error("Error generating batch predictions:", error);
    res.status(500).json({ error: "Failed to generate predictions" });
  }
};

/**
 * GET /intelligence/utilization/:cardId
 * Get utilization analysis for a card
 */
export const getUtilizationAnalysis = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { cardId } = req.params;
    
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    const analysis = await analyzeUtilization(userId, cardId);
    
    if (!analysis) {
      return res.status(404).json({ error: "Card not found or invalid credit limit" });
    }
    
    res.json(analysis);
  } catch (error) {
    logger.error("Error analyzing utilization:", error);
    res.status(500).json({ error: "Failed to analyze utilization" });
  }
};

/**
 * GET /intelligence/utilization/summary
 * Get utilization summary across all cards
 */
export const getUtilizationSummary = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    const summary = await getUserUtilizationSummary(userId);
    
    res.json(summary);
  } catch (error) {
    logger.error("Error fetching utilization summary:", error);
    res.status(500).json({ error: "Failed to fetch utilization summary" });
  }
};

/**
 * GET /intelligence/anomalies/:cardId
 * Get anomalies for a specific card
 */
export const getCardAnomalies = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { cardId } = req.params;
    const { days = 30 } = req.query;
    
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    const anomalies = await detectRecentAnomalies(
      userId,
      cardId,
      parseInt(days as string) || 30
    );
    
    res.json(anomalies);
  } catch (error) {
    logger.error("Error detecting anomalies:", error);
    res.status(500).json({ error: "Failed to detect anomalies" });
  }
};

/**
 * GET /intelligence/anomalies
 * Get anomalies across all cards
 */
export const getPredictions = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { cardIds, days = 30 } = req.query;
    
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    let cardIdArray: string[];
    if (typeof cardIds === "string") {
      cardIdArray = cardIds.split(",");
    } else if (Array.isArray(cardIds)) {
      cardIdArray = cardIds.filter((id): id is string => typeof id === "string");
    } else {
      return res.status(400).json({ error: "cardIds query parameter required" });
    }
    
    const anomalies = await detectAnomaliesAllCards(
      userId,
      cardIdArray,
      parseInt(days as string) || 30
    );
    
    res.json(anomalies);
  } catch (error) {
    logger.error("Error detecting anomalies:", error);
    res.status(500).json({ error: "Failed to detect anomalies" });
  }
};

/**
 * GET /intelligence/anomalies/:cardId/stats
 * Get anomaly statistics for a card
 */
export const getAnomalyStats = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { cardId } = req.params;
    const { days = 90 } = req.query;
    
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    const stats = await getAnomalyStatistics(
      userId,
      cardId,
      parseInt(days as string) || 90
    );
    
    res.json(stats);
  } catch (error) {
    logger.error("Error fetching anomaly statistics:", error);
    res.status(500).json({ error: "Failed to fetch anomaly statistics" });
  }
};

/**
 * POST /intelligence/anomalies/check
 * Check if a specific transaction is anomalous
 */
export const checkTransactionAnomaly = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { transactionId, cardId } = req.body;
    
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    if (!transactionId || !cardId) {
      return res.status(400).json({ error: "transactionId and cardId are required" });
    }
    
    const transaction = await Transaction.findOne({
      _id: new Types.ObjectId(transactionId),
      userId: new Types.ObjectId(userId)
    });
    
    if (!transaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }
    
    const result = await detectTransactionAnomaly(userId, cardId, transaction);
    
    res.json(result);
  } catch (error) {
    logger.error("Error checking transaction anomaly:", error);
    res.status(500).json({ error: "Failed to check transaction anomaly" });
  }
};

/**
 * GET /intelligence/insights/:cardId
 * Get comprehensive intelligence insights for a card
 */
export const getCashFlow = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { cardId } = req.params;
    
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    const insights = await generateIntelligenceInsights(userId, cardId);
    
    if (!insights) {
      return res.status(404).json({ error: "Card not found" });
    }
    
    res.json(insights);
  } catch (error) {
    logger.error("Error generating insights:", error);
    res.status(500).json({ error: "Failed to generate insights" });
  }
};

/**
 * GET /intelligence/insights
 * Get insights for all user cards
 */
export const getAllInsights = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    const insights = await generateInsightsAllCards(userId);
    
    res.json(insights);
  } catch (error) {
    logger.error("Error generating insights:", error);
    res.status(500).json({ error: "Failed to generate insights" });
  }
};

/**
 * GET /intelligence/dashboard
 * Get aggregated intelligence dashboard
 */
export const getIntelligenceDashboard = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    const dashboard = await getAggregatedIntelligence(userId);
    
    res.json(dashboard);
  } catch (error) {
    logger.error("Error fetching dashboard:", error);
    res.status(500).json({ error: "Failed to fetch intelligence dashboard" });
  }
};

/**
 * GET /intelligence/config
 * Get user's intelligence configuration
 */
export const getIntelligenceConfig = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { cardId } = req.query;
    
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    const query: any = { userId: new Types.ObjectId(userId) };
    if (cardId) {
      query.creditCardId = new Types.ObjectId(cardId as string);
    }
    
    let config = await IntelligenceConfig.findOne(query);
    
    if (!config) {
      // Return default config
      config = new IntelligenceConfig({ userId: new Types.ObjectId(userId) });
    }
    
    res.json(config);
  } catch (error) {
    logger.error("Error fetching config:", error);
    res.status(500).json({ error: "Failed to fetch configuration" });
  }
};

/**
 * PUT /intelligence/config
 * Update intelligence configuration
 */
export const updateIntelligenceConfig = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { cardId, ...updates } = req.body;
    
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    const query: any = { userId: new Types.ObjectId(userId) };
    if (cardId) {
      query.creditCardId = new Types.ObjectId(cardId);
    }
    
    const config = await IntelligenceConfig.findOneAndUpdate(
      query,
      { $set: updates },
      { new: true, upsert: true }
    );
    
    logger.info(`Updated intelligence config for user ${userId}`);
    res.json(config);
  } catch (error) {
    logger.error("Error updating config:", error);
    res.status(500).json({ error: "Failed to update configuration" });
  }
};

/**
 * ═══════════════════════════════════════════════════════════
 * CREDIT SCORE IMPROVEMENT & PAYMENT PRIORITY ENDPOINTS
 * ═══════════════════════════════════════════════════════════
 */

/**
 * GET /intelligence/credit-score/improvement-plan
 * Get personalized credit score improvement plan
 */
export const getCreditScoreImprovementPlan = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    // Mock payment history for now (should be fetched from database)
    const paymentHistory: any[] = [];
    
    const plan = await creditScorePlannerService.generateImprovementPlan(
      userId,
      paymentHistory
    );
    
    res.json(plan);
  } catch (error) {
    logger.error("Error generating credit score plan:", error);
    res.status(500).json({ error: "Failed to generate improvement plan" });
  }
};

/**
 * GET /intelligence/payment-priority
 * Get payment priority for all credit cards
 */
export const getPaymentPriority = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    const priority = await paymentPriorityService.generatePaymentPriority(userId);
    
    res.json(priority);
  } catch (error) {
    logger.error("Error generating payment priority:", error);
    res.status(500).json({ error: "Failed to generate payment priority" });
  }
};

/**
 * POST /intelligence/cash-flow/analyze
 * Analyze cash flow feasibility
 * 
 * Body: { monthlyIncome, fixedExpenses, variableExpenses }
 */
export const analyzeCashFlow = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { monthlyIncome, fixedExpenses, variableExpenses } = req.body;
    
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    if (!monthlyIncome || fixedExpenses === undefined || variableExpenses === undefined) {
      return res.status(400).json({
        error: "monthlyIncome, fixedExpenses, and variableExpenses are required"
      });
    }
    
    const analysis = await cashFlowAnalysisService.analyzeCashFlow(
      userId,
      monthlyIncome,
      fixedExpenses,
      variableExpenses
    );
    
    // Add summary
    const summary = cashFlowAnalysisService.generateCashFlowSummary(analysis);
    
    res.json({
      ...analysis,
      summary
    });
  } catch (error) {
    logger.error("Error analyzing cash flow:", error);
    res.status(500).json({ error: "Failed to analyze cash flow" });
  }
};

/**
 * POST /intelligence/recovery-plan
 * Get recovery plan when shortfall exists
 * 
 * Body: { monthlyIncome, fixedExpenses, variableExpenses }
 */
export const getRecoveryPlan = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { monthlyIncome, fixedExpenses, variableExpenses } = req.body;
    
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    if (!monthlyIncome || fixedExpenses === undefined || variableExpenses === undefined) {
      return res.status(400).json({
        error: "monthlyIncome, fixedExpenses, and variableExpenses are required"
      });
    }
    
    // First analyze cash flow
    const cashFlowAnalysis = await cashFlowAnalysisService.analyzeCashFlow(
      userId,
      monthlyIncome,
      fixedExpenses,
      variableExpenses
    );
    
    // Then generate recovery plan
    const recoveryPlan = await recoveryPlannerService.generateRecoveryPlan(
      cashFlowAnalysis
    );
    
    res.json(recoveryPlan);
  } catch (error) {
    logger.error("Error generating recovery plan:", error);
    res.status(500).json({ error: "Failed to generate recovery plan" });
  }
};
