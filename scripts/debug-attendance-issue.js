const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function debugAttendanceIssue() {
  console.log('🔍 Debugging attendance issue - checking why hardcoded data is showing...\n');

  try {
    // 1. Check if there are any classes with enrolled students
    console.log('1. Checking classes and enrollments...');
    const { data: classes, error: classError } = await supabase
      .from('classes')
      .select(`
        id,
        class_name,
        enrollments (
          id,
          status,
          students (
            id,
            full_name,
            email
          )
        )
      `)
      .limit(5);

    if (classError) {
      console.error('❌ Error fetching classes:', classError);
      return;
    }

    console.log(`Found ${classes.length} classes:`);
    classes.forEach((cls, index) => {
      const activeEnrollments = cls.enrollments.filter(e => e.status === 'active');
      console.log(`${index + 1}. ${cls.class_name} (ID: ${cls.id})`);
      console.log(`   - Total enrollments: ${cls.enrollments.length}`);
      console.log(`   - Active enrollments: ${activeEnrollments.length}`);
      if (activeEnrollments.length > 0) {
        console.log(`   - Students: ${activeEnrollments.map(e => e.students.full_name).join(', ')}`);
      }
      console.log('');
    });

    // 2. Check recent main sessions
    console.log('2. Checking recent main sessions...');
    const { data: mainSessions, error: mainSessionError } = await supabase
      .from('main_sessions')
      .select(`
        main_session_id,
        main_session_name,
        class_id,
        scheduled_date,
        classes (
          class_name
        )
      `)
      .order('created_at', { ascending: false })
      .limit(3);

    if (mainSessionError) {
      console.error('❌ Error fetching main sessions:', mainSessionError);
      return;
    }

    console.log(`Found ${mainSessions.length} recent main sessions:`);
    mainSessions.forEach((session, index) => {
      console.log(`${index + 1}. ${session.main_session_name}`);
      console.log(`   - Class: ${session.classes?.class_name} (ID: ${session.class_id})`);
      console.log(`   - Date: ${session.scheduled_date}`);
      console.log(`   - Main Session ID: ${session.main_session_id}`);
      console.log('');
    });

    // 3. Test the attendance API flow for the first main session
    if (mainSessions.length > 0) {
      const testSession = mainSessions[0];
      console.log(`3. Testing attendance API flow for: ${testSession.main_session_name}`);
      
      // Test bulk create attendance
      console.log('   - Testing bulk create attendance...');
      const bulkCreateResponse = await fetch('http://localhost:3000/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bulk_create: true,
          main_session_id: testSession.main_session_id,
          class_id: testSession.class_id
        })
      });

      const bulkResult = await bulkCreateResponse.json();
      console.log('   - Bulk create result:', bulkResult.success ? '✅ Success' : '❌ Failed');
      if (!bulkResult.success) {
        console.log('   - Error:', bulkResult.message);
      } else {
        console.log(`   - Created attendance for ${bulkResult.data?.length || 0} students`);
      }

      // Test fetch attendance
      console.log('   - Testing fetch attendance...');
      const fetchResponse = await fetch(`http://localhost:3000/api/attendance?main_session_id=${testSession.main_session_id}`);
      const fetchResult = await fetchResponse.json();
      
      console.log('   - Fetch result:', fetchResult.success ? '✅ Success' : '❌ Failed');
      if (!fetchResult.success) {
        console.log('   - Error:', fetchResult.message);
      } else {
        console.log(`   - Found ${fetchResult.data?.length || 0} attendance records`);
        if (fetchResult.data && fetchResult.data.length > 0) {
          fetchResult.data.forEach((record, index) => {
            console.log(`     ${index + 1}. ${record.enrollments?.students?.full_name || 'Unknown'} - ${record.status}`);
          });
        }
      }
    }

    // 4. Check if there are any sessions linked to main sessions
    console.log('4. Checking sessions linked to main sessions...');
    const { data: sessions, error: sessionError } = await supabase
      .from('sessions')
      .select(`
        id,
        main_session_id,
        subject_type,
        start_time,
        end_time,
        date
      `)
      .order('created_at', { ascending: false })
      .limit(5);

    if (sessionError) {
      console.error('❌ Error fetching sessions:', sessionError);
      return;
    }

    console.log(`Found ${sessions.length} recent sessions:`);
    sessions.forEach((session, index) => {
      console.log(`${index + 1}. Session ID: ${session.id}`);
      console.log(`   - Main Session ID: ${session.main_session_id}`);
      console.log(`   - Subject: ${session.subject_type}`);
      console.log(`   - Time: ${session.start_time} - ${session.end_time}`);
      console.log(`   - Date: ${session.date}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

debugAttendanceIssue();
