/**
 * Email Processing Controller
 * 
 * HTTP handlers for email processing endpoints
 */

import { Request, Response } from "express";
import { AuthRequest } from "../../../../middleware/auth.middleware";
import { processEmails, getSupportedBanks } from "./emailProcessing.service";
import { getGmailAuthUrl, getOutlookAuthUrl, exchangeGmailCode, exchangeOutlookCode, revokeEmailAccess, getValidAccessToken } from "./emailAuth.service";
import { getProcessingStats } from "./deduplication.service";
import { EmailOAuthToken } from "./models/emailOAuthToken.model";
import { EmailMetadata } from "./models/emailMetadata.model";
import { ProcessedEmail } from "./models/processedEmail.model";
import { Transaction } from "../finance.model";
import { Types } from "mongoose";
import { logger } from "../../../../utils/logger";

/**
 * GET /email/oauth/gmail/authorize
 * Get Gmail OAuth authorization URL
 */
export const getGmailOAuthUrl = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const authUrl = getGmailAuthUrl(userId);
    
    return res.status(200).json({
      success: true,
      authUrl,
      message: "Redirect user to this URL to grant Gmail access"
    });
  } catch (error) {
    logger.error("Error in getGmailOAuthUrl:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate Gmail OAuth URL",
      error: (error as Error).message
    });
  }
};

/**
 * GET /email/oauth/outlook/authorize
 * Get Outlook OAuth authorization URL
 */
export const getOutlookOAuthUrl = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const authUrl = getOutlookAuthUrl(userId);
    
    return res.status(200).json({
      success: true,
      authUrl,
      message: "Redirect user to this URL to grant Outlook access"
    });
  } catch (error) {
    logger.error("Error in getOutlookOAuthUrl:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate Outlook OAuth URL",
      error: (error as Error).message
    });
  }
};

/**
 * GET /email/oauth/gmail/callback
 * OAuth callback after user grants permission
 */
export const handleGmailCallback = async (req: Request, res: Response) => {
  try {
    const { code, state } = req.query;
    
    if (!code || !state) {
      return res.status(400).json({ message: "Missing code or state parameter" });
    }

    const userId = state as string;
    
    // Exchange code for access token and store in database (encrypted)
    await exchangeGmailCode(code as string, userId);
    
    logger.info(`Gmail OAuth successful for user ${userId}`);
    
    // Redirect to frontend success page
    return res.redirect(`${process.env.FRONTEND_URL}/finance/email/connected?provider=gmail`);
  } catch (error) {
    logger.error("Error in handleGmailCallback:", error);
    return res.redirect(`${process.env.FRONTEND_URL}/finance/email/error?message=Gmail+OAuth+failed`);
  }
};

/**
 * GET /email/oauth/outlook/callback
 * OAuth callback after user grants permission
 */
export const handleOutlookCallback = async (req: Request, res: Response) => {
  try {
    const { code, state } = req.query;
    
    if (!code || !state) {
      return res.status(400).json({ message: "Missing code or state parameter" });
    }

    const userId = state as string;
    
    // Exchange code for access token
    const token = await exchangeOutlookCode(code as string, userId);
    
    // TODO: Store token in database (encrypted!)
    // await EmailOAuthTokenModel.create(token);
    
    logger.info(`Outlook OAuth successful for user ${userId}`);
    
    // Redirect to frontend success page
    return res.redirect(`${process.env.FRONTEND_URL}/finance/email/connected?provider=outlook`);
  } catch (error) {
    logger.error("Error in handleOutlookCallback:", error);
    return res.redirect(`${process.env.FRONTEND_URL}/finance/email/error?message=Outlook+OAuth+failed`);
  }
};

/**
 * POST /email/process
 * Process emails from connected account
 * 
 * Body: { provider: "gmail" | "outlook" }
 * Query: { daysBack?: number }
 */
