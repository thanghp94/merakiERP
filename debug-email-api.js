// This script helps debug the email API by adding detailed logging
// You can run this to test the API endpoint directly

async function testEmailAPI() {
  console.log('🧪 Testing Email API Endpoint...\n');

  // Test data - you'll need to replace the teacherId with the actual ID from your database
  const testData = {
    teacherId: 'REPLACE_WITH_ACTUAL_TEACHER_ID', // You'll get this from the debug script above
    startDate: '2025-01-20',
    endDate: '2025-01-26',
    sessions: [
      {
        start_time: '2025-01-20T10:30:00Z',
        end_time: '2025-01-20T11:30:00Z',
        teacher_id: 'REPLACE_WITH_ACTUAL_TEACHER_ID',
        main_sessions: {
          classes: {
            class_name: 'Test Class'
          }
        },
        data: {
          room: '1.1',
          class_name: 'Test Class'
        },
        subject_type: 'TSI'
      }
    ]
  };

  try {
    console.log('📤 Sending request to /api/schedule/email...');
    console.log('📋 Request data:', JSON.stringify(testData, null, 2));

    const response = await fetch('http://localhost:3000/api/schedule/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });

    const result = await response.json();
    
    console.log(`\n📨 Response Status: ${response.status}`);
    console.log('📋 Response Data:', JSON.stringify(result, null, 2));

    if (result.success) {
      console.log('\n✅ Email sent successfully!');
    } else {
      console.log(`\n❌ Email failed: ${result.message}`);
      
      if (result.message.includes('Teacher not found')) {
        console.log('\n💡 Troubleshooting steps:');
        console.log('1. Run the debug-vhuynh-teacher.js script to find the correct teacher ID');
        console.log('2. Make sure the teacher has an email address in the database');
        console.log('3. Replace REPLACE_WITH_ACTUAL_TEACHER_ID in this script with the real ID');
        console.log('4. Make sure your Next.js server is running (npm run dev)');
      }
    }

  } catch (error) {
    console.error('💥 Error testing API:', error);
    console.log('\n🔧 Make sure:');
    console.log('1. Your Next.js server is running: npm run dev');
    console.log('2. The server is accessible at http://localhost:3000');
    console.log('3. Replace REPLACE_WITH_ACTUAL_TEACHER_ID with a real teacher ID');
  }
}

console.log('⚠️  IMPORTANT: Before running this script:');
console.log('1. Run: node debug-vhuynh-teacher.js');
console.log('2. Copy the teacher ID that has an email address');
console.log('3. Replace REPLACE_WITH_ACTUAL_TEACHER_ID in this script');
console.log('4. Make sure your Next.js server is running: npm run dev');
console.log('5. Then run: node debug-email-api.js\n');

// Uncomment the line below after you've updated the teacherId
// testEmailAPI();
