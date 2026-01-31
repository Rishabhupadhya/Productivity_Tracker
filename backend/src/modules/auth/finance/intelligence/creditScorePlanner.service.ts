/**
 * MODULE 1: Credit Score Improvement Planner
 * 
 * Generates personalized, actionable steps to improve credit score
 * based on actual user behavior — NOT generic tips.
 */

import { Types } from "mongoose";
import type { 
  CreditScoreImprovementPlan, 
  CreditScoreAction,
  PaymentHistoryEntry 
} from "./creditScoreTypes";
import { CreditCard } from "../creditCard.model";
import { Transaction } from "../transaction.model";

class CreditScorePlannerService {
  
  /**
   * Generate a personalized credit score improvement plan
   */
  async generateImprovementPlan(
    userId: string,
    paymentHistory: PaymentHistoryEntry[]
  ): Promise<CreditScoreImprovementPlan> {
    
    // Fetch all user's credit cards
    const cards = await CreditCard.find({ 
      userId: new Types.ObjectId(userId),
      isActive: true 
    });

    console.log(`[CreditScorePlanner] Found ${cards.length} active cards for user ${userId}`);

    if (cards.length === 0) {
      // Check if user has any cards at all
      const allCards = await CreditCard.find({ 
        userId: new Types.ObjectId(userId)
      });
      console.log(`[CreditScorePlanner] User has ${allCards.length} total cards (active or inactive)`);
      throw new Error("No active credit cards found. Please add credit cards first.");
    }

    // Analyze factors hurting the score
    const hurtingFactors: string[] = [];
    const actions: CreditScoreAction[] = [];
    let priority = 1;

    // FACTOR 1: Credit Utilization
    const utilizationActions = await this.analyzeUtilization(cards, priority);
    if (utilizationActions.length > 0) {
      hurtingFactors.push("High Credit Utilization");
      actions.push(...utilizationActions);
      priority += utilizationActions.length;
    }

    // FACTOR 2: Payment History
    const paymentActions = this.analyzePaymentHistory(cards, paymentHistory, priority);
    if (paymentActions.length > 0) {
      hurtingFactors.push("Missed or Delayed Payments");
      actions.push(...paymentActions);
      priority += paymentActions.length;
    }

    // FACTOR 3: Credit Inquiries / New Applications
    const inquiryAction = this.analyzeNewCredit(cards, priority);
    if (inquiryAction) {
      hurtingFactors.push("Recent Credit Applications");
      actions.push(inquiryAction);
      priority++;
    }

    // Sort actions by priority
    actions.sort((a, b) => a.priority - b.priority);

    // Generate overall recommendation
    const overallRecommendation = this.generateOverallRecommendation(
      hurtingFactors,
      actions
    );

    return {
      userId,
      topHurtingFactors: hurtingFactors.slice(0, 3),
      actions: actions.slice(0, 5), // Top 5 actions
      overallRecommendation,
      generatedAt: new Date()
    };
  }

  /**
   * FACTOR 1: Analyze credit utilization across all cards
   */
  private async analyzeUtilization(
    cards: any[],
    startPriority: number
  ): Promise<CreditScoreAction[]> {
    
    const actions: CreditScoreAction[] = [];
    let currentPriority = startPriority;

    for (const card of cards) {
      const utilization = (card.outstandingAmount / card.creditLimit) * 100;

      // High utilization: > 50%
      if (utilization > 50) {
        const targetUtilization = 30; // Ideal target
        const targetBalance = (card.creditLimit * targetUtilization) / 100;
        const amountToPayDown = card.outstandingAmount - targetBalance;

        // Calculate deadline: 30 days from now or next billing cycle
        const deadline = new Date();
        deadline.setDate(deadline.getDate() + 30);

        actions.push({
          factor: "High Credit Utilization",
          reason: `${card.cardName} utilization is at ${utilization.toFixed(1)}%, which significantly impacts credit score`,
          action: `Pay down ₹${amountToPayDown.toFixed(0)} to reduce utilization below 30%`,
          amount: amountToPayDown,
          deadline,
          estimatedImpact: utilization > 70 ? "high" : "medium",
          priority: currentPriority++
        });
      }
    }

    // Overall utilization check
    const totalOutstanding = cards.reduce((sum, c) => sum + c.outstandingAmount, 0);
    const totalLimit = cards.reduce((sum, c) => sum + c.creditLimit, 0);
    const overallUtilization = (totalOutstanding / totalLimit) * 100;

    if (overallUtilization > 30 && actions.length === 0) {
      actions.push({
        factor: "Overall Credit Utilization",
        reason: `Total utilization across all cards is ${overallUtilization.toFixed(1)}%`,
        action: "Distribute spending more evenly across cards or pay down balances",
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        estimatedImpact: "medium",
        priority: currentPriority++
      });
    }

    return actions;
  }

