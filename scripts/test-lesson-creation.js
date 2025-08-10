const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testLessonCreation() {
  console.log('🧪 Testing lesson creation workflow...\n');

  try {
    // First, get a class to use for testing
    const { data: classes, error: classError } = await supabase
      .from('classes')
      .select('id, class_name')
      .limit(1);

    if (classError || !classes || classes.length === 0) {
      console.log('❌ No classes found. Creating a test class first...');
      
      // Get or create a facility
      let { data: facilities } = await supabase
        .from('facilities')
        .select('id')
        .limit(1);
      
      if (!facilities || facilities.length === 0) {
        const { data: newFacility } = await supabase
          .from('facilities')
          .insert({
            name: 'Test Facility',
            status: 'active',
            data: {}
          })
          .select()
          .single();
        facilities = [newFacility];
      }

      const { data: newClass } = await supabase
        .from('classes')
        .insert({
          class_name: 'Test Class for Lesson',
          facility_id: facilities[0].id,
          status: 'active',
          start_date: new Date().toISOString().split('T')[0],
          data: {}
        })
        .select()
        .single();
      
      classes[0] = newClass;
      console.log('✅ Created test class:', newClass.class_name);
    }

    const testClass = classes[0];
    console.log('📚 Using class:', testClass.class_name);

    // Get or create an employee for testing
    let { data: employees } = await supabase
      .from('employees')
      .select('id, full_name')
      .limit(1);

    if (!employees || employees.length === 0) {
      const { data: newEmployee } = await supabase
        .from('employees')
        .insert({
          full_name: 'Test Teacher',
          email: 'test.teacher@example.com',
          position: 'teacher',
          status: 'active',
          data: {}
        })
        .select()
        .single();
      
      employees = [newEmployee];
      console.log('✅ Created test employee:', newEmployee.full_name);
    }

    const testTeacher = employees[0];
    console.log('👨‍🏫 Using teacher:', testTeacher.full_name);

    // Test main session creation
    console.log('\n1. Creating main session...');
    const mainSessionData = {
      main_session_name: 'Test Lesson Session',
      scheduled_date: new Date().toISOString().split('T')[0],
      start_time: new Date().toISOString(),
      end_time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours later
      total_duration_minutes: 120,
      class_id: testClass.id
    };

    const { data: mainSession, error: mainSessionError } = await supabase
      .from('main_sessions')
      .insert(mainSessionData)
      .select()
      .single();

    if (mainSessionError) {
      console.log('❌ Failed to create main session:', mainSessionError.message);
      return;
    }

    console.log('✅ Main session created:', mainSession.main_session_name);
    console.log('📋 Main session ID:', mainSession.main_session_id);

    // Test individual session creation
    console.log('\n2. Creating individual sessions...');
    const sessionsData = [
      {
        lesson_id: mainSession.main_session_id,
        subject_type: 'TSI',
        teacher_id: testTeacher.id,
        location_id: 'test-room-1',
        start_time: new Date().toISOString(),
        end_time: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour later
        data: {
          duration_minutes: 60,
          main_session_id: mainSession.main_session_id
        }
      },
      {
        lesson_id: mainSession.main_session_id,
        subject_type: 'GRA',
        teacher_id: testTeacher.id,
        location_id: 'test-room-2',
        start_time: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour later
        end_time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours later
        data: {
          duration_minutes: 60,
          main_session_id: mainSession.main_session_id
        }
      }
    ];

    const { data: sessions, error: sessionsError } = await supabase
      .from('sessions')
      .insert(sessionsData)
      .select();

    if (sessionsError) {
      console.log('❌ Failed to create sessions:', sessionsError.message);
      return;
    }

    console.log('✅ Individual sessions created:', sessions.length);
    sessions.forEach((session, index) => {
      console.log(`   Session ${index + 1}: ${session.subject_type} (${session.id})`);
    });

    // Test retrieval with relationships
    console.log('\n3. Testing data retrieval...');
    const { data: retrievedData, error: retrieveError } = await supabase
      .from('main_sessions')
      .select(`
        *,
        classes (
          id,
          class_name
        )
      `)
      .eq('main_session_id', mainSession.main_session_id)
      .single();

    if (retrieveError) {
      console.log('❌ Failed to retrieve main session:', retrieveError.message);
      return;
    }

    console.log('✅ Main session retrieved successfully');
    console.log('📋 Retrieved data:', {
      id: retrievedData.main_session_id,
      name: retrievedData.main_session_name,
      class: retrievedData.classes?.class_name
    });

    // Test sessions retrieval
    const { data: retrievedSessions, error: sessionsRetrieveError } = await supabase
      .from('sessions')
      .select('*')
      .eq('lesson_id', mainSession.main_session_id);

    if (sessionsRetrieveError) {
      console.log('❌ Failed to retrieve sessions:', sessionsRetrieveError.message);
      return;
    }

    console.log('✅ Sessions retrieved successfully:', retrievedSessions.length);

    console.log('\n🎉 All tests passed! The lesson creation workflow is working correctly.');
    console.log('\n📋 Summary:');
    console.log(`   ✅ Main session created: ${mainSession.main_session_name}`);
    console.log(`   ✅ Individual sessions created: ${sessions.length}`);
    console.log(`   ✅ Data retrieval working correctly`);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testLessonCreation();
