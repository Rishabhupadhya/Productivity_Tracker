/**
 * Test January Transactions with Mock Email Data
 * Use this to test the system without OAuth
 */

import mongoose from "mongoose";
import { env } from "../../../../config/env";
import { EmailParserFactory } from "./emailParser.interface";
import { IciciEmailParser } from "./parsers/iciciEmailParser";
import { HdfcEmailParser } from "./parsers/hdfcEmailParser";
import { SbiEmailParser } from "./parsers/sbiEmailParser";
import { AxisEmailParser } from "./parsers/axisEmailParser";
import { GenericEmailParser } from "./parsers/genericEmailParser";
import { CreditCard } from "../creditCard.model";
import { Transaction } from "../finance.model";
import { createTransaction } from "../finance.service";
import { logger } from "../../../../utils/logger";

// Mock email data from January 2026
const mockJanuaryEmails = [
  {
    messageId: "mock-icici-001",
    subject: "ICICI Bank Credit Card Transaction Alert",
    from: "alerts@icicibank.com",
    body: "Your ICICI Bank Credit Card ending 1234 has been used for Rs 5,432.00 at AMAZON on 15-Jan-26 at 14:30. Available balance: Rs 89,568.00",
    receivedDate: new Date("2026-01-15T14:30:00Z"),
  },
  {
    messageId: "mock-icici-002",
    subject: "Transaction Alert",
    from: "alerts@icicibank.com",
    body: "Your ICICI Bank Credit Card ending 1234 has been used for Rs 2,150.50 at SWIGGY on 18-Jan-26 at 20:15.",
    receivedDate: new Date("2026-01-18T20:15:00Z"),
  },
  {
    messageId: "mock-hdfc-001",
    subject: "Transaction Alert on your HDFC Bank Credit Card",
    from: "alerts@hdfcbank.com",
    body: "Your HDFC Bank Credit Card ending 5678 is used for Rs.3,250.00 at ZOMATO on 12-01-26 at 19:45. Available limit: Rs.96,750.00",
    receivedDate: new Date("2026-01-12T19:45:00Z"),
  },
  {
    messageId: "mock-hdfc-002",
    subject: "HDFC Credit Card Alert",
    from: "alerts@hdfcbank.com",
    body: "Your HDFC Bank Credit Card ending 5678 is used for Rs.899.00 at NETFLIX on 05-01-26 at 10:00.",
    receivedDate: new Date("2026-01-05T10:00:00Z"),
  },
  {
    messageId: "mock-sbi-001",
    subject: "SBI Card Alert - Transaction",
    from: "alerts@sbicard.com",
    body: "Your SBI Credit Card ending 3456 used for Rs 4,567.89 at FLIPKART on 20/01/26 at 15:30. Available credit limit Rs 95,432.11",
    receivedDate: new Date("2026-01-20T15:30:00Z"),
  },
  {
    messageId: "mock-axis-001",
    subject: "Axis Bank Credit Card - Transaction Alert",
    from: "alerts@axisbank.com",
    body: "Your Axis Bank Credit Card ending 2345 is debited with Rs.8,900.50 for a transaction at SWIGGY on 25-Jan-26",
    receivedDate: new Date("2026-01-25T12:00:00Z"),
  },
  {
    messageId: "mock-icici-003",
    subject: "Transaction Alert",
    from: "alerts@icicibank.com",
    body: "Your ICICI Bank Credit Card ending 1234 has been used for Rs 1,234.00 at STARBUCKS on 28-Jan-26 at 09:15.",
    receivedDate: new Date("2026-01-28T09:15:00Z"),
  },
];

