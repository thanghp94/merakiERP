const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testNonGrapeseedAutoSessions() {
  try {
    console.log('🧪 Testing Non-GrapeSEED Auto Sessions...');

    // First, let's find a non-GrapeSEED class or create one
    const { data: existingClasses, error: classError } = await supabase
      .from('classes')
      .select('*')
      .neq('data->program_type', 'GrapeSEED')
      .limit(1);

    if (classError) {
      console.error('Error fetching classes:', classError);
      return;
    }

    let testClass;
    if (existingClasses && existingClasses.length > 0) {
      testClass = existingClasses[0];
      console.log('✅ Found existing non-GrapeSEED class:', testClass.class_name);
    } else {
      // Create a test class
      const { data: facility } = await supabase
        .from('facilities')
        .select('id')
        .limit(1)
        .single();

      const { data: newClass, error: createError } = await supabase
        .from('classes')
        .insert({
          class_name: 'TAHN Test Class',
          facility_id: facility?.id,
          status: 'active',
          start_date: '2024-01-01',
          data: {
            program_type: 'TATH',
            description: 'Test class for auto sessions',
            schedule_entries: [
              {
                id: '1',
                day: 'tuesday',
                startTime: '17:30',
                endTime: '19:00'
              },
              {
                id: '2',
                day: 'thursday',
                startTime: '17:30',
                endTime: '19:00'
              },
              {
                id: '3',
                day: 'saturday',
                startTime: '17:30',
                endTime: '19:00'
              }
            ]
          }
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating test class:', createError);
        return;
      }

      testClass = newClass;
      console.log('✅ Created test non-GrapeSEED class:', testClass.class_name);
    }

    // Test the auto-sessions API
    console.log('\n🚀 Testing auto-sessions API call...');
    
    const response = await fetch(`http://localhost:3002/api/classes/${testClass.id}/auto-sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        numberOfSessions: 2,
        tsiFirst: false, // Not relevant for non-GrapeSEED
        tsiTeacherId: null, // Optional for testing
        repTeacherId: null,
        tsiAssistantId: null,
        repAssistantId: null,
        roomId: null,
        startingLesson: null, // Not relevant for non-GrapeSEED
        timezone: 'Asia/Ho_Chi_Minh'
      }),
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Auto-sessions created successfully!');
      console.log('📊 Result:', {
        mainSessionsCreated: result.data.mainSessionsCreated,
        totalIndividualSessions: result.data.totalIndividualSessions,
        message: result.message
      });

      // Verify the created sessions
      const { data: createdSessions } = await supabase
        .from('sessions')
        .select(`
          *,
          main_sessions!sessions_main_session_id_fkey (
            main_session_name,
            scheduled_date
          )
        `)
        .in('main_session_id', result.data.mainSessions.map(ms => ms.main_session_id));

      console.log('\n📅 Created Sessions:');
      createdSessions?.forEach((session, index) => {
        console.log(`  ${index + 1}. ${session.main_sessions.main_session_name}`);
        console.log(`     Date: ${session.main_sessions.scheduled_date}`);
        console.log(`     Time: ${session.start_time} - ${session.end_time}`);
        console.log(`     Subject: ${session.subject_type}`);
        console.log('');
      });

    } else {
      console.error('❌ Auto-sessions creation failed:');
      console.error('Status:', response.status);
      console.error('Error:', result);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testNonGrapeseedAutoSessions();
