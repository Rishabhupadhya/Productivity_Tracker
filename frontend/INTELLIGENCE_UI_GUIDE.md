# 🚀 Quick Start - Intelligence Dashboard UI

## What You'll See

The Intelligence Dashboard shows:

1. **📊 Summary Cards** (Top)
   - Average Health Score (0-100)
   - Active Alerts count
   - Cards at Risk
   - Overall Utilization

2. **🚨 Active Alerts** (If any)
   - Critical, High, or Medium severity
   - Real-time warnings about overspending, high utilization, etc.

3. **🔮 Overspending Prediction Card**
   - Risk level badge (Low/Medium/High/Critical)
   - Breach probability percentage
   - Current spend vs Expected month-end spend
   - Days remaining in month
   - Human-readable explanation
   - Contributing factors

4. **📊 Credit Utilization Card**
   - Circular gauge showing utilization %
   - Color-coded by risk (Green < 30%, Yellow 30-50%, Orange 50-75%, Red > 75%)
   - Trend indicator (Improving/Stable/Worsening)
   - Actionable recommendations

5. **📈 Spending Profile Card**
   - Average monthly/daily spend
   - Peak spending days
   - Category breakdown with bars (Food, Shopping, Entertainment, etc.)

6. **🔍 Anomalies Card**
   - Unusual transactions detected
   - Amount, merchant, date
   - Explanation with Z-score
   - Severity level

## How to Access

1. **Start Backend:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Start Frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Navigate:**
   - Login to your account
   - Click **"🧠 Credit Card Intelligence"** in the sidebar (under Trackers section)

## Prerequisites

For the dashboard to show data, you need:

1. **At least one credit card** with:
   - `monthlyLimit` set (e.g., 40000)
   - `creditLimit` set
   - `outstandingAmount` (optional)

2. **Multiple transactions** (at least 10-20):
   - With `paymentType: "credit"`
   - Spread across different dates
   - With the credit card ID

## Quick Test Setup

### Option 1: Using Existing Data
If you already have credit cards and transactions, just:
1. Go to `/finance/intelligence`
2. Select a card from dropdown
3. View insights immediately!

### Option 2: Create Test Data

**Step 1: Create a Credit Card**
```bash
curl -X POST http://localhost:5000/finance/credit-cards \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "cardName": "HDFC Regalia",
    "bankName": "HDFC Bank",
    "last4Digits": "1234",
    "creditLimit": 100000,
    "monthlyLimit": 40000,
    "outstandingAmount": 15000,
    "billingDate": 5
  }'
```

**Step 2: Create Test Transactions**
```bash
# Transaction 1
curl -X POST http://localhost:5000/finance/transactions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 2500,
    "type": "expense",
    "category": "Food & Dining",
    "description": "Swiggy Order",
    "paymentType": "credit",
    "creditCardId": "YOUR_CARD_ID",
    "date": "2026-01-15"
  }'

# Transaction 2
curl -X POST http://localhost:5000/finance/transactions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 8500,
    "type": "expense",
    "category": "Shopping",
    "description": "Amazon Order",
    "paymentType": "credit",
    "creditCardId": "YOUR_CARD_ID",
    "date": "2026-01-20"
  }'

# Add 10-20 more transactions with varying amounts (500-5000)
```

**Step 3: Create Anomaly (Optional)**
```bash
# Large transaction to trigger anomaly
curl -X POST http://localhost:5000/finance/transactions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 25000,
    "type": "expense",
    "category": "Shopping",
    "description": "Laptop Purchase",
    "paymentType": "credit",
    "creditCardId": "YOUR_CARD_ID",
    "date": "2026-01-28"
  }'
```

**Step 4: View Intelligence**
- Go to http://localhost:5173/finance/intelligence
- Select your card
- See all insights!

## What Each Feature Shows

### Health Score (0-100)
- **80-100**: Excellent (Green) - Low utilization, no overspending risk
- **60-79**: Good (Yellow) - Moderate utilization or minor concerns
- **<60**: Poor (Red) - High utilization, overspending risk, or anomalies

**Formula:**
```
Health = (Utilization Score × 40%) + 
         (Overspending Score × 30%) + 
         (Anomaly Score × 15%) + 
         (Consistency Score × 15%)
```

### Risk Levels

**Overspending Prediction:**
- 🟢 **Low**: <30% chance of exceeding limit
- 🟡 **Medium**: 30-60% chance
- 🟠 **High**: 60-80% chance
- 🔴 **Critical**: >80% chance or already exceeded

