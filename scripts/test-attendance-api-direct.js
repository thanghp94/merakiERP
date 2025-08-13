const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lunkgjarwqqkpbohneqn.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1bmtnamFyd3Fxa3Bib2huZXFuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDc1MDIwOSwiZXhwIjoyMDcwMzI2MjA5fQ.G-lQ5F__laAz3Q9e5GRi_6DluA2kAjDCOX8hqBNOwXI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAttendanceAPI() {
  try {
    console.log('🧪 Testing Attendance API directly...\n');
    
    // Step 1: Get a test student
    console.log('1. Getting test student...');
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('id, full_name')
      .limit(1);
    
    if (studentsError) {
      console.error('Error fetching students:', studentsError);
      return;
    }
    
    if (students.length === 0) {
      console.log('❌ No students found');
      return;
    }
    
    const testStudent = students[0];
    console.log(`✅ Found student: ${testStudent.full_name} (ID: ${testStudent.id})`);
    
    // Step 2: Get enrollments for this student
    console.log('\n2. Getting enrollments...');
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
    
    console.log(`✅ Found ${enrollments.length} enrollments:`);
    enrollments.forEach(enrollment => {
      console.log(`  - Enrollment ID: ${enrollment.id}, Class: ${enrollment.classes?.class_name}`);
    });
    
    if (enrollments.length === 0) {
      console.log('❌ No enrollments found for this student');
      return;
    }
    
    // Step 3: Test attendance API for each enrollment
    console.log('\n3. Testing attendance API...');
    
    for (const enrollment of enrollments) {
      console.log(`\n   Testing enrollment ${enrollment.id}:`);
      
      // Test the exact API call that the frontend makes
      const { data: attendanceRecords, error: attendanceError } = await supabase
        .from('attendance')
        .select(`
          *,
          enrollments (
            id,
            students (
              id,
              full_name,
              email
            ),
            classes (
              id,
              class_name,
              data,
              facilities (
                id,
                name
              )
            )
          ),
          main_sessions (
            main_session_id,
            main_session_name,
            scheduled_date,
            lesson_id,
            data
          )
        `)
        .eq('enrollment_id', enrollment.id)
        .order('created_at', { ascending: false });
      
      if (attendanceError) {
        console.error('   ❌ Error fetching attendance:', attendanceError);
        continue;
      }
      
      console.log(`   ✅ Found ${attendanceRecords.length} attendance records:`);
      
      attendanceRecords.forEach((record, index) => {
        console.log(`     Record ${index + 1}:`);
        console.log(`       - ID: ${record.id}`);
        console.log(`       - Status: ${record.status}`);
        console.log(`       - Main Session: ${record.main_sessions?.main_session_name || 'N/A'}`);
        console.log(`       - Lesson ID: ${record.main_sessions?.lesson_id || 'N/A'}`);
        console.log(`       - Date: ${record.main_sessions?.scheduled_date || record.created_at}`);
        
        // Test unit extraction
        const lessonId = record.main_sessions?.lesson_id || '';
        if (lessonId.includes('.')) {
          const unit = lessonId.split('.')[0];
          if (unit.match(/^U\d+$/)) {
            console.log(`       - Extracted Unit: ${unit}`);
          }
        }
        console.log('');
      });
    }
    
    // Step 4: Test the HTTP API endpoint directly
    console.log('\n4. Testing HTTP API endpoint...');
    
    const testEnrollmentId = enrollments[0].id;
    const apiUrl = `http://localhost:3001/api/attendance?enrollment_id=${testEnrollmentId}`;
    
    try {
      const response = await fetch(apiUrl);
      const result = await response.json();
      
      console.log(`   API Response Status: ${response.status}`);
      console.log(`   API Response:`, JSON.stringify(result, null, 2));
      
      if (result.success && result.data) {
        console.log(`   ✅ HTTP API returned ${result.data.length} records`);
      } else {
        console.log(`   ❌ HTTP API failed: ${result.message}`);
      }
    } catch (fetchError) {
      console.log(`   ❌ HTTP API fetch error:`, fetchError.message);
    }
    
    console.log('\n🎉 Test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testAttendanceAPI();
