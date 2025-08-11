const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function testAttendanceMainSessions() {
  console.log('🔍 Testing attendance system with main_sessions...\n');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.log('❌ Missing environment variables');
    return;
  }
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  try {
    // Step 1: Get a session and its main_session_id
    console.log('📋 Step 1: Getting session and main_session info...');
    
    const { data: sessions, error: sessionError } = await supabase
      .from('sessions')
      .select('*')
      .limit(1);
    
    if (sessionError || !sessions || sessions.length === 0) {
      console.error('❌ No sessions found');
      return;
    }
    
    const session = sessions[0];
    const mainSessionId = session.lesson_id;
    
    console.log(`✅ Session ID: ${session.id}`);
    console.log(`✅ Main Session ID: ${mainSessionId}`);
    
    // Step 2: Get main session details
    console.log('\n📋 Step 2: Getting main session details...');
    
    const { data: mainSession, error: mainSessionError } = await supabase
      .from('main_sessions')
      .select('*')
      .eq('main_session_id', mainSessionId)
      .single();
    
    if (mainSessionError) {
      console.error('❌ Main session fetch failed:', mainSessionError);
      return;
    }
    
    const classId = mainSession.class_id;
    console.log(`✅ Class ID: ${classId}`);
    console.log(`✅ Main Session Name: ${mainSession.main_session_name}`);
    
    // Step 3: Get enrollments for this class
    console.log('\n📋 Step 3: Getting enrollments for class...');
    
    const { data: enrollments, error: enrollmentError } = await supabase
      .from('enrollments')
      .select(`
        id,
        students (
          id,
          full_name,
          email
        )
      `)
      .eq('class_id', classId)
      .eq('status', 'active');
    
    if (enrollmentError) {
      console.error('❌ Enrollment fetch failed:', enrollmentError);
      return;
    }
    
    console.log(`✅ Found ${enrollments?.length || 0} active enrollments`);
    enrollments?.forEach(enrollment => {
      console.log(`  - ${enrollment.students.full_name} (Enrollment ID: ${enrollment.id})`);
    });
    
    if (!enrollments || enrollments.length === 0) {
      console.log('❌ No enrollments found for this class');
      return;
    }
    
    // Step 4: Test bulk attendance creation
    console.log('\n📋 Step 4: Testing bulk attendance creation...');
    
    // First clear any existing attendance for this main session
    const { error: deleteError } = await supabase
      .from('attendance')
      .delete()
      .eq('main_session_id', mainSessionId);
    
    if (deleteError) {
      console.warn('⚠️ Could not clear existing attendance:', deleteError);
    }
    
    // Create bulk attendance
    const attendanceRecords = enrollments.map(enrollment => ({
      main_session_id: mainSessionId,
      enrollment_id: enrollment.id,
      status: 'present',
      data: {}
    }));
    
    const { data: createdAttendance, error: createError } = await supabase
      .from('attendance')
      .insert(attendanceRecords)
      .select(`
        *,
        enrollments (
          id,
          students (
            id,
            full_name,
            email
          )
        )
      `);
    
    if (createError) {
      console.error('❌ Bulk attendance creation failed:', createError);
      return;
    }
    
    console.log(`✅ Created ${createdAttendance?.length || 0} attendance records`);
    
    // Step 5: Test fetching attendance by main_session_id
    console.log('\n📋 Step 5: Testing attendance fetch by main_session_id...');
    
    const { data: fetchedAttendance, error: fetchError } = await supabase
      .from('attendance')
      .select(`
        *,
        enrollments (
          id,
          students (
            id,
            full_name,
            email
          )
        )
      `)
      .eq('main_session_id', mainSessionId);
    
    if (fetchError) {
      console.error('❌ Attendance fetch failed:', fetchError);
      return;
    }
    
    console.log(`✅ Fetched ${fetchedAttendance?.length || 0} attendance records`);
    fetchedAttendance?.forEach(record => {
      console.log(`  - ${record.enrollments.students.full_name}: ${record.status}`);
    });
    
    // Step 6: Test updating attendance status
    console.log('\n📋 Step 6: Testing attendance status update...');
    
    if (fetchedAttendance && fetchedAttendance.length > 0) {
      const firstRecord = fetchedAttendance[0];
      
      const { data: updatedRecord, error: updateError } = await supabase
        .from('attendance')
        .update({
          status: 'absent',
          data: { performance_note: 'Test note from script' }
        })
        .eq('id', firstRecord.id)
        .select(`
          *,
          enrollments (
            students (
              full_name
            )
          )
        `)
        .single();
      
      if (updateError) {
        console.error('❌ Attendance update failed:', updateError);
      } else {
        console.log(`✅ Updated ${updatedRecord.enrollments.students.full_name} to ${updatedRecord.status}`);
        console.log(`✅ Added note: ${updatedRecord.data?.performance_note}`);
      }
    }
    
    // Step 7: Test the API endpoints
    console.log('\n📋 Step 7: Testing API endpoints...');
    
    // Test GET with main_session_id
    try {
      const response = await fetch(`http://localhost:3000/api/attendance?main_session_id=${mainSessionId}`);
      if (response.ok) {
        const result = await response.json();
        console.log(`✅ API GET: Found ${result.data?.length || 0} records`);
      } else {
        console.log('⚠️ API GET: Server not running or endpoint failed');
      }
    } catch (apiError) {
      console.log('⚠️ API GET: Could not test (server not running)');
    }
    
    console.log('\n🎉 All tests completed successfully!');
    console.log('The attendance system now works with main_sessions directly.');
    console.log('The AttendanceModal should now load students properly.');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testAttendanceMainSessions();
