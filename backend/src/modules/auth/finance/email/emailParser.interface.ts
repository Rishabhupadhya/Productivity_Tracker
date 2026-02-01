/**
 * Email Parser Interface
 * 
 * Strategy Pattern for parsing bank transaction alert emails.
 * Each bank has different email formats, so we use parsers similar to SMS module.
 */

export interface ParsedEmailTransaction {
  amount: number;
  transactionType: "DEBIT" | "CREDIT";
  merchantName: string;
  maskedCardNumber?: string; // Last 4 digits if available
  transactionDate?: Date; // Extracted from email or fallback to received date
  transactionTime?: string; // Time portion if available (e.g., "14:30")
  bankName: string;
  emailSubject: string;
  emailSender: string;
  emailDate: Date;
  isValid: boolean;
}

/**
 * Raw email data structure from Gmail/Outlook APIs
 */
export interface RawEmailData {
  messageId: string; // Unique email identifier
  subject: string;
  from: string; // Sender email address
  body: string; // Email body (text or HTML parsed to text)
  receivedDate: Date;
  snippet?: string; // Email preview/summary
}

/**
 * Base interface for bank-specific email parsers
 */
export interface IEmailParser {
  /**
   * Bank identifier (e.g., "ICICI", "HDFC", "SBI", "Axis")
   */
  getBankName(): string;

  /**
   * Check if this parser can handle the given email
   * Based on sender domain and subject/body keywords
   */
  canParse(email: RawEmailData): boolean;

  /**
   * Parse the email and extract transaction details
   * 
   * @param email Raw email data
   * @returns Parsed transaction or null if invalid/non-transaction email
   */
  parse(email: RawEmailData): ParsedEmailTransaction | null;
}

/**
 * Email Parser Factory
 * 
 * Manages all registered parsers and routes emails to appropriate parser
 */
export class EmailParserFactory {
  private parsers: IEmailParser[] = [];

  /**
   * Register a new bank email parser
   */
  registerParser(parser: IEmailParser): void {
    this.parsers.push(parser);
  }

  /**
   * Find the appropriate parser for the given email
   */
  findParser(email: RawEmailData): IEmailParser | null {
    return this.parsers.find(parser => parser.canParse(email)) || null;
  }

  /**
   * Parse email using the appropriate bank parser
   */
  parse(email: RawEmailData): ParsedEmailTransaction | null {
    const parser = this.findParser(email);
    if (!parser) {
      return null; // No parser found, might be unsupported bank
    }
    return parser.parse(email);
  }

  /**
   * Get list of all supported banks
   */
  getSupportedBanks(): string[] {
    return this.parsers.map(p => p.getBankName());
  }
}
