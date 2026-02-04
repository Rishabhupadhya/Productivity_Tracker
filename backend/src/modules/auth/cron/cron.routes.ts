import { Router } from "express";
import { runAllChecksNow } from "../../../services/scheduler.service";
import { logger } from "../../../utils/logger";

const router = Router();

// Endpoint to be hit by Vercel Cron or manual trigger
// Example: https://.../api/cron/run-checks?force=true
router.get("/run-checks", async (req, res) => {
    try {
        const cronSecret = req.headers['x-cron-secret'];
        const force = req.query.force === 'true';

        // Optional: Basic security check if env is set
        if (process.env.CRON_SECRET && cronSecret !== process.env.CRON_SECRET) {
            return res.status(401).json({ success: false, message: "Unauthorized cron trigger" });
        }

        logger.info(`Cron job triggered (force=${force})`);
        await runAllChecksNow(force);

        res.json({
            success: true,
            message: `Notification checks executed successfully (force=${force})`,
            tip: force ? "Forced mode: bypassed time-of-day checks for testing." : "Normal mode: respected time-of-day checks."
        });
    } catch (error) {
        logger.error("Cron job failed:", error);
        res.status(500).json({
            success: false,
            message: "Cron job internal error",
            error: error instanceof Error ? error.message : "Unknown error"
        });
    }
});

export default router;
