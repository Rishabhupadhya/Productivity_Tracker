import express from "express";
import cors from "cors";
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
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400 // 24 hours cache
}));
app.use(express.json());

// Apply global rate limiting
app.use('/api', apiRateLimiter);

// No need to serve static files - using Vercel Blob Storage

app.use("/api/auth", authRoutes);
app.use("/api/oauth", oauthRoutes); // OAuth routes
app.use("/api/tasks", taskRoutes);
app.use("/api/team", teamRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/goals", goalRoutes);
app.use("/api/habits", habitRoutes);
app.use("/api/momentum", momentumRoutes);

app.use(errorMiddleware);
