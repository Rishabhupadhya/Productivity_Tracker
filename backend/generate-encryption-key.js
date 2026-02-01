#!/usr/bin/env node

/**
 * Generate Encryption Key
 * 
 * Generates a secure 32-byte encryption key for encrypting OAuth tokens
 * Run: node generate-encryption-key.js
 */

const crypto = require('crypto');

const key = crypto.randomBytes(32).toString('hex');

console.log('');
console.log('═══════════════════════════════════════════════════════════');
console.log('  ENCRYPTION KEY GENERATOR');
console.log('═══════════════════════════════════════════════════════════');
console.log('');
console.log('Generated 32-byte encryption key:');
console.log('');
console.log(key);
console.log('');
console.log('Add this to your .env file:');
console.log('');
console.log(`ENCRYPTION_KEY=${key}`);
console.log('');
console.log('⚠️  IMPORTANT: Keep this key secret!');
console.log('   - Never commit it to version control');
console.log('   - Store it securely in production');
console.log('   - If lost, all encrypted tokens become unrecoverable');
console.log('');
console.log('═══════════════════════════════════════════════════════════');
console.log('');
