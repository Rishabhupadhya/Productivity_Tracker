/**
 * Alert Service
 * 
 * Sends notifications (email/SMS) when credit card monthly limits are breached.
 * Currently implements console logging for demonstration.
 * Production implementation should integrate with email/SMS providers.
 */

import { logger } from "../../../../utils/logger";

export type AlertType = "EMAIL" | "SMS" | "BOTH";

export interface AlertData {
  userId: string;
  userEmail?: string;
  userPhone?: string;
  cardName: string;
  bankName: string;
  last4Digits: string;
  currentSpent: number;
  monthlyLimit: number;
  amountOver: number;
  month: string;
}

/**
 * Generate alert message for limit breach
 */
const generateAlertMessage = (data: AlertData): string => {
  return `⚠️ CREDIT CARD LIMIT ALERT

Dear Customer,

You have spent ₹${data.currentSpent.toLocaleString()} this month on your ${data.bankName} Credit Card (${data.cardName} ending ${data.last4Digits}), exceeding your set limit of ₹${data.monthlyLimit.toLocaleString()}.

Amount over limit: ₹${data.amountOver.toLocaleString()}

We recommend stopping further usage on this card for the rest of the month to stay within your budget.

Month: ${data.month}

---
This is an automated alert from Credit Card Intelligence System.`;
};

/**
 * Send email alert (mock implementation)
 * 
 * In production, integrate with:
 * - SendGrid
 * - AWS SES
 * - Nodemailer with SMTP
 * - Twilio SendGrid API
 */
const sendEmailAlert = async (data: AlertData): Promise<boolean> => {
  try {
    const message = generateAlertMessage(data);
    
    // TODO: Replace with actual email service integration
    logger.info(`[EMAIL ALERT] Sending to ${data.userEmail}:`);
    logger.info(message);
    
    // Simulate email sending
    // await emailProvider.send({
    //   to: data.userEmail,
    //   subject: `⚠️ Credit Card Monthly Limit Exceeded - ${data.cardName}`,
    //   body: message
    // });
    
    return true;
  } catch (error) {
    logger.error("Failed to send email alert:", error);
    return false;
  }
};

/**
 * Send SMS alert (mock implementation)
 * 
 * In production, integrate with:
 * - Twilio
 * - AWS SNS
 * - MSG91
 * - Vonage (Nexmo)
 */
const sendSmsAlert = async (data: AlertData): Promise<boolean> => {
  try {
    const shortMessage = `ALERT: You've spent ₹${data.currentSpent.toLocaleString()} on ${data.bankName} ${data.cardName} (${data.last4Digits}), exceeding your ₹${data.monthlyLimit.toLocaleString()} monthly limit. Consider stopping further usage.`;
    
    // TODO: Replace with actual SMS service integration
    logger.info(`[SMS ALERT] Sending to ${data.userPhone}:`);
    logger.info(shortMessage);
    
    // Simulate SMS sending
    // await smsProvider.send({
    //   to: data.userPhone,
    //   message: shortMessage
    // });
    
    return true;
  } catch (error) {
    logger.error("Failed to send SMS alert:", error);
    return false;
  }
};

/**
 * Send alert via specified channels
 * 
 * @param data Alert data containing user and card information
 * @param alertType Type of alert: EMAIL, SMS, or BOTH
 * @returns Object with success status per channel
 */
export const sendAlert = async (
  data: AlertData,
  alertType: AlertType = "BOTH"
): Promise<{ email: boolean; sms: boolean }> => {
  const results = { email: false, sms: false };
  
  if (alertType === "EMAIL" || alertType === "BOTH") {
    if (data.userEmail) {
      results.email = await sendEmailAlert(data);
    } else {
      logger.warn("Email alert requested but no email address provided");
    }
  }
  
  if (alertType === "SMS" || alertType === "BOTH") {
    if (data.userPhone) {
      results.sms = await sendSmsAlert(data);
    } else {
      logger.warn("SMS alert requested but no phone number provided");
    }
  }
  
  return results;
};

/**
 * Send limit breach alert
 * Convenience function for the most common use case
 */
export const sendLimitBreachAlert = async (
  userId: string,
  userEmail: string | undefined,
  userPhone: string | undefined,
  cardName: string,
  bankName: string,
  last4Digits: string,
  currentSpent: number,
  monthlyLimit: number,
  month: string,
  alertType: AlertType = "BOTH"
): Promise<void> => {
  const amountOver = currentSpent - monthlyLimit;
  
  await sendAlert(
    {
      userId,
      userEmail,
      userPhone,
      cardName,
      bankName,
      last4Digits,
      currentSpent,
      monthlyLimit,
      amountOver,
      month
    },
    alertType
  );
};
