const fetch = require('node-fetch');

const API_BASE = 'http://localhost:3000';

async function testFinalAutoSessionsFix() {
  console.log('🧪 Testing FINAL Auto Sessions Fix...\n');

  // Test data for GrapeSEED class with 4 main sessions
  const testData = {
    numberOfSessions: 4,
    sessionType: 'grapeseed',
    startingLesson: 'L4',
    sessions: [
      {
        subject_type: 'TSI',
        teacher_id: null,
        teaching_assistant_id: null,
        location_id: null,
        start_time: '09:00',
        end_time: '09:40',
        duration_minutes: 40,
        session_date: '2024-01-15'
      },
      {
        subject_type: 'REP',
        teacher_id: null,
        teaching_assistant_id: null,
        location_id: null,
        start_time: '09:45',
        end_time: '10:15',
        duration_minutes: 30,
        session_date: '2024-01-15'
      }
    ]
  };

  try {
    // Use a test class ID (you may need to adjust this)
    const classId = 'test-class-id';
    
    console.log('📤 Sending request to create 4 main sessions...');
    console.log('Expected result: 4 main sessions + 8 individual sessions (4 × 2)');
    
    const response = await fetch(`${API_BASE}/api/classes/${classId}/auto-sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    const result = await response.json();
    
    console.log('\n📥 Response Status:', response.status);
    console.log('📥 Response Body:', JSON.stringify(result, null, 2));

    if (result.success) {
      const { mainSessions, sessions } = result.data;
      
      console.log('\n✅ SUCCESS!');
      console.log(`📊 Created ${mainSessions.length} main sessions`);
      console.log(`📊 Created ${sessions.length} individual sessions`);
      
      // Verify the counts
      if (mainSessions.length === 4 && sessions.length === 8) {
        console.log('🎉 PERFECT! The fix works correctly!');
        console.log('   - 4 main sessions ✓');
        console.log('   - 8 individual sessions (4 × 2) ✓');
      } else {
        console.log('❌ ISSUE: Incorrect counts');
        console.log(`   Expected: 4 main sessions, 8 individual sessions`);
        console.log(`   Got: ${mainSessions.length} main sessions, ${sessions.length} individual sessions`);
      }
    } else {
      console.log('❌ API Error:', result.message);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testFinalAutoSessionsFix();
