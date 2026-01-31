# Credit Score Improvement & Payment Priority - Testing Guide

## Overview

This guide demonstrates the **4 new intelligence modules**:

1. **Credit Score Improvement Planner** - Personalized actionable steps
2. **Payment Priority Engine** - Which cards to pay first
3. **Cash Flow Feasibility Check** - Income vs payment analysis
4. **Recovery Planner** - What-if scenarios when shortfall exists

---

## Prerequisites

- Backend server running on `http://localhost:5001`
- Valid JWT token (login first)
- At least 2 active credit cards with different parameters
- Sample transactions for realistic analysis

---

## Setup Test Data

### 1. Create Test Credit Cards

```bash
# Card 1: HDFC Regalia (High utilization, due soon)
curl -X POST http://localhost:5001/api/finance/credit-cards \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "cardName": "HDFC Regalia",
    "bankName": "HDFC Bank",
    "last4Digits": "1234",
    "creditLimit": 100000,
    "outstandingAmount": 72000,
    "monthlyLimit": 40000,
    "billingCycleStartDay": 1,
    "dueDateDay": 5,
    "interestRate": 42
  }'

# Card 2: ICICI Amazon Pay (Moderate utilization, due later)
curl -X POST http://localhost:5001/api/finance/credit-cards \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "cardName": "ICICI Amazon Pay",
    "bankName": "ICICI Bank",
    "last4Digits": "5678",
    "creditLimit": 80000,
    "outstandingAmount": 45000,
    "monthlyLimit": 35000,
    "billingCycleStartDay": 10,
    "dueDateDay": 15,
    "interestRate": 36
  }'

# Card 3: Axis Flipkart (Low utilization, due far)
curl -X POST http://localhost:5001/api/finance/credit-cards \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "cardName": "Axis Flipkart",
    "bankName": "Axis Bank",
    "last4Digits": "9012",
    "creditLimit": 60000,
    "outstandingAmount": 15000,
    "monthlyLimit": 25000,
    "billingCycleStartDay": 20,
    "dueDateDay": 25,
    "interestRate": 39
  }'
```

### 2. Verify Cards Created

```bash
curl -X GET http://localhost:5001/api/finance/credit-cards \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## MODULE 1: Credit Score Improvement Planner

### Test: Get Personalized Improvement Plan

```bash
curl -X GET http://localhost:5001/api/finance/intelligence/credit-score/improvement-plan \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Expected Output

```json
{
  "userId": "USER_ID",
  "topHurtingFactors": [
    "High Credit Utilization",
    "Upcoming Payment Deadline"
  ],
  "actions": [
    {
      "factor": "High Credit Utilization",
      "reason": "HDFC Regalia utilization is at 72.0%, which significantly impacts credit score",
      "action": "Pay down ₹42000 to reduce utilization below 30%",
      "amount": 42000,
      "deadline": "2026-03-02T...",
      "estimatedImpact": "high",
      "priority": 1
    },
    {
      "factor": "Upcoming Payment Deadline",
      "reason": "HDFC Regalia payment due in 3 day(s)",
      "action": "Ensure minimum due is paid to maintain perfect payment history",
      "deadline": "2026-02-05T...",
      "estimatedImpact": "high",
      "priority": 2
    },
    {
      "factor": "High Credit Utilization",
      "reason": "ICICI Amazon Pay utilization is at 56.3%, which significantly impacts credit score",
      "action": "Pay down ₹21200 to reduce utilization below 30%",
      "amount": 21200,
      "deadline": "2026-03-02T...",
      "estimatedImpact": "medium",
      "priority": 3
    }
  ],
  "overallRecommendation": "Focus on 3 action(s) to improve your credit score. 2 high-impact action(s) identified. Prioritize paying down high-utilization cards.",
  "generatedAt": "2026-01-31T..."
}
```

### Key Insights

- **Deterministic Logic**: Every action has a concrete amount, deadline, and expected impact
- **NOT Generic**: "Pay down ₹42,000" not "Pay off some debt"
- **Priority Ordered**: Most critical actions first
- **Explainable**: Clear reason for each recommendation

---

## MODULE 2: Payment Priority Engine

