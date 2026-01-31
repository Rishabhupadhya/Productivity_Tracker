# Intelligence Features - Testing Guide

## Prerequisites

1. **Start Backend Server**
```bash
cd backend
npm run dev
```

2. **Have Test Data**
- At least 1 credit card with `monthlyLimit` set
- Multiple transactions on that card
- Get your JWT token from login

## Quick Test Workflow

### Step 1: Login and Get Token

```bash
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your@email.com",
    "password": "yourpassword"
  }'
```

**Save the token from response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { ... }
}
```

### Step 2: Get Your Credit Cards

```bash
curl -X GET http://localhost:5000/finance/credit-cards \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Save a cardId from response**

### Step 3: Test Intelligence Features

#### 🎯 Get Complete Insights (Recommended First Test)

```bash
curl -X GET "http://localhost:5000/finance/intelligence/insights/YOUR_CARD_ID" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected Response:**
```json
{
  "creditCardId": "...",
  "userId": "...",
  "spendingProfile": {
    "averageMonthlySpend": 28500,
    "averageDailySpend": 950,
    "categoryBreakdown": {
      "food & dining": { "amount": 8500, "percentage": 29.8 },
      "shopping": { "amount": 12000, "percentage": 42.1 }
    },
    "coefficientOfVariation": 0.44
  },
  "prediction": {
    "probabilityOfBreach": 0.65,
    "expectedMonthEndSpend": 35000,
    "monthlyLimit": 40000,
    "riskLevel": "medium",
    "explanation": "You're on track to spend ~₹35,000...",
    "confidenceScore": 0.87
  },
  "utilization": {
    "utilizationPercent": 45.5,
    "riskCategory": "moderate",
    "trend": "stable",
    "recommendation": "Your utilization of 45.5%..."
  },
  "anomalies": [ ... ],
  "healthScore": 72,
  "activeAlerts": [
    {
      "type": "budget_concern",
      "severity": "medium",
      "message": "Your spending is trending upward...",
      "actionable": true
    }
  ]
}
```

#### 📊 Get Dashboard (All Cards Summary)

```bash
curl -X GET "http://localhost:5000/finance/intelligence/dashboard" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected Response:**
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

#### 🔮 Get Overspending Prediction

```bash
curl -X GET "http://localhost:5000/finance/intelligence/prediction/YOUR_CARD_ID" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

#### 📈 Get Utilization Analysis

```bash
curl -X GET "http://localhost:5000/finance/intelligence/utilization/YOUR_CARD_ID" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

#### 🚨 Get Anomalies (Last 30 Days)

```bash
curl -X GET "http://localhost:5000/finance/intelligence/anomalies/YOUR_CARD_ID?days=30" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

#### 🧠 Get Spending Profile

```bash
curl -X GET "http://localhost:5000/finance/intelligence/profile/YOUR_CARD_ID?months=6" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Using Postman (Easier!)

### 1. Import Collection

Create a new Postman collection called "Credit Card Intelligence"

### 2. Set Environment Variables

```
baseUrl: http://localhost:5000
token: YOUR_JWT_TOKEN
cardId: YOUR_CARD_ID
```

### 3. Create Requests

**Get Insights:**
- Method: `GET`
- URL: `{{baseUrl}}/finance/intelligence/insights/{{cardId}}`
- Headers: `Authorization: Bearer {{token}}`

**Get Dashboard:**
- Method: `GET`
- URL: `{{baseUrl}}/finance/intelligence/dashboard`
- Headers: `Authorization: Bearer {{token}}`

**Update Config:**
- Method: `PUT`
- URL: `{{baseUrl}}/finance/intelligence/config`
- Headers: 
  - `Authorization: Bearer {{token}}`
  - `Content-Type: application/json`
- Body (JSON):
```json
{
  "cardId": "{{cardId}}",
  "overspendingAlertThreshold": 0.80,
  "utilizationCriticalThreshold": 80,
  "anomalySensitivity": "high"
}
```

