const { google } = require('googleapis');
const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/productivity_tracker');

const EmailOAuthToken = mongoose.model('EmailOAuthToken', new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  provider: String,
  accessToken: String,
  refreshToken: String,
  expiresAt: Date
}));

async function debugEmails() {
  try {
    // Get token
    const tokenDoc = await EmailOAuthToken.findOne({ provider: 'gmail' });
    if (!tokenDoc) {
      console.log('No Gmail token found');
      return;
    }

    // Decrypt token (stored encrypted)
    const crypto = require('crypto');
    const ENCRYPTION_KEY = Buffer.from('75888d4f2679a81dee7cf659165da6de83df13ffefac7619e58669e97693dcae', 'hex');
    
    const decrypt = (encrypted) => {
      const parts = encrypted.split(':');
      const iv = Buffer.from(parts[0], 'hex');
      const authTag = Buffer.from(parts[1], 'hex');
      const encryptedText = Buffer.from(parts[2], 'hex');
      
      const decipher = crypto.createDecipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
      decipher.setAuthTag(authTag);
      
      return decipher.update(encryptedText, undefined, 'utf8') + decipher.final('utf8');
    };

    const accessToken = decrypt(tokenDoc.accessToken);
    console.log('✅ Token decrypted successfully\n');

    // Setup Gmail API
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });
    const gmail = google.gmail({ version: 'v1', auth });

    // Build query with better filtering
    const afterDate = new Date();
    afterDate.setDate(afterDate.getDate() - 180);
    const afterDateStr = afterDate.toISOString().split('T')[0].replace(/-/g, '/');

    const BANK_SENDER_DOMAINS = [
      "icicibank.com",
      "hdfcbank.com",
      "sbi.co.in",
      "sbicard.com",
      "axisbank.com",
      "kotak.com",
      "indusind.com",
      "yesbank.in"
    ];

    const TRANSACTION_KEYWORDS = [
      "transaction",
      "alert",
      "spent",
      "debited",
      "debit",
      "purchase",
      "charged",
      "used"
    ];

    const EXCLUDED_KEYWORDS = [
      "OTP",
      "One Time Password",
      "promotional",
      "offer",
      "reward",
      "voucher",
      "cashback"
    ];

    const senderQuery = BANK_SENDER_DOMAINS.map(domain => `from:*${domain}`).join(" OR ");
    const subjectQuery = TRANSACTION_KEYWORDS.map(kw => `subject:"${kw}"`).join(" OR ");
    const excludeQuery = EXCLUDED_KEYWORDS.map(kw => `-subject:"${kw}"`).join(" ");

    const query = `(${senderQuery}) (${subjectQuery}) ${excludeQuery} after:${afterDateStr}`;
    console.log(`📧 Fetching emails with query:\n${query}\n`);

    // Fetch emails
    const response = await gmail.users.messages.list({
      userId: 'me',
      q: query,
      maxResults: 5 // Just get first 5
    });

    const messages = response.data.messages || [];
    console.log(`Found ${messages.length} emails\n`);

    // Get details of first email
    if (messages.length > 0) {
      const detail = await gmail.users.messages.get({
        userId: 'me',
        id: messages[0].id,
        format: 'full'
      });

      const headers = detail.data.payload.headers;
      const subject = headers.find(h => h.name === 'Subject')?.value || '';
      const from = headers.find(h => h.name === 'From')?.value || '';
      const date = headers.find(h => h.name === 'Date')?.value || '';

      console.log('=== FIRST EMAIL ===');
      console.log(`Subject: ${subject}`);
      console.log(`From: ${from}`);
      console.log(`Date: ${date}`);
      console.log(`\nSnippet: ${detail.data.snippet}`);
      
      // Extract body
      let body = '';
      let bodyType = 'none';
      
      if (detail.data.payload.body.data) {
        body = Buffer.from(detail.data.payload.body.data, 'base64').toString('utf-8');
        bodyType = 'direct';
      } else if (detail.data.payload.parts) {
        // Try text/plain first
        const textPart = detail.data.payload.parts.find(p => p.mimeType === 'text/plain');
        if (textPart?.body?.data) {
          body = Buffer.from(textPart.body.data, 'base64').toString('utf-8');
          bodyType = 'text/plain';
        } else {
          // Fall back to text/html
          const htmlPart = detail.data.payload.parts.find(p => p.mimeType === 'text/html');
          if (htmlPart?.body?.data) {
            body = Buffer.from(htmlPart.body.data, 'base64').toString('utf-8');
            bodyType = 'text/html';
          }
        }
      }
      
      console.log(`Body Type: ${bodyType}`);
      console.log(`Body Length: ${body.length} characters`);
      
      // Strip HTML if present
      if (bodyType === 'text/html') {
        body = body.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        console.log(`\nHTML-stripped body (first 1500 chars):\n${body.substring(0, 1500)}\n`);
      } else {
        console.log(`\nBody (first 1500 chars):\n${body.substring(0, 1500)}\n`);
      }
      
      // Test parsing
      console.log('\n=== TESTING PARSERS ===');
      
      // Check keywords
      const hasTransactionKeyword = /used|debited|charged|transaction|spent/i.test(body);
      const hasAmount = /(?:Rs\.?\s*|INR\s*)([\d,]+\.?\d*)/i.test(body);
      const hasCard = /ending\s*(\d{4})|XX+(\d{4})|card\s*(\d{4})/i.test(body);
      
      console.log(`Has transaction keyword: ${hasTransactionKeyword}`);
      console.log(`Has amount: ${hasAmount}`);
      console.log(`Has card number: ${hasCard}`);
      
      if (hasAmount) {
        const amountMatch = body.match(/(?:Rs\.?\s*|INR\s*)([\d,]+\.?\d*)/i);
        console.log(`Amount found: Rs.${amountMatch[1]}`);
      }
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    mongoose.connection.close();
  }
}

debugEmails();