### Test: Get Payment Priority Order

```bash
curl -X GET http://localhost:5001/api/finance/intelligence/payment-priority \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Expected Output

```json
{
  "userId": "USER_ID",
  "totalMinimumDueAcrossCards": 6600,
  "totalOutstandingAcrossCards": 132000,
  "paymentOrder": [
    {
      "creditCardId": "CARD_1_ID",
      "cardName": "HDFC Regalia",
      "priority": 1,
      "minimumDue": 3600,
      "totalOutstanding": 72000,
      "dueDate": "2026-02-05T...",
      "daysUntilDue": 5,
      "utilizationPercent": 72,
      "riskFactors": [
        {
          "factor": "Due in 5 days",
          "severity": "high"
        },
        {
          "factor": "Utilization 72% (Very High)",
          "severity": "critical"
        },
        {
          "factor": "High interest rate: 42%",
          "severity": "medium"
        },
        {
          "factor": "Large outstanding: ₹72000",
          "severity": "medium"
        }
      ],
      "explanation": "🔴 URGENT: HDFC Regalia requires immediate attention. Due in 5 days, Utilization 72% (Very High)."
    },
    {
      "creditCardId": "CARD_2_ID",
      "cardName": "ICICI Amazon Pay",
      "priority": 2,
      "minimumDue": 2250,
      "totalOutstanding": 45000,
      "dueDate": "2026-02-15T...",
      "daysUntilDue": 15,
      "utilizationPercent": 56.25,
      "riskFactors": [
        {
          "factor": "Due in 15 days",
          "severity": "low"
        },
        {
          "factor": "Utilization 56% (High)",
          "severity": "high"
        },
        {
          "factor": "Large outstanding: ₹45000",
          "severity": "medium"
        }
      ],
      "explanation": "🟠 HIGH PRIORITY: ICICI Amazon Pay should be paid soon. Utilization 56% (High)."
    },
    {
      "creditCardId": "CARD_3_ID",
      "cardName": "Axis Flipkart",
      "priority": 3,
      "minimumDue": 750,
      "totalOutstanding": 15000,
      "dueDate": "2026-02-25T...",
      "daysUntilDue": 25,
      "utilizationPercent": 25,
      "riskFactors": [
        {
          "factor": "Due in 25 days",
          "severity": "low"
        },
        {
          "factor": "High interest rate: 39%",
          "severity": "medium"
        }
      ],
      "explanation": "🟢 LOW PRIORITY: Axis Flipkart payment is not urgent (25 days remaining)."
    }
  ],
  "generatedAt": "2026-01-31T..."
}
```

### Decision Rules Applied

1. **Days until due** (highest weight)
2. **Utilization > 70%** (critical for credit score)
3. **Utilization > 50%** (high impact)
4. **Interest rate** (secondary)
5. **Outstanding amount** (tertiary)

---

## MODULE 3: Cash Flow Feasibility Check

### Test: Analyze Cash Flow with Sufficient Income

```bash
curl -X POST http://localhost:5001/api/finance/intelligence/cash-flow/analyze \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "monthlyIncome": 120000,
    "fixedExpenses": 45000,
    "variableExpenses": 25000
  }'
```

### Expected Output (Feasible)

```json
{
  "userId": "USER_ID",
  "monthlyIncome": 120000,
  "fixedExpenses": 45000,
  "variableExpenses": 25000,
  "totalExpenses": 70000,
  "availableCash": 50000,
  "requiredPayments": [
    {
      "creditCardId": "CARD_1_ID",
      "cardName": "HDFC Regalia",
      "minimumDue": 3600,
      "dueDate": "2026-02-05T..."
    },
    {
      "creditCardId": "CARD_2_ID",
      "cardName": "ICICI Amazon Pay",
      "minimumDue": 2250,
      "dueDate": "2026-02-15T..."
    },
    {
      "creditCardId": "CARD_3_ID",
      "cardName": "Axis Flipkart",
      "minimumDue": 750,
      "dueDate": "2026-02-25T..."
    }
  ],
  "totalRequiredPayments": 6600,
  "isFeasible": true,
  "shortfallAmount": 0,
  "earliestPaymentDate": "2026-02-05T...",
  "cardsAtRisk": [],
  "generatedAt": "2026-01-31T...",
  "summary": "✅ Cash flow is sufficient. You have ₹43400 surplus after covering all minimum dues."
}
```

### Test: Analyze Cash Flow with Insufficient Income

```bash
curl -X POST http://localhost:5001/api/finance/intelligence/cash-flow/analyze \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "monthlyIncome": 50000,
    "fixedExpenses": 30000,
    "variableExpenses": 15000
  }'
