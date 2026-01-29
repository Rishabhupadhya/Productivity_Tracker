import app from "./app";
import { connectDB } from "./config/db";
import { env } from "./config/env";
import { logger } from "./utils/logger";

const startServer = async () => {
  await connectDB();

  app.listen(env.port, () => {
    logger.info(`Server running on port ${env.port}`);
  });
};

startServer();
