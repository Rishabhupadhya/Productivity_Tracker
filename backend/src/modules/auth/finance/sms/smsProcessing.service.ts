/**
 * SMS Processing Service
 * 
 * Orchestrates the entire SMS-to-alert pipeline:
 * 1. Parse incoming SMS
 * 2. Match to user's credit card
 * 3. Update monthly spending
 * 4. Check limit breach
 * 5. Trigger alerts if needed
 */

import { Types } from "mongoose";
import { SmsParserFactory } from "./smsParser.interface";
import { IciciSmsParser } from "./parsers/iciciParser";
import { HdfcSmsParser } from "./parsers/hdfcParser";
import { SbiSmsParser } from "./parsers/sbiParser";
import { AxisSmsParser } from "./parsers/axisParser";
import { addTransactionToMonthly, checkMonthlyLimit, getCurrentMonth } from "./monthlySpending.service";
import { sendLimitBreachAlert } from "./alert.service";
import { CreditCard } from "../creditCard.model";
import { Transaction } from "../finance.model";
import { logger } from "../../../../utils/logger";

// Initialize parser factory with all bank parsers
const parserFactory = new SmsParserFactory();
parserFactory.registerParser(new IciciSmsParser());
parserFactory.registerParser(new HdfcSmsParser());
parserFactory.registerParser(new SbiSmsParser());
parserFactory.registerParser(new AxisSmsParser());

export interface SmsProcessingResult {
  success: boolean;
  message: string;
  parsedData?: any;
  transactionId?: string;
  limitBreached?: boolean;
  alertSent?: boolean;
}

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

  return await CreditCard.findOne(query);
};

/**
 * Process incoming SMS message
 * 
 * @param userId User ID who received the SMS
 * @param smsText Raw SMS text
 * @param receivedAt When SMS was received (defaults to now)
 * @returns Processing result with status and details
 */
export const processSms = async (
  userId: string,
  smsText: string,
  receivedAt: Date = new Date()
): Promise<SmsProcessingResult> => {
  try {
    // Step 1: Parse SMS
    logger.info(`Processing SMS for user ${userId}`);
    const parsedData = parserFactory.parse(smsText, receivedAt);

    if (!parsedData || !parsedData.isValid) {
      return {
        success: false,
        message: "SMS could not be parsed or is not a credit card transaction"
      };
    }

    logger.info(`Parsed transaction: ${parsedData.bankName}, ₹${parsedData.amount} at ${parsedData.merchantName}`);

    // Step 2: Find matching credit card
    const card = await findCreditCard(
      userId,
      parsedData.maskedCardNumber,
      parsedData.bankName
    );

    if (!card) {
      return {
        success: false,
        message: `No matching credit card found for ${parsedData.bankName}${parsedData.maskedCardNumber ? ` ending ${parsedData.maskedCardNumber}` : ""}`,
        parsedData
      };
    }

    logger.info(`Matched card: ${card.cardName} (${card._id})`);

    // Step 3: Create transaction record
    const transaction = await Transaction.create({
      userId: new Types.ObjectId(userId),
      type: "expense",
      amount: parsedData.amount,
      category: "Credit Card Expense",
      description: `${parsedData.merchantName} - Auto-imported from SMS`,
      payment: `${card.bankName} ${card.cardName}`,
      date: parsedData.transactionDate || receivedAt,
      isRecurring: false,
      paymentType: "credit",
      creditCardId: card._id,
      teamId: card.teamId
    });

    logger.info(`Created transaction: ${transaction._id}`);

    // Step 4: Update monthly spending
    const monthlySpending = await addTransactionToMonthly(
      userId,
      card._id.toString(),
      parsedData.amount,
      parsedData.transactionDate || receivedAt
    );

    // Step 5: Check if monthly limit is breached
    let limitBreached = false;
    let alertSent = false;

    if (card.monthlyLimit && card.monthlyLimit > 0) {
      const limitCheck = await checkMonthlyLimit(
        userId,
        card._id.toString(),
        card.monthlyLimit,
        getCurrentMonth(parsedData.transactionDate || receivedAt)
      );

      if (limitCheck.isBreached) {
        limitBreached = true;
        logger.warn(`Monthly limit breached for card ${card.cardName}: ₹${limitCheck.currentSpent} / ₹${limitCheck.monthlyLimit}`);

        // Step 6: Send alert
        // TODO: Get user email/phone from User model
        await sendLimitBreachAlert(
          userId,
          undefined, // userEmail - should be fetched from User model
          undefined, // userPhone - should be fetched from User model
          card.cardName,
          card.bankName,
          card.last4Digits,
          limitCheck.currentSpent,
          limitCheck.monthlyLimit,
          getCurrentMonth(parsedData.transactionDate || receivedAt)
        );

        alertSent = true;
        logger.info("Limit breach alert sent");
      }
    }

    return {
      success: true,
      message: "SMS processed successfully",
      parsedData,
      transactionId: transaction._id.toString(),
      limitBreached,
      alertSent
    };
  } catch (error) {
    logger.error("Error processing SMS:", error);
    return {
      success: false,
      message: `Error processing SMS: ${(error as Error).message}`
    };
  }
};

/**
 * Get list of supported banks
 */
export const getSupportedBanks = (): string[] => {
  return parserFactory.getRegisteredBanks();
};

/**
 * Test SMS parsing without saving to database
 * Useful for testing and validation
 */
export const testSmsParsing = (smsText: string, receivedAt: Date = new Date()) => {
  return parserFactory.parse(smsText, receivedAt);
};
