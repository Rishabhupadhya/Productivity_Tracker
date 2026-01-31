# EmailJS Setup Guide

## 📧 How to Enable Email Invites

### Step 1: Create EmailJS Account
1. Go to [https://www.emailjs.com/](https://www.emailjs.com/)
2. Sign up for a free account
3. Verify your email

### Step 2: Add Email Service
1. Go to **Email Services** in dashboard
2. Click **Add New Service**
3. Choose your email provider (Gmail recommended for testing)
4. Follow the connection steps
5. Copy your **Service ID**

### Step 3: Create Email Template
1. Go to **Email Templates**
2. Click **Create New Template**
3. Use this template:

**Subject:**
```
You've been invited to {{team_name}} on Productivity Tracker!
```

**Body:**
```
Hi {{to_name}},

{{inviter_name}} has invited you to join the team "{{team_name}}" as a {{role}}.

🎯 To get started:
1. Click here to accept: {{accept_url}}
2. If you don't have an account, you can register with this email

Team: {{team_name}}
Role: {{role}}

Thanks,
Productivity Tracker Team

---
App: {{app_url}}
```

4. Copy your **Template ID**

### Step 4: Get Public Key
1. Go to **Account** → **General**
2. Find your **Public Key**
3. Copy it

### Step 5: Configure Your App
1. Create `.env` file in `frontend` folder:
```bash
cp .env.example .env
```

2. Edit `.env` and add your credentials:
```env
VITE_EMAILJS_SERVICE_ID=service_xxxxxxx
VITE_EMAILJS_TEMPLATE_ID=template_xxxxxxx
VITE_EMAILJS_PUBLIC_KEY=your_public_key_here
```

3. Restart your dev server:
```bash
npm run dev
```

### Step 6: Test It!
1. Go to Teams workspace
2. Select a team
3. Click "👥 View" → "+ Invite"
4. Enter an email address
5. Click "Send Invite"
6. ✅ Check the recipient's inbox!

## 📝 Notes
- Free tier: 200 emails/month
- No credit card required for free tier
- Works without backend SMTP setup
- Emails send from your connected email account

## 🔧 Troubleshooting
- **"Email notification failed"** → Check your credentials in `.env`
- **No email received** → Check spam folder
- **Template errors** → Make sure all variables match: `{{to_name}}`, `{{team_name}}`, etc.

Enjoy! 🚀
