const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testFrontendTimezoneFix() {
  console.log('🌏 Testing frontend timezone fix...\n');

  // Simulate what the frontend now sends (with timezone)
  const testSessionWithTimezone = {
    main_session_name: 'Frontend Timezone Test',
    scheduled_date: '2025-01-18',
    timezone: 'Asia/Ho_Chi_Minh', // Frontend now sends this
    sessions: [
      {
        subject_type: 'TSI',
        teacher_id: 'f09a8b6a-f437-44fe-a578-95cd8afe3b4b', // Hussam
        start_time: '11:22', // Test with 11:22 as user reported
        end_time: '12:22'
      }
    ]
  };

  // Get class ID
  const { data: classes } = await supabase.from('classes').select('id').limit(1);
  testSessionWithTimezone.class_id = classes[0].id;

  console.log('📤 Sending request with timezone:', testSessionWithTimezone.timezone);
  console.log('⏰ Input time:', testSessionWithTimezone.sessions[0].start_time, '-', testSessionWithTimezone.sessions[0].end_time);

  try {
    const response = await fetch('http://localhost:3000/api/main-sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testSessionWithTimezone),
    });

    const result = await response.json();

    if (result.success) {
      console.log('✅ Session created successfully!');
      
      // Check stored times
      const { data: storedSessions } = await supabase
        .from('sessions')
        .select('start_time, end_time')
        .eq('main_session_id', result.data.main_session_id);

      if (storedSessions && storedSessions.length > 0) {
        const session = storedSessions[0];
        console.log('💾 Stored UTC times:', session.start_time, '-', session.end_time);
        
        // Convert back to Vietnam time
        const startVN = new Date(session.start_time).toLocaleTimeString('vi-VN', { 
          timeZone: 'Asia/Ho_Chi_Minh', 
          hour: '2-digit', 
          minute: '2-digit' 
        });
        const endVN = new Date(session.end_time).toLocaleTimeString('vi-VN', { 
          timeZone: 'Asia/Ho_Chi_Minh', 
          hour: '2-digit', 
          minute: '2-digit' 
        });
        
        console.log('🇻🇳 Display times (VN):', startVN, '-', endVN);
        
        // Verify the conversion is correct
        if (startVN === '11:22' && endVN === '12:22') {
          console.log('✅ Timezone conversion working perfectly!');
        } else {
          console.log('❌ Timezone conversion issue detected');
        }
      }

      // Clean up
      await supabase.from('main_sessions').delete().eq('main_session_id', result.data.main_session_id);
      console.log('🧹 Test session cleaned up');

    } else {
      console.log('❌ Session creation failed:', result.message);
      
      // Check if it's a conflict and if the conflict message shows correct timezone
      if (response.status === 409) {
        console.log('🔍 Conflict detected - checking if error message shows correct timezone...');
        console.log('Error message:', result.message);
        
        // The error message should now show the correct time in user's timezone
        if (result.message.includes('11:22') || result.message.includes('12:22')) {
          console.log('✅ Error message shows correct timezone!');
        } else {
          console.log('❌ Error message still shows wrong timezone');
        }
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Test with different input times to verify the fix
async function testMultipleTimes() {
  console.log('🔄 Testing multiple time inputs...\n');
  
  const testTimes = [
    { start: '11:22', end: '12:22', description: 'User reported time 1' },
    { start: '15:22', end: '16:22', description: 'User reported time 2' },
    { start: '09:00', end: '10:00', description: 'Morning time' }
  ];

  for (const timeTest of testTimes) {
    console.log(`\n--- Testing ${timeTest.description}: ${timeTest.start}-${timeTest.end} ---`);
    
    const testSession = {
      main_session_name: `Test ${timeTest.description}`,
      scheduled_date: '2025-01-19',
      timezone: 'Asia/Ho_Chi_Minh',
      sessions: [{
        subject_type: 'TSI',
        teacher_id: 'f09a8b6a-f437-44fe-a578-95cd8afe3b4b',
        start_time: timeTest.start,
        end_time: timeTest.end
      }]
    };

    const { data: classes } = await supabase.from('classes').select('id').limit(1);
    testSession.class_id = classes[0].id;

    try {
      const response = await fetch('http://localhost:3000/api/main-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testSession),
      });

      const result = await response.json();

      if (result.success) {
        console.log(`✅ ${timeTest.description} created successfully`);
        await supabase.from('main_sessions').delete().eq('main_session_id', result.data.main_session_id);
      } else {
        console.log(`⚠️ ${timeTest.description} conflict:`, result.message);
        // Check if error message shows the input time (not a different timezone)
        if (result.message.includes(timeTest.start) || result.message.includes(timeTest.end)) {
          console.log('✅ Error message shows correct input time');
        } else {
          console.log('❌ Error message shows wrong time');
        }
      }
    } catch (error) {
      console.error(`❌ ${timeTest.description} failed:`, error.message);
    }
  }
}

// Run tests
testFrontendTimezoneFix().then(() => {
  return testMultipleTimes();
});
