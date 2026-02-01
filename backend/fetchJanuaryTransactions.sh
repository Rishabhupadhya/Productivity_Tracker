#!/bin/bash

# Fetch January Credit Card Transactions from Emails
# This script provides an easy way to fetch and process January emails

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║   📧 Fetch January Credit Card Transactions from Emails   ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Check if server is running
echo "🔍 Checking if backend server is running..."
if curl -s http://localhost:5001/api/finance/supported-banks > /dev/null 2>&1; then
    echo "✅ Backend server is running"
else
    echo "❌ Backend server is not running!"
    echo "   Please start the server first: cd backend && npm run dev"
    exit 1
fi

# Get JWT token
echo ""
echo "🔐 Step 1: Login to get JWT token"
echo ""
read -p "Enter your email: " USER_EMAIL
read -sp "Enter your password: " USER_PASSWORD
echo ""

# Login and get token
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$USER_EMAIL\",\"password\":\"$USER_PASSWORD\"}")

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo "❌ Login failed! Check your credentials."
    echo "Response: $LOGIN_RESPONSE"
    exit 1
fi

echo "✅ Login successful!"
echo ""

# Choose provider
echo "📧 Step 2: Select email provider"
echo "   1. Gmail"
echo "   2. Outlook"
read -p "Enter choice (1 or 2): " PROVIDER_CHOICE

if [ "$PROVIDER_CHOICE" = "1" ]; then
    PROVIDER="gmail"
else
    PROVIDER="outlook"
fi

echo ""
echo "Selected: $PROVIDER"
echo ""

# Check if already connected
echo "🔍 Checking if $PROVIDER is connected..."

# Try to get OAuth URL (if not connected, this will return the auth URL)
AUTH_RESPONSE=$(curl -s http://localhost:5001/api/finance/email/oauth/$PROVIDER/authorize \
  -H "Authorization: Bearer $TOKEN")

AUTH_URL=$(echo $AUTH_RESPONSE | grep -o '"authUrl":"[^"]*' | cut -d'"' -f4)

if [ ! -z "$AUTH_URL" ]; then
    echo ""
    echo "⚠️  $PROVIDER not connected yet!"
    echo ""
    echo "📝 Step 3: Authorize your $PROVIDER account"
    echo ""
    echo "🔗 Open this URL in your browser:"
    echo "$AUTH_URL"
    echo ""
    echo "📌 Instructions:"
    echo "   1. Copy the URL above"
    echo "   2. Open it in your browser"
    echo "   3. Login and grant permission"
    echo "   4. You'll be redirected back automatically"
    echo ""
    read -p "⏳ After authorizing, press Enter to continue..."
    echo ""
fi

# Process emails
echo "📅 Step 4: Fetching emails from January 2026..."
echo ""

# Calculate days back (from Jan 1 to Feb 1 = 31 days)
DAYS_BACK=31

echo "⚙️  Processing $DAYS_BACK days of emails..."
echo ""

PROCESS_RESPONSE=$(curl -s -X POST http://localhost:5001/api/finance/email/process \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"provider\":\"$PROVIDER\",\"daysBack\":$DAYS_BACK}")

# Parse results
SUCCESS=$(echo $PROCESS_RESPONSE | grep -o '"success":[^,}]*' | cut -d':' -f2)
EMAILS_PROCESSED=$(echo $PROCESS_RESPONSE | grep -o '"emailsProcessed":[^,}]*' | cut -d':' -f2)
TRANSACTIONS_CREATED=$(echo $PROCESS_RESPONSE | grep -o '"transactionsCreated":[^,}]*' | cut -d':' -f2)
DUPLICATES_SKIPPED=$(echo $PROCESS_RESPONSE | grep -o '"duplicatesSkipped":[^,}]*' | cut -d':' -f2)
PARSE_FAILURES=$(echo $PROCESS_RESPONSE | grep -o '"parseFailures":[^,}]*' | cut -d':' -f2)
LIMIT_BREACH_ALERTS=$(echo $PROCESS_RESPONSE | grep -o '"limitBreachAlerts":[^,}]*' | cut -d':' -f2)

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                     📊 RESULTS                             ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "✅ Success: $SUCCESS"
echo "📧 Emails processed: $EMAILS_PROCESSED"
echo "💳 Transactions created: $TRANSACTIONS_CREATED"
echo "🔄 Duplicates skipped: $DUPLICATES_SKIPPED"
echo "❌ Parse failures: $PARSE_FAILURES"
echo "⚠️  Limit breach alerts: $LIMIT_BREACH_ALERTS"
echo ""

if [ "$TRANSACTIONS_CREATED" != "0" ] && [ ! -z "$TRANSACTIONS_CREATED" ]; then
    echo "🎉 Successfully fetched January transactions!"
    echo "   Check your database for new transaction records."
elif [ "$EMAILS_PROCESSED" = "0" ]; then
    echo "⚠️  No emails found from January."
    echo "   Make sure your bank sends transaction alerts to this email."
elif [ "$DUPLICATES_SKIPPED" = "$EMAILS_PROCESSED" ]; then
    echo "✅ All emails already processed (no duplicates created)."
else
    echo "⚠️  Some emails could not be parsed."
    echo "   Check server logs for details."
fi

echo ""
echo "Full response:"
echo "$PROCESS_RESPONSE"
echo ""
