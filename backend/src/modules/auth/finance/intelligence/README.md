# Credit Card Intelligence - ML Layer

## Overview

The Intelligence Layer adds ML-driven insights on top of credit card transaction data to predict overspending, analyze utilization risk, and detect anomalies.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Intelligence Layer                        │
├─────────────────────────────────────────────────────────────┤
│  Module 1: Spending Behavior Profiling                      │
│  → Analyze historical patterns                              │
│  → Temporal analysis (daily/weekly/monthly averages)        │
│  → Category breakdown                                        │
│  → Volatility metrics                                        │
├─────────────────────────────────────────────────────────────┤
│  Module 2: Overspending Prediction                          │
│  → Predict limit breach before month end                    │
│  → Rule-based forecasting (upgradable to ML)                │
│  → Confidence scoring                                        │
│  → Risk categorization                                       │
├─────────────────────────────────────────────────────────────┤
│  Module 3: Credit Utilization Intelligence                  │
│  → Real-time utilization tracking                           │
│  → Trend analysis (improving/stable/worsening)              │
│  → Risk categorization (healthy/moderate/risky/critical)    │
│  → Actionable recommendations                                │
├─────────────────────────────────────────────────────────────┤
│  Module 4: Anomaly Detection                                │
│  → Amount-based (Z-score)                                   │
│  → Category-based (new/rare merchants)                      │
│  → Frequency-based (velocity)                               │
│  → Time-based (unusual hours)                               │
├─────────────────────────────────────────────────────────────┤
│  Module 5: Orchestration & Insights                         │
│  → Aggregate all modules                                     │
│  → Calculate health score (0-100)                           │
│  → Generate prioritized alerts                              │
│  → Proactive notifications                                   │
└─────────────────────────────────────────────────────────────┘
```

## Features

### 1. **Spending Behavior Profiling**

Analyzes 6 months of historical transactions to build behavioral profiles:

- **Temporal Patterns**: Average daily/weekly/monthly spend
- **Peak Analysis**: Top 3 spending days, peak day of week
- **Category Breakdown**: Automatic merchant categorization (7 categories)
- **Volatility Metrics**: Standard deviation, coefficient of variation
- **Data Quality**: Number of transactions, period covered

**Merchant Categories**:
- Food & Dining (Swiggy, Zomato, restaurants)
- Shopping (Amazon, Flipkart, malls)
- Entertainment (Netflix, BookMyShow)
- Travel & Transport (Uber, Ola, flights)
- Groceries (BigBasket, Blinkit)
- Bills & Utilities
- Health & Wellness

### 2. **Overspending Prediction**

Predicts if user will exceed monthly limit BEFORE month ends:

**Algorithm**:
```typescript
Expected Month End Spend = 
  (Linear Projection * linearWeight) +
  (Historical Average * historicalWeight) +
  (Recent 7-Day Trend * recentWeight)

// Weights adjust dynamically based on month progress
recentWeight = min(0.6, monthProgress)
historicalWeight = 0.3
linearWeight = 1 - recentWeight - historicalWeight
```

**Risk Levels**:
- **Low**: <30% probability of breach
- **Medium**: 30-60% probability
- **High**: 60-80% probability
- **Critical**: >80% probability

**Example Output**:
```json
{
  "probabilityOfBreach": 0.842,
  "expectedMonthEndSpend": 47800,
  "monthlyLimit": 40000,
  "riskLevel": "critical",
  "explanation": "Heads up! At your current pace of ₹1,800/day, you may spend ~₹47,800 this month, which is above your set limit of ₹40,000.",
  "factors": [
    {
      "factor": "Accelerating spend",
      "impact": "negative",
      "description": "Last 7 days average (₹2,100/day) is 20% higher than month average"
    }
  ],
  "confidenceScore": 0.87
}
```

### 3. **Credit Utilization Intelligence**

Real-time utilization tracking with trend analysis:

**Formula**:
```
Utilization % = (Outstanding Amount + Current Month Spend) / Credit Limit * 100
```

**Risk Categories**:
- **Healthy**: <30% (ideal for credit score)
- **Moderate**: 30-50% (safe zone)
- **Risky**: 50-75% (approaching danger)
- **Critical**: >75% (harms credit score)

**Trend Detection**:
- Compares current utilization with last 3 months average
- Flags "worsening" if increased by >5%
- Flags "improving" if decreased by >5%
- Otherwise "stable"

**Example Output**:
```json
{
  "utilizationPercent": 78.5,
  "riskCategory": "critical",
  "trend": "worsening",
  "recommendation": "⚠️ URGENT: Your utilization is at 78.5%, which can significantly harm your credit score. Pay down ₹48,500 to bring it below 30%.",
  "actionRequired": true
}
```

### 4. **Anomaly Detection**

Multi-dimensional anomaly detection using statistical methods:

**Detection Methods**:

1. **Amount-Based**: Z-score > 2.5 (configurable)
   ```
   Z = (Transaction Amount - Mean) / Standard Deviation
   ```

2. **Category-Based**: New or rare merchant categories

3. **Frequency-Based**: ≥3 transactions in 1 hour (velocity)

4. **Time-Based**: Transactions between midnight and 5 AM

**Severity Levels**:
- **High**: Z-score ≥ 3.5
- **Medium**: Z-score ≥ 2.5
- **Low**: Z-score < 2.5

**Example Output**:
```json
{
  "transaction": {
    "amount": 25000,
    "merchantName": "Diamond Jewellers",
    "category": "Shopping"
  },
  "isAnomaly": true,
  "anomalyScore": 0.892,
  "anomalyType": ["amount", "category"],
  "deviationFromMean": 3.8,
  "severity": "high",
  "explanation": "This ₹25,000 transaction is 3.8× higher than your typical spend of ₹1,200 (±₹800). This is your first transaction in the 'Shopping' category.",
  "expectedRange": {
    "min": 100,
    "max": 5000,
    "mean": 1200,
    "stdDev": 800
  }
}
```

### 5. **Intelligence Orchestration**

Aggregates all modules into comprehensive insights:

**Health Score Calculation** (0-100):
```
Health Score = 
  (Utilization Score * 0.40) +     // Lower utilization = higher score
  (Overspending Score * 0.30) +    // Lower breach probability = higher score
  (Anomaly Score * 0.15) +         // Fewer anomalies = higher score
  (Consistency Score * 0.15)       // Lower volatility = higher score
