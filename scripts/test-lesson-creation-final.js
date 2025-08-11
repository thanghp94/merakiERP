const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function testLessonCreation() {
  console.log('🧪 Testing lesson creation with lesson number saving...\n');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.log('❌ Missing environment variables');
    return;
  }
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  try {
    // Get a class for testing
    const { data: classes } = await supabase
      .from('classes')
      .select('id, class_name')
      .limit(1);
    
    if (!classes || classes.length === 0) {
      console.log('❌ No classes found for testing');
      return;
    }
    
    const testClassId = classes[0].id;
    console.log(`Using test class: ${classes[0].class_name} (${testClassId})`);
    
    // Test data that mimics what the form would send
    const testMainSession = {
      main_session_name: 'GS12 test.U8.L99',
      lesson_number: 'L99', // This should be saved to lesson_id
      scheduled_date: '2025-08-15',
      class_id: testClassId,
      sessions: [
        {
          subject_type: 'TSI',
          teacher_id: 'test-teacher-id',
          start_time: '10:00',
          end_time: '10:45',
          duration_minutes: 45,
          location_id: 'test-room'
        },
        {
          subject_type: 'REP',
          teacher_id: 'test-teacher-id',
          start_time: '11:00',
          end_time: '11:30',
          duration_minutes: 30,
          location_id: 'test-room'
        }
      ]
    };
    
    console.log('\n📋 Test data prepared:');
    console.log(`  Main session name: ${testMainSession.main_session_name}`);
    console.log(`  Lesson number: ${testMainSession.lesson_number}`);
    console.log(`  Expected lesson_id in DB: ${testMainSession.lesson_number}`);
    console.log(`  Sessions count: ${testMainSession.sessions.length}`);
    console.log(`  Expected start_time: ${testMainSession.sessions[0].start_time}`);
    console.log(`  Expected end_time: ${testMainSession.sessions[testMainSession.sessions.length - 1].end_time}`);
    console.log(`  Expected total_duration: ${testMainSession.sessions.reduce((sum, s) => sum + s.duration_minutes, 0)} minutes`);
    
    // Test the API logic directly (simulating what the API does)
    console.log('\n🔧 Testing API logic...');
    
    // Extract lesson number (like the API does)
    let extractedLessonId = testMainSession.lesson_number;
    if (!extractedLessonId && testMainSession.main_session_name) {
      const lessonMatch = testMainSession.main_session_name.match(/\.L(\d+)/);
      if (lessonMatch) {
        extractedLessonId = `L${lessonMatch[1]}`;
      }
    }
    
    console.log(`✅ Extracted lesson ID: ${extractedLessonId}`);
    
    // Calculate timing (like the API does)
    const validSessions = testMainSession.sessions.filter(s => s.start_time && s.end_time);
    let calculatedStartTime = '';
    let calculatedEndTime = '';
    let calculatedTotalDuration = 0;
    
    if (validSessions.length > 0) {
      const sortedSessions = [...validSessions].sort((a, b) => a.start_time.localeCompare(b.start_time));
      calculatedStartTime = sortedSessions[0].start_time;
      calculatedEndTime = sortedSessions[sortedSessions.length - 1].end_time;
      calculatedTotalDuration = testMainSession.sessions.reduce((sum, session) => sum + (session.duration_minutes || 0), 0);
    }
    
    console.log(`✅ Calculated start time: ${calculatedStartTime}`);
    console.log(`✅ Calculated end time: ${calculatedEndTime}`);
    console.log(`✅ Calculated total duration: ${calculatedTotalDuration} minutes`);
    
    // Prepare data field (like the API does)
    const dataField = {
      start_time: calculatedStartTime,
      end_time: calculatedEndTime,
      total_duration_minutes: calculatedTotalDuration,
      start_timestamp: calculatedStartTime ? `${testMainSession.scheduled_date}T${calculatedStartTime}:00+00:00` : null,
      end_timestamp: calculatedEndTime ? `${testMainSession.scheduled_date}T${calculatedEndTime}:00+00:00` : null,
      created_by_form: true
    };
    
    console.log('\n📦 Prepared data field:');
    console.log(JSON.stringify(dataField, null, 2));
    
    // Test the actual database insert
    console.log('\n💾 Testing database insert...');
    
    const insertData = {
      main_session_name: testMainSession.main_session_name,
      scheduled_date: testMainSession.scheduled_date,
      class_id: testMainSession.class_id,
      lesson_id: extractedLessonId,
      data: dataField
    };
    
    console.log('Insert data:');
    console.log(JSON.stringify(insertData, null, 2));
    
    const { data: mainSessionData, error: mainSessionError } = await supabase
      .from('main_sessions')
      .insert(insertData)
      .select()
      .single();
    
    if (mainSessionError) {
      console.error('❌ Error creating main session:', mainSessionError);
      return;
    }
    
    console.log('\n✅ Main session created successfully!');
    console.log(`   ID: ${mainSessionData.main_session_id}`);
    console.log(`   Name: ${mainSessionData.main_session_name}`);
    console.log(`   Lesson ID: ${mainSessionData.lesson_id}`);
    console.log(`   Data: ${JSON.stringify(mainSessionData.data, null, 2)}`);
    
    // Verify the lesson_id was saved correctly
    if (mainSessionData.lesson_id === extractedLessonId) {
      console.log('✅ Lesson ID saved correctly!');
    } else {
      console.log(`❌ Lesson ID mismatch! Expected: ${extractedLessonId}, Got: ${mainSessionData.lesson_id}`);
    }
    
    // Verify the timing data was saved in JSONB
    const savedData = mainSessionData.data;
    if (savedData && savedData.start_time === calculatedStartTime && savedData.end_time === calculatedEndTime) {
      console.log('✅ Timing data saved correctly in JSONB!');
    } else {
      console.log('❌ Timing data not saved correctly in JSONB');
    }
    
    // Clean up the test record
    console.log('\n🧹 Cleaning up test record...');
    await supabase
      .from('main_sessions')
      .delete()
      .eq('main_session_id', mainSessionData.main_session_id);
    
    console.log('✅ Test record cleaned up');
    console.log('\n🎉 Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testLessonCreation();
