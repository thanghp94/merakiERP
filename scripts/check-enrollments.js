const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function checkEnrollments() {
  console.log('🔍 Checking enrollments data...\n');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.log('❌ Missing environment variables');
    return;
  }
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  try {
    // Check classes
    const { data: classes, error: classError } = await supabase
      .from('classes')
      .select('*');
    
    if (classError) {
      console.error('❌ Error fetching classes:', classError);
      return;
    }
    
    console.log('📚 Classes found:', classes?.length || 0);
    classes?.forEach(cls => {
      console.log(`  - ${cls.class_name} (ID: ${cls.id})`);
    });
    
    // Check students
    const { data: students, error: studentError } = await supabase
      .from('students')
      .select('*');
    
    if (studentError) {
      console.error('❌ Error fetching students:', studentError);
      return;
    }
    
    console.log('\n👥 Students found:', students?.length || 0);
    students?.forEach(student => {
      console.log(`  - ${student.full_name} (ID: ${student.id})`);
    });
    
    // Check enrollments
    const { data: enrollments, error: enrollmentError } = await supabase
      .from('enrollments')
      .select(`
        *,
        students (full_name),
        classes (class_name)
      `);
    
    if (enrollmentError) {
      console.error('❌ Error fetching enrollments:', enrollmentError);
      return;
    }
    
    console.log('\n📝 Enrollments found:', enrollments?.length || 0);
    enrollments?.forEach(enrollment => {
      console.log(`  - ${enrollment.students.full_name} in ${enrollment.classes.class_name} (Status: ${enrollment.status})`);
    });
    
    // Check sessions
    const { data: sessions, error: sessionError } = await supabase
      .from('sessions')
      .select(`
        *,
        main_sessions (
          main_session_name,
          class_id,
          classes (class_name)
        )
      `);
    
    if (sessionError) {
      console.error('❌ Error fetching sessions:', sessionError);
      return;
    }
    
    console.log('\n🎯 Sessions found:', sessions?.length || 0);
    sessions?.forEach(session => {
      console.log(`  - ${session.main_sessions?.main_session_name} for ${session.main_sessions?.classes?.class_name} (ID: ${session.id})`);
    });
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkEnrollments();
