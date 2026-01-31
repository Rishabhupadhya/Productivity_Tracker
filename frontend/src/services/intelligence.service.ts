/**
 * Intelligence Service
 * API calls for ML-driven insights
 */

import { api } from './api';

export interface SpendingProfile {
  averageMonthlySpend: number;
  averageDailySpend: number;
  averageWeeklySpend: number;
  peakSpendingDays: number[];
  peakSpendingDayOfWeek: number;
  categoryBreakdown: Record<string, { amount: number; percentage: number }>;
  standardDeviationDaily: number;
  coefficientOfVariation: number;
  dataPoints: number;
  periodCovered: number;
  lastUpdated: string;
}

export interface OverspendingPrediction {
  creditCardId: string;
  userId: string;
  month: string;
  probabilityOfBreach: number;
  expectedMonthEndSpend: number;
  monthlyLimit: number;
  currentSpend: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  daysElapsed: number;
  daysRemaining: number;
  currentDailyAverage: number;
  projectedDailyAverage: number;
  confidenceScore: number;
  explanation: string;
  factors: Array<{
    factor: string;
    impact: 'positive' | 'negative';
    description: string;
  }>;
  generatedAt: string;
}

export interface UtilizationAnalysis {
  creditCardId: string;
  userId: string;
  month: string;
  currentBalance: number;
  creditLimit: number;
  utilizationPercent: number;
  riskCategory: 'healthy' | 'moderate' | 'risky' | 'critical';
  trend: 'improving' | 'stable' | 'worsening';
  averageUtilization: number;
  peakUtilization: number;
  lowestUtilization: number;
  recommendation: string;
  actionRequired: boolean;
  generatedAt: string;
}

export interface AnomalyDetection {
  transaction: {
    transactionId: string;
    amount: number;
    merchantName: string;
    category: string;
    date: string;
  };
  isAnomaly: boolean;
  anomalyScore: number;
  anomalyType: ('amount' | 'category' | 'velocity' | 'time')[];
  expectedRange: {
    min: number;
    max: number;
    mean: number;
    stdDev: number;
  };
  deviationFromMean: number;
  severity: 'low' | 'medium' | 'high';
  explanation: string;
  comparisonBaseline: string;
  detectedAt: string;
}

export interface IntelligenceAlert {
  type: 'overspending_risk' | 'high_utilization' | 'anomaly_detected' | 'budget_concern';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  actionable: boolean;
  createdAt: string;
}

export interface IntelligenceInsights {
  creditCardId: string;
  userId: string;
  spendingProfile: SpendingProfile;
  prediction?: OverspendingPrediction;
  utilization?: UtilizationAnalysis;
  anomalies?: AnomalyDetection[];
  healthScore: number;
  activeAlerts: IntelligenceAlert[];
  generatedAt: string;
}

export interface IntelligenceDashboard {
  totalCards: number;
  averageHealthScore: number;
  totalAlerts: number;
  criticalAlerts: number;
  cardsAtRisk: number;
  totalAnomalies: number;
  overallUtilization: number;
}

export interface IntelligenceConfig {
  userId: string;
  creditCardId?: string;
  overspendingAlertThreshold: number;
  utilizationWarningThreshold: number;
  utilizationCriticalThreshold: number;
  anomalyZScoreThreshold: number;
  anomalySensitivity: 'low' | 'medium' | 'high';
  enableOverspendingPrediction: boolean;
  enableAnomalyDetection: boolean;
  enableProactiveAlerts: boolean;
  profileUpdateFrequency: 'realtime' | 'daily' | 'weekly';
}

/**
 * Credit Score Improvement Types
 */
export interface CreditScoreAction {
  factor: string;
  reason: string;
  action: string;
  amount?: number;
  deadline: string;
  estimatedImpact: 'low' | 'medium' | 'high';
  priority: number;
}

export interface CreditScoreImprovementPlan {
  userId: string;
  currentScoreEstimate?: number;
  topHurtingFactors: string[];
  actions: CreditScoreAction[];
  overallRecommendation: string;
  generatedAt: string;
}

export interface PaymentPriorityItem {
  creditCardId: string;
  cardName: string;
  priority: number;
  minimumDue: number;
  totalOutstanding: number;
  dueDate: string;
  daysUntilDue: number;
  utilizationPercent: number;
  riskFactors: {
    factor: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }[];
  explanation: string;
}

export interface PaymentPriorityPlan {
  userId: string;
  totalMinimumDueAcrossCards: number;
  totalOutstandingAcrossCards: number;
  paymentOrder: PaymentPriorityItem[];
  generatedAt: string;
}

export interface CashFlowAnalysis {
  userId: string;
  monthlyIncome: number;
  fixedExpenses: number;
  variableExpenses: number;
  totalExpenses: number;
  availableCash: number;
  requiredPayments: {
    creditCardId: string;
    cardName: string;
    minimumDue: number;
    dueDate: string;
  }[];
  totalRequiredPayments: number;
  isFeasible: boolean;
  shortfallAmount: number;
  earliestPaymentDate?: string;
  cardsAtRisk: string[];
  generatedAt: string;
  summary?: string;
}

