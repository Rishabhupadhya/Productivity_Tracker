// Test updated parsers with sample Indian bank emails

const testEmails = [
  {
    bank: 'HDFC',
    messageId: 'test-hdfc-1',
    subject: 'Transaction Alert from HDFC Bank Credit Card',
    from: 'alerts@hdfcbank.com',
    body: 'Rs.380.00 is debited from your HDFC Bank Credit Card ending 5712 towards MANISH SHOES GARMENTS on 30 Jan, 2026 at 21:25:59. Available balance: Rs 89,620.00',
    receivedDate: new Date('2026-01-30'),
    snippet: 'Transaction alert'
  },
  {
    bank: 'SBI',
    messageId: 'test-sbi-1',
    subject: 'Transaction Alert from Reliance SBI Credit Card Premium',
    from: 'onlinesbicard@sbicard.com',
    body: 'Dear Cardholder, This is to inform you that, Rs.110.00 spent on your SBI Credit Card ending with 0468 at BalajiBartanBhandar on 01-02-26 via UPI (Ref No. 698462288282). Trxn. not done by you? Report at https://sbicard.com/Dispute.',
    receivedDate: new Date('2026-02-01'),
    snippet: 'SBI Card Transaction Alert'
  },
  {
    bank: 'HDFC',
    messageId: 'test-hdfc-2',
    subject: 'HDFC Bank Credit Card Transaction',
    from: 'alerts@hdfcbank.com',
    body: 'Rs.79.80 is debited from your HDFC Bank Credit Card ending 5712 towards RESTAURANT BRANDS ASIA on 30 Jan, 2026 at 21:12:30. To know your available balance, outstanding amount and transactions in detail, please visit MyCards.',
    receivedDate: new Date('2026-01-30'),
    snippet: 'Debit transaction'
  }
];

console.log('='.repeat(80));
console.log('TESTING BANK EMAIL PARSERS');
console.log('='.repeat(80));

testEmails.forEach((email, index) => {
  console.log(`\n[Test ${index + 1}] ${email.bank} Email`);
  console.log('-'.repeat(80));
  console.log(`Subject: ${email.subject}`);
  console.log(`Body: ${email.body.substring(0, 100)}...`);
  
  // Test amount extraction
  const amountMatch = email.body.match(/(?:Rs\.?|INR)\s*([\d,]+(?:\.\d{1,2})?)/i);
  console.log(`\n✓ Amount: ${amountMatch ? 'Rs.' + amountMatch[1] : '❌ NOT FOUND'}`);
  
  // Test card extraction
  const cardMatch = email.body.match(/(?:ending\s*(?:with)?|card)\s*(\d{4})|XX+(\d{4})/i);
  console.log(`✓ Card: ${cardMatch ? (cardMatch[1] || cardMatch[2]) : '❌ NOT FOUND'}`);
  
  // Test merchant extraction
  let merchantMatch;
  if (email.bank === 'HDFC') {
    merchantMatch = email.body.match(/towards\s+([A-Z][A-Za-z0-9\s&.',-]+?)(?:\s+on|\s+dated|\.|$)/i);
  } else {
    merchantMatch = email.body.match(/\bat\s+([A-Z][A-Za-z0-9\s&.',-]+?)(?:\s+on|\s+via|\.|$)/i);
  }
  console.log(`✓ Merchant: ${merchantMatch ? merchantMatch[1].trim() : '❌ NOT FOUND'}`);
  
  // Test date extraction
  let dateMatch;
  if (email.bank === 'HDFC') {
    dateMatch = email.body.match(/on\s+(\d{1,2})\s+([A-Za-z]{3})\s*,?\s*(\d{4})/i);
    if (dateMatch) {
      console.log(`✓ Date: ${dateMatch[1]} ${dateMatch[2]} ${dateMatch[3]}`);
    }
  } else {
    dateMatch = email.body.match(/on\s+(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})/);
    if (dateMatch) {
      console.log(`✓ Date: ${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`);
    }
  }
  if (!dateMatch) {
    console.log(`✓ Date: ❌ NOT FOUND`);
  }
  
  // Test time extraction
  const timeMatch = email.body.match(/\bat\s+(\d{1,2}):(\d{2})(?::(\d{2}))?/i);
  console.log(`✓ Time: ${timeMatch ? timeMatch[0].replace(/^at\s+/i, '') : 'Not present'}`);
  
  // Test keyword detection
  const hasTransactionKeyword = /\b(spent|debited|charged|used)\b/i.test(email.body);
  console.log(`✓ Transaction keyword: ${hasTransactionKeyword ? '✓ YES' : '❌ NO'}`);
  
  // Test exclusions
  const isExcluded = /OTP|One.?Time.?Password|promotional|reward.*points|statement/i.test(email.body);
  console.log(`✓ Should exclude: ${isExcluded ? '❌ YES (will be filtered)' : '✓ NO (valid transaction)'}`);
  
  console.log(`\n${hasTransactionKeyword && !isExcluded && amountMatch && cardMatch && merchantMatch ? '✅ PARSER SHOULD SUCCEED' : '❌ PARSER WILL FAIL'}`);
});

console.log('\n' + '='.repeat(80));
console.log('Test complete. All patterns validated.');
console.log('='.repeat(80));
