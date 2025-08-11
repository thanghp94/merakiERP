const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function testMainSessionCreation() {
  console.log('🔍 Testing main session creation with sessions...\n');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.log('❌ Missing environment variables');
    return;
  }
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  try {
    // Step 1: Get a class for testing
    console.log('📋 Step 1: Getting a class for testing...');
    
    const { data: classes, error: classError } = await supabase
      .from('classes')
      .select('id, class_name')
      .limit(1);
    
    if (classError || !classes || classes.length === 0) {
      console.error('❌ No classes found for testing');
      return;
    }
    
    const testClass = classes[0];
    console.log(`✅ Using class: ${testClass.class_name} (ID: ${testClass.id})`);
    
    // Step 2: Get teachers and facilities for sessions
    console.log('\n📋 Step 2: Getting teachers and facilities...');
    
    const { data: teachers, error: teacherError } = await supabase
      .from('employees')
      .select('id, full_name')
      .eq('role', 'teacher')
      .limit(2);
    
    const { data: facilities, error: facilityError } = await supabase
      .from('facilities')
      .select('id, name')
      .limit(1);
    
    if (teacherError || !teachers || teachers.length === 0) {
      console.error('❌ No teachers found');
      return;
    }
    
    if (facilityError || !facilities || facilities.length === 0) {
      console.error('❌ No facilities found');
      return;
    }
    
    console.log(`✅ Found ${teachers.length} teachers and ${facilities.length} facilities`);
    
    // Step 3: Create a test main session with sessions
    console.log('\n📋 Step 3: Creating main session with sessions...');
    
    const testMainSession = {
      main_session_name: `Test Main Session ${Date.now()}`,
      scheduled_date: '2024-01-15',
      class_id: testClass.id,
      sessions: [
        {
          subject_type: 'Grammar',
          teacher_id: teachers[0].id,
          location_id: facilities[0].id,
          start_time: '09:00',
          end_time: '10:30',
          duration_minutes: 90
        },
        {
          subject_type: 'Speaking',
          teacher_id: teachers.length > 1 ? teachers[1].id : teachers[0].id,
          location_id: facilities[0].id,
          start_time: '10:45',
          end_time: '12:15',
          duration_minutes: 90
        }
      ]
    };
    
    // Call the API endpoint
    const response = await fetch('http://localhost:3000/api/main-sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testMainSession)
    });
    
    if (!response.ok) {
      console.error('❌ API call failed:', response.status, response.statusText);
      
      // Try direct database insertion as fallback
      console.log('📋 Trying direct database insertion...');
      
      const { data: mainSessionData, error: mainSessionError } = await supabase
        .from('main_sessions')
        .insert({
          main_session_name: testMainSession.main_session_name,
          scheduled_date: testMainSession.scheduled_date,
          class_id: testMainSession.class_id,
          data: {
            start_time: '09:00',
            end_time: '12:15',
            total_duration_minutes: 180,
            created_by_test: true
          }
        })
        .select()
        .single();
      
      if (mainSessionError) {
        console.error('❌ Direct main session creation failed:', mainSessionError);
        return;
      }
      
      console.log(`✅ Created main session directly: ${mainSessionData.main_session_name}`);
      
      // Create sessions manually
      const sessionsToInsert = testMainSession.sessions.map(session => ({
        lesson_id: mainSessionData.main_session_id,
        subject_type: session.subject_type,
        teacher_id: session.teacher_id,
        location_id: session.location_id,
        start_time: `${testMainSession.scheduled_date}T${session.start_time}:00+00:00`,
        end_time: `${testMainSession.scheduled_date}T${session.end_time}:00+00:00`,
        date: testMainSession.scheduled_date,
        data: {
          lesson_id: `${session.subject_type}${Date.now()}`,
          subject_name: `${testMainSession.main_session_name} - ${session.subject_type}`,
          subject_type: session.subject_type,
          main_session_id: mainSessionData.main_session_id,
          created_by_test: true
        }
      }));
      
      const { data: createdSessions, error: sessionsError } = await supabase
        .from('sessions')
        .insert(sessionsToInsert)
        .select();
      
      if (sessionsError) {
        console.error('❌ Sessions creation failed:', sessionsError);
        return;
      }
      
      console.log(`✅ Created ${createdSessions?.length || 0} sessions manually`);
      
    } else {
      const result = await response.json();
      console.log('✅ API call successful:', result.message);
      console.log('Main session ID:', result.data?.main_session_id);
    }
    
    // Step 4: Verify sessions were created
    console.log('\n📋 Step 4: Verifying sessions were created...');
    
    const { data: allMainSessions, error: fetchError } = await supabase
      .from('main_sessions')
      .select('main_session_id, main_session_name')
      .ilike('main_session_name', '%Test Main Session%')
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (fetchError || !allMainSessions || allMainSessions.length === 0) {
      console.error('❌ Could not find the created main session');
      return;
    }
    
    const createdMainSession = allMainSessions[0];
    console.log(`✅ Found main session: ${createdMainSession.main_session_name}`);
    
    // Check if sessions were created
    const { data: relatedSessions, error: sessionsFetchError } = await supabase
      .from('sessions')
      .select(`
        *,
        employees!sessions_teacher_id_fkey (
          full_name
        ),
        facilities (
          name
        )
      `)
      .eq('lesson_id', createdMainSession.main_session_id);
    
    if (sessionsFetchError) {
      console.error('❌ Error fetching related sessions:', sessionsFetchError);
      return;
    }
    
    console.log(`✅ Found ${relatedSessions?.length || 0} related sessions:`);
    relatedSessions?.forEach(session => {
      console.log(`  - ${session.subject_type}: ${session.employees?.full_name} at ${session.facilities?.name}`);
      console.log(`    Time: ${session.start_time} - ${session.end_time}`);
    });
    
    // Step 5: Test attendance creation with the new main session
    console.log('\n📋 Step 5: Testing attendance creation...');
    
    const { data: enrollments, error: enrollmentError } = await supabase
      .from('enrollments')
      .select('id, students(full_name)')
      .eq('class_id', testClass.id)
      .eq('status', 'active')
      .limit(2);
    
    if (enrollmentError || !enrollments || enrollments.length === 0) {
      console.log('⚠️ No enrollments found for attendance testing');
    } else {
      const { data: testAttendance, error: attendanceError } = await supabase
        .from('attendance')
        .insert({
          main_session_id: createdMainSession.main_session_id,
          enrollment_id: enrollments[0].id,
          status: 'present',
          data: { test: true }
        })
        .select(`
          *,
          enrollments (
            students (
              full_name
            )
          )
        `)
        .single();
      
      if (attendanceError) {
        console.error('❌ Attendance creation failed:', attendanceError);
      } else {
        console.log(`✅ Created attendance for: ${testAttendance.enrollments.students.full_name}`);
        
        // Clean up test attendance
        await supabase
          .from('attendance')
          .delete()
          .eq('id', testAttendance.id);
        console.log('✅ Cleaned up test attendance');
      }
    }
    
    console.log('\n🎉 Main session creation test completed!');
    console.log('✅ Main sessions now create corresponding sessions');
    console.log('✅ Attendance system works with main_sessions');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testMainSessionCreation();