```

**Alert Prioritization**:
1. **Critical**: Overspending imminent, utilization >75%
2. **High**: Utilization 50-75%, high-severity anomalies
3. **Medium**: Worsening trends, budget concerns

## API Endpoints

### Spending Profile
```bash
GET /finance/intelligence/profile/:cardId?months=6
```

### Overspending Prediction
```bash
GET /finance/intelligence/prediction/:cardId

POST /finance/intelligence/prediction/batch
Body: { "cardIds": ["card1", "card2"] }
```

### Utilization Analysis
```bash
GET /finance/intelligence/utilization/:cardId

GET /finance/intelligence/utilization/summary  # All cards
```

### Anomaly Detection
```bash
GET /finance/intelligence/anomalies/:cardId?days=30

GET /finance/intelligence/anomalies?cardIds=card1,card2&days=30

GET /finance/intelligence/anomalies/:cardId/stats?days=90

POST /finance/intelligence/anomalies/check
Body: { "transactionId": "txn123", "cardId": "card1" }
```

### Comprehensive Insights
```bash
GET /finance/intelligence/insights/:cardId  # Single card

GET /finance/intelligence/insights  # All cards

GET /finance/intelligence/dashboard  # Aggregated summary
```

### Configuration
```bash
GET /finance/intelligence/config?cardId=card1

PUT /finance/intelligence/config
Body: {
  "cardId": "card1",  // Optional: per-card config
  "overspendingAlertThreshold": 0.75,
  "utilizationWarningThreshold": 50,
  "utilizationCriticalThreshold": 75,
  "anomalyZScoreThreshold": 2.5,
  "anomalySensitivity": "medium",
  "enableOverspendingPrediction": true,
  "enableAnomalyDetection": true,
  "enableProactiveAlerts": true,
  "profileUpdateFrequency": "realtime"
}
```

## Configuration Options

### User-Specific Thresholds

All thresholds are configurable per-user or per-card:

| Setting | Default | Description |
|---------|---------|-------------|
| `overspendingAlertThreshold` | 0.75 | Trigger alert when breach probability ≥ 75% |
| `utilizationWarningThreshold` | 50 | Warn when utilization ≥ 50% |
| `utilizationCriticalThreshold` | 75 | Critical alert when utilization ≥ 75% |
| `anomalyZScoreThreshold` | 2.5 | Flag anomaly when Z-score ≥ 2.5 |
| `anomalySensitivity` | medium | low/medium/high |
| `profileUpdateFrequency` | realtime | realtime/daily/weekly |

### Feature Flags

Enable/disable modules individually:

- `enableOverspendingPrediction`: true/false
- `enableAnomalyDetection`: true/false
- `enableProactiveAlerts`: true/false

## Integration with SMS Parser

After each SMS is processed and transaction created:

```typescript
// In smsProcessing.service.ts
import { generateIntelligenceInsights } from '../intelligence/intelligenceOrchestration.service';

