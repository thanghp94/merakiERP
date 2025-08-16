const https = require('https');
const http = require('http');

async function testScheduleCycling() {
  console.log('🧪 Testing Schedule Cycling for Auto Sessions...');
  
  try {
    // Test data with a class that has multiple schedule entries (Thứ 2, 4, 6, 7)
    const testData = {
      numberOfSessions: 8, // Test with 8 sessions to see 2 full cycles
      tsiFirst: true,
      tsiTeacherId: 'test-teacher-1',
      repTeacherId: 'test-teacher-2',
      tsiAssistantId: 'test-assistant-1',
      repAssistantId: 'test-assistant-2',
      roomId: 'test-room-1',
      startingLesson: 'L1',
      timezone: 'Asia/Ho_Chi_Minh'
    };

    console.log('📤 Sending request with data:', JSON.stringify(testData, null, 2));

    const postData = JSON.stringify(testData);
    
    const options = {
      hostname: 'localhost',
      port: 3002,
      path: '/api/classes/test-class-id/auto-sessions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const result = await new Promise((resolve, reject) => {
      const req = http.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const result = JSON.parse(data);
            resolve({ status: res.statusCode, data: result });
          } catch (error) {
            reject(new Error('Failed to parse response: ' + data));
          }
        });
      });
      
      req.on('error', (error) => {
        reject(error);
      });
      
      req.write(postData);
      req.end();
    });
    
    console.log('📥 Response status:', result.status);
    console.log('📥 Response data:', JSON.stringify(result.data, null, 2));

    if (result.data.success) {
      console.log('✅ API call successful!');
      console.log(`📊 Created ${result.data.data.mainSessionsCreated} main sessions`);
      console.log(`📊 Created ${result.data.data.totalIndividualSessions} individual sessions`);
      
      // Check if sessions follow the schedule pattern
      if (result.data.data.mainSessions && result.data.data.mainSessions.length > 0) {
        console.log('\n📅 Session dates analysis:');
        result.data.data.mainSessions.forEach((session, index) => {
          const date = new Date(session.scheduled_date);
          const dayName = date.toLocaleDateString('vi-VN', { weekday: 'long' });
          console.log(`   Session ${index + 1}: ${session.scheduled_date} (${dayName})`);
        });
        
        // Verify the math: 8 main sessions × 2 sessions each = 16 total sessions
        const expectedSessions = testData.numberOfSessions * 2;
        if (result.data.data.totalIndividualSessions === expectedSessions) {
          console.log('✅ Session count is correct!');
          console.log(`   Expected: ${expectedSessions}, Got: ${result.data.data.totalIndividualSessions}`);
        } else {
          console.log('❌ Session count is incorrect!');
          console.log(`   Expected: ${expectedSessions}, Got: ${result.data.data.totalIndividualSessions}`);
        }
      }
    } else {
      console.log('❌ API call failed:', result.data.message);
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    if (error.message.includes('ECONNREFUSED')) {
      console.log('💡 Make sure the Next.js dev server is running on port 3002');
      console.log('   Run: npm run dev');
    }
  }
}

// Run the test
testScheduleCycling();
