# 🔑 OAuth Setup Instructions

## Environment Variables Needed

Add these to your `/backend/.env` file:

```env
# Gmail OAuth Configuration
GMAIL_CLIENT_ID=your_gmail_client_id_here
GMAIL_CLIENT_SECRET=your_gmail_client_secret_here
GMAIL_REDIRECT_URI=http://localhost:5001/api/finance/email/oauth/gmail/callback

# Outlook OAuth Configuration
OUTLOOK_CLIENT_ID=your_outlook_client_id_here
OUTLOOK_CLIENT_SECRET=your_outlook_client_secret_here
OUTLOOK_REDIRECT_URI=http://localhost:5001/api/finance/email/oauth/outlook/callback

# Frontend URL
FRONTEND_URL=http://localhost:5173

# Encryption Key (ALREADY ADDED ✅)
ENCRYPTION_KEY=75888d4f2679a81dee7cf659165da6de83df13ffefac7619e58669e97693dcae
```

---

## 📧 Gmail OAuth Setup (5 minutes)

### Step 1: Go to Google Cloud Console
Visit: https://console.cloud.google.com/

### Step 2: Create/Select Project
- Click "Select a project" → "New Project"
- Name: "Credit Card Intelligence" (or any name)
- Click "Create"

### Step 3: Enable Gmail API
- Menu → "APIs & Services" → "Library"
- Search: "Gmail API"
- Click "Enable"

### Step 4: Create OAuth Credentials
- Go to "APIs & Services" → "Credentials"
- Click "Create Credentials" → "OAuth client ID"
- If asked, configure "OAuth consent screen":
  - User Type: "External"
  - App name: "Credit Card Intelligence"
  - Support email: your@email.com
  - Scopes: Add `https://www.googleapis.com/auth/gmail.readonly`
  - Test users: Add yourself
  - Save

- Back to "Create OAuth client ID":
  - Application type: **Web application**
  - Name: "Email Parser"
  - **Authorized redirect URIs**: Add exactly:
    ```
    http://localhost:5001/api/finance/email/oauth/gmail/callback
    ```
  - Click "Create"

### Step 5: Copy Credentials
You'll see a popup with:
- **Client ID**: Looks like `123456789-abc123.apps.googleusercontent.com`
- **Client Secret**: Looks like `GOCSPX-abc123xyz`

Add to `.env`:
```env
GMAIL_CLIENT_ID=123456789-abc123.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=GOCSPX-abc123xyz
```

---

## 📧 Outlook OAuth Setup (5 minutes)

### Step 1: Go to Azure Portal
Visit: https://portal.azure.com/

### Step 2: Register Application
- Menu → "Azure Active Directory"
- "App registrations" → "New registration"
- Name: "Credit Card Intelligence"
- Supported account types: **Accounts in any organizational directory and personal Microsoft accounts**
- **Redirect URI**:
  - Platform: Web
  - URI: `http://localhost:5001/api/finance/email/oauth/outlook/callback`
- Click "Register"

### Step 3: Create Client Secret
- In your new app, go to "Certificates & secrets"
- Click "New client secret"
- Description: "Email Parser Secret"
- Expires: 24 months
- Click "Add"
- **IMMEDIATELY COPY THE VALUE** (you can't see it again!)

### Step 4: Add API Permissions
- Go to "API permissions"
- Click "Add a permission"
- Select "Microsoft Graph"
- Select "Delegated permissions"
- Search and check: `Mail.Read`
- Click "Add permissions"

### Step 5: Copy Credentials
- **Application (client) ID**: Found on "Overview" page (looks like `12345678-1234-1234-1234-123456789abc`)
- **Client secret**: The value you copied in Step 3

Add to `.env`:
```env
OUTLOOK_CLIENT_ID=12345678-1234-1234-1234-123456789abc
OUTLOOK_CLIENT_SECRET=the_secret_value_you_copied
```

---

## ✅ Verification

Your complete `.env` file should now look like:

```env
# Existing variables
PORT=5001
MONGO_URI=mongodb://localhost:27017/productivity_tracker
JWT_SECRET=super_secure_jwt_secret
NODE_ENV=development

# Gmail OAuth
GMAIL_CLIENT_ID=123456789-abc123.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=GOCSPX-abc123xyz
GMAIL_REDIRECT_URI=http://localhost:5001/api/finance/email/oauth/gmail/callback

# Outlook OAuth
OUTLOOK_CLIENT_ID=12345678-1234-1234-1234-123456789abc
OUTLOOK_CLIENT_SECRET=your_outlook_secret_value
OUTLOOK_REDIRECT_URI=http://localhost:5001/api/finance/email/oauth/outlook/callback

# Frontend
FRONTEND_URL=http://localhost:5173

# Encryption (already set)
ENCRYPTION_KEY=75888d4f2679a81dee7cf659165da6de83df13ffefac7619e58669e97693dcae
```

---

## 🧪 Test It

After adding credentials, restart your server and test:

```bash
# Get OAuth URL
curl http://localhost:5001/api/finance/email/oauth/gmail/authorize \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Response will contain authUrl - open it in browser to authorize
```

---

## 🐛 Troubleshooting

### "redirect_uri_mismatch"
- Ensure URI in .env **exactly matches** the one in Google Cloud Console/Azure Portal
- No trailing slashes
- Check http vs https

### "invalid_client"
- Double-check CLIENT_ID and CLIENT_SECRET have no extra spaces
- Ensure you copied the entire secret value

### "access_denied"
- Add yourself as a test user in OAuth consent screen (Google)
- Ensure Mail.Read permission is granted (Outlook)

---

## 🎯 What Happens After OAuth?

1. User clicks authorize link
2. Redirected to Google/Microsoft login
3. User grants permission
4. Redirected back to your app with authorization code
5. Backend exchanges code for access token
6. Token encrypted and stored in MongoDB
7. User redirected to frontend success page

---

## 📖 More Info

- **Full Setup Guide**: [SETUP.md](SETUP.md)
- **Quick Reference**: [QUICKSTART.md](QUICKSTART.md)
- **Module Documentation**: [README.md](README.md)

---

**Need Help?** Check the links above or search "Google OAuth 2.0 setup" / "Azure AD OAuth setup"
