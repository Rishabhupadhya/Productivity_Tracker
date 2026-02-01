# Email Parsing Module - Setup Guide

## ✅ Completed Steps

1. **Email routes registered** in [finance.routes.ts](../finance.routes.ts)
2. **Dependencies installed**: `googleapis`, `@microsoft/microsoft-graph-client`
3. **OAuth implementation complete** with encrypted token storage
4. **All parsers tested** and working ✅
5. **Encryption key generated** and added to .env

---

## 🔑 Next Steps: OAuth Credentials Setup

To use the email parsing module, you need OAuth credentials from Google and Microsoft.

### 📧 Gmail OAuth Setup

1. **Go to Google Cloud Console**: https://console.cloud.google.com/

2. **Create a new project** (or select existing)
   - Click "Select a project" → "New Project"
   - Name: "Credit Card Intelligence" or similar
   - Click "Create"

3. **Enable Gmail API**
   - Go to "APIs & Services" → "Library"
   - Search for "Gmail API"
   - Click "Enable"

4. **Create OAuth Credentials**
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth client ID"
   - Application type: "Web application"
   - Name: "Credit Card Email Parser"
   - **Authorized redirect URIs**: Add this exact URL:
     ```
     http://localhost:5001/api/finance/email/oauth/gmail/callback
     ```
   - Click "Create"

5. **Copy credentials to .env**
   - You'll see "Client ID" and "Client Secret"
   - Update your `.env` file:
     ```env
     GMAIL_CLIENT_ID=your_actual_client_id_here.apps.googleusercontent.com
     GMAIL_CLIENT_SECRET=your_actual_client_secret_here
     ```

6. **Configure OAuth Consent Screen** (if not done)
   - Go to "OAuth consent screen"
   - User Type: "External" (for testing)
   - Fill in app name, support email
   - Add scope: `https://www.googleapis.com/auth/gmail.readonly`
   - Add yourself as test user

---

### 📧 Outlook OAuth Setup

1. **Go to Azure Portal**: https://portal.azure.com/

2. **Register an application**
   - Navigate to "Azure Active Directory" → "App registrations"
   - Click "New registration"
   - Name: "Credit Card Email Parser"
   - Supported account types: "Accounts in any organizational directory and personal Microsoft accounts"
   - **Redirect URI**: 
     - Platform: "Web"
     - URI: `http://localhost:5001/api/finance/email/oauth/outlook/callback`
   - Click "Register"

3. **Create Client Secret**
   - In your app, go to "Certificates & secrets"
   - Click "New client secret"
   - Description: "Email Parser Secret"
   - Expires: 24 months
   - Click "Add"
   - **Copy the VALUE immediately** (you can't see it again!)

4. **Configure API Permissions**
   - Go to "API permissions"
   - Click "Add a permission"
   - Select "Microsoft Graph"
   - Select "Delegated permissions"
   - Search and add: `Mail.Read`
   - Click "Add permissions"

5. **Copy credentials to .env**
   - Application (client) ID from "Overview" page
   - Client secret VALUE you copied earlier
   - Update your `.env` file:
     ```env
     OUTLOOK_CLIENT_ID=your_actual_client_id_here
     OUTLOOK_CLIENT_SECRET=your_actual_client_secret_here
     ```

---

## 📝 Environment Variables Summary

Your `.env` file should look like this:

```env
# Existing variables
PORT=5001
MONGO_URI=mongodb://localhost:27017/productivity_tracker
JWT_SECRET=super_secure_jwt_secret
NODE_ENV=development

# Gmail OAuth Configuration
GMAIL_CLIENT_ID=123456789-abc.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=GOCSPX-your_secret_here
GMAIL_REDIRECT_URI=http://localhost:5001/api/finance/email/oauth/gmail/callback

# Outlook OAuth Configuration
OUTLOOK_CLIENT_ID=12345678-1234-1234-1234-123456789abc
OUTLOOK_CLIENT_SECRET=your_secret_value_here
OUTLOOK_REDIRECT_URI=http://localhost:5001/api/finance/email/oauth/outlook/callback

# Frontend URL (for redirects after OAuth)
FRONTEND_URL=http://localhost:5173

# Token Encryption (already generated)
ENCRYPTION_KEY=75888d4f2679a81dee7cf659165da6de83df13ffefac7619e58669e97693dcae
```

---

## 🧪 Testing the Email Parser

### 1. Test Parsers (Already Done ✅)
```bash
cd backend
npx ts-node src/modules/auth/finance/email/tests/emailParser.test.ts
```

**Result**: All 15 tests passed! 🎉

### 2. Test OAuth Flow (After adding credentials)

#### Step 1: Get Authorization URL
```bash
curl http://localhost:5001/api/finance/email/oauth/gmail/authorize \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Response:
```json
{
  "success": true,
  "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?...",
  "message": "Redirect user to this URL to grant Gmail access"
}
```

#### Step 2: Authorize in Browser
- Copy the `authUrl` from response
- Open in browser
- Login and grant permission
- You'll be redirected back to your app

#### Step 3: Process Emails
```bash
curl -X POST http://localhost:5001/api/finance/email/process \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "gmail",
    "daysBack": 7
  }'
