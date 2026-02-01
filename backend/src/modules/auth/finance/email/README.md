# Email Parser Module - Credit Card Intelligence System

## Overview

A production-ready backend module that fetches bank credit card transaction alert emails via OAuth, parses them using bank-specific parsers, and automatically creates transaction records with deduplication.

## Features

✅ **OAuth Integration** - Gmail & Outlook with read-only scopes  
✅ **Multi-Bank Email Parsing** - ICICI, HDFC, SBI, Axis + Generic fallback  
✅ **Deduplication** - Prevents duplicate transactions via message ID + content hash  
✅ **Automatic Transaction Creation** - Matches cards and creates records  
✅ **Monthly Spending Tracking** - Updates spending limits automatically  
✅ **Limit Breach Alerts** - Triggers email/SMS when limits exceeded  
✅ **Security First** - Read-only scopes, encrypted tokens, user-revocable access  

---

## Architecture

### 1. **Email OAuth Layer**
- `emailAuth.service.ts` - OAuth 2.0 authorization flows
- Read-only scopes: `gmail.readonly`, `Mail.Read`
- Secure token storage (encrypted in production)

### 2. **Email Fetcher**
- `emailFetcher.service.ts` - Fetch emails from Gmail/Outlook APIs
- Filters by sender domain and subject keywords
- Excludes OTP, promotional, marketing emails

### 3. **Email Parser Layer** (Strategy Pattern)
- `emailParser.interface.ts` - Base interface and factory
- `parsers/iciciEmailParser.ts` - ICICI Bank parser
- `parsers/hdfcEmailParser.ts` - HDFC Bank parser
- `parsers/sbiEmailParser.ts` - SBI parser
- `parsers/axisEmailParser.ts` - Axis Bank parser
- `parsers/genericEmailParser.ts` - Fallback for unknown banks

### 4. **Deduplication**
- `deduplication.service.ts` - Dual-layer deduplication
  - Layer 1: Email message ID
  - Layer 2: Transaction content hash (amount + date + merchant + card)

### 5. **Data Models**
- `models/emailMetadata.model.ts` - Track processed emails
- `models/processedEmail.model.ts` - Deduplication records

### 6. **Processing Pipeline**
- `emailProcessing.service.ts` - Orchestrates: fetch → parse → dedupe → create transaction → update spending → alerts

### 7. **API Layer**
- `email.controller.ts` - HTTP request handlers
- `email.routes.ts` - API endpoints

---

## API Endpoints

### Base URL: `/finance/email`

#### 1. **Get Gmail OAuth URL**
```http
GET /finance/email/oauth/gmail/authorize
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?...",
  "message": "Redirect user to this URL to grant Gmail access"
}
```

#### 2. **Get Outlook OAuth URL**
```http
GET /finance/email/oauth/outlook/authorize
Authorization: Bearer <token>
```

#### 3. **OAuth Callbacks** (handled automatically)
```
GET /finance/email/oauth/gmail/callback?code=xxx&state=userId
GET /finance/email/oauth/outlook/callback?code=xxx&state=userId
```

#### 4. **Process Emails**
```http
POST /finance/email/process
Authorization: Bearer <token>
Content-Type: application/json

{
  "provider": "gmail",  // or "outlook"
  "daysBack": 7         // optional, default: 7
}
```

**Response:**
```json
{
  "success": true,
  "message": "Processed 15 emails successfully",
  "emailsProcessed": 15,
  "transactionsCreated": 12,
  "duplicatesSkipped": 2,
  "parseFailures": 1,
  "limitBreachAlerts": 1
}
```

#### 5. **Disconnect Email Account**
```http
DELETE /finance/email/disconnect/gmail
Authorization: Bearer <token>
```

#### 6. **Get Processing Statistics**
```http
GET /finance/email/stats
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalProcessed": 150,
    "successful": 142,
    "failed": 8,
    "duplicates": 25
  }
}
```

#### 7. **Get Supported Banks**
```http
GET /finance/email/supported-banks
Authorization: Bearer <token>
```

---

## Usage Flow

### User Setup (One-Time)

