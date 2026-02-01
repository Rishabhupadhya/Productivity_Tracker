/**
 * Intelligence Orchestration Service
 * 
 * Central coordinator for all ML/intelligence modules.
 * Aggregates insights from:
 * 1. Spending Profile
 * 2. Overspending Prediction
 * 3. Utilization Analysis
 * 4. Anomaly Detection
 * 
 * Produces:
 * - Comprehensive IntelligenceInsights
 * - Health score (0-100)
 * - Prioritized alerts
 * - Proactive notifications
 */

import { Types } from "mongoose";
import { CreditCard } from "../creditCard.model";
import { IntelligenceInsights, IntelligenceAlert } from "./intelligence.types";
import { IntelligenceConfig } from "./intelligenceConfig.model";
import { generateSpendingProfile } from "./spendingProfile.service";
import { predictOverspending } from "./overspendingPrediction.service";
import { analyzeUtilization } from "./utilizationAnalysis.service";
import { detectRecentAnomalies } from "./anomalyDetection.service";
import { logger } from "../../../../utils/logger";

/**
 * Calculate overall financial health score (0-100)
 * 
 * Factors:
 * - Utilization (40%): Lower is better
 * - Overspending risk (30%): Lower is better
 * - Anomaly rate (15%): Lower is better
 * - Spending consistency (15%): Lower volatility is better
 */
const calculateHealthScore = (
  utilizationPercent: number,
  overspendingProbability: number,
  anomalyRate: number,
  coefficientOfVariation: number
): number => {
  // Utilization score (0-100, inverted)
  const utilizationScore = Math.max(0, 100 - (utilizationPercent * 1.2));
  
  // Overspending score (0-100, inverted)
  const overspendingScore = Math.max(0, 100 - (overspendingProbability * 100));
  
  // Anomaly score (0-100, inverted, capped at 10% anomaly rate)
  const anomalyScore = Math.max(0, 100 - (Math.min(anomalyRate, 10) * 10));
  
  // Consistency score (0-100, inverted, capped at CoV of 2.0)
  const consistencyScore = Math.max(0, 100 - (Math.min(coefficientOfVariation, 2.0) * 50));
  
  // Weighted average
  const healthScore = 
    (utilizationScore * 0.40) +
    (overspendingScore * 0.30) +
    (anomalyScore * 0.15) +
    (consistencyScore * 0.15);
  
  return Math.round(healthScore);
};

/**
 * Generate alerts based on insights
 */
const generateAlerts = (
  prediction: ReturnType<typeof predictOverspending> extends Promise<infer T> ? T : never,
  utilization: ReturnType<typeof analyzeUtilization> extends Promise<infer T> ? T : never,
  anomalies: Awaited<ReturnType<typeof detectRecentAnomalies>>,
  config: any
): IntelligenceAlert[] => {
  const alerts: IntelligenceAlert[] = [];
  
  // Overspending alert
  if (prediction && prediction.probabilityOfBreach >= config.overspendingAlertThreshold) {
    alerts.push({
      type: "overspending_risk",
      severity: prediction.riskLevel === "critical" ? "critical" : prediction.riskLevel === "high" ? "warning" : "info",
      message: prediction.explanation,
      actionable: true
    });
  }
  
  // Utilization alert
  if (utilization) {
    if (utilization.riskCategory === "critical" && utilization.utilizationPercent >= config.utilizationCriticalThreshold) {
      alerts.push({
        type: "high_utilization",
        severity: "critical",
        message: utilization.recommendation,
        actionable: utilization.actionRequired
      });
    } else if (utilization.riskCategory === "risky" && utilization.utilizationPercent >= config.utilizationWarningThreshold) {
      alerts.push({
        type: "high_utilization",
        severity: "warning",
        message: utilization.recommendation,
        actionable: utilization.actionRequired
      });
    }
  }
  
  // Anomaly alerts (only high severity)
  const highSeverityAnomalies = anomalies.filter(a => a.severity === "high");
  if (highSeverityAnomalies.length > 0) {
    alerts.push({
      type: "anomaly_detected",
      severity: "warning",
      message: `Detected ${highSeverityAnomalies.length} unusual transaction${highSeverityAnomalies.length > 1 ? 's' : ''} in the last 30 days. Review them to ensure they're legitimate.`,
      actionable: true
    });
  }
  
  // Budget health alert
  if (utilization && prediction) {
    if (utilization.trend === "worsening" && prediction.riskLevel !== "low") {
      alerts.push({
        type: "anomaly_detected",
        severity: "warning",
        message: "Your spending is trending upward and you may exceed your budget. Consider reviewing your expenses.",
        actionable: true
      });
    }
  }
  
  // Sort by severity: critical > warning > info
  const severityOrder: Record<string, number> = { critical: 0, warning: 1, info: 2 };
  return alerts.sort((a, b) => (severityOrder[a.severity] || 999) - (severityOrder[b.severity] || 999));
};

/**
 * Generate comprehensive intelligence insights for a credit card
 * 
 * @param userId User ID
 * @param creditCardId Credit card ID
 * @param referenceDate Date for analysis (defaults to now)
 * @returns Complete intelligence insights
 */