async function testWithMockData(userId: string) {
  try {
    console.log("\n╔════════════════════════════════════════════════════════════╗");
    console.log("║     🧪 Test January Transactions with Mock Email Data     ║");
    console.log("╚════════════════════════════════════════════════════════════╝\n");

    // Connect to database
    await mongoose.connect(env.MONGO_URI);
    console.log("✅ Database connected\n");

    // Initialize parsers
    const parserFactory = new EmailParserFactory();
    parserFactory.registerParser(new IciciEmailParser());
    parserFactory.registerParser(new HdfcEmailParser());
    parserFactory.registerParser(new SbiEmailParser());
    parserFactory.registerParser(new AxisEmailParser());
    parserFactory.registerParser(new GenericEmailParser());

    // Get user's credit cards
    const cards = await CreditCard.find({ userId: new mongoose.Types.ObjectId(userId) });
    console.log(`📇 Found ${cards.length} credit cards for user\n`);

    if (cards.length === 0) {
      console.log("⚠️  No credit cards found!");
      console.log("   Please add credit cards first:");
      console.log("   - Card ending 1234 (ICICI)");
      console.log("   - Card ending 5678 (HDFC)");
      console.log("   - Card ending 3456 (SBI)");
      console.log("   - Card ending 2345 (Axis)\n");
      return;
    }

    cards.forEach((card) => {
      console.log(`   - ${card.cardName} ending ${card.last4Digits}`);
    });
    console.log("");

    let transactionsCreated = 0;
    let parseFailures = 0;
    let noCardMatch = 0;

    console.log("⚙️  Processing mock emails...\n");

    for (const email of mockJanuaryEmails) {
      console.log(`📧 Processing: ${email.subject}`);
      console.log(`   From: ${email.from}`);
      console.log(`   Date: ${email.receivedDate.toISOString().split("T")[0]}`);

      // Parse email - get parser based on sender email
      let parser = null;
      if (email.from.includes('icicibank')) {
        parser = parserFactory['parsers'].find((p: any) => p.constructor.name === 'IciciEmailParser');
      } else if (email.from.includes('hdfcbank')) {
        parser = parserFactory['parsers'].find((p: any) => p.constructor.name === 'HdfcEmailParser');
      } else if (email.from.includes('sbicard')) {
        parser = parserFactory['parsers'].find((p: any) => p.constructor.name === 'SbiEmailParser');
      } else if (email.from.includes('axisbank')) {
        parser = parserFactory['parsers'].find((p: any) => p.constructor.name === 'AxisEmailParser');
      }

      if (!parser) {
        console.log(`   ⚠️  No parser found for ${email.from}\n`);
        parseFailures++;
        continue;
      }

      const parsed = parser.parse(email as any);
      if (!parsed || !parsed.isValid) {
        console.log(`   ❌ Parse failed\n`);
        parseFailures++;
        continue;
      }

      console.log(`   💰 Amount: ₹${parsed.amount}`);
      console.log(`   🏪 Merchant: ${parsed.merchantName}`);
      console.log(`   💳 Card: ending ${parsed.maskedCardNumber}`);

      // Find matching card
      const card = cards.find(
        (c) => c.last4Digits === parsed.maskedCardNumber
      );

      if (!card) {
        console.log(`   ⚠️  No matching card found\n`);
        noCardMatch++;
        continue;
      }

      // Create transaction
      try {
        const transaction = await Transaction.create({
          userId: new mongoose.Types.ObjectId(userId),
          creditCardId: card._id,
          type: "expense",
          amount: parsed.amount,
          category: "Uncategorized",
          description: parsed.merchantName || "Transaction",
          date: parsed.transactionDate || parsed.emailDate,
          paymentType: "credit",
          isRecurring: false
        });

        console.log(`   ✅ Transaction created!\n`);
        transactionsCreated++;
      } catch (error) {
        console.log(`   ❌ Failed to create transaction: ${(error as Error).message}\n`);
        parseFailures++;
      }
    }

    // Display results
    console.log("╔════════════════════════════════════════════════════════════╗");
    console.log("║                     📊 RESULTS                             ║");
    console.log("╚════════════════════════════════════════════════════════════╝\n");

    console.log(`✅ Success: true`);
    console.log(`📧 Emails processed: ${mockJanuaryEmails.length}`);
    console.log(`💳 Transactions created: ${transactionsCreated}`);
    console.log(`⚠️  No card match: ${noCardMatch}`);
    console.log(`❌ Parse failures: ${parseFailures}`);

    if (transactionsCreated > 0) {
      console.log("\n🎉 Successfully created January transactions from mock data!");
      console.log("   Check your transactions in the database or app.");
    }

    if (noCardMatch > 0) {
      console.log("\n💡 Tip: Add these credit cards to see all transactions:");
      console.log("   - Card ending 1234 (ICICI)");
      console.log("   - Card ending 5678 (HDFC)");
      console.log("   - Card ending 3456 (SBI)");
      console.log("   - Card ending 2345 (Axis)");
    }

    console.log("\n✨ Done!\n");
  } catch (error) {
    console.error("\n❌ Error:", error);
    logger.error("Mock test failed:", error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

// Run if executed directly
if (require.main === module) {
  const userId = process.argv[2];
  if (!userId) {
    console.log("\n❌ Usage: npx ts-node testMockEmails.ts USER_ID\n");
    process.exit(1);
  }
  testWithMockData(userId);
}

export { testWithMockData };
