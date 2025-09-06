// Test script to check email service configuration
console.log('🧪 Testing Email Service Configuration...\n');

// Test 1: Check if environment variables are set
console.log('1. Environment Variables Check:');
console.log('   GMAIL_USER:', process.env.GMAIL_USER ? '✅ Set' : '❌ Not set');
console.log('   GMAIL_APP_PASSWORD:', process.env.GMAIL_APP_PASSWORD ? '✅ Set' : '❌ Not set');
console.log('   NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Not set');
console.log('   NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Not set');

// Test 2: Test email service initialization
console.log('\n2. Email Service Initialization:');
try {
  const { getNodemailerService } = require('./lib/nodemailer-service');
  const emailService = getNodemailerService();

  console.log('   Email service created:', emailService ? '✅ Success' : '❌ Failed');
  console.log('   Email service ready:', emailService.isReady() ? '✅ Ready' : '❌ Not ready');

  if (!emailService.isReady()) {
    console.log('   💡 Gmail credentials not configured. Please set:');
    console.log('      GMAIL_USER=your-email@gmail.com');
    console.log('      GMAIL_APP_PASSWORD=your-app-password');
  }
} catch (error) {
  console.log('   ❌ Email service initialization failed:', error.message);
}

// Test 3: Test connection if configured
console.log('\n3. Connection Test:');
if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
  try {
    const { getNodemailerService } = require('./lib/nodemailer-service');
    const emailService = getNodemailerService();

    emailService.testConnection().then(result => {
      console.log('   Connection test result:', result ? '✅ Success' : '❌ Failed');
      if (!result) {
        console.log('   💡 Check your Gmail credentials and app password');
      }
    });
  } catch (error) {
    console.log('   ❌ Connection test failed:', error.message);
  }
} else {
  console.log('   ⏭️  Skipping connection test (credentials not set)');
}

console.log('\n📋 Setup Instructions:');
console.log('1. Create a Gmail App Password:');
console.log('   - Go to https://myaccount.google.com/security');
console.log('   - Enable 2-Factor Authentication');
console.log('   - Generate an App Password for "Mail"');
console.log('2. Set environment variables in .env.local:');
console.log('   GMAIL_USER=your-email@gmail.com');
console.log('   GMAIL_APP_PASSWORD=your-16-char-app-password');
console.log('3. Restart your Next.js server: npm run dev');