```

### Expected Output (Shortfall)

```json
{
  "userId": "USER_ID",
  "monthlyIncome": 50000,
  "fixedExpenses": 30000,
  "variableExpenses": 15000,
  "totalExpenses": 45000,
  "availableCash": 5000,
  "requiredPayments": [
    {
      "creditCardId": "CARD_1_ID",
      "cardName": "HDFC Regalia",
      "minimumDue": 3600,
      "dueDate": "2026-02-05T..."
    },
    {
      "creditCardId": "CARD_2_ID",
      "cardName": "ICICI Amazon Pay",
      "minimumDue": 2250,
      "dueDate": "2026-02-15T..."
    },
    {
      "creditCardId": "CARD_3_ID",
      "cardName": "Axis Flipkart",
      "minimumDue": 750,
      "dueDate": "2026-02-25T..."
    }
  ],
  "totalRequiredPayments": 6600,
  "isFeasible": false,
  "shortfallAmount": 1600,
  "earliestPaymentDate": "2026-02-05T...",
  "cardsAtRisk": ["ICICI Amazon Pay", "Axis Flipkart"],
  "generatedAt": "2026-01-31T...",
  "summary": "⚠️ You need an additional ₹1600 by 5 Feb to avoid missing minimum dues. 2 card(s) at risk: ICICI Amazon Pay, Axis Flipkart."
}
```

---

## MODULE 4: Recovery Planner (What-If Scenarios)

### Test: Get Recovery Plan When Shortfall Exists

```bash
curl -X POST http://localhost:5001/api/finance/intelligence/recovery-plan \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "monthlyIncome": 50000,
    "fixedExpenses": 30000,
    "variableExpenses": 15000
  }'
