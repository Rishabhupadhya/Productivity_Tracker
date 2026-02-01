/**
 * Email OAuth Authentication Service
 * 
 * Handles OAuth 2.0 authentication for Gmail and Outlook.
 * Uses read-only scopes to minimize security risk.
 * 
 * SECURITY NOTES:
 * - Stores refresh tokens encrypted in database
 * - Uses read-only Gmail scopes (gmail.readonly)
 * - Store tokens per user in database
 * - Allow users to disconnect/revoke access anytime
 */

import { Types } from "mongoose";
import { logger } from "../../../../utils/logger";
import { EmailOAuthToken } from "./models/emailOAuthToken.model";
import { EmailMetadata } from "./models/emailMetadata.model";
import { ProcessedEmail } from "./models/processedEmail.model";
import { Transaction } from "../finance.model";
import { encryptToken, decryptToken } from "./encryption.utils";
import { google } from "googleapis";

/**
 * OAuth Token Interface
 */
export interface EmailOAuthTokenData {
  userId: Types.ObjectId;
  provider: "gmail" | "outlook";
  accessToken: string;
  refreshToken?: string;
  expiresAt: Date;
  scope: string;
  connectedAt: Date;
}

/**
 * OAuth Configuration
 * Set these in environment variables
 */
export const OAUTH_CONFIG = {
  gmail: {
    clientId: process.env.GMAIL_CLIENT_ID || "",
    clientSecret: process.env.GMAIL_CLIENT_SECRET || "",
    redirectUri: process.env.GMAIL_REDIRECT_URI || "http://localhost:5001/api/finance/email/oauth/gmail/callback",
    scopes: [
      "https://www.googleapis.com/auth/gmail.readonly" // Read-only access
    ]
  },
  outlook: {
    clientId: process.env.OUTLOOK_CLIENT_ID || "",
    clientSecret: process.env.OUTLOOK_CLIENT_SECRET || "",
    redirectUri: process.env.OUTLOOK_REDIRECT_URI || "http://localhost:5001/api/finance/email/oauth/outlook/callback",
    scopes: [
      "https://graph.microsoft.com/Mail.Read" // Read-only access
    ]
  }
};

/**
 * Generate Gmail OAuth URL
 * User clicks this URL to grant permission
 */
