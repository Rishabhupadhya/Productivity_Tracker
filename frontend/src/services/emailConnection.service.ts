/**
 * Email Connection Service
 * Handles Gmail OAuth connection and transaction import
 */

import { api } from './api';

export interface EmailConnectionStatus {
  connected: boolean;
  provider: 'gmail' | 'outlook' | null;
  userEmail?: string;
  connectedAt?: string;
}

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
  parseFailures: number;
  limitBreachAlerts: number;
}

/**
 * Get Gmail OAuth authorization URL
 */
export const getGmailAuthUrl = async (): Promise<string> => {
  const response = await api.get('/finance/email/oauth/gmail/authorize');
  return response.data.authUrl;
};

/**
 * Check email connection status
 */
export const checkEmailConnection = async (): Promise<EmailConnectionStatus> => {
  try {
    // Try to get OAuth token info from backend
    const response = await api.get('/finance/email/oauth/status');
    return response.data;
  } catch (error) {
    // If no token or error, return disconnected
    return {
      connected: false,
      provider: null
    };
  }
};

/**
 * Disconnect email account
 */
export const disconnectEmail = async (provider: 'gmail' | 'outlook'): Promise<void> => {
  await api.delete(`/finance/email/disconnect/${provider}`);
};

/**
 * Process emails and import transactions
 */
export const processEmails = async (
  provider: 'gmail' | 'outlook',
  daysBack: number = 30
): Promise<EmailProcessingResult> => {
  const response = await api.post(`/finance/email/process?daysBack=${daysBack}`, {
    provider
  });
  return response.data;
};

/**
 * Get email processing history
 */
export const getEmailProcessingHistory = async () => {
  const response = await api.get('/finance/email/history');
  return response.data;
};

/**
 * Clear email import history (allows reimporting same emails)
 */
export const clearEmailHistory = async (): Promise<{ 
  emailsCleared: number; 
  hashesCleared: number;
  transactionsDeleted: number;
}> => {
  const response = await api.delete('/finance/email/clear-history');
  return response.data;
};
