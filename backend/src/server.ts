import { app } from "./app";
import { connectDB } from "./config/db";
import { env } from "./config/env";
import { logger } from "./utils/logger";
import cron from "node-cron";
import { processRecurringTransactions } from "./modules/auth/finance/finance.service";

const startServer = async () => {
  await connectDB();

  app.listen(env.PORT, () => {
    logger.info(`Server running on port ${env.PORT}`);
  });

  // Schedule recurring transactions to process daily at 00:01 AM
  cron.schedule("1 0 * * *", async () => {
    logger.info("Processing recurring transactions...");
    try {
      await processRecurringTransactions();
      logger.info("Recurring transactions processed successfully");
    } catch (error) {
      logger.error("Error processing recurring transactions:", error);
    }
  });

  logger.info("Recurring transaction scheduler started (runs daily at 00:01 AM)");
};

startServer();