export const processUserEmails = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { provider } = req.body;
    const daysBack = parseInt(req.query.daysBack as string) || 7;

    logger.info(`Processing emails with daysBack=${daysBack} for user ${userId}`);

    if (!provider || !["gmail", "outlook"].includes(provider)) {
      return res.status(400).json({ message: "Invalid provider. Must be 'gmail' or 'outlook'" });
    }

    // Get valid access token (automatically refreshes if expired)
    const accessToken = await getValidAccessToken(userId, provider);

    const result = await processEmails(userId, provider, accessToken, daysBack);

    return res.status(200).json(result);
  } catch (error) {
    logger.error("Error in processUserEmails:", error);
    
    // Check if it's an auth error
    if ((error as Error).message.includes("No") && (error as Error).message.includes("token")) {
      return res.status(400).json({
        success: false,
        message: "Email account not connected. Please authorize first.",
        error: (error as Error).message
      });
    }
    
    return res.status(500).json({
      success: false,
      message: "Failed to process emails",
      error: (error as Error).message
    });
  }
};

/**
 * GET /email/oauth/status
 * Check OAuth connection status
 */
export const getOAuthStatus = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Check for Gmail token
    const gmailToken = await EmailOAuthToken.findOne({
      userId,
      provider: "gmail"
    });

    // Check for Outlook token
    const outlookToken = await EmailOAuthToken.findOne({
      userId,
      provider: "outlook"
    });

    if (gmailToken) {
      return res.status(200).json({
        connected: true,
        provider: "gmail",
        userEmail: gmailToken.userEmail,
        connectedAt: gmailToken.createdAt
      });
    }

    if (outlookToken) {
      return res.status(200).json({
        connected: true,
        provider: "outlook",
        userEmail: outlookToken.userEmail,
        connectedAt: outlookToken.createdAt
      });
    }

    return res.status(200).json({
      connected: false,
      provider: null
    });
  } catch (error) {
    logger.error("Error in getOAuthStatus:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to check OAuth status",
      error: (error as Error).message
    });
  }
};

/**
 * DELETE /email/disconnect/:provider
 * Disconnect email account (revoke OAuth access)
 */
export const disconnectEmailAccount = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { provider } = req.params;

    if (!["gmail", "outlook"].includes(provider)) {
      return res.status(400).json({ message: "Invalid provider" });
    }

    await revokeEmailAccess(userId, provider as "gmail" | "outlook");

    return res.status(200).json({
      success: true,
      message: `${provider} account disconnected successfully`
    });
  } catch (error) {
    logger.error("Error in disconnectEmailAccount:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to disconnect email account",
      error: (error as Error).message
    });
  }
};

/**
 * GET /email/stats
 * Get email processing statistics
 */
export const getEmailStats = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const stats = await getProcessingStats(userId);

    return res.status(200).json({
      success: true,
      stats
    });
  } catch (error) {
    logger.error("Error in getEmailStats:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get email statistics",
      error: (error as Error).message
    });
  }
};

/**
 * GET /email/supported-banks
 * Get list of supported banks
 */
export const getSupportedBanksList = async (req: Request, res: Response) => {
  try {
    const banks = getSupportedBanks();
    
    return res.status(200).json({
      success: true,
      banks,
      count: banks.length
    });
  } catch (error) {
    logger.error("Error in getSupportedBanksList:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get supported banks",
      error: (error as Error).message
    });
  }
};

/**
 * DELETE /email/clear-history
 * Clear email processing history (allows reimporting same emails)
 */
export const clearEmailHistory = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Get all transaction IDs from email metadata before deleting
    const emailMetadataRecords = await EmailMetadata.find({
      userId: new Types.ObjectId(userId),
      transactionId: { $exists: true, $ne: null }
    });

    const transactionIds = emailMetadataRecords
      .map(record => record.transactionId)
      .filter(id => id != null);

    // Delete the transactions that were created from emails
    const transactionResult = await Transaction.deleteMany({
      _id: { $in: transactionIds }
    });

    // Delete email metadata
    const emailResult = await EmailMetadata.deleteMany({
      userId: new Types.ObjectId(userId)
    });

    // Delete processed email hashes
    const hashResult = await ProcessedEmail.deleteMany({
      userId: new Types.ObjectId(userId)
    });

    logger.info(`Cleared email history for user ${userId}: ${emailResult.deletedCount} emails, ${hashResult.deletedCount} hashes, ${transactionResult.deletedCount} transactions`);

    return res.status(200).json({
      success: true,
      message: "Email import history cleared",
      emailsCleared: emailResult.deletedCount,
      hashesCleared: hashResult.deletedCount,
      transactionsDeleted: transactionResult.deletedCount
    });
  } catch (error) {
    logger.error("Error in clearEmailHistory:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to clear email history",
      error: (error as Error).message
    });
  }
};
