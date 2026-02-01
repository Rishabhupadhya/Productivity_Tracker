// Test email parsing with actual data

const testEmail = {
  messageId: 'test-123',
  subject: 'Transaction Alert from Reliance SBI Credit Card Premium',
  from: 'SBI Card Transaction Alert <onlinesbicard@sbicard.com>',
  body: 'Untitled Document table Dear Cardholder, This is to inform you that, Rs.110.00 spent on your SBI Credit Card ending with 0468 at BalajiBartanBhandar on 01-02-26 via UPI (Ref No. 698462288282). Trxn. not done by you?',
  receivedDate: new Date('2026-02-01'),
  snippet: 'SBI Card Transaction Alert'
};

// Test SBI parser canParse
const sbiSenderMatch = /@sbi(card)?\.(co\.in|com)/i.test(testEmail.from);
const hasSbiKeywords = /SBI|State\s*Bank/i.test(testEmail.subject) || /SBI|State\s*Bank/i.test(testEmail.body);
const hasCreditCardKeywords = /credit\s*card|card/i.test(testEmail.subject) || /credit\s*card|card/i.test(testEmail.body);

console.log('=== SBI Parser canParse() Test ===');
console.log(`Email from: ${testEmail.from}`);
console.log(`Subject: ${testEmail.subject}`);
console.log(`\nCanParse checks:`);
console.log(`  isSbiSender: ${sbiSenderMatch}`);
console.log(`  hasSbiKeywords: ${hasSbiKeywords}`);
console.log(`  hasCreditCardKeywords: ${hasCreditCardKeywords}`);
console.log(`  Final canParse result: ${sbiSenderMatch && hasSbiKeywords && hasCreditCardKeywords}`);

if (sbiSenderMatch && hasSbiKeywords && hasCreditCardKeywords) {
  console.log('\n✅ Parser would accept this email\n');
  
  // Test parsing
  console.log('=== Testing parse() ===');
  const amountMatch = testEmail.body.match(/(?:Rs\.?\s*|INR\s*)([\d,]+\.?\d*)/i);
  const cardMatch = testEmail.body.match(/ending\s*(?:with\s*)?(\d{4})|XX+(\d{4})|card\s*(\d{4})/i);
  const merchantMatch = testEmail.body.match(/(?:at|from)\s+([A-Z][A-Z0-9\s&.-]+?)(?:\s+on|\s+dated|\.|$)/i);
  
  console.log(`Amount match: ${amountMatch ? amountMatch[1] : 'NONE'}`);
  console.log(`Card match: ${cardMatch ? (cardMatch[1] || cardMatch[2] || cardMatch[3]) : 'NONE'}`);
  console.log(`Merchant match: ${merchantMatch ? merchantMatch[1] : 'NONE'}`);
  
  if (amountMatch) {
    console.log(`\n✅ Would create transaction:`);
    console.log(`   Amount: Rs.${amountMatch[1]}`);
    console.log(`   Card: ${cardMatch ? (cardMatch[1] || cardMatch[2] || cardMatch[3]) : 'Unknown'}`);
    console.log(`   Merchant: ${merchantMatch ? merchantMatch[1].trim() : 'Unknown Merchant'}`);
  } else {
    console.log('\n❌ parse() would return null (no amount found)');
  }
} else {
  console.log('\n❌ Parser would reject this email');
}
