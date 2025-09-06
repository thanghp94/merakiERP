// Test script to verify the email button functionality
console.log('🧪 Testing Email Button Functionality...\n');

// Test 1: Check if the API endpoint is accessible
async function testAPIEndpoint() {
  console.log('1. Testing API endpoint accessibility...');

  try {
    const response = await fetch('http://localhost:3000/api/schedule/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        teacherId: '112a9251-209c-4cdd-a16e-b6ad08edd7a9', // Real vhuynh teacher ID from server logs
        startDate: '2025-01-20',
        endDate: '2025-01-26',
        sessions: []
      }),
    });

    console.log('   ✅ API endpoint is accessible');
    console.log('   📡 Response status:', response.status);

    const result = await response.json();
    console.log('   📋 Response:', result);

  } catch (error) {
    console.log('   ❌ API endpoint not accessible:', error.message);
    console.log('   💡 Make sure your Next.js server is running: npm run dev');
  }
}

// Test 2: Instructions for browser testing
function printBrowserTestInstructions() {
  console.log('\n2. Browser Testing Instructions:');
  console.log('   📋 Open your browser and go to the schedule page');
  console.log('   📧 Click the "📧 Email Schedule" button');
  console.log('   👤 Select "vhuynh" from the dropdown');
  console.log('   📤 Click "Send Email"');
  console.log('   🔍 Check the browser console (F12) for these logs:');
  console.log('      - "🚀 handleSendEmail called"');
  console.log('      - "📋 Selected teacher: [ID]"');
  console.log('      - "📤 Sending API request..."');
  console.log('      - "📡 Response status: [status]"');
  console.log('   📝 Copy and paste any console logs you see');
}

// Test 3: Check server logs
function printServerLogInstructions() {
  console.log('\n3. Server Log Instructions:');
  console.log('   📋 Check your Next.js server terminal for these logs:');
  console.log('      - "🔍 Looking up teacher with ID: [ID]"');
  console.log('      - "📡 Teacher lookup response status: [status]"');
  console.log('      - "👤 Teacher found: [details]"');
  console.log('   📝 Copy and paste any server logs you see');
}

// Run tests
testAPIEndpoint();
printBrowserTestInstructions();
printServerLogInstructions();

console.log('\n🎯 Expected Flow:');
console.log('   1. Browser console shows handleSendEmail logs');
console.log('   2. API request is sent to /api/schedule/email');
console.log('   3. Server logs show teacher lookup process');
console.log('   4. Either success alert or detailed error message appears');
