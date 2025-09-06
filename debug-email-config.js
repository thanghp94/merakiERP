// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });
const nodemailer = require('nodemailer');

// Test email configuration
async function testEmailConfig() {
  console.log('🔍 Testing email configuration...\n');

  // Check environment variables
  console.log('📋 Environment Variables Check:');
  console.log(`GMAIL_USER: ${process.env.GMAIL_USER ? '✅ Set' : '❌ Not set'}`);
  console.log(`GMAIL_APP_PASSWORD: ${process.env.GMAIL_APP_PASSWORD ? '✅ Set' : '❌ Not set'}\n`);

  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.log('❌ Missing required environment variables');
    console.log('Please set GMAIL_USER and GMAIL_APP_PASSWORD in your .env.local file\n');
    return;
  }

  console.log('📧 Gmail User:', process.env.GMAIL_USER);
  console.log('🔑 App Password Length:', process.env.GMAIL_APP_PASSWORD.length, 'characters\n');

  // Test transporter creation
  console.log('🔧 Creating transporter...');
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD
    }
  });

  try {
    console.log('🔗 Testing connection...');
    await transporter.verify();
    console.log('✅ Email configuration is working correctly!\n');

    // Test sending a simple email
    console.log('📤 Testing email sending...');
    const testResult = await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: process.env.GMAIL_USER, // Send to yourself for testing
      subject: 'Test Email from MerakiERP',
      html: '<h1>Test Email</h1><p>This is a test email to verify your email configuration.</p>'
    });

    console.log('✅ Test email sent successfully!');
    console.log('📨 Message ID:', testResult.messageId);

  } catch (error) {
    console.log('❌ Email configuration test failed:');
    console.log('Error:', error.message);

    if (error.message.includes('Invalid login')) {
      console.log('\n💡 Possible issues:');
      console.log('1. Incorrect Gmail username or app password');
      console.log('2. 2-Factor Authentication not enabled (required for app passwords)');
      console.log('3. App password not generated correctly');
      console.log('4. Gmail account security settings blocking the login');
    }

    if (error.message.includes('ENOTFOUND')) {
      console.log('\n💡 Possible issues:');
      console.log('1. Network connectivity issues');
      console.log('2. Gmail SMTP servers temporarily unavailable');
    }
  }
}

// Run the test
testEmailConfig().catch(console.error);
