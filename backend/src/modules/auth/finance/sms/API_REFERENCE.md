# SMS Parser API - Quick Reference

## Base URL
```
http://localhost:5001/finance/sms
```

## Authentication
All endpoints require JWT authentication:
```
Authorization: Bearer <your_jwt_token>
```

---

## 1. Process Credit Card SMS

**Endpoint:** `POST /process`

**Description:** Parse SMS and automatically create transaction, update monthly spending, and send alert if limit breached

**Request Body:**
```json
{
  "smsText": "Your ICICI Bank Credit Card XX1234 has been debited with INR 5,432.00 on 31-Jan-26 at AMAZON",
  "receivedAt": "2026-01-31T10:30:00Z"  // Optional
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "SMS processed successfully",
  "parsedData": {
    "amount": 5432,
    "transactionType": "DEBIT",
    "merchantName": "AMAZON",
    "maskedCardNumber": "1234",
    "transactionDate": "2026-01-31T00:00:00.000Z",
    "bankName": "ICICI",
    "rawSms": "...",
    "isValid": true
  },
  "transactionId": "65abc123def456...",
  "limitBreached": true,
  "alertSent": true
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "No matching credit card found for ICICI ending 1234",
  "parsedData": { ... }
}
```

---

## 2. Test SMS Parsing (Dry Run)

**Endpoint:** `POST /test-parse`

**Description:** Test SMS parsing without saving to database

**Request Body:**
```json
{
  "smsText": "Your HDFC Bank Credit Card ending 5678 is used for Rs.3,250.00 at ZOMATO"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "SMS parsed successfully",
  "parsedData": {
    "amount": 3250,
    "transactionType": "DEBIT",
    "merchantName": "ZOMATO",
    "maskedCardNumber": "5678",
    "bankName": "HDFC",
    "isValid": true
  }
}
```

---

## 3. Get Supported Banks

**Endpoint:** `GET /supported-banks`

**Description:** Get list of banks currently supported

**Response (200):**
```json
{
  "success": true,
  "banks": ["ICICI", "HDFC", "SBI", "Axis"],
  "count": 4
}
```

---

## 4. Get Monthly Spending

**Endpoint:** `GET /monthly-spending`

**Description:** Get monthly spending across all credit cards

**Query Parameters:**
- `month` (optional) - Format: `YYYY-MM` (default: current month)

**Example:**
```
GET /monthly-spending?month=2026-01
```

**Response (200):**
```json
{
  "success": true,
  "month": "2026-01",
  "totalSpent": 42300,
  "totalTransactions": 15,
  "cards": [
    {
      "_id": "65abc...",
      "userId": "65def...",
      "creditCardId": {
        "_id": "65xyz...",
        "cardName": "HDFC Regalia",
        "bankName": "HDFC",
        "last4Digits": "5678",
        "monthlyLimit": 40000
      },
      "month": "2026-01",
      "totalSpent": 42300,
      "transactionCount": 15,
      "lastUpdated": "2026-01-31T10:30:00Z"
    }
  ]
}
```

---

## Sample cURL Commands

### Process SMS
```bash
curl -X POST http://localhost:5001/finance/sms/process \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "smsText": "Your ICICI Bank Credit Card XX1234 has been debited with INR 5,432.00 on 31-Jan-26 at AMAZON"
  }'
```

### Test Parsing
```bash
curl -X POST http://localhost:5001/finance/sms/test-parse \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "smsText": "Your HDFC Bank Credit Card ending 5678 is used for Rs.3,250.00 at ZOMATO"
  }'
```

### Get Supported Banks
```bash
curl -X GET http://localhost:5001/finance/sms/supported-banks \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Get Monthly Spending
```bash
curl -X GET "http://localhost:5001/finance/sms/monthly-spending?month=2026-01" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Error Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Bad Request (invalid SMS, card not found, invalid format) |
| 401 | Unauthorized (missing or invalid JWT token) |
| 500 | Internal Server Error |

---

## SMS Format Requirements

### Must Include:
- Bank name (ICICI, HDFC, SBI, or Axis)
- Amount (INR or Rs format)
- Debit keyword (debited, used, spent, charged)
- Merchant name

### Optional:
- Last 4 digits of card
- Transaction date (defaults to current date if missing)

### Ignored SMS Types:
- OTP messages
- Promotional messages
- Statement notifications
- Reversals/refunds
- Credit transactions (only debit supported)

---

## Integration Example (Node.js)

```javascript
const axios = require('axios');

const processSms = async (smsText) => {
  try {
    const response = await axios.post(
      'http://localhost:5001/finance/sms/process',
      { smsText },
      {
        headers: {
          'Authorization': `Bearer ${JWT_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('SMS processed:', response.data);
    
    if (response.data.limitBreached) {
      console.warn('⚠️ Monthly limit breached! Alert sent:', response.data.alertSent);
    }
  } catch (error) {
    console.error('Failed to process SMS:', error.response?.data || error.message);
  }
};

// Example usage
processSms('Your ICICI Bank Credit Card XX1234 has been debited with INR 5,432.00 at AMAZON');
```

---

## Testing Workflow

1. **Add Credit Card** (via `/finance/credit-cards` endpoint)
   ```json
   {
     "cardName": "HDFC Regalia",
     "bankName": "HDFC",
     "last4Digits": "5678",
     "creditLimit": 200000,
     "monthlyLimit": 40000,
     "billingCycleStartDay": 1,
     "dueDateDay": 20
   }
   ```

2. **Test SMS Parsing** (no DB save)
   ```
   POST /sms/test-parse
   ```

3. **Process Real SMS** (creates transaction + updates spending)
   ```
   POST /sms/process
   ```

4. **Check Monthly Spending**
   ```
   GET /sms/monthly-spending
   ```

5. **Verify Limit Breach Alert** (check console logs for alert output)

---

## Troubleshooting

### "No matching credit card found"
- Ensure card exists in database with matching `bankName` and `last4Digits`
- Bank name matching is case-insensitive
- If SMS doesn't contain last 4 digits, only bank name is matched

### "SMS could not be parsed"
- Check if SMS is from a supported bank (ICICI, HDFC, SBI, Axis)
- Verify SMS contains debit keywords (debited, used, spent, charged)
- OTP/promotional messages are intentionally ignored

### Alert not sent
- Check console logs for alert output (currently mock implementation)
- Verify `monthlyLimit` is set on the credit card
- Ensure spending actually exceeds the limit

---

## Next Steps

1. Set up real email/SMS providers for alerts
2. Add webhook endpoint for automatic SMS forwarding
3. Implement duplicate SMS detection
4. Add support for more banks
5. Build frontend UI for SMS management
