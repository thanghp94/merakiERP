const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testTimezoneHandling() {
  console.log('🕐 Testing timezone handling...\n');

  // Test data
  const testSession = {
    main_session_name: 'Test Timezone Session',
    scheduled_date: '2025-01-16', // Use a different date to avoid conflicts
    start_time: '09:00',
    end_time: '10:00',
    total_duration_minutes: 60,
    class_id: null, // We'll need to get a real class ID
    sessions: [
      {
        subject_type: 'TSI',
        teacher_id: null, // We'll need to get a real teacher ID
        teaching_assistant_id: null,
        location_id: 'test-room',
        start_time: '09:00',
        end_time: '10:00',
        duration_minutes: 60
      }
    ]
  };

  try {
    // First, get a real class ID
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

    // Use the known teacher ID from the previous output
    const teacherId = 'f09a8b6a-f437-44fe-a578-95cd8afe3b4b'; // Hussam
    testSession.sessions[0].teacher_id = teacherId;
    console.log(`👨‍🏫 Using teacher: Hussam (${teacherId})`);

    // Test the API call
    console.log('\n🔄 Testing main-sessions API with timezone fix...');
    console.log('Input time:', testSession.sessions[0].start_time, '-', testSession.sessions[0].end_time);

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
      
      // Check how the time was stored in the database
      const { data: storedSession } = await supabase
        .from('main_sessions')
        .select('*')
        .eq('main_session_id', result.data.main_session_id)
        .single();

      if (storedSession) {
        console.log('\n📊 Stored times in database:');
        console.log('Data field:', JSON.stringify(storedSession.data, null, 2));
        console.log('Scheduled date:', storedSession.scheduled_date);
        
        // Parse times from data field
        if (storedSession.data && storedSession.data.start_timestamp && storedSession.data.end_timestamp) {
          const startTime = new Date(storedSession.data.start_timestamp);
          const endTime = new Date(storedSession.data.end_timestamp);
          
          console.log('\n🌏 Times in Vietnam timezone (Asia/Ho_Chi_Minh):');
          console.log('Start:', startTime.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }));
          console.log('End:', endTime.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }));
          
          console.log('\n⏰ Time comparison:');
          console.log('Input time:', testSession.sessions[0].start_time, '-', testSession.sessions[0].end_time);
          console.log('Stored time:', storedSession.data.start_time, '-', storedSession.data.end_time);
        } else {
          console.log('❌ No timestamp data found in JSONB field');
        }
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
    console.error('❌ Error during test:', error.message);
  }
}

// Run the test
testTimezoneHandling();
