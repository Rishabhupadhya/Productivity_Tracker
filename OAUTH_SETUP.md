# Google SSO Authentication - Installation Guide

## Backend Dependencies

```bash
cd backend
npm install google-auth-library express-rate-limit rate-limit-redis redis
```

### Package Details:
- **google-auth-library**: Official Google OAuth client
- **express-rate-limit**: Rate limiting middleware
- **rate-limit-redis**: Redis store for distributed rate limiting
- **redis**: Redis client for caching and session management

## Environment Variables

Create/update `backend/.env`:

```env
# OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:5001/api/oauth/google/callback

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-refresh-token-secret
JWT_EXPIRES_IN=15m

# Application
PORT=5001
FRONTEND_URL=http://localhost:5173
MONGODB_URI=mongodb://localhost:27017/productivity_tracker

# Optional: Redis for rate limiting
REDIS_URL=redis://localhost:6379
```

## Google OAuth Setup

### 1. Create Google Cloud Project

1. Go to https://console.cloud.google.com/
2. Create a new project or select existing
3. Enable Google+ API

### 2. Create OAuth 2.0 Credentials

1. Navigate to: **APIs & Services > Credentials**
2. Click **Create Credentials > OAuth 2.0 Client ID**
3. Application type: **Web application**
4. Name: `Productivity Tracker`
5. **Authorized JavaScript origins**:
   - `http://localhost:5173` (development)
   - `https://yourdomain.com` (production)
6. **Authorized redirect URIs**:
   - `http://localhost:5001/api/oauth/google/callback` (development)
   - `https://api.yourdomain.com/api/oauth/google/callback` (production)
7. Click **Create**
8. Copy **Client ID** and **Client Secret** to your `.env` file

### 3. Configure OAuth Consent Screen

1. Navigate to: **APIs & Services > OAuth consent screen**
2. User Type: **External** (for public apps)
3. Fill in required fields:
   - App name: `Productivity Tracker`
   - User support email
   - Developer contact email
4. Add scopes:
   - `userinfo.email`
   - `userinfo.profile`
5. Add test users (during development)
6. Save and continue

## Database Migration

Run this script to add OAuth fields to existing users:

```bash
cd backend
npm run migrate:oauth
```

Or manually update MongoDB:

```javascript
db.users.updateMany(
  {},
  {
    $set: {
      authMethod: "email_password",
      role: "user",
      emailVerified: false,
      isActive: true,
      failedLoginAttempts: 0
    }
  }
);
```

## Testing OAuth Flow

### 1. Start Backend

```bash
cd backend
npm run dev
```

### 2. Start Frontend

```bash
cd frontend
npm run dev
```

### 3. Test Login

1. Navigate to `http://localhost:5173/login`
2. Click **Continue with Google**
3. Sign in with Google account
4. Should redirect back to dashboard

## Production Deployment

### Vercel/Netlify Frontend

Update allowed origins in `backend/src/app.ts`:

```typescript
app.use(cors({
  origin: [
    'https://yourdomain.com',
    'https://yourdomain.vercel.app',
  ],
  credentials: true
}));
```

### Backend Deployment

Update Google OAuth redirect URI:
```env
GOOGLE_REDIRECT_URI=https://api.yourdomain.com/api/oauth/google/callback
FRONTEND_URL=https://yourdomain.com
```

Add production redirect URI in Google Cloud Console.

## Security Checklist

✅ **HTTPS** in production
✅ **HttpOnly cookies** for tokens (recommended over localStorage)
✅ **CSRF protection** via state parameter
✅ **Rate limiting** enabled
✅ **JWT expiration** set to 15 minutes
✅ **Refresh tokens** for long-term auth
✅ **Audit logging** for all auth events
✅ **Account lockout** after failed attempts

## Troubleshooting

### "Invalid Grant" Error
- Check redirect URI matches exactly in Google Console
- Ensure client ID and secret are correct
- Clear browser cookies and try again

### "Redirect URI Mismatch"
- Add exact redirect URI to Google Console
- Include both http://localhost and https://domain versions
- Wait 5 minutes for Google to propagate changes

### Rate Limit Errors
- Check Redis connection
- Increase rate limits in development
- Implement IP whitelist for testing

## Future Enhancements

- [ ] Microsoft OAuth (Azure AD)
- [ ] Okta/Auth0 SSO
- [ ] GitHub OAuth
- [ ] Two-Factor Authentication (2FA)
- [ ] Biometric authentication (WebAuthn)
- [ ] Social account linking UI
- [ ] Session management dashboard

## SOC2 Compliance Features

✅ **Audit Trail**: All auth events logged
✅ **Session Management**: Auto-logout after timeout
✅ **Access Control**: Role-based permissions
✅ **Data Encryption**: Tokens encrypted at rest
✅ **Rate Limiting**: Brute force protection
✅ **Account Recovery**: Secure password reset
✅ **Privacy Controls**: User data deletion

## Support

For issues or questions:
- Check logs: `backend/logs/auth.log`
- Enable debug mode: `LOG_LEVEL=debug`
- Review audit logs in MongoDB: `authlogs` collection
