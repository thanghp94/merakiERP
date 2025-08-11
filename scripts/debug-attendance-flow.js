const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function debugAttendanceFlow() {
  console.log('🔍 Debugging attendance flow...\n');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.log('❌ Missing environment variables');
    return;
  }
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  try {
    // Step 1: Get a session ID
    const { data: sessions, error: sessionError } = await supabase
      .from('sessions')
      .select('id')
      .limit(1);
    
    if (sessionError || !sessions || sessions.length === 0) {
      console.error('❌ No sessions found');
      return;
    }
    
    const sessionId = sessions[0].id;
    console.log(`🎯 Using session ID: ${sessionId}`);
    
    // Step 2: Simulate the AttendanceModal fetchStudents function
    console.log('\n📋 Step 2: Fetching session details...');
    
    const { data: session, error: sessionErr } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .single();
    
    if (sessionErr) {
      console.error('❌ Session fetch failed:', sessionErr);
      return;
    }
    
    console.log('✅ Session found:', {
      id: session.id,
      lesson_id: session.lesson_id,
      subject_type: session.subject_type
    });
    
    // Step 3: Get main session to find class_id
    console.log('\n📋 Step 3: Fetching main session...');
    
    const { data: mainSession, error: mainErr } = await supabase
      .from('main_sessions')
      .select('*')
      .eq('main_session_id', session.lesson_id)
      .single();
    
    if (mainErr) {
      console.error('❌ Main session fetch failed:', mainErr);
      return;
    }
    
    const classId = mainSession.class_id;
    console.log('✅ Main session found, class_id:', classId);
    
    // Step 4: Create bulk attendance (simulate the API call)
    console.log('\n📋 Step 4: Creating bulk attendance...');
    
    // First get enrollments for this class
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
      console.log(`  - ${enrollment.students.full_name} (ID: ${enrollment.id})`);
    });
    
    if (!enrollments || enrollments.length === 0) {
      console.log('❌ No active enrollments found for this class!');
      return;
    }
    
    // Step 5: Check for existing attendance records
    console.log('\n📋 Step 5: Checking existing attendance...');
    
    const { data: existingAttendance, error: existingError } = await supabase
      .from('attendance')
      .select('enrollment_id')
      .eq('session_id', sessionId);
    
    if (existingError) {
      console.error('❌ Existing attendance check failed:', existingError);
    } else {
      console.log(`✅ Found ${existingAttendance?.length || 0} existing attendance records`);
    }
    
    const existingEnrollmentIds = existingAttendance?.map(a => a.enrollment_id) || [];
    const newEnrollments = enrollments.filter(enrollment => 
      !existingEnrollmentIds.includes(enrollment.id)
    );
    
    console.log(`📝 Need to create attendance for ${newEnrollments.length} students`);
    
    // Step 6: Create attendance records if needed
    if (newEnrollments.length > 0) {
      console.log('\n📋 Step 6: Creating attendance records...');
      
      const attendanceRecords = newEnrollments.map(enrollment => ({
        session_id: sessionId,
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
        console.error('❌ Attendance creation failed:', createError);
      } else {
        console.log(`✅ Created ${createdAttendance?.length || 0} attendance records`);
      }
    }
    
    // Step 7: Fetch final attendance data (what the modal should show)
    console.log('\n📋 Step 7: Fetching final attendance data...');
    
    const { data: finalAttendance, error: finalError } = await supabase
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
      .eq('session_id', sessionId);
    
    if (finalError) {
      console.error('❌ Final attendance fetch failed:', finalError);
    } else {
      console.log(`✅ Final attendance data: ${finalAttendance?.length || 0} records`);
      finalAttendance?.forEach(record => {
        console.log(`  - ${record.enrollments.students.full_name}: ${record.status}`);
      });
    }
    
    console.log('\n🎉 Attendance flow completed successfully!');
    console.log('The modal should now show students.');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

debugAttendanceFlow();
