/**
 * Email Deduplication Service
 * 
 * Prevents duplicate transactions by:
 * 1. Checking if email message ID was already processed
 * 2. Checking if transaction content hash already exists
 */

import crypto from "crypto";
import { Types } from "mongoose";
import { EmailMetadata } from "./models/emailMetadata.model";
import { ProcessedEmail } from "./models/processedEmail.model";
import { ParsedEmailTransaction } from "./emailParser.interface";
import { logger } from "../../../../utils/logger";

/**
 * Generate content hash for transaction deduplication
 * Hash components: amount + transaction date + merchant + card number
 */
export const generateContentHash = (parsed: ParsedEmailTransaction): string => {
  // Normalize data before hashing
  const amount = parsed.amount.toFixed(2); // Ensure consistent decimal format
  const date = parsed.transactionDate 
    ? parsed.transactionDate.toISOString().split('T')[0] // YYYY-MM-DD only
    : parsed.emailDate.toISOString().split('T')[0];
  const merchant = parsed.merchantName.toLowerCase().trim().replace(/\s+/g, '');
  const card = parsed.maskedCardNumber || 'unknown';

  const hashInput = `${amount}|${date}|${merchant}|${card}`;
  
  return crypto
    .createHash('sha256')
    .update(hashInput)
    .digest('hex');
};

/**
 * Check if email message was already processed
 */
export const isEmailAlreadyProcessed = async (
  userId: string,
  messageId: string
): Promise<boolean> => {
  const existing = await EmailMetadata.findOne({
    userId: new Types.ObjectId(userId),
    messageId
  });

  if (existing) {
    logger.info(`Email ${messageId} already processed at ${existing.processedAt}`);
    return true;
  }

  return false;
};

/**
 * Check if transaction content already exists (duplicate transaction)
 */
export const isTransactionDuplicate = async (
  userId: string,
  contentHash: string
): Promise<boolean> => {
  const existing = await ProcessedEmail.findOne({
    userId: new Types.ObjectId(userId),
    contentHash
  });

  if (existing) {
    logger.info(`Duplicate transaction detected (hash: ${contentHash}, original message: ${existing.messageId})`);
    return true;
  }

  return false;
};

/**
 * Mark email as processed with metadata
 */
export const markEmailAsProcessed = async (
  userId: string,
  messageId: string,
  subject: string,
  from: string,
  receivedDate: Date,
  parsedSuccessfully: boolean,
  bankName?: string,
  transactionId?: string,
  errorMessage?: string,
  body?: string,
  snippet?: string
): Promise<void> => {
  await EmailMetadata.create({
    userId: new Types.ObjectId(userId),
    messageId,
    subject,
    from,
    receivedDate,
    parsedSuccessfully,
    bankName,
    transactionId: transactionId ? new Types.ObjectId(transactionId) : undefined,
    errorMessage,
    body,
    snippet
  });

  logger.info(`Email ${messageId} marked as processed (success: ${parsedSuccessfully})`);
};

/**
 * Record transaction hash for deduplication
 */
export const recordTransactionHash = async (
  userId: string,
  contentHash: string,
  messageId: string,
  transactionId?: string
): Promise<void> => {
  try {
    await ProcessedEmail.create({
      userId: new Types.ObjectId(userId),
      contentHash,
      messageId,
      transactionId: transactionId ? new Types.ObjectId(transactionId) : undefined
    });

    logger.info(`Transaction hash recorded: ${contentHash}`);
  } catch (error: any) {
    // Ignore duplicate key errors (race condition)
    if (error.code === 11000) {
      logger.warn(`Transaction hash ${contentHash} already exists (race condition)`);
    } else {
      throw error;
    }
  }
};

/**
 * Get processing statistics for user
 */
export const getProcessingStats = async (userId: string): Promise<{
  totalProcessed: number;
  successful: number;
  failed: number;
  duplicates: number;
}> => {
  const [totalProcessed, successful, failed] = await Promise.all([
    EmailMetadata.countDocuments({ userId: new Types.ObjectId(userId) }),
    EmailMetadata.countDocuments({ userId: new Types.ObjectId(userId), parsedSuccessfully: true }),
    EmailMetadata.countDocuments({ userId: new Types.ObjectId(userId), parsedSuccessfully: false })
  ]);

  const duplicates = await ProcessedEmail.countDocuments({ 
    userId: new Types.ObjectId(userId) 
  });

  return {
    totalProcessed,
    successful,
    failed,
    duplicates
  };
};
