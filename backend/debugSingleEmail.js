const { MongoClient } = require('mongodb');
const { google } = require('googleapis');
const crypto = require('crypto');

const ENCRYPTION_KEY = '75888d4f2679a81dee7cf659165da6de83df13ffefac7619e58669e97693dcae';

async function debugEmail() {
  const client = new MongoClient('mongodb://localhost:27017');
  await client.connect();
  const db = client.db('productivity_tracker');
  
  // Get user
  const user = await db.collection('users').findOne({ email: 'uprishabh29@gmail.com' });
  console.log('User ID:', user._id.toString());
  
  // Get token
  const tokenDoc = await db.collection('emailoauthtokens').findOne({ 
    userId: user._id,
    provider: 'gmail' 
  });
  
  if (!tokenDoc) {
    console.log('❌ No Gmail token found');
    await client.close();
    return;
  }
  
  // Decrypt access token
  function decrypt(encryptedText) {
    const parts = encryptedText.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedData = Buffer.from(parts[1], 'hex');
    const authTag = Buffer.from(parts[2], 'hex');
    
    const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encryptedData);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString('utf-8');
  }
  
  const accessToken = decrypt(tokenDoc.accessToken);
  console.log('✅ Decrypted access token (length:', accessToken.length, ')');
  
  // Create Gmail client
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });
  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
  
  // Get one message ID from database
  const emailMeta = await db.collection('emailmetadatas').findOne({});
  if (!emailMeta) {
    console.log('❌ No emails in database');
    await client.close();
    return;
  }
  
  console.log('\n📧 Fetching message:', emailMeta.externalId);
  console.log('Subject:', emailMeta.subject);
  
  try {
    const detail = await gmail.users.messages.get({
      userId: 'me',
      id: emailMeta.externalId,
      format: 'full'
    });
    
    console.log('\n✅ Message fetched successfully!');
    console.log('Snippet:', detail.data.snippet);
    console.log('\nPayload structure:');
    console.log('- Body data:', detail.data.payload.body.data ? 'YES' : 'NO');
    console.log('- Parts:', detail.data.payload.parts ? detail.data.payload.parts.length : 0);
    
    if (detail.data.payload.parts) {
      console.log('\nParts:');
      detail.data.payload.parts.forEach((part, i) => {
        console.log(`  ${i+1}. ${part.mimeType} - Body data: ${part.body?.data ? part.body.data.substring(0, 50) + '...' : 'NONE'}`);
      });
      
      // Try to extract body
      const textPart = detail.data.payload.parts.find(p => p.mimeType === 'text/plain');
      const htmlPart = detail.data.payload.parts.find(p => p.mimeType === 'text/html');
      
      if (textPart?.body?.data) {
        const body = Buffer.from(textPart.body.data, 'base64').toString('utf-8');
        console.log('\n📄 TEXT/PLAIN Body (first 500 chars):');
        console.log(body.substring(0, 500));
      } else if (htmlPart?.body?.data) {
        const body = Buffer.from(htmlPart.body.data, 'base64').toString('utf-8');
        const stripped = body.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        console.log('\n📄 TEXT/HTML Body (stripped, first 500 chars):');
        console.log(stripped.substring(0, 500));
      } else {
        console.log('\n⚠️ No body data found in parts!');
        console.log('Part details:', JSON.stringify(detail.data.payload.parts, null, 2));
      }
    }
    
  } catch (error) {
    console.error('❌ Error fetching message:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
  
  await client.close();
}

debugEmail().catch(console.error);