1. **Connect Email Account**
   ```
   GET /finance/email/oauth/gmail/authorize
   → User clicks authUrl
   → Grants read-only access
   → Redirected back with access token
   ```

2. **Process Historical Emails**
   ```
   POST /finance/email/process
   {
     "provider": "gmail",
     "daysBack": 30  // Fetch last 30 days
   }
   ```

3. **Automatic Processing** (Scheduled)
   - Set up cron job to run daily/hourly
   - Fetches new emails since last run
   - Creates transactions automatically

### Deduplication Logic

```
Email Received
    ↓
Check: Email message ID already processed?
  → YES: Skip
  → NO: Continue
    ↓
Parse email → Generate content hash
    ↓
Check: Content hash exists?
  → YES: Skip (duplicate transaction)
  → NO: Create transaction
    ↓
Record both message ID and content hash
```

### Content Hash Formula
```
SHA-256(amount|date|merchant|card)
```

Example:
```
Input: "5432.00|2026-01-31|AMAZON|1234"
Hash: "a3f8c9d..."
```

---

## Sample Bank Email Formats

### ICICI Bank
```
Subject: Alert: Card transaction for Rs 5,432.00
From: alerts@icicibank.com

Your ICICI Bank Credit Card ending 1234 has been used for 
Rs 5,432.00 at AMAZON on 31-Jan-26 at 14:30.
Available balance: Rs 89,568.00
```

### HDFC Bank
```
Subject: Transaction Alert on your HDFC Bank Credit Card
From: alerts@hdfcbank.com

Your HDFC Bank Credit Card ending 5678 is used for 
Rs.3,250.00 at ZOMATO on 31-01-26 at 19:45.
Available limit: Rs.96,750.00
```

### SBI
```
Subject: SBI Card Alert - Transaction
From: alerts@sbicard.com

Your SBI Credit Card ending 3456 used for Rs 4,567.89 
at FLIPKART on 31/01/26 at 10:15.
Available credit limit Rs 95,432.11
```

### Axis Bank
```
Subject: Axis Bank Credit Card - Transaction Alert
From: alerts@axisbank.com

Your Axis Bank Credit Card ending 2345 is debited with 
Rs.8,900.50 for a transaction at SWIGGY on 31-Jan-26
```

---

## Security & Compliance

### OAuth Scopes (Read-Only)
- **Gmail**: `https://www.googleapis.com/auth/gmail.readonly`
- **Outlook**: `https://graph.microsoft.com/Mail.Read`

### Token Storage
```typescript
// ❌ WRONG (Plaintext)
accessToken: "ya29.a0AfH6SMB..."

// ✅ CORRECT (Encrypted)
import crypto from 'crypto';
const encrypted = encrypt(token, process.env.ENCRYPTION_KEY);
```

### User Controls
- Users can disconnect anytime: `DELETE /email/disconnect/:provider`
- Tokens are revoked on server and provider side
- No emails stored permanently (only metadata)

### Filtered Email Types
**Fetched:**
- Transaction alerts
- Debit notifications
- Spending alerts

**Ignored:**
- OTP emails
- Marketing/promotional
- Statements
- Rewards/cashback campaigns

---

## Testing

### Run Test Suite
```bash
cd backend/src/modules/auth/finance/email/tests
ts-node emailParser.test.ts
```

### Expected Output
```
============================================================
EMAIL PARSER TEST SUITE
============================================================

📧 ICICI Bank Parser Tests:
  Test 1: ✅ PASS
    Amount: ₹5432, Merchant: AMAZON, Card: 1234
  Test 2: ✅ PASS
    Amount: ₹2150, Merchant: SWIGGY, Card: 4567
  Test 3: ✅ PASS (OTP email correctly ignored)

💳 HDFC Bank Parser Tests:
  Test 1: ✅ PASS
    Amount: ₹3250, Merchant: ZOMATO, Card: 5678
  Test 2: ✅ PASS
    Amount: ₹899, Merchant: NETFLIX, Card: 5432

🏦 SBI Parser Tests:
  Test 1: ✅ PASS
  Test 2: ✅ PASS

🔷 Axis Bank Parser Tests:
  Test 1: ✅ PASS
  Test 2: ✅ PASS

🚫 Non-Transaction Email Tests (should all return null):
  Test 1: ✅ PASS (OTP for ICICI Credit Card)
  Test 2: ✅ PASS (Exclusive Cashback Offer!)
  Test 3: ✅ PASS (Your Monthly Statement is Ready)
```

