# Fix Google OAuth Redirect URI Error

## The Problem
Google is rejecting the OAuth request because it's receiving:
```
redirect_uri=https://productivity-tracker-jfib.vercel.app/auth/google/callback
```

But your backend `.env` has the correct value:
```
redirect_uri=https://productivity-tracker-jfib.vercel.app/api/oauth/google/callback
```

**Root Cause**: Vercel backend is using outdated environment variables.

---

## Solution: Update Vercel Environment Variables

### Step 1: Update Backend Environment Variable

1. Go to your Vercel dashboard: https://vercel.com/dashboard
2. Select your **backend project** (productivity-tracker-jfib)
3. Go to **Settings** → **Environment Variables**
4. Find `GOOGLE_REDIRECT_URI` and update it to:
   ```
   https://productivity-tracker-jfib.vercel.app/api/oauth/google/callback
   ```
5. Click **Save**

### Step 2: Update Google Cloud Console

You need to add the redirect URI to your Google OAuth Client:

1. Go to: https://console.cloud.google.com/apis/credentials
2. Click on your OAuth 2.0 Client ID
3. Under **Authorized redirect URIs**, add:
   ```
   https://productivity-tracker-jfib.vercel.app/api/oauth/google/callback
   ```
4. **Remove** the old one if it exists:
   ```
   https://productivity-tracker-jfib.vercel.app/auth/google/callback
   ```
5. Click **Save**

### Step 3: Redeploy Backend

After updating environment variables, you must redeploy:

```bash
cd backend
vercel --prod
```

Or trigger a redeploy from Vercel dashboard:
- Go to your backend project
- Click **Deployments**
- Click the **⋮** menu on the latest deployment
- Click **Redeploy**

---

## Alternative: Quick Fix via Vercel CLI

```bash
# Set the environment variable
vercel env add GOOGLE_REDIRECT_URI production
# When prompted, enter: https://productivity-tracker-jfib.vercel.app/api/oauth/google/callback

# Redeploy
cd backend
vercel --prod
```

---

## Verification

After updating and redeploying:

1. Clear browser cache/cookies
2. Go to: https://momentum12.vercel.app/login
3. Click "Continue with Google"
4. You should be redirected to Google's authorization page
5. After authorizing, you should be redirected back to your app

If you still see the error, check:
- Vercel environment variable is set correctly
- Google Console has the correct redirect URI
- Backend was redeployed after env var change

---

## All Required Environment Variables for Vercel Backend

Make sure these are all set in Vercel:

```
PORT=5002
NODE_ENV=production
MONGODB_URI=<your-mongodb-uri>
JWT_SECRET=<your-jwt-secret>
JWT_REFRESH_SECRET=<your-jwt-refresh-secret>
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
FRONTEND_URL=https://momentum12.vercel.app
GOOGLE_CLIENT_ID=<your-google-client-id>
GOOGLE_CLIENT_SECRET=<your-google-client-secret>
GOOGLE_REDIRECT_URI=https://productivity-tracker-jfib.vercel.app/api/oauth/google/callback
UPSTASH_REDIS_REST_URL=<your-redis-url>
UPSTASH_REDIS_REST_TOKEN=<your-redis-token>
BLOB_READ_WRITE_TOKEN=<your-blob-token>
```