  /**
   * FACTOR 2: Analyze payment history
   */
  private analyzePaymentHistory(
    cards: any[],
    paymentHistory: PaymentHistoryEntry[],
    startPriority: number
  ): CreditScoreAction[] {
    
    const actions: CreditScoreAction[] = [];
    let currentPriority = startPriority;

    // Check for missed/late payments in last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const recentHistory = paymentHistory.filter(
      (entry) => new Date(entry.dueDate) >= sixMonthsAgo
    );

    const latePayments = recentHistory.filter((entry) => !entry.paidOnTime);

    if (latePayments.length > 0) {
      // Find the card with most late payments
      const cardLateCounts = new Map<string, number>();
      latePayments.forEach((entry) => {
        const count = cardLateCounts.get(entry.creditCardId) || 0;
        cardLateCounts.set(entry.creditCardId, count + 1);
      });

      const worstCardId = Array.from(cardLateCounts.entries())
        .sort((a, b) => b[1] - a[1])[0][0];

      const worstCard = cards.find((c) => c._id.toString() === worstCardId);

      if (worstCard) {
        actions.push({
          factor: "Missed or Delayed Payments",
          reason: `${latePayments.length} late payment(s) detected in the last 6 months`,
          action: `Set up autopay for minimum due on ${worstCard.cardName} to avoid future delays`,
          deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          estimatedImpact: "high",
          priority: currentPriority++
        });
      }
    }

    // Check for cards with approaching due dates
    const today = new Date();
    const upcomingDue = cards.filter((card) => {
      const daysUntilDue = this.calculateDaysUntilDue(card.dueDateDay);
      return daysUntilDue <= 7 && daysUntilDue >= 0;
    });

    if (upcomingDue.length > 0) {
      upcomingDue.forEach((card) => {
        const daysUntilDue = this.calculateDaysUntilDue(card.dueDateDay);
        const dueDate = new Date(today);
        dueDate.setDate(today.getDate() + daysUntilDue);

        actions.push({
          factor: "Upcoming Payment Deadline",
          reason: `${card.cardName} payment due in ${daysUntilDue} day(s)`,
          action: `Ensure minimum due is paid to maintain perfect payment history`,
          deadline: dueDate,
          estimatedImpact: "high",
          priority: currentPriority++
        });
      });
    }

    return actions;
  }

  /**
   * FACTOR 3: Analyze new credit applications
   */
  private analyzeNewCredit(
    cards: any[],
    priority: number
  ): CreditScoreAction | null {
    
    // Check if any cards were added in the last 3 months
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const recentCards = cards.filter(
      (card) => new Date(card.createdAt) >= threeMonthsAgo
    );

    if (recentCards.length > 0) {
      return {
        factor: "Recent Credit Applications",
        reason: `${recentCards.length} new card(s) added in the last 3 months`,
        action: "Avoid applying for new credit cards for the next 6 months to stabilize credit age",
        deadline: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 6 months
        estimatedImpact: "low",
        priority
      };
    }

    return null;
  }

  /**
   * Generate overall recommendation summary
   */
  private generateOverallRecommendation(
    hurtingFactors: string[],
    actions: CreditScoreAction[]
  ): string {
    
    if (actions.length === 0) {
      return "Your credit profile looks healthy! Continue maintaining low utilization and on-time payments.";
    }

    const highImpactActions = actions.filter((a) => a.estimatedImpact === "high").length;

    let recommendation = `Focus on ${actions.length} action(s) to improve your credit score. `;

    if (highImpactActions > 0) {
      recommendation += `${highImpactActions} high-impact action(s) identified. `;
    }

    if (hurtingFactors.includes("High Credit Utilization")) {
      recommendation += "Prioritize paying down high-utilization cards. ";
    }

    if (hurtingFactors.includes("Missed or Delayed Payments")) {
      recommendation += "Set up autopay to avoid future late payments. ";
    }

    return recommendation.trim();
  }

  /**
   * Helper: Calculate days until due date
   */
  private calculateDaysUntilDue(dueDateDay: number): number {
    const today = new Date();
    const currentDay = today.getDate();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    let dueDate = new Date(currentYear, currentMonth, dueDateDay);

    // If due date has passed this month, use next month
    if (dueDateDay < currentDay) {
      dueDate.setMonth(currentMonth + 1);
    }

    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  }
}

export default new CreditScorePlannerService();