## Test Scenarios

### Scenario 1: Normal Spending Pattern

**Setup:**
- Create 20-30 transactions over last 3 months
- Amounts: ₹500-₹2000 (consistent)
- Monthly limit: ₹40,000

**Expected Results:**
- ✅ Prediction: Low risk
- ✅ Health Score: 80-95
- ✅ No critical alerts
- ✅ Utilization: <30% (healthy)

### Scenario 2: Overspending Risk

**Setup:**
- Create transactions totaling ₹25,000 in first 15 days
- Monthly limit: ₹40,000
- Recent transactions higher than usual

**Expected Results:**
- ⚠️ Prediction: Medium/High risk
- ⚠️ "At your current pace, you may exceed..."
- ⚠️ Health Score: 50-70
- ⚠️ Alert: Overspending risk

**Test:**
```bash
curl -X GET "http://localhost:5000/finance/intelligence/prediction/YOUR_CARD_ID" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Scenario 3: Anomaly Detection

**Setup:**
- Add one large transaction (₹25,000)
- Normal transactions are ₹500-₹2000

**Expected Results:**
- 🚨 Anomaly detected
- 🚨 High severity
- 🚨 Z-score > 2.5
- 🚨 Explanation: "3.8× higher than typical spend"

**Test:**
```bash
# After creating the large transaction
curl -X GET "http://localhost:5000/finance/intelligence/anomalies/YOUR_CARD_ID?days=7" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Scenario 4: High Utilization

**Setup:**
- Set card outstanding amount to ₹80,000
- Credit limit: ₹100,000

**Expected Results:**
- 🔴 Critical risk category
- 🔴 "URGENT: Pay down ₹XXX"
- 🔴 Health score drops
- 🔴 Alert generated

**Test:**
```bash
# First update outstanding amount
curl -X PATCH "http://localhost:5000/finance/credit-cards/YOUR_CARD_ID" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{ "outstandingAmount": 80000 }'

# Then check utilization
curl -X GET "http://localhost:5000/finance/intelligence/utilization/YOUR_CARD_ID" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Integration Test: SMS → Intelligence

### Test End-to-End Flow

1. **Send SMS for Processing:**
```bash
curl -X POST "http://localhost:5000/finance/sms/process" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "smsBody": "Your ICICI Bank Credit Card XX1234 has been used for Rs 5,000.00 at AMAZON on 31-01-26"
  }'
```

2. **Check Intelligence Update:**
```bash
curl -X GET "http://localhost:5000/finance/intelligence/insights/YOUR_CARD_ID" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

3. **Verify:**
- ✅ Current spend increased by ₹5,000
- ✅ Prediction updated
- ✅ Utilization recalculated
- ✅ Anomaly check performed

## Checking if Intelligence Works

### Simple Health Check

Run this to see if intelligence is calculating:

```bash
# Get insights
curl -X GET "http://localhost:5000/finance/intelligence/insights/YOUR_CARD_ID" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" | jq

# Expected: Should return object with healthScore, prediction, utilization
# If null/404: Card not found or no monthly limit set
# If 500 error: Check backend logs
```

### Verify Configuration

