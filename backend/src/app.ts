import express from "express";
import cors from "cors";
import authRoutes from "./modules/auth/auth.routes";
import taskRoutes from "./modules/auth/task/task.routes";
import teamRoutes from "./modules/auth/team/team.routes";
import profileRoutes from "./modules/auth/profile/profile.routes";
import projectRoutes from "./modules/auth/project/project.routes";
import goalRoutes from "./modules/auth/goal/goal.routes";
import habitRoutes from "./modules/auth/habit/habit.routes";
import momentumRoutes from "./modules/auth/momentum/momentum.routes";
import { errorMiddleware } from "./middleware/error.middleware";

export const app = express();

app.use(cors());
app.use(express.json());

// No need to serve static files - using Vercel Blob Storage

app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/team", teamRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/goals", goalRoutes);
app.use("/api/habits", habitRoutes);
app.use("/api/momentum", momentumRoutes);

app.use(errorMiddleware);
