import { app } from "./app";
import { connectDB } from "./config/db";
import { env } from "./config/env";
import { logger } from "./utils/logger";
import { initializeScheduler } from "./services/scheduler.service";
import { testEmailConnection } from "./services/email.service";

const startServer = async () => {
  await connectDB();

  // RE-ENABLED: Email and Scheduler
  const emailConfigured = await testEmailConnection();
  if (emailConfigured) {
    logger.info("✅ Email service configured and ready");
    initializeScheduler();
    logger.info("✅ Notification scheduler initialized");
  } else {
    logger.warn("⚠️ Email service not configured. Notifications will be disabled.");
  }

  app.listen(env.PORT, () => {
    logger.info(`Server running on port ${env.PORT}`);
  });
};

startServer();
