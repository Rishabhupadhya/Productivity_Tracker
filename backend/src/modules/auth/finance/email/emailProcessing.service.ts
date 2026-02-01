/**
 * Email Processing Service
 * 
 * Orchestrates the entire email-to-transaction pipeline:
 * 1. Fetch emails from Gmail/Outlook
 * 2. Parse using bank-specific parsers
 * 3. Deduplicate to prevent duplicate transactions
 * 4. Match to user's credit cards
 * 5. Create transaction records
 * 6. Update monthly spending
 * 7. Trigger alerts if needed
 */

import { Types } from "mongoose";
import { EmailParserFactory } from "./emailParser.interface";
import { IciciEmailParser } from "./parsers/iciciEmailParser";
import { HdfcEmailParser } from "./parsers/hdfcEmailParser";
import { HdfcInstaAlertsParser } from "./parsers/hdfcInstaAlertsParser";
import { SbiEmailParser } from "./parsers/sbiEmailParser";
import { AxisEmailParser } from "./parsers/axisEmailParser";
import { GenericEmailParser } from "./parsers/genericEmailParser";
import { fetchGmailEmails, fetchOutlookEmails } from "./emailFetcher.service";
import {
  isEmailAlreadyProcessed,
  isTransactionDuplicate,
  generateContentHash,
  markEmailAsProcessed,
  recordTransactionHash
} from "./deduplication.service";
import { addTransactionToMonthly, checkMonthlyLimit, getCurrentMonth } from "../sms/monthlySpending.service";
import { sendLimitBreachAlert } from "../sms/alert.service";
import { 
  classifyEmail, 
  quickExtractFromSnippet, 
  needsFullBodyParse,
  EmailCategory 
} from "./emailClassifier.service";
import { CreditCard } from "../creditCard.model";
import { Transaction } from "../finance.model";
import { logger } from "../../../../utils/logger";

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const getDayRange = (d: Date) => {
  const start = new Date(d);
  start.setHours(0, 0, 0, 0);
  const end = new Date(d);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

const findExistingCardExpenseTransaction = async (
  userId: string,
  creditCardId: Types.ObjectId,
  amount: number,
  dateBase: Date,
  merchantName?: string
) => {
  const { start, end } = getDayRange(new Date(dateBase));

  const query: any = {
    userId: new Types.ObjectId(userId),
    type: "expense",
    paymentType: "credit",
    creditCardId,
    amount,
    date: { $gte: start, $lte: end }
  };

  const merchant = (merchantName || "").trim();
  if (merchant && !/^unknown merchant$/i.test(merchant) && merchant.length >= 3) {
    query.description = { $regex: escapeRegex(merchant), $options: "i" };
  }

  return Transaction.findOne(query).select("_id");
};

// Initialize parser factory with all bank parsers
const parserFactory = new EmailParserFactory();
parserFactory.registerParser(new IciciEmailParser());
parserFactory.registerParser(new HdfcEmailParser());
parserFactory.registerParser(new HdfcInstaAlertsParser()); // HDFC UPI transactions
parserFactory.registerParser(new SbiEmailParser());
parserFactory.registerParser(new AxisEmailParser());
parserFactory.registerParser(new GenericEmailParser()); // Fallback for unknown banks

export interface EmailProcessingResult {
  success: boolean;
  message: string;
  emailsProcessed: number;
  transactionsCreated: number;
  duplicatesSkipped: number;
  skipped?: {
    total: number;
    alreadyProcessed: number;
    nonDebit: number;
    duplicateContentHash: number;
    noMatchingCard: number;
    existingTransaction: number;
  };
  transactionsWithoutCard?: number;
  parseFailures: number;
  limitBreachAlerts: number;
}

/**
 * Process emails from user's connected email account
 * 
 * @param userId User ID
 * @param provider Email provider (gmail or outlook)
 * @param accessToken OAuth access token
 * @param daysBack Number of days to fetch (default: 7)
 */
export const processEmails = async (
  userId: string,
  provider: "gmail" | "outlook",
  accessToken: string,
  daysBack: number = 7
): Promise<EmailProcessingResult> => {
  logger.info(`Processing ${provider} emails for user ${userId} (last ${daysBack} days)`);

  let emailsProcessed = 0;
  let transactionsCreated = 0;
  let duplicatesSkipped = 0;
  let parseFailures = 0;
  let limitBreachAlerts = 0;

  let skippedAlreadyProcessed = 0;
  let skippedNonDebit = 0;
  let skippedDuplicateContentHash = 0;
  let skippedNoMatchingCard = 0;
  let skippedExistingTransaction = 0;
  let transactionsWithoutCard = 0;

  try {
    // Step 1: Fetch emails from provider
    const emails = provider === "gmail"
      ? await fetchGmailEmails(accessToken, daysBack)
      : await fetchOutlookEmails(accessToken, daysBack);

    logger.info(`Fetched ${emails.length} emails from ${provider}`);

    // Track dates for debugging
    const emailDates = emails.map(e => new Date(e.receivedDate).toISOString().split('T')[0]);
    const uniqueDates = [...new Set(emailDates)].sort();
    logger.info(`Email date range: ${uniqueDates.length} unique dates from ${uniqueDates[0]} to ${uniqueDates[uniqueDates.length - 1]}`);
    logger.info(`Dates with emails: ${uniqueDates.join(', ')}`);

    // Step 2: Process each email
    for (const email of emails) {
      try {
        // Check if already processed by message ID
        if (await isEmailAlreadyProcessed(userId, email.messageId)) {
          const emailDate = new Date(email.receivedDate).toISOString().split('T')[0];
          logger.info(`[${emailDate}] Skipping already processed: ${email.subject.substring(0, 50)}`);
          duplicatesSkipped++;
          skippedAlreadyProcessed++;
          continue;
        }

        // NEW: Classify email using metadata first
        logger.info(`[Stage 1] Classifying email: ${email.subject.substring(0, 50)}...`);
        const classification = classifyEmail(email);
        logger.info(`[Stage 1] Category: ${classification.category}, Confidence: ${classification.confidence.toFixed(2)}, Bank: ${classification.bankName || 'Unknown'}`);
        
        // Skip non-transaction emails early
        if ([EmailCategory.OTP, EmailCategory.PROMOTION].includes(classification.category)) {
          const emailDate = new Date(email.receivedDate).toISOString().split('T')[0];
          logger.info(`[${emailDate}] Skipping ${classification.category}: ${email.subject.substring(0, 50)}`);
          await markEmailAsProcessed(
            userId,
            email.messageId,
            email.subject,
            email.from,
            email.receivedDate,
            false,
            classification.bankName,
            undefined,
            `Non-transaction email: ${classification.category}`,
            email.body,
            email.snippet
          );
          continue;
        }
        
        // Allow STATEMENT to try parsing (might contain transaction details)
        if (classification.category === EmailCategory.STATEMENT) {
          const emailDate = new Date(email.receivedDate).toISOString().split('T')[0];
          logger.info(`[${emailDate}] STATEMENT email - attempting to parse: ${email.subject.substring(0, 50)}`);
        }
        
        // Skip unknown emails with low confidence
        if (classification.category === EmailCategory.UNKNOWN) {
          logger.info(`[Stage 1] Unknown email type, skipping`);
          await markEmailAsProcessed(
            userId,
            email.messageId,
            email.subject,
            email.from,
            email.receivedDate,
            false,
            undefined,
            undefined,
            "Email type could not be determined",
            email.body,
            email.snippet
          );
          continue;
        }
        
        // NEW: Try quick extraction from snippet
        logger.info(`[Stage 2] Quick extraction from snippet...`);
        const quickExtract = quickExtractFromSnippet(email.snippet || "", email.subject);
        logger.info(`[Stage 2] Amount: ${quickExtract.amount || 'N/A'}, Card: ${quickExtract.cardLast4 || 'N/A'}, Confidence: ${quickExtract.confidence.toFixed(2)}`);
        
        // Decide if full body parse is needed
        const shouldParseBody = needsFullBodyParse(classification, quickExtract);
        
        let parsed = null;
        
        if (shouldParseBody) {
          // Full body parsing
          logger.info(`[Stage 3] Full body parsing required`);
          const parser = parserFactory.findParser(email);
          if (!parser) {
            logger.warn(`[Stage 3] No parser found for email from: ${email.from}`);
            await markEmailAsProcessed(
              userId,
              email.messageId,
              email.subject,
              email.from,
              email.receivedDate,
              false,
              classification.bankName,
              undefined,
              "No matching parser found",
              email.body,
              email.snippet
            );
            parseFailures++;
            continue;
          }
          logger.info(`[Stage 3] Using parser: ${parser.getBankName()}`);
          parsed = parser.parse(email);
        } else {
          // Use snippet data (skip full parse)
          logger.info(`[Stage 2] Using snippet data, skipping full body parse`);
          if (quickExtract.amount && quickExtract.amount > 0) {
            parsed = {
              amount: quickExtract.amount,
              transactionType: "DEBIT" as const,
              merchantName: quickExtract.merchant || "Unknown Merchant",
              maskedCardNumber: quickExtract.cardLast4,
              transactionDate: email.receivedDate,
              transactionTime: undefined,
              bankName: classification.bankName || "Unknown",
              emailSubject: email.subject,
              emailSender: email.from,
              emailDate: email.receivedDate,
              isValid: true
            };
          }
        }
        
        if (!parsed || !parsed.isValid) {
          logger.warn(`Failed to extract transaction data: ${email.subject}`);
          logger.warn(`Email body length: ${email.body.length}, snippet: ${email.body.substring(0, 200)}...`);
          await markEmailAsProcessed(
            userId,
            email.messageId,
            email.subject,
            email.from,
            email.receivedDate,
            false,
            undefined,
            undefined,
            "Could not parse email or non-transaction email",
            email.body,
            email.snippet
          );
          parseFailures++;
          continue;
        }

        logger.info(`Parsed transaction: ${parsed.bankName}, ₹${parsed.amount} at ${parsed.merchantName}`);

        // Only import spending (debit) alerts.
        if (parsed.transactionType !== "DEBIT") {
          logger.info(`Skipping non-DEBIT email: ${email.subject.substring(0, 60)}`);
          await markEmailAsProcessed(
            userId,
            email.messageId,
            email.subject,
            email.from,
            email.receivedDate,
            false,
            parsed.bankName,
            undefined,
            "Not a debit/spend transaction",
            email.body,
            email.snippet
          );
          duplicatesSkipped++;
          skippedNonDebit++;
          continue;
        }

        // Generate content hash for deduplication (amount + date + merchant + card)
        const contentHash = generateContentHash(parsed);

        // Skip if we've already imported an equivalent transaction (e.g., forwarded email, duplicate alert)
        if (await isTransactionDuplicate(userId, contentHash)) {
          logger.info(`Duplicate transaction (content hash) skipped: ${email.subject.substring(0, 60)}`);
          await markEmailAsProcessed(
            userId,
            email.messageId,
            email.subject,
            email.from,
            email.receivedDate,
            true,
            parsed.bankName,
            undefined,
            "Duplicate transaction (content hash)",
            email.body,
            email.snippet
          );
          duplicatesSkipped++;
          skippedDuplicateContentHash++;
          continue;
        }

        // Find matching credit card (optional)
        const card = await findCreditCard(
          userId,
          parsed.maskedCardNumber,
          parsed.bankName
        );

        if (!card) {
          logger.warn(`No registered credit card found for ${parsed.bankName} ending ${parsed.maskedCardNumber}`);
          logger.info(`Creating transaction without card link (you can add card later for tracking)`);
          skippedNoMatchingCard++;
          transactionsWithoutCard++;
        } else {
          logger.info(`Matched card: ${card.cardName} (${card._id})`);

          // Skip if user already has this transaction (manual or previously imported)
          const existingTxn = await findExistingCardExpenseTransaction(
            userId,
            card._id,
            parsed.amount,
            parsed.transactionDate || parsed.emailDate,
            parsed.merchantName
          );

          if (existingTxn) {
            logger.info(`Existing credit-card transaction found in DB, skipping import: ${existingTxn._id}`);
            await markEmailAsProcessed(
              userId,
              email.messageId,
              email.subject,
              email.from,
              email.receivedDate,
              true,
              parsed.bankName,
              existingTxn._id.toString(),
              "Transaction already exists (manual or previously created)",
              email.body,
              email.snippet
            );
            await recordTransactionHash(userId, contentHash, email.messageId, existingTxn._id.toString());
            duplicatesSkipped++;
            skippedExistingTransaction++;
            continue;
          }
        }

        // Create transaction record (with or without card link)
        const transactionData: any = {
          userId: new Types.ObjectId(userId),
          type: "expense",
          amount: parsed.amount,
          category: "shopping", // Default category, can be improved with ML
          description: card 
            ? `${parsed.merchantName} - ${card.bankName} ${card.cardName}`
            : `${parsed.merchantName} - ${parsed.bankName} Card ending ${parsed.maskedCardNumber || '****'}`,
          date: parsed.transactionDate || parsed.emailDate,
          paymentType: card ? "credit" : "debit" // Use debit if no card matched
        };

        // Add creditCardId only if card was found
        if (card) {
          transactionData.creditCardId = card._id;
        }

        const transaction = await Transaction.create(transactionData);

        logger.info(`Transaction created: ${transaction._id}`);
        transactionsCreated++;

        // Mark email as successfully processed
        await markEmailAsProcessed(
          userId,
          email.messageId,
          email.subject,
          email.from,
          email.receivedDate,
          true,
          parsed.bankName,
          transaction._id.toString(),
          undefined,
          email.body,
          email.snippet
        );

        // Record transaction hash for deduplication
        await recordTransactionHash(
          userId,
          contentHash,
          email.messageId,
          transaction._id.toString()
        );

        // Update monthly spending only if card was found and has monthly limit
        if (card && card.monthlyLimit && card.monthlyLimit > 0) {
          await addTransactionToMonthly(
            userId,
            card._id.toString(),
            parsed.amount,
            parsed.transactionDate || parsed.emailDate
          );

          // Check if limit breached
          const limitCheck = await checkMonthlyLimit(
            card._id.toString(),
            userId,
            parsed.amount
          );
          if (limitCheck.isBreached) {
            logger.warn(`Monthly limit breached for card ${card.cardName}`);
            
            // Send alert (TODO: Get user email/phone from User model)
            await sendLimitBreachAlert(
              userId,
              undefined, // userEmail
              undefined, // userPhone
              card.cardName,
              card.bankName,
              card.last4Digits,
              limitCheck.currentSpent,
              limitCheck.monthlyLimit,
              getCurrentMonth(parsed.transactionDate || parsed.emailDate)
            );
            
            limitBreachAlerts++;
          }
        }

        emailsProcessed++;

      } catch (emailError) {
        logger.error(`Error processing email ${email.messageId}:`, emailError);
        parseFailures++;
      }
    }

    return {
      success: true,
      message: `Processed ${emailsProcessed} emails successfully`,
      emailsProcessed,
      transactionsCreated,
      duplicatesSkipped,
      skipped: {
        total: duplicatesSkipped,
        alreadyProcessed: skippedAlreadyProcessed,
        nonDebit: skippedNonDebit,
        duplicateContentHash: skippedDuplicateContentHash,
        noMatchingCard: skippedNoMatchingCard,
        existingTransaction: skippedExistingTransaction
      },
      transactionsWithoutCard,
      parseFailures,
      limitBreachAlerts
    };

  } catch (error) {
    logger.error("Error in processEmails:", error);
    return {
      success: false,
      message: `Error processing emails: ${(error as Error).message}`,
      emailsProcessed,
      transactionsCreated,
      duplicatesSkipped,
      skipped: {
        total: duplicatesSkipped,
        alreadyProcessed: skippedAlreadyProcessed,
        nonDebit: skippedNonDebit,
        duplicateContentHash: skippedDuplicateContentHash,
        noMatchingCard: skippedNoMatchingCard,
        existingTransaction: skippedExistingTransaction
      },
      transactionsWithoutCard,
      parseFailures,
      limitBreachAlerts
    };
  }
};

/**
 * Find user's credit card by last 4 digits and bank name
 */
const findCreditCard = async (
  userId: string,
  last4Digits: string | undefined,
  bankName: string
) => {
  const query: any = {
    userId: new Types.ObjectId(userId),
    isActive: true,
    bankName: new RegExp(bankName, "i") // Case-insensitive match
  };

  if (last4Digits) {
    query.last4Digits = last4Digits;
  }

  logger.info(`[findCreditCard] Query: userId=${userId}, last4=${last4Digits}, bankName=${bankName}`);
  logger.info(`[findCreditCard] Query object: ${JSON.stringify(query)}`);
  
  const result = await CreditCard.findOne(query);
  
  if (!result) {
    // Try to find all cards for this user to debug
    const allCards = await CreditCard.find({ userId: new Types.ObjectId(userId), isActive: true });
    logger.info(`[findCreditCard] No match found. User has ${allCards.length} active cards:`);
    allCards.forEach(card => {
      logger.info(`  - Bank: ${card.bankName}, Last4: ${card.last4Digits}, Name: ${card.cardName}`);
    });
  } else {
    logger.info(`[findCreditCard] Match found: ${result.cardName}`);
  }
  
  return result;
};

/**
 * Get supported banks
 */
export const getSupportedBanks = (): string[] => {
  return parserFactory.getSupportedBanks();
};
