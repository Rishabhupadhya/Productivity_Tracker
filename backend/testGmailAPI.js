// Quick test to check if Gmail API is returning any emails

const { google } = require('googleapis');
const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/productivity_tracker');

const EmailOAuthToken = mongoose.model('EmailOAuthToken', new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  provider: String,
  accessToken: String,
  refreshToken: String,
  expiresAt: Date
}));

async function testGmailAPI() {
  try {
    const tokenDoc = await EmailOAuthToken.findOne({ provider: 'gmail' });
    if (!tokenDoc) {
      console.log('❌ No Gmail token found');
      process.exit(1);
    }

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
    console.log('✅ Token decrypted\n');

    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });
    const gmail = google.gmail({ version: 'v1', auth });

    // Test 1: Simple query (all emails from last 7 days)
    console.log('Test 1: Fetching emails from last 7 days...');
    const afterDate = new Date();
    afterDate.setDate(afterDate.getDate() - 7);
    const afterStr = afterDate.toISOString().split('T')[0].replace(/-/g, '/');
    
    const response1 = await gmail.users.messages.list({
      userId: 'me',
      q: `after:${afterStr}`,
      maxResults: 10
    });
    
    console.log(`Found ${response1.data.messages?.length || 0} emails in last 7 days\n`);
    
    // Test 2: Bank emails
    console.log('Test 2: Fetching bank emails...');
    const response2 = await gmail.users.messages.list({
      userId: 'me',
      q: `from:(*icicibank.com OR *hdfcbank.com OR *sbicard.com OR *axisbank.com) after:${afterStr}`,
      maxResults: 10
    });
    
    console.log(`Found ${response2.data.messages?.length || 0} bank emails\n`);
    
    // Test 3: Transaction keywords
    console.log('Test 3: Fetching transaction emails...');
    const response3 = await gmail.users.messages.list({
      userId: 'me',
      q: `(subject:transaction OR subject:debited OR subject:spent) after:${afterStr}`,
      maxResults: 10
    });
    
    console.log(`Found ${response3.data.messages?.length || 0} transaction emails\n`);
    
    if (response3.data.messages && response3.data.messages.length > 0) {
      console.log('Sample email details:');
      const msg = await gmail.users.messages.get({
        userId: 'me',
        id: response3.data.messages[0].id,
        format: 'metadata',
        metadataHeaders: ['From', 'Subject', 'Date']
      });
      
      const headers = msg.data.payload.headers;
      console.log(`  From: ${headers.find(h => h.name === 'From')?.value}`);
      console.log(`  Subject: ${headers.find(h => h.name === 'Subject')?.value}`);
      console.log(`  Snippet: ${msg.data.snippet}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response?.data) {
      console.error('Details:', JSON.stringify(error.response.data, null, 2));
    }
  } finally {
    mongoose.connection.close();
  }
}

testGmailAPI();
