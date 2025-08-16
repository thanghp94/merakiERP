const https = require('https');
const http = require('http');

async function testAutoSessionsAPI() {
  console.log('🧪 Testing Fixed Auto Sessions API...');
  
  try {
    // Test data for 4 main sessions
    const testData = {
      numberOfSessions: 4,
      tsiFirst: true,
      tsiTeacherId: 'test-teacher-1',
      repTeacherId: 'test-teacher-2',
      tsiAssistantId: null,
      repAssistantId: null,
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
      
      // Verify the math: 4 main sessions × 2 sessions each = 8 total sessions
      const expectedSessions = testData.numberOfSessions * 2; // TSI + REP for each main session
      if (result.data.data.totalIndividualSessions === expectedSessions) {
        console.log('✅ Session count is correct!');
        console.log(`   Expected: ${expectedSessions}, Got: ${result.data.data.totalIndividualSessions}`);
      } else {
        console.log('❌ Session count is incorrect!');
        console.log(`   Expected: ${expectedSessions}, Got: ${result.data.data.totalIndividualSessions}`);
      }
    } else {
      console.log('❌ API call failed:', result.data.message);
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Run the test
testAutoSessionsAPI();
