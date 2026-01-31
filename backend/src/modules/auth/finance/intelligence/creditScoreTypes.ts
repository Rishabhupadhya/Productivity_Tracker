/**
 * Credit Score Improvement & Payment Priority - Type Definitions
 * 
 * Types for the new credit score enhancement modules
 */

/**
 * MODULE 1: Credit Score Improvement Action
 */
export interface CreditScoreAction {
  factor: string; // e.g., "High Credit Utilization", "Missed Payments"
  reason: string; // Why this is hurting the score
  action: string; // What to do
  amount?: number; // How much to pay/reduce (if applicable)
  deadline: Date; // By when
  estimatedImpact: "low" | "medium" | "high"; // Expected score impact
  priority: number; // 1 = highest priority
}

export interface CreditScoreImprovementPlan {
  userId: string;
  currentScoreEstimate?: number; // Optional if we calculate it
  topHurtingFactors: string[]; // Top 3 factors hurting score
  actions: CreditScoreAction[];
  overallRecommendation: string;
  generatedAt: Date;
}

/**
 * MODULE 2: Payment Priority
 */
export interface PaymentPriorityItem {
  creditCardId: string;
  cardName: string;
  priority: number; // 1 = pay first
  minimumDue: number;
  totalOutstanding: number;
  dueDate: Date;
  daysUntilDue: number;
  utilizationPercent: number;
  
  // Risk factors
  riskFactors: {
    factor: string; // e.g., "Due in 2 days", "Utilization > 50%"
    severity: "low" | "medium" | "high" | "critical";
  }[];
  
  explanation: string; // Why this card has this priority
}

export interface PaymentPriorityPlan {
  userId: string;
  totalMinimumDueAcrossCards: number;
  totalOutstandingAcrossCards: number;
  paymentOrder: PaymentPriorityItem[];
  generatedAt: Date;
}

/**
 * MODULE 3: Cash Flow Analysis
 */
export interface CashFlowAnalysis {
  userId: string;
  
  // Income
  monthlyIncome: number;
  
  // Expenses
  fixedExpenses: number;
  variableExpenses: number;
  totalExpenses: number;
  
  // Available cash
  availableCash: number; // Income - Expenses
  
  // Required payments
  requiredPayments: {
    creditCardId: string;
    cardName: string;
    minimumDue: number;
    dueDate: Date;
  }[];
  
  totalRequiredPayments: number;
  
  // Shortfall analysis
  isFeasible: boolean;
  shortfallAmount: number; // 0 if feasible, > 0 if shortfall
  earliestPaymentDate?: Date; // Earliest due date requiring payment
  cardsAtRisk: string[]; // Card IDs that will go overdue
  
  generatedAt: Date;
}

/**
 * MODULE 4: Recovery Suggestions
 */
export interface RecoverySuggestion {
  type: "partial_payment" | "minimum_only" | "expense_reduction" | "income_awareness";
  description: string;
  impact: string; // What happens if user follows this
  amountInvolved?: number;
  cardsAffected?: string[];
  priority: number; // 1 = try this first
}

export interface RecoveryPlan {
  userId: string;
  shortfallAmount: number;
  suggestions: RecoverySuggestion[];
  
  // Scenario comparison
  scenarios: {
    name: string; // e.g., "Pay All Full", "Pay Minimums Only", "Partial Payments"
    totalPayment: number;
    shortfallReduction: number;
    creditScoreImpact: "protected" | "minor_impact" | "major_impact";
    explanation: string;
  }[];
  
  generatedAt: Date;
}

/**
 * Payment History Entry (for credit score calculation)
 */
export interface PaymentHistoryEntry {
  creditCardId: string;
  dueDate: Date;
  minimumDue: number;
  amountPaid: number;
  paidOnTime: boolean;
  daysLate?: number;
}
