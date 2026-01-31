/**
 * Intelligence Module - Type Definitions
 * 
 * Centralized types for all ML/intelligence features.
 * Keeps type definitions separate from implementation for clarity.
 */

/**
 * Spending Profile - Aggregated historical behavior per card
 */
export interface SpendingProfile {
  creditCardId: string;
  userId: string;
  
  // Temporal patterns
  averageMonthlySpend: number;
  averageDailySpend: number;
  averageWeeklySpend: number;
  
  // Peak patterns
  peakSpendingDays: number[]; // Days of month (1-31) with highest spend
  peakSpendingDayOfWeek: number; // 0=Sunday, 6=Saturday
  
  // Category distribution (merchant-based heuristics)
  categoryBreakdown: {
    category: string;
    totalSpent: number;
    transactionCount: number;
    percentageOfTotal: number;
  }[];
  
  // Volatility measures
  standardDeviationDaily: number;
  coefficientOfVariation: number; // StdDev / Mean (measures spending volatility)
  
  // Data quality
  dataPoints: number; // Number of transactions analyzed
  periodCovered: {
    startDate: Date;
    endDate: Date;
    monthsCovered: number;
  };
  
  lastUpdated: Date;
}

/**
 * Overspending Prediction Result
 */
export interface OverspendingPrediction {
  creditCardId: string;
  userId: string;
  month: string; // YYYY-MM
  
  // Prediction metrics
  probabilityOfBreach: number; // 0-1
  expectedMonthEndSpend: number;
  monthlyLimit: number;
  currentSpend: number;
  
  // Risk categorization
  riskLevel: "low" | "medium" | "high" | "critical";
  
  // Trajectory
  daysElapsed: number;
  daysRemaining: number;
  currentDailyAverage: number;
  projectedDailyAverage: number;
  
  // Confidence
  confidenceScore: number; // 0-1 (based on data quality)
  
  // Explainability
  explanation: string;
  factors: {
    factor: string;
    impact: "positive" | "negative";
    description: string;
  }[];
  
  generatedAt: Date;
}

/**
 * Credit Utilization Analysis
 */
export interface UtilizationAnalysis {
  creditCardId: string;
  userId: string;
  
  // Current state
  currentBalance: number;
  creditLimit: number;
  utilizationPercent: number;
  
  // Risk assessment
  riskCategory: "healthy" | "moderate" | "risky" | "critical";
  
  // Trends (comparing to previous periods)
  trend: "improving" | "stable" | "worsening";
  changeFromLastMonth: number; // Percentage points
  
  // Historical context
  averageUtilization: number; // Last 6 months
  peakUtilization: number;
  lowestUtilization: number;
  
  // Recommendations
  recommendation: string;
  actionRequired: boolean;
  
  analyzedAt: Date;
}

/**
 * Anomaly Detection Result
 */
export interface AnomalyDetection {
  transactionId: string;
  creditCardId: string;
  userId: string;
  
  // Transaction details
  amount: number;
  merchantName: string;
  category: string;
  transactionDate: Date;
  
  // Anomaly metrics
  isAnomaly: boolean;
  anomalyScore: number; // 0-1 (higher = more anomalous)
  anomalyType: "amount" | "category" | "frequency" | "merchant" | "multiple";
  
  // Statistical context
  expectedRange: {
    min: number;
    max: number;
    mean: number;
    stdDev: number;
  };
  
  deviationFromMean: number; // In standard deviations (Z-score)
  
  // Severity
  severity: "low" | "medium" | "high";
  
  // Explainability
  explanation: string;
  comparisonBaseline: string; // e.g., "30-day rolling average"
  
  detectedAt: Date;
}

/**
 * Intelligence Insights - Aggregated view of all intelligence modules
 */
export interface IntelligenceInsights {
  creditCardId: string;
  userId: string;
  
  // Component insights
  spendingProfile?: SpendingProfile;
  overspendingPrediction?: OverspendingPrediction;
  utilizationAnalysis?: UtilizationAnalysis;
  recentAnomalies: AnomalyDetection[];
  
  // Overall health score
  healthScore: number; // 0-100 (100 = excellent financial health)
  
  // Actionable alerts
  activeAlerts: {
    type: "overspending_risk" | "high_utilization" | "anomaly_detected" | "limit_breach";
    severity: "info" | "warning" | "critical";
    message: string;
    actionable: boolean;
  }[];
  
  generatedAt: Date;
}

/**
 * Configuration for intelligence thresholds
 */
export interface IntelligenceConfig {
  userId: string;
  creditCardId?: string; // If null, applies to all cards
  
  // Overspending prediction
  overspendingAlertThreshold: number; // Probability threshold (default: 0.75)
  
  // Utilization alerts
  utilizationWarningThreshold: number; // Percent (default: 50)
  utilizationCriticalThreshold: number; // Percent (default: 75)
  
  // Anomaly detection
  anomalyZScoreThreshold: number; // Standard deviations (default: 2.5)
  anomalySensitivity: "low" | "medium" | "high"; // Affects detection aggressiveness
  
  // Analysis frequency
  profileUpdateFrequency: "realtime" | "daily" | "weekly"; // How often to recalculate profiles
  
  // Feature flags
  enableOverspendingPrediction: boolean;
  enableAnomalyDetection: boolean;
  enableProactiveAlerts: boolean;
  
  createdAt: Date;
  updatedAt: Date;
}
