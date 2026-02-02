import dotenv from "dotenv";

dotenv.config();

export const env = {
  PORT: process.env.PORT || 5002,
  MONGO_URI: process.env.MONGODB_URI as string,
  JWT_SECRET: process.env.JWT_SECRET as string,
  NODE_ENV: process.env.NODE_ENV || "development"
};
