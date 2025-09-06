// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

console.log('🔍 Environment variables loaded from .env.local:\n');

// Get all environment variables that start with common prefixes
const relevantVars = Object.keys(process.env).filter(key =>
  key.includes('GMAIL') ||
  key.includes('EMAIL') ||
  key.includes('MAIL') ||
  key.includes('SMTP')
);

if (relevantVars.length === 0) {
  console.log('❌ No email-related environment variables found');
  console.log('\n📋 All environment variables:');
  Object.keys(process.env).forEach(key => {
    if (!key.startsWith('npm_') && !key.startsWith('NODE_') && !key.startsWith('PATH')) {
      console.log(`${key}: ${process.env[key] ? '✅ Set' : '❌ Not set'}`);
    }
  });
} else {
  console.log('📧 Email-related environment variables:');
  relevantVars.forEach(key => {
    const value = process.env[key];
    console.log(`${key}: ${value ? `✅ Set (${value.length} chars)` : '❌ Not set'}`);
  });
}

console.log('\n💡 Looking for Gmail credentials...');
console.log(`GMAIL_USER: ${process.env.GMAIL_USER || '❌ Not found'}`);
console.log(`GMAIL_APP_PASSWORD: ${process.env.GMAIL_APP_PASSWORD || '❌ Not found'}`);
console.log(`GMAIL_USER_NEW: ${process.env.GMAIL_USER_NEW || '❌ Not found'}`);
console.log(`GMAIL_APP_PASSWORD_NEW: ${process.env.GMAIL_APP_PASSWORD_NEW || '❌ Not found'}`);
