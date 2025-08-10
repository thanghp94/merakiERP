const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function debugApiCall() {
  console.log('🔍 Debugging API call with real data...\n');

  try {
    // Get real data from database
    const { data: classes } = await supabase.from('classes').select('id, class_name').limit(1);
    const { data: employees } = await supabase.from('employees').select('id, full_name').limit(1);

    if (!classes || classes.length === 0 || !employees || employees.length === 0) {
      console.log('❌ Missing test data. Need at least 1 class and 1 employee');
      return;
    }

    const testClass = classes[0];
    const testEmployee = employees[0];

    console.log('📋 Using test data:');
    console.log('   Class:', testClass.class_name, '(', testClass.id, ')');
    console.log('   Employee:', testEmployee.full_name, '(', testEmployee.id, ')');

    // Simulate the exact data that LessonForm would send
    const formData = {
      main_session_name: 'Debug Test Session',
      scheduled_date: '2025-08-10',
      start_time: '09:00',
      end_time: '11:00',
      total_duration_minutes: 120,
      class_id: testClass.id,
      sessions: [
        {
          subject_type: 'TSI',
          teacher_id: testEmployee.id,
          teaching_assistant_id: '',
          location_id: 'test-room-1',
          start_time: '09:00',
          end_time: '10:00',
          duration_minutes: 60
        },
        {
          subject_type: 'GRA',
          teacher_id: testEmployee.id,
          teaching_assistant_id: '',
          location_id: 'test-room-2',
          start_time: '10:00',
          end_time: '11:00',
          duration_minutes: 60
        }
      ]
    };

    console.log('\n📤 Sending data to API:');
    console.log('   Sessions count:', formData.sessions.length);
    console.log('   Session 1:', formData.sessions[0].subject_type, '-', formData.sessions[0].duration_minutes, 'min');
    console.log('   Session 2:', formData.sessions[1].subject_type, '-', formData.sessions[1].duration_minutes, 'min');

    // Make the API call
    const response = await fetch('http://localhost:3000/api/main-sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    });

    const result = await response.json();

    console.log('\n📥 API Response:');
    console.log('   Status:', response.status);
    console.log('   Success:', result.success);
    console.log('   Message:', result.message);

    if (result.success && result.data) {
      console.log('   Main Session ID:', result.data.main_session_id);
      
      // Check if sessions were created
      const { data: createdSessions, error: sessionsError } = await supabase
        .from('sessions')
        .select('*')
        .eq('lesson_id', result.data.main_session_id);

      if (sessionsError) {
        console.log('❌ Error checking sessions:', sessionsError.message);
      } else {
        console.log('✅ Sessions created:', createdSessions ? createdSessions.length : 0);
        if (createdSessions && createdSessions.length > 0) {
          createdSessions.forEach((session, index) => {
            console.log(`   Session ${index + 1}: ${session.subject_type} (${session.id})`);
          });
        }
      }
    } else {
      console.log('❌ API call failed:', result.error || result.message);
    }

  } catch (error) {
    console.error('❌ Debug error:', error.message);
  }
}

debugApiCall();
