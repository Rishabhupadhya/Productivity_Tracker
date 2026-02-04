import { Router } from "express";
import { runAllChecksNow } from "../../../services/scheduler.service";
import { logger } from "../../../utils/logger";

const router = Router();

// Endpoint to be hit by Vercel Cron or manual trigger
// In production, this should be protected by a secret key
router.get("/run-checks", async (req, res) => {
    try {
        const cronSecret = req.headers['x-cron-secret'];

        // Optional: Basic security check if env is set
        if (process.env.CRON_SECRET && cronSecret !== process.env.CRON_SECRET) {
            return res.status(401).json({ success: false, message: "Unauthorized cron trigger" });
        }

        logger.info("Cron job triggered manually or by scheduler");
        await runAllChecksNow();

        res.json({ success: true, message: "Notification checks completed successfully" });
    } catch (error) {
        logger.error("Cron job failed:", error);
        res.status(500).json({ success: false, message: "Cron job failed", error: error instanceof Error ? error.message : "Unknown error" });
    }
});

export default router;