```

### Expected Output

```json
{
  "userId": "USER_ID",
  "shortfallAmount": 1600,
  "suggestions": [
    {
      "type": "minimum_only",
      "description": "Pay only minimum dues on all 3 card(s) to protect credit score",
      "impact": "Reduces immediate cash need to ₹6600. Credit score remains protected. Interest will accrue on remaining balance.",
      "amountInvolved": 6600,
      "cardsAffected": ["HDFC Regalia", "ICICI Amazon Pay", "Axis Flipkart"],
      "priority": 1
    },
    {
      "type": "partial_payment",
      "description": "Pay 1 card(s) with earliest due dates first, defer 2 card(s)",
      "impact": "Prioritizes cards at highest risk. 1 card(s) protected: HDFC Regalia. 2 card(s) will incur late fees: ICICI Amazon Pay, Axis Flipkart.",
      "amountInvolved": 5000,
      "cardsAffected": ["HDFC Regalia", "ICICI Amazon Pay", "Axis Flipkart"],
      "priority": 2
    },
    {
      "type": "expense_reduction",
      "description": "Reduce variable expenses by ₹1600 (11% of current spending)",
      "impact": "Achievable by cutting discretionary spending (dining, entertainment, shopping). Covers shortfall without affecting fixed commitments.",
      "amountInvolved": 1600,
      "priority": 3
    },
    {
      "type": "income_awareness",
      "description": "Income-expense gap: ₹1600 (3.2% of monthly income)",
      "impact": "Consider supplementary income sources, freelancing, or one-time asset liquidation if sustainable. Avoid high-interest loans.",
      "amountInvolved": 1600,
      "priority": 4
    }
  ],
  "scenarios": [
    {
      "name": "Pay All Minimum Dues",
      "totalPayment": 6600,
      "shortfallReduction": 6600,
      "creditScoreImpact": "protected",
      "explanation": "Pay ₹6600 across 3 card(s). Credit score fully protected. Requires ₹1600 additional cash."
    },
    {
      "name": "Pay High-Priority Cards Only",
      "totalPayment": 5850,
      "shortfallReduction": 5850,
      "creditScoreImpact": "minor_impact",
      "explanation": "Pay ₹5850 on 2 card(s) with earliest due dates. Protects most critical cards. 1 card(s) will incur late fees."
    },
    {
      "name": "Defer All Payments",
      "totalPayment": 0,
      "shortfallReduction": 0,
      "creditScoreImpact": "major_impact",
      "explanation": "No payments made. All 3 card(s) will report late payment. Severe credit score damage. Late fees and interest will compound."
    }
  ],
  "generatedAt": "2026-01-31T..."
}
```

### Key Features

- **NO LOAN SUGGESTIONS**: Focus on payment optimization, not debt
- **Scenario Comparison**: Shows consequences of each choice
- **Actionable**: Specific amounts and trade-offs
- **Priority Ordered**: Try safest options first

---

## Testing Workflow

### Step-by-Step Complete Test

```bash
# 1. Login and get token
TOKEN=$(curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' \
  | jq -r '.token')

# 2. Create test cards (run all 3 curl commands above)

# 3. Check credit score improvement plan
curl -X GET http://localhost:5001/api/finance/intelligence/credit-score/improvement-plan \
  -H "Authorization: Bearer $TOKEN" | jq

# 4. Check payment priority
curl -X GET http://localhost:5001/api/finance/intelligence/payment-priority \
  -H "Authorization: Bearer $TOKEN" | jq

# 5. Analyze cash flow (sufficient income)
curl -X POST http://localhost:5001/api/finance/intelligence/cash-flow/analyze \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"monthlyIncome":120000,"fixedExpenses":45000,"variableExpenses":25000}' | jq

# 6. Analyze cash flow (shortfall scenario)
curl -X POST http://localhost:5001/api/finance/intelligence/cash-flow/analyze \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"monthlyIncome":50000,"fixedExpenses":30000,"variableExpenses":15000}' | jq

# 7. Get recovery plan for shortfall
curl -X POST http://localhost:5001/api/finance/intelligence/recovery-plan \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"monthlyIncome":50000,"fixedExpenses":30000,"variableExpenses":15000}' | jq
```

---

## Edge Cases to Test

### 1. No Credit Cards
```bash
# Should return appropriate error
curl -X GET http://localhost:5001/api/finance/intelligence/payment-priority \
  -H "Authorization: Bearer $TOKEN"
```

### 2. All Payments Feasible
```bash
# Very high income, all green
curl -X POST http://localhost:5001/api/finance/intelligence/cash-flow/analyze \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"monthlyIncome":200000,"fixedExpenses":30000,"variableExpenses":20000}'
```

### 3. Extreme Shortfall
```bash
# Income barely covers expenses
curl -X POST http://localhost:5001/api/finance/intelligence/recovery-plan \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"monthlyIncome":30000,"fixedExpenses":25000,"variableExpenses":8000}'
```

---

## Success Criteria

✅ All endpoints return deterministic, explainable results  
✅ No generic advice — every recommendation has specific numbers  
✅ Priority ordering is consistent and logical  
✅ Shortfall calculations are accurate  
✅ Recovery suggestions avoid loans  
✅ Scenario comparisons show clear trade-offs  

---

## Next Steps

1. **Payment History Tracking**: Add database collection to store payment records
2. **Credit Score Calculation**: Implement actual score computation (300-850)
3. **Auto-Payment Setup**: API to configure autopay for minimum dues
4. **Frontend Dashboard**: Visualize all 4 modules in UI
5. **Notifications**: Alert users when due dates approach or shortfall detected

---

## Documentation Files

- `creditScoreTypes.ts` - Type definitions
- `creditScorePlanner.service.ts` - MODULE 1
- `paymentPriority.service.ts` - MODULE 2
- `cashFlowAnalysis.service.ts` - MODULE 3
- `recoveryPlanner.service.ts` - MODULE 4
- `intelligence.controller.ts` - HTTP handlers
- `intelligence.routes.ts` - API routes

---

**Status**: ✅ All 4 modules fully implemented and testable