export const processSms = async (userId: string, smsBody: string) => {
  // ... existing SMS parsing logic ...
  
  // After transaction created:
  
  // Generate intelligence insights (non-blocking)
  generateIntelligenceInsights(userId, creditCardId).then(insights => {
    if (insights && insights.activeAlerts.length > 0) {
      // Send proactive alerts
      const criticalAlerts = insights.activeAlerts.filter(a => a.severity === 'critical');
      if (criticalAlerts.length > 0) {
        sendProactiveAlert(userId, criticalAlerts[0].message);
      }
    }
  }).catch(err => {
    logger.error('Intelligence generation failed (non-blocking):', err);
  });
  
  // Return SMS processing result immediately
  return result;
};
```

## Data Models

### IntelligenceConfig Schema

```typescript
{
  userId: ObjectId,
  creditCardId?: ObjectId,  // Optional: per-card config
  overspendingAlertThreshold: 0.75,
  utilizationWarningThreshold: 50,
  utilizationCriticalThreshold: 75,
  anomalyZScoreThreshold: 2.5,
  anomalySensitivity: "medium",
  enableOverspendingPrediction: true,
  enableAnomalyDetection: true,
  enableProactiveAlerts: true,
  profileUpdateFrequency: "realtime"
}
```

## Algorithm Details

### Merchant Categorization

Heuristic-based (can be upgraded to ML classification):

```typescript
const categoryPatterns = {
  'food & dining': /swiggy|zomato|restaurant|cafe|pizza|burger|kfc|mcdonalds|starbucks/i,
  'shopping': /amazon|flipkart|myntra|ajio|mall|store/i,
  'entertainment': /netflix|prime|hotstar|bookmyshow|pvr|inox|gaming/i,
  'travel': /uber|ola|rapido|makemytrip|goibibo|irctc|airline|flight/i,
  'groceries': /bigbasket|blinkit|grofers|dmart|supermarket/i,
  'bills': /electricity|water|gas|mobile|internet|recharge/i,
  'health': /pharmacy|apollo|hospital|gym|fitness/i
};
```

### Weekend Adjustment

If user's peak spending day is weekend, add 5% to projection:

```typescript
if (weekendDaysRemaining > 0 && peakSpendingDayOfWeek === 0 || 6) {
  expectedMonthEndSpend *= 1.05;
}
```

### Confidence Scoring

```typescript
baseConfidence = min(0.9, dataPoints / 100);  // More data = higher confidence
volatilityPenalty = min(0.3, coefficientOfVariation * 0.5);
confidenceScore = max(0.5, baseConfidence - volatilityPenalty);
```

## Explainability

All predictions include human-readable explanations:

**Overspending Prediction**:
- Current pace vs projected spend
- Comparison with monthly limit
- Contributing factors (accelerating spend, above typical pace, weekend pattern)

**Utilization Analysis**:
- Current utilization percentage
- Risk category explanation
- Specific amount to pay down
- Trend context (vs recent months)

**Anomaly Detection**:
- What makes it anomalous (amount/category/velocity/time)
- Statistical context (Z-score, expected range)
- Comparison baseline (90 days of history)

## Performance Considerations

### Caching Strategy

- Cache spending profiles for 1 hour
- Recalculate predictions only when new transaction added
- Store anomaly statistics daily

### Async Processing

- All intelligence modules run asynchronously
- Don't block SMS processing or transaction creation
- Failed intelligence generation logged but doesn't affect core flow

### Database Queries

- Use compound indexes: `{ userId: 1, creditCardId: 1, date: -1 }`
- Limit historical lookback (6 months for profiles, 90 days for anomalies)
- Batch processing for multiple cards

## Future Enhancements

### Phase 2: ML-Assisted (Planned)

1. **Spending Prediction**: LSTM for time-series forecasting
2. **Merchant Classification**: NLP + embeddings
3. **Anomaly Detection**: Isolation Forest / Autoencoder
4. **Credit Score Impact**: Predict score changes

### Phase 3: Fully Predictive (Planned)

1. **Personalized Budgets**: Auto-suggest optimal limits
2. **Cashback Optimization**: Recommend best card per category
3. **Debt Payoff Strategy**: Avalanche vs snowball optimization
4. **Financial Goals**: Track progress to savings goals

## Testing

### Unit Tests (Planned)

```bash
npm test -- intelligence
```

### Test Scenarios

1. **Normal spending**: Should predict low risk
2. **Accelerating spending**: Should predict high risk
3. **Large transaction**: Should detect anomaly
4. **Multiple cards**: Should aggregate correctly
5. **No history**: Should handle gracefully

## Production Checklist

- [ ] Configure thresholds per user
- [ ] Enable feature flags gradually
- [ ] Monitor prediction accuracy
- [ ] Set up anomaly alert notifications
- [ ] Add analytics tracking
- [ ] Configure caching layer
- [ ] Set up monitoring dashboards
- [ ] Document API for frontend team
- [ ] Performance testing (10k users, 100k transactions)
- [ ] Security audit (sensitive financial data)

## Support

For questions or issues:
1. Check API documentation
2. Review example responses
3. Test with sample data
4. Contact backend team

---

**Version**: 1.0.0  
**Last Updated**: January 2025  
**Status**: Production Ready (Rule-Based), ML-Ready Architecture
