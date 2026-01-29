import dotenv from "dotenv";

dotenv.config();

export const env = {
  port: process.env.PORT || 5000,
  mongoUri: process.env.MONGO_URI as string,
  jwtSecret: process.env.JWT_SECRET as string,
  nodeEnv: process.env.NODE_ENV || "development",
};
