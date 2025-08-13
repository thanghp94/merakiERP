const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lunkgjarwqqkpbohneqn.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1bmtnamFyd3Fxa3Bib2huZXFuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDc1MDIwOSwiZXhwIjoyMDcwMzI2MjA5fQ.G-lQ5F__laAz3Q9e5GRi_6DluA2kAjDCOX8hqBNOwXI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestAttendanceData() {
  try {
    console.log('🧪 Creating test attendance data...\n');
    
    // Step 1: Get or create a test student
    console.log('1. Getting/creating test student...');
    let { data: students, error: studentsError } = await supabase
      .from('students')
      .select('id, full_name')
      .limit(1);
    
    if (studentsError) {
      console.error('Error fetching students:', studentsError);
      return;
    }
    
    let testStudent;
    if (students.length === 0) {
      // Create a test student
      const { data: newStudent, error: createStudentError } = await supabase
        .from('students')
        .insert({
          full_name: 'Nguyễn Văn An',
          email: 'test@example.com',
          phone: '0123456789',
          status: 'active',
          data: {
            program: 'GrapeSEED',
            current_english_level: 'Beginner'
          }
        })
        .select()
        .single();
      
      if (createStudentError) {
        console.error('Error creating student:', createStudentError);
        return;
      }
      testStudent = newStudent;
      console.log(`✅ Created test student: ${testStudent.full_name}`);
    } else {
      testStudent = students[0];
      console.log(`✅ Using existing student: ${testStudent.full_name}`);
    }
    
    // Step 2: Get or create a test class
    console.log('\n2. Getting/creating test class...');
    let { data: classes, error: classesError } = await supabase
      .from('classes')
      .select('id, class_name, current_unit')
      .limit(1);
    
    if (classesError) {
      console.error('Error fetching classes:', classesError);
      return;
    }
    
    let testClass;
    if (classes.length === 0) {
      // Get a facility first
      const { data: facilities } = await supabase
        .from('facilities')
        .select('id')
        .limit(1);
      
      const facilityId = facilities?.[0]?.id || 'default-facility';
      
      // Create a test class
      const { data: newClass, error: createClassError } = await supabase
        .from('classes')
        .insert({
          class_name: 'GS12 test (CS2)',
          facility_id: facilityId,
          status: 'active',
          start_date: '2024-01-01',
          current_unit: 'U10',
          data: {
            program_type: 'GrapeSEED',
            unit: 'U10'
          }
        })
        .select()
        .single();
      
      if (createClassError) {
        console.error('Error creating class:', createClassError);
        return;
      }
      testClass = newClass;
      console.log(`✅ Created test class: ${testClass.class_name}`);
    } else {
      testClass = classes[0];
      // Update class to have current_unit if it doesn't
      if (!testClass.current_unit) {
        await supabase
          .from('classes')
          .update({ current_unit: 'U10' })
          .eq('id', testClass.id);
        testClass.current_unit = 'U10';
      }
      console.log(`✅ Using existing class: ${testClass.class_name}`);
    }
    
    // Step 3: Create enrollment if it doesn't exist
    console.log('\n3. Creating enrollment...');
    let { data: existingEnrollments } = await supabase
      .from('enrollments')
      .select('id')
      .eq('student_id', testStudent.id)
      .eq('class_id', testClass.id);
    
    let testEnrollment;
    if (existingEnrollments.length === 0) {
      const { data: newEnrollment, error: enrollmentError } = await supabase
        .from('enrollments')
        .insert({
          student_id: testStudent.id,
          class_id: testClass.id,
          status: 'active',
          enrollment_date: '2024-01-01',
          data: {}
        })
        .select()
        .single();
      
      if (enrollmentError) {
        console.error('Error creating enrollment:', enrollmentError);
        return;
      }
      testEnrollment = newEnrollment;
      console.log(`✅ Created enrollment: ${testEnrollment.id}`);
    } else {
      testEnrollment = existingEnrollments[0];
      console.log(`✅ Using existing enrollment: ${testEnrollment.id}`);
    }
    
    // Step 4: Create main sessions with proper lesson_id format
    console.log('\n4. Creating main sessions...');
    const mainSessionsToCreate = [
      { lesson: 'L1', unit: 'U10' },
      { lesson: 'L2', unit: 'U10' },
      { lesson: 'L3', unit: 'U10' },
      { lesson: 'L1', unit: 'U11' },
      { lesson: 'L2', unit: 'U11' }
    ];
    
    const createdMainSessions = [];
    
    for (const sessionData of mainSessionsToCreate) {
      const lessonId = `${sessionData.unit}.${sessionData.lesson}`;
      
      // Check if main session already exists
      const { data: existingMainSession } = await supabase
        .from('main_sessions')
        .select('main_session_id')
        .eq('lesson_id', lessonId)
        .eq('class_id', testClass.id);
      
      if (existingMainSession.length === 0) {
        const { data: newMainSession, error: mainSessionError } = await supabase
          .from('main_sessions')
          .insert({
            main_session_name: `${testClass.class_name}.${lessonId}`,
            scheduled_date: '2024-12-01',
            class_id: testClass.id,
            lesson_id: lessonId,
            data: {
              start_time: '09:00',
              end_time: '10:30',
              total_duration_minutes: 90
            }
          })
          .select()
          .single();
        
        if (mainSessionError) {
          console.error('Error creating main session:', mainSessionError);
          continue;
        }
        createdMainSessions.push(newMainSession);
        console.log(`✅ Created main session: ${newMainSession.main_session_name} (lesson_id: ${lessonId})`);
      }
    }
    
    // Step 5: Create attendance records
    console.log('\n5. Creating attendance records...');
    const { data: allMainSessions } = await supabase
      .from('main_sessions')
      .select('main_session_id, main_session_name, lesson_id')
      .eq('class_id', testClass.id);
    
    let attendanceCount = 0;
    for (const mainSession of allMainSessions) {
      // Check if attendance already exists
      const { data: existingAttendance } = await supabase
        .from('attendance')
        .select('id')
        .eq('main_session_id', mainSession.main_session_id)
        .eq('enrollment_id', testEnrollment.id);
      
      if (existingAttendance.length === 0) {
        const { data: newAttendance, error: attendanceError } = await supabase
          .from('attendance')
          .insert({
            main_session_id: mainSession.main_session_id,
            enrollment_id: testEnrollment.id,
            status: 'present',
            data: {
              notes: 'Test attendance record'
            }
          })
          .select()
          .single();
        
        if (attendanceError) {
          console.error('Error creating attendance:', attendanceError);
          continue;
        }
        attendanceCount++;
        console.log(`✅ Created attendance for: ${mainSession.main_session_name}`);
      }
    }
    
    console.log(`\n🎉 Test data creation completed!`);
    console.log(`   Student: ${testStudent.full_name} (ID: ${testStudent.id})`);
    console.log(`   Class: ${testClass.class_name} (ID: ${testClass.id})`);
    console.log(`   Enrollment: ${testEnrollment.id}`);
    console.log(`   Main Sessions: ${allMainSessions.length}`);
    console.log(`   Attendance Records: ${attendanceCount}`);
    
    console.log(`\n🧪 Now test the attendance drawer with student: ${testStudent.full_name}`);
    
  } catch (error) {
    console.error('❌ Error creating test data:', error);
  }
}

createTestAttendanceData();
