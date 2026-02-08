import dotenv from "dotenv";

dotenv.config();

export const env = {
  PORT: process.env.PORT || 5002,
  MONGO_URI: process.env.MONGODB_URI as string,
  JWT_SECRET: process.env.JWT_SECRET as string,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET as string,
  JWT_EXPIRES_IN: (process.env.JWT_EXPIRES_IN || '7d') as string | number,
  NODE_ENV: process.env.NODE_ENV || "development",
  BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN as string,
  FRONTEND_URL: process.env.FRONTEND_URL || (process.env.NODE_ENV === 'production' ? 'https://momentum12.vercel.app' : 'http://localhost:5173'),

  // OAuth Configuration
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID as string,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET as string,
  GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI as string,

  // Redis (optional)
  REDIS_URL: process.env.REDIS_URL,
};
