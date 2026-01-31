/**
 * SMS Parser Interface
 * 
 * Defines the contract for bank-specific SMS parsers.
 * Each bank has different SMS formats, so we use the Strategy Pattern
 * to make the system extensible for new banks.
 */

export interface ParsedTransaction {
  amount: number;
  transactionType: "DEBIT" | "CREDIT";
  merchantName: string;
  maskedCardNumber?: string; // Last 4 digits if available
  transactionDate?: Date; // Extracted from SMS or fallback to received timestamp
  bankName: string;
  rawSms: string;
  isValid: boolean; // False if parsing fails or SMS is not a transaction
}

/**
 * Base interface for bank-specific SMS parsers
 */
export interface ISmsParser {
  /**
   * Bank identifier (e.g., "ICICI", "HDFC", "SBI", "Axis")
   */
  getBankName(): string;

  /**
   * Check if this parser can handle the given SMS
   * @param smsText Raw SMS message text
   * @returns true if this parser recognizes the SMS format
   */
  canParse(smsText: string): boolean;

  /**
   * Parse the SMS and extract transaction details
   * @param smsText Raw SMS message text
   * @param receivedAt Timestamp when SMS was received (fallback for transaction date)
   * @returns Parsed transaction data or null if invalid/non-transaction SMS
   */
  parse(smsText: string, receivedAt: Date): ParsedTransaction | null;
}

/**
 * SMS Parser Factory
 * 
 * Manages all registered parsers and routes SMS to the appropriate parser
 */
export class SmsParserFactory {
  private parsers: ISmsParser[] = [];

  /**
   * Register a new bank parser
   */
  registerParser(parser: ISmsParser): void {
    this.parsers.push(parser);
  }

  /**
   * Find the appropriate parser for the given SMS
   */
  findParser(smsText: string): ISmsParser | null {
    return this.parsers.find(parser => parser.canParse(smsText)) || null;
  }

  /**
   * Parse SMS using the appropriate bank parser
   */
  parse(smsText: string, receivedAt: Date = new Date()): ParsedTransaction | null {
    const parser = this.findParser(smsText);
    if (!parser) {
      return null;
    }
    return parser.parse(smsText, receivedAt);
  }

  /**
   * Get all registered parsers
   */
  getRegisteredBanks(): string[] {
    return this.parsers.map(p => p.getBankName());
  }
}
