import mongoose from "mongoose";
import { env } from "./env";
import { logger } from "../utils/logger";

// Optimize for serverless - reuse connections
mongoose.set('bufferCommands', false);

export const connectDB = async () => {
  try {
    // Check if already connected
    if (mongoose.connection.readyState >= 1) {
      logger.info("MongoDB already connected");
      return;
    }

    await mongoose.connect(env.MONGO_URI, {
      maxPoolSize: 10, // Connection pooling for serverless
      minPoolSize: 2,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    logger.info("MongoDB connected");
  } catch (error) {
    logger.error("MongoDB connection failed", error);
    
    // In serverless, don't exit process - just throw
    if (env.NODE_ENV === "production") {
      throw error;
    }
    process.exit(1);
  }
};
