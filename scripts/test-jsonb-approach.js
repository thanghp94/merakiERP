const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testJSONBApproach() {
  console.log('🧪 Testing JSONB approach for storing sessions...\n');

  // Test data
  const testData = {
    main_session_name: 'Test JSONB Sessions',
    scheduled_date: '2025-08-10',
    total_duration_minutes: 120,
    class_id: '9721cbdb-5e41-4009-a1d1-c9202da6ea2b',
    data: {
      sessions: [
        {
          subject_type: 'TSI',
          teacher_id: '0cf1da18-1e18-43f1-96f3-2e1c238af9ed',
          teaching_assistant_id: null,
          location_id: 'room-A1',
          start_time: '09:30',
          end_time: '10:30',
          duration_minutes: 60
        },
        {
          subject_type: 'GRA',
          teacher_id: '0cf1da18-1e18-43f1-96f3-2e1c238af9ed',
          teaching_assistant_id: null,
          location_id: 'room-A2',
          start_time: '10:45',
          end_time: '11:45',
          duration_minutes: 60
        }
      ],
      auto_calculated_times: {
        start_time: '09:30',
        end_time: '11:45'
      },
      created_by_form: true
    }
  };

  try {
    console.log('📝 Inserting main session with JSONB sessions...');
    
    const { data: result, error } = await supabase
      .from('main_sessions')
      .insert(testData)
      .select()
      .single();

    if (error) {
      console.log('❌ Error:', error.message);
      console.log('Error details:', error);
      return;
    }

    console.log('✅ Success! Main session created with ID:', result.main_session_id);
    console.log('📊 Sessions stored in JSONB:', result.data.sessions.length);
    console.log('⏰ Auto-calculated times:', result.data.auto_calculated_times);
    
    // Test querying the data
    console.log('\n🔍 Testing JSONB queries...');
    
    const { data: queryResult, error: queryError } = await supabase
      .from('main_sessions')
      .select('*')
      .eq('main_session_id', result.main_session_id)
      .single();

    if (queryError) {
      console.log('❌ Query error:', queryError.message);
      return;
    }

    console.log('✅ Query successful!');
    console.log('📋 Retrieved sessions:', queryResult.data.sessions.length);
    queryResult.data.sessions.forEach((session, index) => {
      console.log(`   Session ${index + 1}: ${session.subject_type} (${session.start_time}-${session.end_time})`);
    });

    console.log('\n🎉 JSONB approach is working perfectly!');
    console.log('✅ Benefits:');
    console.log('   - Single database operation');
    console.log('   - No foreign key issues');
    console.log('   - Flexible session structure');
    console.log('   - Auto-calculated times stored');

  } catch (error) {
    console.log('❌ Unexpected error:', error.message);
  }
}

testJSONBApproach();
