# Google SSO Deployment Checklist ✅

## Critical Fixes Applied
- ✅ Fixed `GOOGLE_REDIRECT_URI` in backend `.env` to use correct path: `/api/oauth/google/callback`
- ✅ Fixed OAuth controller to redirect to `/auth/callback` instead of `/dashboard`

---

## 1. Google Cloud Console Configuration

### Required Redirect URIs in Google Console
Add **BOTH** of these to your Google OAuth Client:

1. **Production Backend Callback** (Primary):
   ```
   https://productivity-tracker-jfib.vercel.app/api/oauth/google/callback
   ```

2. **Development Backend Callback** (Optional, for local testing):
   ```
   http://localhost:5002/api/oauth/google/callback
   ```

### Authorized JavaScript Origins
Add these origins to allow your frontend to initiate OAuth:
```
https://momentum12.vercel.app
https://productivity-tracker-jfib.vercel.app
http://localhost:5173  (for local development)
```

### How to Update Google Console
1. Go to: https://console.cloud.google.com/apis/credentials
2. Select your OAuth 2.0 Client ID (from your .env file)
3. Add the redirect URIs listed above
4. Click **Save**

---

## 2. Backend Vercel Environment Variables

Verify these are set in your Vercel backend project settings:

```bash
# Database
MONGODB_URI=<your-mongodb-uri>

# JWT
JWT_SECRET=<your-secret>
JWT_REFRESH_SECRET=<your-refresh-secret>
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Environment
NODE_ENV=production
FRONTEND_URL=<your-frontend-url>

# Google OAuth
GOOGLE_CLIENT_ID=<your-google-client-id>
GOOGLE_CLIENT_SECRET=<your-google-client-secret>
GOOGLE_REDIRECT_URI=<your-backend-url>/api/oauth/google/callback

# Redis (Upstash)
UPSTASH_REDIS_REST_URL=<your-redis-url>
UPSTASH_REDIS_REST_TOKEN=<your-redis-token>

# File Storage
BLOB_READ_WRITE_TOKEN=<your-token>
```

---

## 3. Frontend Vercel Environment Variables

Verify these are set in your Vercel frontend project settings:

```bash
VITE_API_URL=https://productivity-tracker-jfib.vercel.app/api
```

---

## 4. OAuth Flow Verification

### Complete Flow Path
1. **User clicks** "Continue with Google" button on `/login` page
2. **Frontend** sends GET request to: `https://productivity-tracker-jfib.vercel.app/api/oauth/google`
3. **Backend** generates Google auth URL and returns it
4. **Frontend** redirects browser to Google's authorization page
5. **User** approves permissions on Google
6. **Google** redirects to: `https://productivity-tracker-jfib.vercel.app/api/oauth/google/callback?code=...&state=...`
7. **Backend** exchanges code for tokens, creates/finds user, generates JWT tokens
8. **Backend** redirects to: `https://momentum12.vercel.app/auth/callback?token=...&refresh_token=...&new_user=...`
9. **Frontend** OAuthCallback component stores tokens in localStorage
10. **Frontend** refreshes user data and redirects to `/dashboard`

### URL Endpoints Summary
| Purpose | URL | Type |
|---------|-----|------|
| Initiate OAuth | `https://productivity-tracker-jfib.vercel.app/api/oauth/google` | Backend API |
| Google Callback | `https://productivity-tracker-jfib.vercel.app/api/oauth/google/callback` | Backend API |
| Frontend Callback | `https://momentum12.vercel.app/auth/callback` | Frontend Route |

---

## 5. Test OAuth Flow

### Manual Testing Steps
1. **Clear cookies/localStorage** in browser
2. **Navigate to**: https://momentum12.vercel.app/login
3. **Click** "Continue with Google" button
4. **Verify** you're redirected to Google authorization page
5. **Sign in** with your Google account
6. **Approve** permissions
7. **Verify** you're redirected back to your app at `/auth/callback`
8. **Verify** you land on `/dashboard` page successfully
9. **Check browser console** for any errors
10. **Verify** token is stored in localStorage

### Expected Console Logs
- Frontend: "Connecting..." when button clicked
- Backend: "Google OAuth initiation..." 
- Backend: "Google OAuth callback received..."
- Frontend: "OAuth callback processing..."
- Frontend: "Redirecting to dashboard..."

---

## 6. Common Issues & Solutions

### Issue: "Redirect URI mismatch" error from Google
**Solution**: Ensure the redirect URI in Google Console exactly matches:
```
https://productivity-tracker-jfib.vercel.app/api/oauth/google/callback
```

