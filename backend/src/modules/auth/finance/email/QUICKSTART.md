# Email Parsing Module - Quick Reference

## ✅ Setup Complete!

All components are integrated and ready to use:

### What's Done:
- ✅ Email routes registered in [finance.routes.ts](../finance.routes.ts)
- ✅ Dependencies installed: `googleapis`, `@microsoft/microsoft-graph-client`  
- ✅ OAuth implementation with encrypted token storage
- ✅ All 5 bank parsers tested and passing
- ✅ Encryption key generated and configured

---

## 🔑 Required Environment Variables

Add these to your `.env` file:

```env
# Gmail OAuth - Get from: https://console.cloud.google.com/
GMAIL_CLIENT_ID=your_gmail_client_id_here
GMAIL_CLIENT_SECRET=your_gmail_client_secret_here
GMAIL_REDIRECT_URI=http://localhost:5001/api/finance/email/oauth/gmail/callback

# Outlook OAuth - Get from: https://portal.azure.com/
OUTLOOK_CLIENT_ID=your_outlook_client_id_here
OUTLOOK_CLIENT_SECRET=your_outlook_client_secret_here
OUTLOOK_REDIRECT_URI=http://localhost:5001/api/finance/email/oauth/outlook/callback

# Frontend (already set)
FRONTEND_URL=http://localhost:5173

# Encryption (already generated)
ENCRYPTION_KEY=75888d4f2679a81dee7cf659165da6de83df13ffefac7619e58669e97693dcae
```

---

## 📖 Getting OAuth Credentials

### Gmail (Google Cloud Console):
1. Go to https://console.cloud.google.com/
2. Create project → Enable Gmail API
3. Create OAuth client ID (Web application)
4. Add redirect URI: `http://localhost:5001/api/finance/email/oauth/gmail/callback`
5. Copy Client ID and Client Secret to .env

### Outlook (Azure Portal):
1. Go to https://portal.azure.com/
2. Azure AD → App registrations → New registration
3. Add redirect URI: `http://localhost:5001/api/finance/email/oauth/outlook/callback`
4. Create client secret
5. Add API permission: `Mail.Read` (Microsoft Graph)
6. Copy Application ID and Client Secret to .env

**Detailed guide**: See [SETUP.md](SETUP.md)

---

## 🧪 Test Results

**Parser Test Suite**: ✅ All 15 tests passed

```
📧 ICICI Bank: ✅ 3/3 tests passed
💳 HDFC Bank: ✅ 2/2 tests passed  
🏦 SBI: ✅ 2/2 tests passed
🔷 Axis Bank: ✅ 2/2 tests passed
🚫 Non-transaction filtering: ✅ 3/3 tests passed
```

Run tests anytime:
```bash
npx ts-node src/modules/auth/finance/email/tests/emailParser.test.ts
```

---

## 🚀 API Endpoints

Base URL: `http://localhost:5001/api/finance/email`

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/oauth/gmail/authorize` | GET | Get Gmail OAuth URL |
| `/oauth/outlook/authorize` | GET | Get Outlook OAuth URL |
| `/oauth/gmail/callback` | GET | OAuth callback (auto) |
| `/oauth/outlook/callback` | GET | OAuth callback (auto) |
| `/process` | POST | Process emails |
| `/disconnect/:provider` | DELETE | Disconnect account |
| `/stats` | GET | Processing statistics |
| `/supported-banks` | GET | List supported banks |

---

## 💡 Quick Start

Once you add OAuth credentials:

1. **Connect Gmail**:
   ```bash
   GET /api/finance/email/oauth/gmail/authorize
   # Returns authUrl → Open in browser → Grant access
   ```

2. **Process Emails**:
   ```bash
   POST /api/finance/email/process
   {
     "provider": "gmail",
     "daysBack": 7
   }
   ```

3. **View Results**:
   - New transactions created automatically
   - Duplicates skipped
   - Monthly spending updated
   - Limit breach alerts sent

---

## 🏦 Supported Banks

- ✅ ICICI Bank (`@icicibank.com`)
- ✅ HDFC Bank (`@hdfcbank.com`, `@hdfcbank.net`)
- ✅ SBI / SBI Cards (`@sbi.co.in`, `@sbicard.com`)
- ✅ Axis Bank (`@axisbank.com`)
- ✅ Generic fallback (other banks)

---

## 📚 Documentation

- **Setup Guide**: [SETUP.md](SETUP.md) - Detailed OAuth setup
- **Full Documentation**: [README.md](README.md) - Complete module docs
- **Parsers**: `parsers/*.ts` - Bank-specific parsing logic
- **Tests**: `tests/emailParser.test.ts` - Sample emails

---

## 🔒 Security

- **Read-only scopes**: `gmail.readonly`, `Mail.Read`
- **Encrypted storage**: AES-256-GCM encryption
- **Auto token refresh**: Handles expired tokens
- **User control**: Disconnect anytime
- **No OTP parsing**: Security-sensitive emails filtered

---

## 🐛 Troubleshooting

**"Invalid redirect_uri"**:  
→ Ensure .env URIs match Google/Azure console exactly

**"No token found"**:  
→ User must authorize first (call `/oauth/.../authorize`)

**Parser not detecting**:  
→ Check sender domain and subject keywords

**Encryption error**:  
→ Verify ENCRYPTION_KEY is 64 hex characters

---

## 📦 Next Steps

1. Add OAuth credentials to .env (see above)
2. Test OAuth flow with your account
3. Build frontend UI for email connection
4. Set up cron job for auto-processing

**Server running at**: http://localhost:5001  
**All routes available under**: `/api/finance/email/*`