---

## Adding a New Bank Parser

### Step 1: Create Parser Class
```typescript
// parsers/kotakEmailParser.ts
import { IEmailParser, RawEmailData, ParsedEmailTransaction } from "../emailParser.interface";

export class KotakEmailParser implements IEmailParser {
  getBankName(): string {
    return "Kotak";
  }

  canParse(email: RawEmailData): boolean {
    return /@kotakbank\.com/i.test(email.from) && 
           /credit\s*card/i.test(email.body);
  }

  parse(email: RawEmailData): ParsedEmailTransaction | null {
    // Implement parsing logic
    // Return null for OTP/promotional emails
  }
}
```

### Step 2: Register in Factory
```typescript
// emailProcessing.service.ts
import { KotakEmailParser } from "./parsers/kotakEmailParser";

parserFactory.registerParser(new KotakEmailParser());
```

### Step 3: Add Test Cases
```typescript
// tests/emailParser.test.ts
export const kotakTestEmails: RawEmailData[] = [
  {
    messageId: "test-kotak-001",
    subject: "Kotak Credit Card Transaction",
    from: "alerts@kotakbank.com",
    body: "Your Kotak Credit Card ending 5678 debited Rs.2,500.00 at AMAZON",
    receivedDate: new Date("2026-01-31T10:00:00Z")
  }
];
```

---

## Production Deployment Checklist

### Environment Variables
```bash
# Gmail OAuth
GMAIL_CLIENT_ID=your_client_id
GMAIL_CLIENT_SECRET=your_client_secret
GMAIL_REDIRECT_URI=https://yourdomain.com/api/finance/email/oauth/gmail/callback

# Outlook OAuth
OUTLOOK_CLIENT_ID=your_client_id
OUTLOOK_CLIENT_SECRET=your_client_secret
OUTLOOK_REDIRECT_URI=https://yourdomain.com/api/finance/email/oauth/outlook/callback

# Encryption
ENCRYPTION_KEY=your_32_byte_encryption_key

# Frontend
FRONTEND_URL=https://yourdomain.com
```

### Dependencies
```bash
npm install googleapis @microsoft/microsoft-graph-client
```

### Database Indexes
```javascript
// Ensure indexes exist
EmailMetadata.index({ userId: 1, receivedDate: -1 });
EmailMetadata.index({ messageId: 1 }, { unique: true });
ProcessedEmail.index({ userId: 1, contentHash: 1 }, { unique: true });
```

### Cron Job (Auto-Process)
```javascript
// Run every hour to fetch new emails
const cron = require('node-cron');

cron.schedule('0 * * * *', async () => {
  const users = await User.find({ emailConnected: true });
  for (const user of users) {
    await processEmails(user._id, user.emailProvider, user.accessToken, 1);
  }
});
```

### Monitoring
- [ ] Alert on OAuth token expiration
- [ ] Track parsing failure rate
- [ ] Monitor duplicate rate (should be ~5-10%)
- [ ] Log API rate limit usage

---

## Limitations & Future Enhancements

### Current Limitations
- Manual OAuth setup required per user
- Gmail/Outlook APIs have rate limits
- Parsing depends on email format consistency
- No support for attachments (PDF statements)

### Future Enhancements
1. **ML-Based Parser** - Train model for unknown bank formats
2. **Smart Categorization** - Auto-categorize merchants (Food, Travel, etc.)
3. **PDF Statement Parsing** - Extract transactions from attachment PDFs
4. **Real-Time Webhooks** - Push notifications instead of polling
5. **Multi-Currency Support** - Parse international transactions
6. **Cashback/Rewards Tracking** - Parse reward emails
7. **EMI Detection** - Identify and track EMI transactions

---

## Support

For issues or questions:
- Check test suite output for parser errors
- Verify OAuth credentials and scopes
- Ensure email formats match expected patterns
- Review deduplication logs for hash collisions
