# Intelligence API Quick Reference

## Base URL
```
/finance/intelligence
```

All endpoints require authentication via JWT token in `Authorization` header.

---

## Spending Profile

### Get Spending Profile
```http
GET /profile/:cardId?months=6
```

**Response**:
```json
{
  "averageMonthlySpend": 28500,
  "averageDailySpend": 950,
  "averageWeeklySpend": 6650,
  "peakSpendingDays": [1, 15, 28],
  "peakSpendingDayOfWeek": 6,
  "categoryBreakdown": {
    "food & dining": { "amount": 8500, "percentage": 29.8 },
    "shopping": { "amount": 12000, "percentage": 42.1 },
    "entertainment": { "amount": 3000, "percentage": 10.5 }
  },
  "standardDeviationDaily": 420,
  "coefficientOfVariation": 0.44,
  "dataPoints": 178,
  "periodCovered": 180,
  "lastUpdated": "2025-01-15T10:30:00Z"
}
```

---

## Overspending Prediction

### Single Card Prediction
```http
GET /prediction/:cardId
```

**Response**:
```json
{
  "creditCardId": "...",
  "userId": "...",
  "month": "2025-01",
  "probabilityOfBreach": 0.842,
  "expectedMonthEndSpend": 47800,
  "monthlyLimit": 40000,
  "currentSpend": 21500,
  "riskLevel": "critical",
  "daysElapsed": 15,
  "daysRemaining": 16,
  "currentDailyAverage": 1433,
  "projectedDailyAverage": 1542,
  "confidenceScore": 0.87,
  "explanation": "Heads up! At your current pace of ₹1,433/day, you may spend ~₹47,800 this month...",
  "factors": [
    {
      "factor": "Accelerating spend",
      "impact": "negative",
      "description": "Last 7 days average (₹2,100/day) is 20% higher than month average"
    }
  ],
  "generatedAt": "2025-01-15T10:30:00Z"
}
```

### Batch Predictions
```http
POST /prediction/batch
```

**Request Body**:
```json
{
  "cardIds": ["card1", "card2", "card3"]
}
```

**Response**: Array of prediction objects

---

## Utilization Analysis

### Single Card Utilization
```http
GET /utilization/:cardId
```

**Response**:
```json
{
  "creditCardId": "...",
  "userId": "...",
  "month": "2025-01",
  "currentBalance": 78500,
  "creditLimit": 100000,
  "utilizationPercent": 78.5,
  "riskCategory": "critical",
  "trend": "worsening",
  "averageUtilization": 52.3,
  "peakUtilization": 85.2,
  "lowestUtilization": 23.1,
  "recommendation": "⚠️ URGENT: Your utilization is at 78.5%, which can significantly harm your credit score. Pay down ₹48,500 to bring it below 30%.",
  "actionRequired": true,
  "generatedAt": "2025-01-15T10:30:00Z"
}
```

### Utilization Summary (All Cards)
```http
GET /utilization/summary
```

**Response**:
```json
{
  "totalBalance": 156000,
  "totalCreditLimit": 250000,
  "overallUtilization": 62.4,
  "cardsAtRisk": 2,
  "highestUtilizationCard": "card_abc123"
}
```

---

## Anomaly Detection

### Card Anomalies
```http
GET /anomalies/:cardId?days=30
```

**Response**:
```json
[
  {
    "transaction": {
      "transactionId": "...",
      "amount": 25000,
      "merchantName": "Diamond Jewellers",
      "category": "Shopping",
      "date": "2025-01-14T18:30:00Z"
    },
    "isAnomaly": true,
    "anomalyScore": 0.892,
    "anomalyType": ["amount", "category"],
    "expectedRange": {
      "min": 100,
      "max": 5000,
      "mean": 1200,
      "stdDev": 800
    },
    "deviationFromMean": 3.8,
    "severity": "high",
    "explanation": "This ₹25,000 transaction is 3.8× higher than your typical spend...",
    "comparisonBaseline": "Based on 145 transactions over the last 90 days",
    "detectedAt": "2025-01-15T10:30:00Z"
  }
]
```

### All Anomalies
```http
GET /anomalies?cardIds=card1,card2&days=30
```

