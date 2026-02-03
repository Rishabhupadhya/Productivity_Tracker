import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import csrf from "csurf";
import authRoutes from "./modules/auth/auth.routes";
import oauthRoutes from "./modules/oauth/oauth.routes";
import taskRoutes from "./modules/auth/task/task.routes";
import teamRoutes from "./modules/auth/team/team.routes";
import profileRoutes from "./modules/auth/profile/profile.routes";
import projectRoutes from "./modules/auth/project/project.routes";
import goalRoutes from "./modules/auth/goal/goal.routes";
import habitRoutes from "./modules/auth/habit/habit.routes";
import momentumRoutes from "./modules/auth/momentum/momentum.routes";
import { errorMiddleware } from "./middleware/error.middleware";
import { apiRateLimiter } from "./middleware/rate-limiter.middleware";

export const app = express();

// Security headers - Helmet configuration
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"], // React inline styles
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
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  frameguard: { action: 'deny' },
  noSniff: true,
  xssFilter: true
}));

// Restrict CORS to specific domains only
const allowedOrigins = [
  process.env.NODE_ENV === 'development' ? 'http://localhost:5173' : null,
  'https://momentum12.vercel.app',
  // Only allow YOUR specific preview deployments
  /^https:\/\/momentum12-.*\.vercel\.app$/
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // Check if origin is allowed
    const isAllowed = allowedOrigins.some(allowed => {
      if (typeof allowed === 'string') return allowed === origin;
      if (allowed instanceof RegExp) return allowed.test(origin);
      return false;
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  maxAge: 86400 // 24 hours cache
}));

// Body parser
app.use(express.json());

// Cookie parser - required for HttpOnly cookies
app.use(cookieParser());

// CSRF protection - applies to state-changing routes
const csrfProtection = csrf({ 
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  }
});

// CSRF token endpoint (no CSRF check on this endpoint)
app.get('/api/csrf-token', (req, res) => {
  res.json({ csrfToken: (req as any).csrfToken() });
});

// Apply global rate limiting
app.use('/api', apiRateLimiter);

// No need to serve static files - using Vercel Blob Storage

// Auth routes - no CSRF on login/register (users don't have tokens yet)
app.use("/api/auth", authRoutes);
// OAuth routes - no CSRF (external flow)
app.use("/api/oauth", oauthRoutes);

// Protected routes - apply CSRF protection
app.use("/api/tasks", csrfProtection, taskRoutes);
app.use("/api/team", csrfProtection, teamRoutes);
app.use("/api/profile", csrfProtection, profileRoutes);
app.use("/api/projects", csrfProtection, projectRoutes);
app.use("/api/goals", csrfProtection, goalRoutes);
app.use("/api/habits", csrfProtection, habitRoutes);
app.use("/api/momentum", csrfProtection, momentumRoutes);

app.use(errorMiddleware);
