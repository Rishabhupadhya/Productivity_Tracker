import { app } from "../src/app";
import { connectDB } from "../src/config/db";

// Initialize database connection
let isConnected = false;

const initDB = async () => {
  if (!isConnected) {
    await connectDB();
    isConnected = true;
  }
};

// Vercel serverless function handler
export default async (req: any, res: any) => {
  await initDB();
  return app(req, res);
};