### Anomaly Statistics
```http
GET /anomalies/:cardId/stats?days=90
```

**Response**:
```json
{
  "totalTransactions": 145,
  "anomaliesDetected": 8,
  "anomalyRate": 5.52,
  "byType": {
    "amount": 5,
    "category": 3,
    "velocity": 2
  },
  "bySeverity": {
    "high": 2,
    "medium": 4,
    "low": 2
  },
  "averageAnomalyScore": 0.684
}
```

### Check Transaction Anomaly
```http
POST /anomalies/check
```

**Request Body**:
```json
{
  "transactionId": "txn_123",
  "cardId": "card_abc"
}
```

---

## Comprehensive Insights

### Single Card Insights
```http
GET /insights/:cardId
```

**Response**:
```json
{
  "creditCardId": "...",
  "userId": "...",
  "spendingProfile": { /* Profile object */ },
  "prediction": { /* Prediction object */ },
  "utilization": { /* Utilization object */ },
  "anomalies": [ /* Anomaly objects */ ],
  "healthScore": 67,
  "activeAlerts": [
    {
      "type": "overspending_risk",
      "severity": "critical",
      "message": "Heads up! At your current pace...",
      "actionable": true,
      "createdAt": "2025-01-15T10:30:00Z"
    },
    {
      "type": "high_utilization",
      "severity": "high",
      "message": "Your utilization is 78.5%...",
      "actionable": true,
      "createdAt": "2025-01-15T10:30:00Z"
    }
  ],
  "generatedAt": "2025-01-15T10:30:00Z"
}
```

### All Cards Insights
```http
GET /insights
```

**Response**: Array of insight objects

### Intelligence Dashboard
```http
GET /dashboard
```

**Response**:
```json
{
  "totalCards": 3,
  "averageHealthScore": 72,
  "totalAlerts": 5,
  "criticalAlerts": 2,
  "cardsAtRisk": 2,
  "totalAnomalies": 8,
  "overallUtilization": 62.4
}
```

---

## Configuration

### Get Configuration
```http
GET /config?cardId=card123
```

**Response**:
```json
{
  "userId": "...",
  "creditCardId": "...",
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

### Update Configuration
```http
PUT /config
```

**Request Body**:
```json
{
  "cardId": "card123",
  "overspendingAlertThreshold": 0.80,
  "utilizationCriticalThreshold": 80,
  "anomalySensitivity": "high"
}
```

---

## Error Responses

### 401 Unauthorized
```json
{
  "error": "Unauthorized"
}
```

### 404 Not Found
```json
{
  "error": "Card not found or no monthly limit set"
}
```

### 500 Server Error
```json
{
  "error": "Failed to generate insights"
}
```

---

## cURL Examples

### Get Insights
```bash
curl -X GET "http://localhost:5000/finance/intelligence/insights/card_abc123" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Update Config
```bash
curl -X PUT "http://localhost:5000/finance/intelligence/config" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "cardId": "card_abc123",
    "overspendingAlertThreshold": 0.80,
    "anomalySensitivity": "high"
  }'
```

### Check Anomaly
```bash
curl -X POST "http://localhost:5000/finance/intelligence/anomalies/check" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "transactionId": "txn_123",
    "cardId": "card_abc"
  }'
```

---

## Integration Example

```typescript
// After SMS processing
import { generateIntelligenceInsights } from './intelligence/intelligenceOrchestration.service';

// In your SMS processing service
const result = await processSms(userId, smsBody);

// Generate insights asynchronously (non-blocking)
if (result.success && result.transaction) {
  generateIntelligenceInsights(userId, result.transaction.creditCardId)
    .then(insights => {
      // Send proactive alerts if critical issues detected
      const critical = insights?.activeAlerts.filter(a => a.severity === 'critical');
      if (critical && critical.length > 0) {
        sendPushNotification(userId, critical[0].message);
      }
    })
    .catch(err => console.error('Intelligence failed (non-blocking):', err));
}
```

---

**Risk Levels**: low | medium | high | critical  
**Alert Types**: overspending_risk | high_utilization | anomaly_detected | budget_concern  
**Trend Values**: improving | stable | worsening  
**Sensitivity**: low | medium | high