**Utilization:**
- 🟢 **Healthy**: <30% (Ideal for credit score)
- 🟡 **Moderate**: 30-50% (Safe zone)
- 🟠 **Risky**: 50-75% (Approaching danger)
- 🔴 **Critical**: >75% (Can harm credit score)

### Trend Indicators
- 📈 **Improving**: Utilization decreasing by >5% vs last 3 months
- ➡️ **Stable**: Utilization within ±5%
- 📉 **Worsening**: Utilization increasing by >5%

## UI Features

### Interactive Elements
- **Card Selector**: Switch between multiple credit cards
- **Color-Coded Gauges**: Visual utilization indicator
- **Collapsible Sections**: Click to expand/collapse details
- **Real-Time Updates**: Refreshes when you switch cards

### Responsive Design
- Works on desktop, tablet, and mobile
- Cards stack on smaller screens
- Smooth animations and transitions

## Troubleshooting

### "Failed to load insights"
**Cause**: Card has no monthly limit set

**Fix:**
```bash
curl -X PATCH http://localhost:5000/finance/credit-cards/YOUR_CARD_ID \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "monthlyLimit": 40000 }'
```

### No anomalies showing
**Expected!** If all transactions are normal-sized, no anomalies detected.

**To trigger anomaly**: Add a transaction 3-4× larger than your usual spending.

### "Insufficient historical data"
**Cause**: Less than 10 transactions

**Fix**: Add more transactions using the script above.

### Empty category breakdown
**Cause**: Merchant names don't match patterns

**Fix**: Use common merchant names like:
- Swiggy, Zomato (Food)
- Amazon, Flipkart (Shopping)
- Netflix, BookMyShow (Entertainment)
- Uber, Ola (Travel)

## Screenshots (What You'll See)

```
┌─────────────────────────────────────────────────────────┐
│  🧠 Credit Card Intelligence                            │
│  ML-driven insights to optimize your credit card usage  │
├─────────────────────────────────────────────────────────┤
│  [72]          [5]         [2]          [45.5%]        │
│  Health Score  Alerts      At Risk      Utilization    │
├─────────────────────────────────────────────────────────┤
│  Select Card: [HDFC Regalia - ****1234 ▼]             │
├─────────────────────────────────────────────────────────┤
│  🚨 ACTIVE ALERTS                                       │
│  ┌─────────────────────────────────────────────────┐  │
│  │ ⚠️  OVERSPENDING RISK                            │  │
│  │     At your current pace, you may spend ~₹47K... │  │
│  └─────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────┤
│  🔮 Overspending Prediction  │  📊 Credit Utilization  │
│  ┌──────────────────────────┐│  ┌───────────────────┐  │
│  │ [HIGH RISK] 65% breach   ││  │    ╭─────╮        │  │
│  │ Current: ₹21,500         ││  │   │ 45.5% │       │  │
│  │ Expected: ₹35,000        ││  │    ╰─────╯        │  │
│  │ Limit: ₹40,000           ││  │  Moderate (📉)     │  │
│  │                          ││  │  Action: Pay ₹15K  │  │
│  └──────────────────────────┘│  └───────────────────┘  │
├─────────────────────────────────────────────────────────┤
│  📈 Spending Profile         │  🔍 Anomalies         │  │
│  ┌──────────────────────────┐│  ┌───────────────────┐  │
│  │ Avg Monthly: ₹28,500     ││  │ Laptop - ₹25,000  │  │
│  │ Peak Day: Saturday       ││  │ 3.8× higher than  │  │
│  │                          ││  │ usual (amount)    │  │
│  │ 🍔 Food      ████ 29.8%  ││  │                   │  │
│  │ 🛒 Shopping  ██████ 42.1%││  └───────────────────┘  │
│  └──────────────────────────┘│                         │
└─────────────────────────────────────────────────────────┘
```

## Next Steps

### Enhance UI (Optional)
- Add charts (line chart for spending trends)
- Add date range selector
- Add export to PDF feature
- Add email alert configuration

### Backend Integration
- Auto-refresh after SMS processing
- Real-time WebSocket updates
- Push notifications for critical alerts

### Mobile App
- React Native version
- Push notifications
- Biometric auth

---

**Enjoy your ML-powered Credit Card Intelligence! 🚀**