### Issue: CORS errors in browser console
**Solution**: Backend CORS is configured for:
- `https://momentum12.vercel.app`
- `https://*.vercel.app`

Verify no typos in FRONTEND_URL environment variable.

### Issue: "Invalid state token" error
**Solution**: This is a CSRF protection error. Happens if:
1. State token expired (>10 minutes)
2. User refreshed during OAuth flow
3. Clock sync issue between servers

Ask user to try again.

### Issue: Tokens not stored in localStorage
**Solution**: Check OAuthCallback.tsx is receiving tokens in URL params:
- Open browser DevTools > Network tab
- Look for redirect to `/auth/callback?token=...&refresh_token=...`

### Issue: Redis rate limiting errors
**Solution**: Verify Upstash Redis credentials in backend .env:
- UPSTASH_REDIS_REST_URL
- UPSTASH_REDIS_REST_TOKEN

Test Redis connection: https://console.upstash.com/

---

## 7. Security Checklist

- ✅ **CSRF Protection**: State tokens used and verified
- ✅ **Rate Limiting**: Redis rate limiting on OAuth endpoints
- ✅ **Token Expiry**: Access tokens expire in 15m, refresh tokens in 7d
- ✅ **Audit Logging**: All OAuth events logged to AuthLog model
- ✅ **Email Verification**: Google email verification checked
- ✅ **CORS**: Restricted to known domains
- ⚠️ **HttpOnly Cookies**: Consider using instead of URL params (see note below)

### Security Note
Current implementation passes tokens via URL query parameters. For enhanced security, consider implementing HttpOnly cookies:
- Prevents XSS attacks from stealing tokens
- Requires SameSite=None and Secure flags for cross-origin
- More complex to implement with separate frontend/backend domains

---

## 8. Monitoring & Logs

### Check Backend Logs
```bash
vercel logs <backend-project-name>
```

### Check Frontend Logs
```bash
vercel logs <frontend-project-name>
```

### Monitor AuthLog Collection
Check MongoDB Atlas for authentication events:
```javascript
db.authlogs.find({ action: "oauth_login" }).sort({ timestamp: -1 }).limit(10)
```

---

## 9. Post-Deployment Testing

Run these tests after deployment:

1. ✅ **Fresh Login**: Clear cookies, login with Google
2. ✅ **Existing User**: Login with same Google account again
3. ✅ **Cancel Flow**: Click Google button, cancel on Google page
4. ✅ **Network Error**: Test with slow/interrupted network
5. ✅ **Rate Limiting**: Attempt 20+ OAuth requests in 1 minute (should block)
6. ✅ **Email Verification**: Use unverified Google account (should show warning)
7. ✅ **Token Refresh**: Wait 15+ minutes, verify refresh token works

---

## 10. Rollback Plan

If OAuth fails in production:

1. **Immediate**: Comment out GoogleSSOButton in Login.tsx
2. **Deploy**: Push change to disable Google SSO temporarily
3. **Debug**: Check logs and fix issues
4. **Re-enable**: Uncomment and redeploy when fixed

---

## 11. Support Links

- **Google Console**: https://console.cloud.google.com/apis/credentials
- **Upstash Console**: https://console.upstash.com/
- **Vercel Backend**: https://vercel.com/dashboard
- **MongoDB Atlas**: https://cloud.mongodb.com/
- **Documentation**: See GOOGLE_SSO_GUIDE.md

---

## Quick Command Reference

```bash
# Backend - Build and test locally
cd backend
npm run build
npm run dev

# Frontend - Build and test locally
cd frontend
npm run build
npm run dev

# Deploy backend
vercel --prod

# Deploy frontend
vercel --prod

# View logs
vercel logs --follow
```

---

## Status Summary

### ✅ Ready for Deployment
- Backend OAuth implementation complete
- Frontend OAuth components implemented
- Environment variables configured
- CORS configured
- Rate limiting configured
- Audit logging configured
- Documentation complete

### ⚠️ Action Required
1. **Update Google Console** with redirect URI: `https://productivity-tracker-jfib.vercel.app/api/oauth/google/callback`
2. **Verify Vercel env variables** are set (backend + frontend)
3. **Deploy** both frontend and backend
4. **Test** complete OAuth flow

---

## Contact

If you encounter issues during deployment:
1. Check logs: `vercel logs --follow`
2. Review this checklist
3. Verify all environment variables
4. Test locally first with `npm run dev`