```

Response:
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

---

## 📊 API Endpoints Available

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/finance/email/oauth/gmail/authorize` | Get Gmail OAuth URL |
| `GET` | `/api/finance/email/oauth/outlook/authorize` | Get Outlook OAuth URL |
| `GET` | `/api/finance/email/oauth/gmail/callback` | OAuth callback (automatic) |
| `GET` | `/api/finance/email/oauth/outlook/callback` | OAuth callback (automatic) |
| `POST` | `/api/finance/email/process` | Process emails |
| `DELETE` | `/api/finance/email/disconnect/:provider` | Disconnect account |
| `GET` | `/api/finance/email/stats` | Get processing stats |
| `GET` | `/api/finance/email/supported-banks` | List supported banks |

---

## 🔒 Security Features

✅ **Read-only access**: Gmail and Outlook use read-only scopes  
✅ **Encrypted tokens**: All OAuth tokens encrypted with AES-256-GCM  
✅ **Token auto-refresh**: Expired tokens refreshed automatically  
✅ **User revocation**: Users can disconnect anytime  
✅ **No OTP parsing**: OTP emails filtered out  
✅ **Deduplication**: Prevents duplicate transactions  

---

## 🐛 Troubleshooting

### OAuth Error: "redirect_uri_mismatch"
- **Fix**: Ensure redirect URIs in .env **exactly match** those in Google Cloud Console/Azure Portal
- Check for trailing slashes, http vs https

### OAuth Error: "invalid_client"
- **Fix**: Double-check CLIENT_ID and CLIENT_SECRET in .env
- Ensure no extra spaces or quotes

### Parser Not Detecting Emails
- **Check**: Bank sender domain in parser's `canParse()` method
- **Check**: Subject line keywords match
- Run test suite to verify parser logic

### Token Encryption Error
- **Fix**: Ensure ENCRYPTION_KEY is exactly 64 hex characters (32 bytes)
- Run `node generate-encryption-key.js` to get a new key

---

## 📦 Supported Banks

Currently supported:
- ✅ ICICI Bank
- ✅ HDFC Bank
- ✅ SBI / SBI Cards
- ✅ Axis Bank
- ✅ Generic fallback (other banks)

To add more banks, see [README.md](README.md#adding-a-new-bank-parser)

---

## 🎯 Production Checklist

Before deploying to production:

- [ ] Replace `localhost` URLs in .env with production URLs
- [ ] Update OAuth redirect URIs in Google/Microsoft consoles
- [ ] Set up SSL/HTTPS for callback URLs
- [ ] Store ENCRYPTION_KEY securely (AWS Secrets Manager, etc.)
- [ ] Enable OAuth consent screen for all users (not just test users)
- [ ] Set up monitoring for token refresh failures
- [ ] Add rate limiting to email processing endpoint
- [ ] Consider webhook support for real-time processing
- [ ] Set up email alerts for parsing failures

---

## 🚀 What's Working

✅ Email routes registered in main app  
✅ OAuth authentication with encryption  
✅ 5 bank parsers tested and working  
✅ Deduplication system implemented  
✅ Token auto-refresh implemented  
✅ Secure token storage with AES-256-GCM  

## 🔜 What's Next

1. Add OAuth credentials (see above)
2. Test OAuth flow
3. Build frontend UI for email connection
4. Set up automatic email processing (cron job)

---

**Need Help?** Check the main [README.md](README.md) for detailed documentation.
