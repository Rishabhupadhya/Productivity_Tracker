# 📧 Fetch January Credit Card Transactions

## Quick Start (2 options)

### Option 1: Using Shell Script (Easiest)

```bash
cd backend
./fetchJanuaryTransactions.sh
```

**What it does:**
1. Checks if backend is running
2. Logs you in (asks for email/password)
3. Connects your Gmail/Outlook (if not connected)
4. Fetches all January emails (31 days back)
5. Creates transactions from bank alerts
6. Shows you the results

---

### Option 2: Manual API Calls

#### Step 1: Login and Get Token

```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com","password":"yourpassword"}'
```

Save the `token` from response.

#### Step 2: Connect Email Account (First Time Only)

**For Gmail:**
```bash
curl http://localhost:5001/api/finance/email/oauth/gmail/authorize \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**For Outlook:**
```bash
curl http://localhost:5001/api/finance/email/oauth/outlook/authorize \
  -H "Authorization: Bearer YOUR_TOKEN"
```

- Copy the `authUrl` from response
- Open in browser
- Login and grant permission
- You'll be redirected back (token saved automatically)

#### Step 3: Fetch January Emails

```bash
curl -X POST http://localhost:5001/api/finance/email/process \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "gmail",
    "daysBack": 31
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Processed 45 emails successfully",
  "emailsProcessed": 45,
  "transactionsCreated": 38,
  "duplicatesSkipped": 5,
  "parseFailures": 2,
  "limitBreachAlerts": 1
}
```

---

## Option 3: Using TypeScript Script

```bash
cd backend
npx ts-node src/modules/auth/finance/email/fetchJanuaryEmails.ts
```

**Interactive script that:**
1. Asks for your User ID
2. Chooses email provider
3. Handles OAuth authorization
4. Fetches January emails
5. Shows detailed results

---

## What Happens

### During Processing:

1. **Fetch emails** from Gmail/Outlook API
   - Only bank domains: icicibank.com, hdfcbank.com, sbi.co.in, axisbank.com
   - Only transaction keywords: "transaction", "alert", "spent", "debited"
   - Excludes OTP, promotional, statement emails

2. **Parse each email** with bank-specific parser
   - Extracts: amount, merchant, card last 4 digits, date, time
   - Example: "Rs 5,432.00 at AMAZON on 31-Jan-26"

3. **Check for duplicates**
   - By email message ID (skip if already processed)
   - By transaction hash (amount+date+merchant+card)

4. **Match credit card**
   - Finds your card by last 4 digits
   - If multiple matches, uses first one

5. **Create transaction**
   - Saves to Finance collection
   - Updates monthly spending
   - Checks limit breach

6. **Send alerts** (if limit exceeded)

---

## Expected Results

### ✅ Success Scenario:
```
📧 Emails processed: 45
💳 Transactions created: 38
🔄 Duplicates skipped: 5
❌ Parse failures: 2
⚠️  Limit breach alerts: 1
```

**Meaning:**
- Found 45 transaction alert emails
- Created 38 new transactions
- 5 were already processed (no duplicates)
- 2 emails couldn't be parsed (maybe non-standard format)
- 1 card exceeded monthly limit

---

### ⚠️ No Emails Found:
```
📧 Emails processed: 0
💳 Transactions created: 0
```

**Possible reasons:**
1. No bank emails in January
2. Email provider connection failed
3. Bank domain not in filter list
4. OAuth token expired

**Fix:**
- Check if you received bank emails in January
- Verify email is connected (check EmailOAuthToken collection)
- Try re-authorizing OAuth

---

### 🔄 All Duplicates:
```
📧 Emails processed: 15
💳 Transactions created: 0
🔄 Duplicates skipped: 15
```

**Meaning:**
- All emails were already processed before
- No new transactions created (good!)
- Deduplication working correctly

---

## Troubleshooting

### "Unauthorized" / "No token found"
**Fix:** Re-run OAuth authorization flow
```bash
curl http://localhost:5001/api/finance/email/oauth/gmail/authorize \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### "Invalid grant" / "Token expired"
**Fix:** Token expired, re-authorize
- OAuth tokens expire after 1 hour
- Script will auto-refresh if refresh token exists

### "No credit card matched"
**Fix:** Add credit cards first
```bash
curl -X POST http://localhost:5001/api/finance/credit-cards \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "cardName": "HDFC Regalia",
    "lastFourDigits": "5678",
    "creditLimit": 200000,
    "monthlyLimit": 50000
  }'
```

### "Parse failure"
**Fix:** Check email format
- Run parser tests: `npx ts-node src/modules/auth/finance/email/tests/emailParser.test.ts`
- If your bank format differs, add a custom parser

---

## Verify Transactions Created

### Check MongoDB:
```bash
mongo productivity_tracker
db.finances.find({ userId: "YOUR_USER_ID", date: { $gte: new Date("2026-01-01") } }).pretty()
```

### Check via API:
```bash
curl http://localhost:5001/api/finance/transactions?startDate=2026-01-01&endDate=2026-01-31 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Run Again Later

You can run this anytime to fetch new emails:

```bash
# Fetch last 7 days
curl -X POST http://localhost:5001/api/finance/email/process \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"provider": "gmail", "daysBack": 7}'

# Fetch last 30 days
curl -X POST http://localhost:5001/api/finance/email/process \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"provider": "gmail", "daysBack": 30}'
```

**Safe to run multiple times** - duplicates are automatically skipped!

---

## Automated Processing (Optional)

Set up a cron job to fetch emails daily:

```bash
# Add to crontab (crontab -e)
0 1 * * * cd /path/to/backend && ./fetchJanuaryTransactions.sh >> /var/log/email-fetch.log 2>&1
```

This will:
- Run daily at 1 AM
- Fetch yesterday's emails
- Create new transactions
- Skip duplicates automatically

---

## Need Help?

Check these files:
- **[README.md](src/modules/auth/finance/email/README.md)** - Full documentation
- **[SETUP.md](src/modules/auth/finance/email/SETUP.md)** - OAuth setup
- **[QUICKSTART.md](src/modules/auth/finance/email/QUICKSTART.md)** - Quick reference

Or check server logs:
```bash
cd backend
tail -f logs/combined.log
```
