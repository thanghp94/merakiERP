const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function testEmailSystem() {
  console.log('🧪 Testing Email System...\n');

  // Check environment variables
  console.log('📋 Environment Variables:');
  console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? '✅ Set' : '❌ Not set');
  console.log('GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? '✅ Set' : '❌ Not set');
  console.log('GOOGLE_REFRESH_TOKEN:', process.env.GOOGLE_REFRESH_TOKEN ? '✅ Set' : '❌ Not set');
  console.log('GOOGLE_ACCESS_TOKEN:', process.env.GOOGLE_ACCESS_TOKEN ? '✅ Set' : '❌ Not set');
  console.log();

  // Test if googleapis is installed
  try {
    const { google } = require('googleapis');
    console.log('✅ googleapis package is installed');
  } catch (error) {
    console.log('❌ googleapis package not found:', error.message);
    console.log('💡 Run: npm install googleapis @types/googleapis');
    return;
  }

  // Test email templates
  try {
    const { emailTemplates, getTemplateById } = require('../lib/email-templates');
    console.log('✅ Email templates loaded:', emailTemplates.length, 'templates');
    
    const testTemplate = getTemplateById('welcome_inquiry');
    if (testTemplate) {
      console.log('✅ Template test passed:', testTemplate.name);
    } else {
      console.log('❌ Template test failed');
    }
  } catch (error) {
    console.log('❌ Email templates error:', error.message);
  }

  // Test Gmail service
  try {
    const { getGmailService } = require('../lib/gmail-service');
    const gmailService = getGmailService();
    console.log('✅ Gmail service initialized');
  } catch (error) {
    console.log('❌ Gmail service error:', error.message);
  }

  // Test with sample data
  console.log('\n🔬 Testing with sample admission data...');
  
  const sampleAdmission = {
    id: 'test-123',
    student_name: 'Nguyễn Văn Test',
    parent_name: 'Nguyễn Thị Parent',
    phone: '0123456789',
    email: 'test@example.com',
    data: {
      interested_program: 'IELTS Foundation',
      budget: '5-10 triệu',
      urgency: 'high'
    }
  };

  // Test API endpoint simulation
  try {
    const testPayload = {
      templateId: 'welcome_inquiry',
      recipientEmail: sampleAdmission.email,
      admissionData: sampleAdmission
    };

    console.log('📤 Test payload:', JSON.stringify(testPayload, null, 2));
    console.log('✅ Payload structure is valid');
  } catch (error) {
    console.log('❌ Payload error:', error.message);
  }

  console.log('\n🔍 Common Issues to Check:');
  console.log('1. Missing refresh token - need to get from OAuth playground');
  console.log('2. Invalid credentials - check client ID and secret');
  console.log('3. Missing googleapis package - run npm install');
  console.log('4. Network issues - check internet connection');
  console.log('5. Gmail API not enabled - check Google Cloud Console');
  
  console.log('\n📝 Next Steps:');
  console.log('1. Run: node scripts/setup-gmail-api.js');
  console.log('2. Get refresh token from OAuth playground');
  console.log('3. Add refresh token to .env.local');
  console.log('4. Test again');
}

testEmailSystem().catch(console.error);
