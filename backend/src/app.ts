import express from "express";
import cors from "cors";
import path from "path";
import authRoutes from "./modules/auth/auth.routes";
import taskRoutes from "./modules/auth/task/task.routes";
import teamRoutes from "./modules/auth/team/team.routes";
import profileRoutes from "./modules/auth/profile/profile.routes";
import { errorMiddleware } from "./middleware/error.middleware";

export const app = express();

app.use(cors());
app.use(express.json());

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/team", teamRoutes);
app.use("/api/profile", profileRoutes);

app.use(errorMiddleware);
