import express from "express";
import cors from "cors";
import { errorHandler } from "./middleware/error.middleware";

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Health Check
app.get("/health", (_, res) => {
  res.status(200).json({
    status: "OK",
    message: "Productivity Tracker API is running 🚀",
  });
});

// Error handler (last middleware)
app.use(errorHandler);

export default app;
