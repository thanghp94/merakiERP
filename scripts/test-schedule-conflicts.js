const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function testScheduleConflicts() {
  console.log('🧪 Testing teacher schedule conflict detection...\n');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.log('❌ Missing environment variables');
    return;
  }
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  try {
    // Get test data
    const { data: classes } = await supabase
      .from('classes')
      .select('id, class_name')
      .limit(1);
    
    const { data: teachers } = await supabase
      .from('employees')
      .select('id, full_name')
      .limit(1);
    
    if (!classes || classes.length === 0 || !teachers || teachers.length === 0) {
      console.log('❌ Missing test data (classes or teachers)');
      return;
    }
    
    const testClassId = classes[0].id;
    const testTeacherId = teachers[0].id;
    const testDate = '2025-08-20';
    
    console.log(`Using test class: ${classes[0].class_name}`);
    console.log(`Using test teacher: ${teachers[0].full_name}`);
    console.log(`Test date: ${testDate}\n`);
    
    // Step 1: Create first main session (should succeed)
    console.log('📋 Step 1: Creating first main session...');
    
    const firstSession = {
      main_session_name: 'GS12 test.U8.L101',
      lesson_number: 'L101',
      scheduled_date: testDate,
      class_id: testClassId,
      sessions: [
        {
          subject_type: 'TSI',
          teacher_id: testTeacherId,
          start_time: '10:00',
          end_time: '10:45',
          duration_minutes: 45,
          location_id: 'test-room-1'
        }
      ]
    };
    
    const response1 = await fetch('http://localhost:3000/api/main-sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(firstSession),
    });
    
    const result1 = await response1.json();
    
    if (result1.success) {
      console.log('✅ First session created successfully');
      console.log(`   Main session ID: ${result1.data.main_session_id}`);
    } else {
      console.log('❌ First session failed:', result1.message);
      return;
    }
    
    // Step 2: Try to create overlapping session (should fail)
    console.log('\n📋 Step 2: Creating overlapping session (should fail)...');
    
    const overlappingSession = {
      main_session_name: 'GS12 test.U8.L102',
      lesson_number: 'L102',
      scheduled_date: testDate,
      class_id: testClassId,
      sessions: [
        {
          subject_type: 'REP',
          teacher_id: testTeacherId, // Same teacher
          start_time: '10:30', // Overlaps with 10:00-10:45
          end_time: '11:15',
          duration_minutes: 45,
          location_id: 'test-room-2'
        }
      ]
    };
    
    const response2 = await fetch('http://localhost:3000/api/main-sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(overlappingSession),
    });
    
    const result2 = await response2.json();
    
    if (!result2.success && response2.status === 409) {
      console.log('✅ Conflict detected correctly!');
      console.log(`   Vietnamese message: ${result2.message}`);
      console.log(`   Conflict details:`, result2.conflict_details);
    } else {
      console.log('❌ Conflict detection failed - session was created when it should have been blocked');
      console.log('Result:', result2);
    }
    
    // Step 3: Try to create non-overlapping session (should succeed)
    console.log('\n📋 Step 3: Creating non-overlapping session (should succeed)...');
    
    const nonOverlappingSession = {
      main_session_name: 'GS12 test.U8.L103',
      lesson_number: 'L103',
      scheduled_date: testDate,
      class_id: testClassId,
      sessions: [
        {
          subject_type: 'GRA',
          teacher_id: testTeacherId, // Same teacher
          start_time: '11:00', // No overlap with 10:00-10:45
          end_time: '11:45',
          duration_minutes: 45,
          location_id: 'test-room-3'
        }
      ]
    };
    
    const response3 = await fetch('http://localhost:3000/api/main-sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(nonOverlappingSession),
    });
    
    const result3 = await response3.json();
    
    if (result3.success) {
      console.log('✅ Non-overlapping session created successfully');
      console.log(`   Main session ID: ${result3.data.main_session_id}`);
    } else {
      console.log('❌ Non-overlapping session failed:', result3.message);
    }
    
    // Cleanup: Delete test sessions
    console.log('\n🧹 Cleaning up test sessions...');
    
    if (result1.success) {
      await supabase
        .from('main_sessions')
        .delete()
        .eq('main_session_id', result1.data.main_session_id);
      console.log('   Deleted first test session');
    }
    
    if (result3.success) {
      await supabase
        .from('main_sessions')
        .delete()
        .eq('main_session_id', result3.data.main_session_id);
      console.log('   Deleted third test session');
    }
    
    console.log('\n🎉 Schedule conflict testing completed!');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Check if we're running this directly or if Next.js server is available
console.log('⚠️  Note: This test requires the Next.js development server to be running.');
console.log('   Please run "npm run dev" in another terminal first.\n');

testScheduleConflicts();
