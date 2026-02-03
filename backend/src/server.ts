import { app } from "./app";
import { connectDB } from "./config/db";
import { env } from "./config/env";
import { logger } from "./utils/logger";
// import { initializeScheduler } from "./services/scheduler.service"; // DISABLED
// import { testEmailConnection } from "./services/email.service"; // DISABLED

const startServer = async () => {
  await connectDB();

  // EMAIL AND SCHEDULER DISABLED TEMPORARILY - Re-enable after core functionality is working
  // const emailConfigured = await testEmailConnection();
  // if (emailConfigured) {
  //   logger.info("✅ Email service configured and ready");
  //   initializeScheduler();
  //   logger.info("✅ Notification scheduler initialized");
  // } else {
  //   logger.warn("⚠️ Email service not configured.");
  // }

  app.listen(env.PORT, () => {
    logger.info(`Server running on port ${env.PORT}`);
  });
};

startServer();