```bash
curl -X GET "http://localhost:5000/finance/intelligence/config" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Should return default config:**
```json
{
  "overspendingAlertThreshold": 0.75,
  "utilizationWarningThreshold": 50,
  "utilizationCriticalThreshold": 75,
  "anomalyZScoreThreshold": 2.5,
  "enableOverspendingPrediction": true,
  "enableAnomalyDetection": true
}
```

## Common Issues

### ❌ "Card not found or no monthly limit set"

**Solution:**
```bash
# Set monthly limit on your card
curl -X PATCH "http://localhost:5000/finance/credit-cards/YOUR_CARD_ID" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{ "monthlyLimit": 40000 }'
```

### ❌ "Insufficient historical data"

**Solution:** Create more transactions:
```bash
# Add 10-20 transactions over last 2-3 months
# Use different dates in the past
```

### ❌ Empty anomalies array

**Expected!** If all transactions are normal, no anomalies detected.

**To test anomaly detection:**
1. Check your typical spending (profile endpoint)
2. Add transaction 3-4× larger
3. Query anomalies again

## Backend Logs

Check server logs for intelligence execution:

```
[INFO] Generating intelligence insights for card abc123
[INFO] Predicting overspending for card abc123
[INFO] Analyzing utilization for card abc123
[INFO] Detecting anomalies for last 30 days on card abc123
[INFO] Generated 2 alerts for card abc123
```

## Next Steps: Frontend Integration

The intelligence features currently have **NO UI**. To see them in your app:

### Option 1: Quick Test UI (Recommended)

Create a simple test page:

```typescript
// frontend/src/pages/IntelligenceTest.tsx
import { useEffect, useState } from 'react';
import api from '../services/api';

export default function IntelligenceTest() {
  const [cardId, setCardId] = useState('');
  const [insights, setInsights] = useState<any>(null);
  
  const fetchInsights = async () => {
    const response = await api.get(`/finance/intelligence/insights/${cardId}`);
    setInsights(response.data);
  };
  
  return (
    <div style={{ padding: '20px' }}>
      <h1>Intelligence Test</h1>
      <input 
        value={cardId} 
        onChange={e => setCardId(e.target.value)}
        placeholder="Enter Card ID"
      />
      <button onClick={fetchInsights}>Get Insights</button>
      
      {insights && (
        <div>
          <h2>Health Score: {insights.healthScore}</h2>
          
          <h3>Prediction</h3>
          <pre>{JSON.stringify(insights.prediction, null, 2)}</pre>
          
          <h3>Utilization</h3>
          <pre>{JSON.stringify(insights.utilization, null, 2)}</pre>
          
          <h3>Alerts</h3>
          {insights.activeAlerts.map((alert: any) => (
            <div key={alert.type} style={{ 
              padding: '10px', 
              background: alert.severity === 'critical' ? 'red' : 'orange',
              color: 'white',
              margin: '5px 0'
            }}>
              {alert.message}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

### Option 2: Full UI Implementation (Future)

You'll need to create:
- Intelligence Dashboard component
- Prediction cards with charts
- Utilization gauge/progress bar
- Anomaly list with explanations
- Alert notifications
- Configuration settings panel

## Testing Checklist

- [ ] Backend server running
- [ ] JWT token obtained
- [ ] Card ID retrieved
- [ ] Monthly limit set on card
- [ ] At least 10 transactions created
- [ ] GET /intelligence/insights working
- [ ] GET /intelligence/dashboard working
- [ ] Prediction shows risk level
- [ ] Utilization shows percentage
- [ ] Configuration can be updated
- [ ] Anomaly detection works with large transaction
- [ ] Health score calculated (0-100)
- [ ] Alerts generated for high risk

## Sample Test Data Generator

Use this to create test data:

```bash
# Create 20 random transactions
for i in {1..20}; do
  curl -X POST "http://localhost:5000/finance/transactions" \
    -H "Authorization: Bearer YOUR_TOKEN_HERE" \
    -H "Content-Type: application/json" \
    -d '{
      "amount": '$((RANDOM % 2000 + 500))',
      "type": "expense",
      "category": "Shopping",
      "description": "Test Transaction '$i'",
      "paymentType": "credit",
      "creditCardId": "YOUR_CARD_ID",
      "date": "'$(date -v-${i}d +%Y-%m-%d)'"
    }'
  sleep 0.5
done
```

---

**Happy Testing! 🚀**

For issues or questions, check:
1. Backend logs (`npm run dev` output)
2. API_REFERENCE.md for endpoint details
3. README.md for algorithm explanations
