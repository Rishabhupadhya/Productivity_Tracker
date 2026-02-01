// Quick script to fetch January transactions
// Run: node fetchJanuary.js YOUR_EMAIL YOUR_PASSWORD

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:5001/api';

async function fetchJanuaryTransactions() {
  try {
    // Get credentials from command line
    const email = process.argv[2];
    const password = process.argv[3];

    if (!email || !password) {
      console.log('\n❌ Usage: node fetchJanuary.js YOUR_EMAIL YOUR_PASSWORD\n');
      process.exit(1);
    }

    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║   📧 Fetch January Credit Card Transactions from Emails   ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    // Step 1: Login
    console.log('🔐 Step 1: Logging in...');
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (!loginRes.ok) {
      const error = await loginRes.text();
      throw new Error(`Login failed: ${error}`);
    }

    const loginData = await loginRes.json();
    const token = loginData.token;
    const userId = loginData.user.id;

    console.log('✅ Logged in successfully!');
    console.log(`   User ID: ${userId}\n`);

    // Step 2: Get Gmail OAuth URL
    console.log('📧 Step 2: Setting up Gmail connection...');
    const authRes = await fetch(`${BASE_URL}/finance/email/oauth/gmail/authorize`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const authData = await authRes.json();

    if (authData.authUrl) {
      console.log('\n⚠️  Gmail not connected yet!\n');
      console.log('🔗 Please open this URL in your browser to authorize:\n');
      console.log(authData.authUrl);
      console.log('\n📌 After authorizing, press Ctrl+C and run this script again.\n');
      return;
    }

    console.log('✅ Gmail already connected!\n');

    // Step 3: Process January emails
    console.log('📅 Step 3: Fetching January 2026 emails...');
    console.log('   Processing 31 days of emails...\n');

    const processRes = await fetch(`${BASE_URL}/finance/email/process`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        provider: 'gmail',
        daysBack: 31  // All of January
      })
    });

    if (!processRes.ok) {
      const error = await processRes.text();
      throw new Error(`Processing failed: ${error}`);
    }

    const result = await processRes.json();

    // Display results
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║                     📊 RESULTS                             ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    console.log(`✅ Success: ${result.success}`);
    console.log(`📧 Emails processed: ${result.emailsProcessed}`);
    console.log(`💳 Transactions created: ${result.transactionsCreated}`);
    console.log(`🔄 Duplicates skipped: ${result.duplicatesSkipped}`);
    console.log(`❌ Parse failures: ${result.parseFailures}`);
    console.log(`⚠️  Limit breach alerts: ${result.limitBreachAlerts}`);

    if (result.transactionsCreated > 0) {
      console.log('\n🎉 Successfully fetched January transactions!');
      console.log('   Check your transactions in the app or database.');
    } else if (result.emailsProcessed === 0) {
      console.log('\n⚠️  No bank transaction emails found in January.');
      console.log('   Make sure your bank sends alerts to this Gmail account.');
    } else if (result.duplicatesSkipped === result.emailsProcessed) {
      console.log('\n✅ All emails already processed (no duplicates).');
    } else {
      console.log('\n⚠️  Some emails could not be parsed.');
      console.log('   Check server logs for details.');
    }

    console.log('\n✨ Done!\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\nFull error:', error);
    console.log('');
    process.exit(1);
  }
}

fetchJanuaryTransactions();
