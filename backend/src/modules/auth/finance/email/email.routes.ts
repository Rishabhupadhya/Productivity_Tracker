/**
 * Email Processing Routes
 */

import { Router } from "express";
import { authMiddleware } from "../../../../middleware/auth.middleware";
import * as emailController from "./email.controller";

const router = Router();

// OAuth authorization endpoints (require auth)
router.get("/oauth/gmail/authorize", authMiddleware, emailController.getGmailOAuthUrl);
router.get("/oauth/outlook/authorize", authMiddleware, emailController.getOutlookOAuthUrl);
router.get("/oauth/status", authMiddleware, emailController.getOAuthStatus);

// OAuth callback endpoints (NO auth middleware - handled by OAuth state parameter)
router.get("/oauth/gmail/callback", emailController.handleGmailCallback);
router.get("/oauth/outlook/callback", emailController.handleOutlookCallback);

// Email processing endpoints (require auth)
router.post("/process", authMiddleware, emailController.processUserEmails);

// Disconnect email account (require auth)
router.delete("/disconnect/:provider", authMiddleware, emailController.disconnectEmailAccount);

// Statistics and info (require auth)
router.get("/stats", authMiddleware, emailController.getEmailStats);
router.get("/supported-banks", authMiddleware, emailController.getSupportedBanksList);

// Clear import history (require auth)
router.delete("/clear-history", authMiddleware, emailController.clearEmailHistory);

export default router;