export const generateIntelligenceInsights = async (
  userId: string,
  creditCardId: string,
  referenceDate: Date = new Date()
): Promise<IntelligenceInsights | null> => {
  logger.info(`Generating intelligence insights for card ${creditCardId}`);
  
  // Verify card exists
  const card = await CreditCard.findOne({
    _id: new Types.ObjectId(creditCardId),
    userId: new Types.ObjectId(userId),
    isActive: true
  });
  
  if (!card) {
    logger.warn(`Card not found: ${creditCardId}`);
    return null;
  }
  
  // Get user configuration (or use defaults)
  let config = await IntelligenceConfig.findOne({
    userId: new Types.ObjectId(userId),
    $or: [
      { creditCardId: new Types.ObjectId(creditCardId) }, // Card-specific
      { creditCardId: { $exists: false } } // Global
    ]
  });
  
  if (!config) {
    // Create default config
    config = await IntelligenceConfig.create({
      userId: new Types.ObjectId(userId)
    });
    logger.info(`Created default intelligence config for user ${userId}`);
  }
  
  // === RUN ALL INTELLIGENCE MODULES ===
  
  const [profile, prediction, utilization, anomalies] = await Promise.all([
    // Module 1: Spending Profile
    generateSpendingProfile(userId, creditCardId, 6),
    
    // Module 2: Overspending Prediction
    config.enableOverspendingPrediction
      ? predictOverspending(userId, creditCardId, referenceDate)
      : Promise.resolve(null),
    
    // Module 3: Utilization Analysis
    analyzeUtilization(userId, creditCardId, referenceDate),
    
    // Module 4: Anomaly Detection
    config.enableAnomalyDetection
      ? detectRecentAnomalies(userId, creditCardId, 30, config.anomalyZScoreThreshold)
      : Promise.resolve([])
  ]);
  
  // === CALCULATE HEALTH SCORE ===
  
  const healthScore = calculateHealthScore(
    utilization?.utilizationPercent || 0,
    prediction?.probabilityOfBreach || 0,
    anomalies.length > 0 ? (anomalies.length / Math.max(profile.dataPoints, 30)) * 100 : 0,
    profile.coefficientOfVariation || 0
  );
  
  // === GENERATE ALERTS ===
  
  const alerts = config.enableProactiveAlerts
    ? generateAlerts(prediction, utilization, anomalies, config)
    : [];
  
  logger.info(`Generated ${alerts.length} alerts for card ${creditCardId}`);
  
  return {
    creditCardId,
    userId,
    spendingProfile: profile,
    overspendingPrediction: prediction || undefined,
    utilizationAnalysis: utilization || undefined,
    recentAnomalies: anomalies.length > 0 ? anomalies : [],
    healthScore,
    activeAlerts: alerts,
    generatedAt: new Date()
  };
};

/**
 * Generate insights for multiple cards
 */
export const generateInsightsMultipleCards = async (
  userId: string,
  creditCardIds: string[],
  referenceDate: Date = new Date()
): Promise<(IntelligenceInsights | null)[]> => {
  return Promise.all(
    creditCardIds.map(cardId => generateIntelligenceInsights(userId, cardId, referenceDate))
  );
};

/**
 * Generate insights for all user cards
 */
export const generateInsightsAllCards = async (
  userId: string,
  referenceDate: Date = new Date()
): Promise<IntelligenceInsights[]> => {
  const cards = await CreditCard.find({
    userId: new Types.ObjectId(userId),
    isActive: true
  });
  
  const cardIds = cards.map(c => c._id.toString());
  const insights = await generateInsightsMultipleCards(userId, cardIds, referenceDate);
  
  return insights.filter(i => i !== null) as IntelligenceInsights[];
};

/**
 * Get aggregated intelligence summary across all cards
 */
export const getAggregatedIntelligence = async (
  userId: string,
  referenceDate: Date = new Date()
): Promise<{
  totalCards: number;
  averageHealthScore: number;
  totalAlerts: number;
  criticalAlerts: number;
  cardsAtRisk: number;
  totalAnomalies: number;
  overallUtilization: number;
}> => {
  const insights = await generateInsightsAllCards(userId, referenceDate);
  
  const totalAlerts = insights.reduce((sum, i) => sum + i.activeAlerts.length, 0);
  const criticalAlerts = insights.reduce(
    (sum, i) => sum + i.activeAlerts.filter(a => a.severity === "critical").length,
    0
  );
  const cardsAtRisk = insights.filter(
    i => i.utilizationAnalysis && (i.utilizationAnalysis.riskCategory === "risky" || i.utilizationAnalysis.riskCategory === "critical")
  ).length;
  const totalAnomalies = insights.reduce((sum, i) => sum + (i.recentAnomalies?.length || 0), 0);
  
  const avgHealthScore = insights.length > 0
    ? Math.round(insights.reduce((sum, i) => sum + i.healthScore, 0) / insights.length)
    : 0;
  
  // Overall utilization across all cards
  let totalBalance = 0;
  let totalLimit = 0;
  insights.forEach(i => {
    if (i.utilizationAnalysis) {
      totalBalance += i.utilizationAnalysis.currentBalance;
      totalLimit += i.utilizationAnalysis.creditLimit;
    }
  });
  
  const overallUtilization = totalLimit > 0 
    ? Math.round((totalBalance / totalLimit) * 10000) / 100 
    : 0;
  
  return {
    totalCards: insights.length,
    averageHealthScore: avgHealthScore,
    totalAlerts,
    criticalAlerts,
    cardsAtRisk,
    totalAnomalies,
    overallUtilization
  };
};
