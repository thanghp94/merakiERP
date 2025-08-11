const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testTimezoneHandling() {
  console.log('🌏 Testing timezone handling with frontend timezone support...\n');

  // Test data with timezone information
  const testSession = {
    main_session_name: 'Test Timezone Session with Frontend Support',
    scheduled_date: '2025-01-17', // Use a different date to avoid conflicts
    start_time: '15:22',
    end_time: '16:22',
    total_duration_minutes: 60,
    class_id: null, // We'll need to get a real class ID
    timezone: 'Asia/Ho_Chi_Minh', // Frontend sends timezone info
    sessions: [
      {
        subject_type: 'TSI',
        teacher_id: null, // We'll need to get a real teacher ID
        teaching_assistant_id: null,
        location_id: 'test-room',
        start_time: '15:22',
        end_time: '16:22',
        duration_minutes: 60
      }
    ]
  };

  try {
    // Get a real class ID
    const { data: classes } = await supabase
      .from('classes')
      .select('id, class_name')
      .limit(1);

    if (!classes || classes.length === 0) {
      console.log('❌ No classes found. Please create a class first.');
      return;
    }

    testSession.class_id = classes[0].id;
    console.log(`📚 Using class: ${classes[0].class_name} (${classes[0].id})`);

    // Use the known teacher ID
    const teacherId = 'f09a8b6a-f437-44fe-a578-95cd8afe3b4b'; // Hussam
    testSession.sessions[0].teacher_id = teacherId;
    console.log(`👨‍🏫 Using teacher: Hussam (${teacherId})`);

    // Test the API call with timezone support
    console.log('\n🔄 Testing main-sessions API with timezone support...');
    console.log('Input time:', testSession.sessions[0].start_time, '-', testSession.sessions[0].end_time);
    console.log('Timezone:', testSession.timezone);

    const response = await fetch('http://localhost:3000/api/main-sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testSession),
    });

    const result = await response.json();

    if (result.success) {
      console.log('✅ Session created successfully!');
      console.log('Main session ID:', result.data.main_session_id);

      // Fetch the created session to verify timezone handling
      const { data: storedSession } = await supabase
        .from('main_sessions')
        .select('*')
        .eq('main_session_id', result.data.main_session_id)
        .single();

      // Fetch the created sessions to verify UTC storage
      const { data: storedSessions } = await supabase
        .from('sessions')
        .select('*')
        .eq('main_session_id', result.data.main_session_id);

      if (storedSession) {
        console.log('\n📊 Stored main session data:');
        console.log('Data field:', JSON.stringify(storedSession.data, null, 2));
        console.log('Scheduled date:', storedSession.scheduled_date);
      }

      if (storedSessions && storedSessions.length > 0) {
        console.log('\n📊 Stored session times (should be in UTC):');
        storedSessions.forEach((session, index) => {
          console.log(`Session ${index + 1}:`);
          console.log('  Start time (UTC):', session.start_time);
          console.log('  End time (UTC):', session.end_time);
          
          // Convert back to Vietnam timezone for verification
          const startVN = new Date(session.start_time).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
          const endVN = new Date(session.end_time).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
          
          console.log('  Start time (VN):', startVN);
          console.log('  End time (VN):', endVN);
          console.log('');
        });

        console.log('⏰ Time verification:');
        console.log('Input time:', testSession.sessions[0].start_time, '-', testSession.sessions[0].end_time, '(Vietnam time)');
        const inputStart = new Date(`${testSession.scheduled_date}T${testSession.sessions[0].start_time}:00`);
        const expectedUTC = new Date(inputStart.getTime() - (7 * 60 * 60 * 1000)); // Subtract 7 hours for UTC
        console.log('Expected UTC:', expectedUTC.toISOString());
        console.log('Stored UTC:', storedSessions[0].start_time);
      }

      // Clean up - delete the test session
      await supabase
        .from('main_sessions')
        .delete()
        .eq('main_session_id', result.data.main_session_id);

      console.log('\n🧹 Test session cleaned up');
    } else {
      console.log('❌ Failed to create session:', result.message);
      if (result.conflict_details) {
        console.log('Conflict details:', result.conflict_details);
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testTimezoneHandling();