export const getGmailAuthUrl = (userId: string): string => {
  const params = new URLSearchParams({
    client_id: OAUTH_CONFIG.gmail.clientId,
    redirect_uri: OAUTH_CONFIG.gmail.redirectUri,
    response_type: "code",
    scope: OAUTH_CONFIG.gmail.scopes.join(" "),
    access_type: "offline", // Get refresh token
    state: userId, // Pass user ID to identify after callback
    prompt: "consent" // Force consent screen to get refresh token
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
};

/**
 * Generate Outlook OAuth URL
 */
export const getOutlookAuthUrl = (userId: string): string => {
  const params = new URLSearchParams({
    client_id: OAUTH_CONFIG.outlook.clientId,
    redirect_uri: OAUTH_CONFIG.outlook.redirectUri,
    response_type: "code",
    scope: OAUTH_CONFIG.outlook.scopes.join(" "),
    state: userId, // Pass user ID
    response_mode: "query"
  });

  return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`;
};

/**
 * Exchange authorization code for access token (Gmail)
 * Implements actual OAuth token exchange using googleapis
 */
export const exchangeGmailCode = async (
  code: string,
  userId: string
): Promise<EmailOAuthTokenData> => {
  try {
    logger.info(`Gmail OAuth code exchange for user ${userId}`);

    // Create OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      OAUTH_CONFIG.gmail.clientId,
      OAUTH_CONFIG.gmail.clientSecret,
      OAUTH_CONFIG.gmail.redirectUri
    );

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.access_token) {
      throw new Error("No access token received from Gmail");
    }

    // Calculate expiration
    const expiresAt = new Date(
      Date.now() + (tokens.expiry_date || 3600 * 1000)
    );

    // Encrypt tokens before storing
    const encryptedAccessToken = encryptToken(tokens.access_token);
    const encryptedRefreshToken = tokens.refresh_token
      ? encryptToken(tokens.refresh_token)
      : undefined;

    // Save to database
    await EmailOAuthToken.findOneAndUpdate(
      { userId: new Types.ObjectId(userId), provider: "gmail" },
      {
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        expiresAt,
        scope: tokens.scope || OAUTH_CONFIG.gmail.scopes.join(" "),
        connectedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    logger.info(`Gmail OAuth successful for user ${userId}`);

    return {
      userId: new Types.ObjectId(userId),
      provider: "gmail",
      accessToken: tokens.access_token, // Return decrypted for immediate use
      refreshToken: tokens.refresh_token || undefined,
      expiresAt,
      scope: tokens.scope || OAUTH_CONFIG.gmail.scopes.join(" "),
      connectedAt: new Date(),
    };
  } catch (error) {
    logger.error("Gmail OAuth code exchange failed:", error);
    throw new Error(
      `Failed to exchange Gmail authorization code: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};

/**
 * Exchange authorization code for access token (Outlook)
 * Implements actual OAuth token exchange using Microsoft Graph
 */
export const exchangeOutlookCode = async (
  code: string,
  userId: string
): Promise<EmailOAuthTokenData> => {
  try {
    logger.info(`Outlook OAuth code exchange for user ${userId}`);

    // Exchange code for tokens
    const response = await fetch(
      "https://login.microsoftonline.com/common/oauth2/v2.0/token",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: OAUTH_CONFIG.outlook.clientId,
          client_secret: OAUTH_CONFIG.outlook.clientSecret,
          redirect_uri: OAUTH_CONFIG.outlook.redirectUri,
          grant_type: "authorization_code",
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Outlook OAuth failed: ${error}`);
    }

    const data = await response.json();

    if (!data.access_token) {
      throw new Error("No access token received from Outlook");
    }

    // Calculate expiration
    const expiresAt = new Date(Date.now() + (data.expires_in || 3600) * 1000);

    // Encrypt tokens before storing
    const encryptedAccessToken = encryptToken(data.access_token);
    const encryptedRefreshToken = data.refresh_token
      ? encryptToken(data.refresh_token)
      : undefined;

    // Save to database
    await EmailOAuthToken.findOneAndUpdate(
      { userId: new Types.ObjectId(userId), provider: "outlook" },
      {
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        expiresAt,
        scope: data.scope || OAUTH_CONFIG.outlook.scopes.join(" "),
        connectedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    logger.info(`Outlook OAuth successful for user ${userId}`);

    return {
      userId: new Types.ObjectId(userId),
      provider: "outlook",
      accessToken: data.access_token, // Return decrypted for immediate use
      refreshToken: data.refresh_token,
      expiresAt,
      scope: data.scope || OAUTH_CONFIG.outlook.scopes.join(" "),
      connectedAt: new Date(),
    };
  } catch (error) {
    logger.error("Outlook OAuth code exchange failed:", error);
    throw new Error(
      `Failed to exchange Outlook authorization code: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};

/**
 * Refresh access token when expired
 * Implements actual token refresh for both providers
 */
export const refreshAccessToken = async (
  userId: string,
  provider: "gmail" | "outlook"
): Promise<{ accessToken: string; expiresAt: Date }> => {
  try {
    logger.info(`Refreshing ${provider} access token for user ${userId}`);

    // Get stored refresh token
    const storedToken = await EmailOAuthToken.findOne({
      userId: new Types.ObjectId(userId),
      provider,
    });

    if (!storedToken || !storedToken.refreshToken) {
      throw new Error("No refresh token found for user");
    }

    // Decrypt refresh token
    const refreshToken = decryptToken(storedToken.refreshToken);

    if (provider === "gmail") {
      // Gmail refresh
      const oauth2Client = new google.auth.OAuth2(
        OAUTH_CONFIG.gmail.clientId,
        OAUTH_CONFIG.gmail.clientSecret,
        OAUTH_CONFIG.gmail.redirectUri
      );

      oauth2Client.setCredentials({ refresh_token: refreshToken });

      const { credentials } = await oauth2Client.refreshAccessToken();

      if (!credentials.access_token) {
        throw new Error("No access token received from Gmail refresh");
      }

      const expiresAt = new Date(
        Date.now() + (credentials.expiry_date || 3600 * 1000)
      );

      // Update stored token
      const encryptedAccessToken = encryptToken(credentials.access_token);
      await EmailOAuthToken.findOneAndUpdate(
        { userId: new Types.ObjectId(userId), provider },
        { accessToken: encryptedAccessToken, expiresAt, lastUsed: new Date() }
      );

      return {
        accessToken: credentials.access_token,
        expiresAt,
      };
    } else {
      // Outlook refresh
      const response = await fetch(
        "https://login.microsoftonline.com/common/oauth2/v2.0/token",
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id: OAUTH_CONFIG.outlook.clientId,
            client_secret: OAUTH_CONFIG.outlook.clientSecret,
            refresh_token: refreshToken,
            grant_type: "refresh_token",
          }),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Outlook token refresh failed: ${error}`);
      }

      const data = await response.json();

      if (!data.access_token) {
        throw new Error("No access token received from Outlook refresh");
      }

      const expiresAt = new Date(
        Date.now() + (data.expires_in || 3600) * 1000
      );

      // Update stored token
      const encryptedAccessToken = encryptToken(data.access_token);
      await EmailOAuthToken.findOneAndUpdate(
        { userId: new Types.ObjectId(userId), provider },
        { accessToken: encryptedAccessToken, expiresAt, lastUsed: new Date() }
      );

      return {
        accessToken: data.access_token,
        expiresAt,
      };
    }
  } catch (error) {
    logger.error(`Token refresh failed for ${provider}:`, error);
    throw new Error(
      `Failed to refresh ${provider} token: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};

/**
 * Get valid access token (refresh if expired)
 */
export const getValidAccessToken = async (
  userId: string,
  provider: "gmail" | "outlook"
): Promise<string> => {
  const storedToken = await EmailOAuthToken.findOne({
    userId: new Types.ObjectId(userId),
    provider,
  });

  if (!storedToken) {
    throw new Error(`No ${provider} token found for user`);
  }

  // Check if token is expired (with 5 minute buffer)
  const isExpired = storedToken.expiresAt.getTime() - Date.now() < 5 * 60 * 1000;

  if (isExpired) {
    logger.info(`Token expired, refreshing for user ${userId}`);
    const refreshed = await refreshAccessToken(userId, provider);
    return refreshed.accessToken;
  }

  // Decrypt and return existing token
  return decryptToken(storedToken.accessToken);
};

/**
 * Revoke OAuth access (disconnect email)
 * User-initiated disconnect - revoke tokens and delete from DB
 */
export const revokeEmailAccess = async (
  userId: string,
  provider: "gmail" | "outlook"
): Promise<void> => {
  try {
    logger.info(`Revoking ${provider} access for user ${userId}`);

    // Get stored token
    const storedToken = await EmailOAuthToken.findOne({
      userId: new Types.ObjectId(userId),
      provider,
    });

    if (!storedToken) {
      logger.warn(`No ${provider} token found for user ${userId}`);
      return;
    }

    // Decrypt access token for revocation
    const accessToken = decryptToken(storedToken.accessToken);

    if (provider === "gmail") {
      // Revoke Gmail token
      await fetch(
        `https://oauth2.googleapis.com/revoke?token=${accessToken}`,
        { method: "POST" }
      );
    } else {
      // Revoke Outlook token (if needed, Microsoft handles this automatically)
      // No explicit revoke needed for Outlook
    }

    // Delete from database
    await EmailOAuthToken.deleteOne({
      userId: new Types.ObjectId(userId),
      provider,
    });

    // Delete all email metadata for this user
    const emailDeleteResult = await EmailMetadata.deleteMany({
      userId: new Types.ObjectId(userId)
    });
    logger.info(`Deleted ${emailDeleteResult.deletedCount} email metadata records for user ${userId}`);

    // Delete all transaction hashes for this user
    const hashDeleteResult = await ProcessedEmail.deleteMany({
      userId: new Types.ObjectId(userId)
    });
    logger.info(`Deleted ${hashDeleteResult.deletedCount} transaction hashes for user ${userId}`);

    // Delete all email-sourced transactions for this user
    // (transactions without a creditCardId are from email imports)
    const transactionDeleteResult = await Transaction.deleteMany({
      userId: new Types.ObjectId(userId),
      paymentType: "credit",
      creditCardId: { $exists: false }
    });
    logger.info(`Deleted ${transactionDeleteResult.deletedCount} email-sourced transactions for user ${userId}`);

    logger.info(`Successfully revoked ${provider} access and cleaned up all email data for user ${userId}`);
  } catch (error) {
    logger.error(`Failed to revoke ${provider} access:`, error);
    throw new Error(
      `Failed to revoke ${provider} access: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};
