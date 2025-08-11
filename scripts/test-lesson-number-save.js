const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function testLessonNumberSave() {
  console.log('🔍 Testing lesson number save functionality...\n');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.log('❌ Missing environment variables');
    return;
  }
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  try {
    // Check existing main sessions to see if lesson_id is populated
    console.log('📋 Checking existing main sessions for lesson_id...');
    
    const { data: mainSessions, error } = await supabase
      .from('main_sessions')
      .select('main_session_id, main_session_name, lesson_id, class_id, scheduled_date')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (error) {
      console.error('❌ Error fetching main sessions:', error);
      return;
    }
    
    console.log(`✅ Found ${mainSessions?.length || 0} main sessions`);
    
    if (mainSessions && mainSessions.length > 0) {
      console.log('\nMain sessions with lesson_id status:');
      mainSessions.forEach((session, index) => {
        console.log(`\n${index + 1}. Main Session: ${session.main_session_name}`);
        console.log(`   ID: ${session.main_session_id}`);
        console.log(`   Lesson ID: ${session.lesson_id || 'NOT SET ❌'}`);
        console.log(`   Class ID: ${session.class_id}`);
        console.log(`   Date: ${session.scheduled_date}`);
        
        // Try to extract lesson number from name
        if (session.main_session_name) {
          const lessonMatch = session.main_session_name.match(/\.L(\d+)/);
          if (lessonMatch) {
            const expectedLessonId = `L${lessonMatch[1]}`;
            console.log(`   Expected Lesson ID: ${expectedLessonId}`);
            if (session.lesson_id === expectedLessonId) {
              console.log(`   Status: ✅ CORRECT`);
            } else {
              console.log(`   Status: ❌ MISMATCH (should be ${expectedLessonId})`);
            }
          }
        }
      });
    }
    
    // Test the API endpoint directly
    console.log('\n📋 Testing main-sessions API with lesson number...');
    
    // Get a class ID for testing
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
    
    // Create test data
    const testData = {
      main_session_name: 'GS12 test.U8.L99', // Test lesson name
      lesson_number: 'L99', // Explicit lesson number
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
        }
      ]
    };
    
    console.log('Test data prepared:');
    console.log(`  Main session name: ${testData.main_session_name}`);
    console.log(`  Lesson number: ${testData.lesson_number}`);
    console.log(`  Expected lesson_id in DB: ${testData.lesson_number}`);
    
    console.log('\n⚠️  Note: This is a dry run test. To actually test the API, you would need to:');
    console.log('1. Start the Next.js development server');
    console.log('2. Make a POST request to /api/main-sessions with the test data');
    console.log('3. Check if the lesson_id field is properly saved');
    
    console.log('\n✅ Test preparation complete!');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testLessonNumberSave();
