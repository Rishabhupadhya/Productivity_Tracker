/**
 * Intelligence API Routes
 * 
 * Endpoints:
 * - GET    /intelligence/profile/:cardId                - Spending behavior profile
 * - GET    /intelligence/prediction/:cardId             - Overspending prediction
 * - POST   /intelligence/prediction/batch               - Batch predictions
 * - GET    /intelligence/utilization/:cardId            - Utilization analysis
 * - GET    /intelligence/utilization/summary            - Utilization summary (all cards)
 * - GET    /intelligence/anomalies/:cardId              - Card anomalies
 * - GET    /intelligence/anomalies                      - All anomalies
 * - GET    /intelligence/anomalies/:cardId/stats        - Anomaly statistics
 * - POST   /intelligence/anomalies/check                - Check transaction anomaly
 * - GET    /intelligence/insights/:cardId               - Comprehensive insights (card)
 * - GET    /intelligence/insights                       - All insights
 * - GET    /intelligence/dashboard                      - Aggregated dashboard
 * - GET    /intelligence/config                         - Get configuration
 * - PUT    /intelligence/config                         - Update configuration
 * 
 * === CREDIT SCORE & PAYMENT PRIORITY ===
 * - GET    /intelligence/credit-score/improvement-plan  - Credit score improvement plan
 * - GET    /intelligence/payment-priority               - Payment priority engine
 * - POST   /intelligence/cash-flow/analyze              - Cash flow feasibility check
 * - POST   /intelligence/recovery-plan                  - Recovery suggestions
 */

import { Router } from "express";
import { authMiddleware } from "../../../../middleware/auth.middleware";
import {
  getSpendingProfile,
  getOverspendingPrediction,
  getPredictionsBatch,
  getUtilizationAnalysis,
  getUtilizationSummary,
  getCardAnomalies,
  getAnomalyStats,
  checkTransactionAnomaly,
  getAllInsights,
  getIntelligenceDashboard,
  getIntelligenceConfig,
  updateIntelligenceConfig,
  getCreditScoreImprovementPlan,
  getPaymentPriority,
  analyzeCashFlow,
  getRecoveryPlan
} from "./intelligence.controller";

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// === SPENDING PROFILE ===
router.get("/profile/:cardId", getSpendingProfile);

// === OVERSPENDING PREDICTION ===
router.get("/prediction/:cardId", getOverspendingPrediction);
router.post("/prediction/batch", getPredictionsBatch);

// === UTILIZATION ANALYSIS ===
router.get("/utilization/:cardId", getUtilizationAnalysis);
router.get("/utilization/summary", getUtilizationSummary);

// === ANOMALY DETECTION ===
router.get("/anomalies/:cardId", getCardAnomalies);
router.get("/anomalies/:cardId/stats", getAnomalyStats);
router.post("/anomalies/check", checkTransactionAnomaly);

// === COMPREHENSIVE INSIGHTS ===
router.get("/insights", getAllInsights);
router.get("/dashboard", getIntelligenceDashboard);

// === CONFIGURATION ===
router.get("/config", getIntelligenceConfig);
router.put("/config", updateIntelligenceConfig);

// === CREDIT SCORE & PAYMENT PRIORITY ===
router.get("/credit-score/improvement-plan", getCreditScoreImprovementPlan);
router.get("/payment-priority", getPaymentPriority);
router.post("/cash-flow/analyze", analyzeCashFlow);
router.post("/recovery-plan", getRecoveryPlan);

export default router;
