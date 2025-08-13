const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugAttendanceDrawer() {
  try {
    console.log('🔍 Debugging attendance drawer issue...\n');
    
    // Step 1: Check if we have students
    console.log('1. Checking students...');
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('id, full_name')
      .limit(5);
    
    if (studentsError) {
      console.error('Error fetching students:', studentsError);
      return;
    }
    
    console.log(`Found ${students.length} students:`);
    students.forEach(student => {
      console.log(`  - ${student.full_name} (ID: ${student.id})`);
    });
    
    if (students.length === 0) {
      console.log('❌ No students found. Cannot test attendance.');
      return;
    }
    
    // Step 2: Check enrollments for the first student
    const testStudent = students[0];
    console.log(`\n2. Checking enrollments for ${testStudent.full_name}...`);
    
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from('enrollments')
      .select(`
        id,
        student_id,
        class_id,
        status,
        classes (
          id,
          class_name
        )
      `)
      .eq('student_id', testStudent.id);
    
    if (enrollmentsError) {
      console.error('Error fetching enrollments:', enrollmentsError);
      return;
    }
    
    console.log(`Found ${enrollments.length} enrollments:`);
    enrollments.forEach(enrollment => {
      console.log(`  - Class: ${enrollment.classes?.class_name} (Enrollment ID: ${enrollment.id})`);
    });
    
    if (enrollments.length === 0) {
      console.log('❌ No enrollments found for this student. Cannot test attendance.');
      return;
    }
    
    // Step 3: Check attendance records for each enrollment
    console.log(`\n3. Checking attendance records...`);
    
    for (const enrollment of enrollments) {
      console.log(`\n   Checking attendance for enrollment ${enrollment.id}:`);
      
      const { data: attendanceRecords, error: attendanceError } = await supabase
        .from('attendance')
        .select(`
          id,
          enrollment_id,
          main_session_id,
          status,
          created_at,
          data,
          main_sessions (
            main_session_id,
            main_session_name,
            lesson_id,
            scheduled_date
          ),
          enrollments (
            id,
            classes (
              id,
              class_name
            ),
            students (
              id,
              full_name
            )
          )
        `)
        .eq('enrollment_id', enrollment.id);
      
      if (attendanceError) {
        console.error('   Error fetching attendance:', attendanceError);
        continue;
      }
      
      console.log(`   Found ${attendanceRecords.length} attendance records:`);
      attendanceRecords.forEach(record => {
        console.log(`     - Session: ${record.main_sessions?.main_session_name || 'N/A'}`);
        console.log(`       Lesson ID: ${record.main_sessions?.lesson_id || 'N/A'}`);
        console.log(`       Status: ${record.status}`);
        console.log(`       Date: ${record.main_sessions?.scheduled_date || 'N/A'}`);
        console.log('');
      });
    }
    
    // Step 4: Check main sessions to see if they have lesson_id in the new format
    console.log(`\n4. Checking main sessions with new lesson_id format...`);
    
    const { data: mainSessions, error: mainSessionsError } = await supabase
      .from('main_sessions')
      .select('main_session_id, main_session_name, lesson_id, scheduled_date')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (mainSessionsError) {
      console.error('Error fetching main sessions:', mainSessionsError);
      return;
    }
    
    console.log(`Found ${mainSessions.length} recent main sessions:`);
    mainSessions.forEach(session => {
      console.log(`  - ${session.main_session_name}`);
      console.log(`    Lesson ID: "${session.lesson_id}"`);
      console.log(`    Date: ${session.scheduled_date}`);
      console.log('');
    });
    
    // Step 5: Test the unit extraction logic
    console.log(`\n5. Testing unit extraction from lesson_id...`);
    
    const unitsFound = new Set();
    mainSessions.forEach(session => {
      const lessonId = session.lesson_id || '';
      if (lessonId.includes('.')) {
        const unit = lessonId.split('.')[0];
        if (unit.match(/^U\d+$/)) {
          unitsFound.add(unit);
          console.log(`  - Extracted unit "${unit}" from lesson_id "${lessonId}"`);
        }
      }
    });
    
    console.log(`\nUnique units found: ${Array.from(unitsFound).join(', ')}`);
    
    console.log('\n✅ Debug completed!');
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

debugAttendanceDrawer();