export interface RecoverySuggestion {
  type: 'partial_payment' | 'minimum_only' | 'expense_reduction' | 'income_awareness';
  description: string;
  impact: string;
  amountInvolved?: number;
  cardsAffected?: string[];
  priority: number;
}

export interface RecoveryPlan {
  userId: string;
  shortfallAmount: number;
  suggestions: RecoverySuggestion[];
  scenarios: {
    name: string;
    totalPayment: number;
    shortfallReduction: number;
    creditScoreImpact: 'protected' | 'minor_impact' | 'major_impact';
    explanation: string;
  }[];
  generatedAt: string;
}

class IntelligenceService {
  /**
   * Get comprehensive insights for a card
   */
  async getCardInsights(cardId: string): Promise<IntelligenceInsights> {
    const response = await api.get(`/finance/intelligence/insights/${cardId}`);
    return response.data;
  }

  /**
   * Get insights for all user cards
   */
  async getAllInsights(): Promise<IntelligenceInsights[]> {
    const response = await api.get('/finance/intelligence/insights');
    return response.data;
  }

  /**
   * Get aggregated dashboard
   */
  async getDashboard(): Promise<IntelligenceDashboard> {
    const response = await api.get('/finance/intelligence/dashboard');
    return response.data;
  }

  /**
   * Get spending profile
   */
  async getSpendingProfile(cardId: string, months: number = 6): Promise<SpendingProfile> {
    const response = await api.get(`/finance/intelligence/profile/${cardId}`, {
      params: { months }
    });
    return response.data;
  }

  /**
   * Get overspending prediction
   */
  async getOverspendingPrediction(cardId: string): Promise<OverspendingPrediction> {
    const response = await api.get(`/finance/intelligence/prediction/${cardId}`);
    return response.data;
  }

  /**
   * Get utilization analysis
   */
  async getUtilizationAnalysis(cardId: string): Promise<UtilizationAnalysis> {
    const response = await api.get(`/finance/intelligence/utilization/${cardId}`);
    return response.data;
  }

  /**
   * Get utilization summary across all cards
   */
  async getUtilizationSummary() {
    const response = await api.get('/finance/intelligence/utilization/summary');
    return response.data;
  }

  /**
   * Get anomalies for a card
   */
  async getCardAnomalies(cardId: string, days: number = 30): Promise<AnomalyDetection[]> {
    const response = await api.get(`/finance/intelligence/anomalies/${cardId}`, {
      params: { days }
    });
    return response.data;
  }

  /**
   * Get anomaly statistics
   */
  async getAnomalyStats(cardId: string, days: number = 90) {
    const response = await api.get(`/finance/intelligence/anomalies/${cardId}/stats`, {
      params: { days }
    });
    return response.data;
  }

  /**
   * Get intelligence configuration
   */
  async getConfig(cardId?: string): Promise<IntelligenceConfig> {
    const response = await api.get('/finance/intelligence/config', {
      params: cardId ? { cardId } : {}
    });
    return response.data;
  }

  /**
   * Update intelligence configuration
   */
  async updateConfig(config: Partial<IntelligenceConfig>): Promise<IntelligenceConfig> {
    const response = await api.put('/finance/intelligence/config', config);
    return response.data;
  }

  /**
   * ═══════════════════════════════════════════════════════════
   * CREDIT SCORE & PAYMENT PRIORITY APIs
   * ═══════════════════════════════════════════════════════════
   */

  /**
   * Get credit score improvement plan
   */
  async getCreditScoreImprovementPlan(): Promise<CreditScoreImprovementPlan> {
    const response = await api.get('/finance/intelligence/credit-score/improvement-plan');
    return response.data;
  }

  /**
   * Get payment priority order
   */
  async getPaymentPriority(): Promise<PaymentPriorityPlan> {
    const response = await api.get('/finance/intelligence/payment-priority');
    return response.data;
  }

  /**
   * Analyze cash flow feasibility
   */
  async analyzeCashFlow(
    monthlyIncome: number,
    fixedExpenses: number,
    variableExpenses: number
  ): Promise<CashFlowAnalysis> {
    const response = await api.post('/finance/intelligence/cash-flow/analyze', {
      monthlyIncome,
      fixedExpenses,
      variableExpenses
    });
    return response.data;
  }

  /**
   * Get recovery plan for shortfall
   */
  async getRecoveryPlan(
    monthlyIncome: number,
    fixedExpenses: number,
    variableExpenses: number
  ): Promise<RecoveryPlan> {
    const response = await api.post('/finance/intelligence/recovery-plan', {
      monthlyIncome,
      fixedExpenses,
      variableExpenses
    });
    return response.data;
  }
}

export default new IntelligenceService();
