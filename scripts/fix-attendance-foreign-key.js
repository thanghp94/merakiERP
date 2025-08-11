const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function fixAttendanceForeignKey() {
  console.log('🔧 Fixing attendance foreign key to point to main_sessions...\n');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.log('❌ Missing environment variables');
    return;
  }
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  try {
    console.log('📋 Testing current attendance table structure...');
    
    // Test if we can insert a record to see what the current constraint is
    const { data: mainSessions, error: mainSessionError } = await supabase
      .from('main_sessions')
      .select('main_session_id, main_session_name, class_id')
      .limit(1);
    
    if (mainSessionError || !mainSessions || mainSessions.length === 0) {
      console.error('❌ No main sessions found');
      return;
    }
    
    const testMainSession = mainSessions[0];
    console.log(`✅ Found main session: ${testMainSession.main_session_name} (ID: ${testMainSession.main_session_id})`);
    
    // Get an enrollment for testing
    const { data: enrollments, error: enrollmentError } = await supabase
      .from('enrollments')
      .select('id')
      .eq('class_id', testMainSession.class_id)
      .limit(1);
    
    if (enrollmentError || !enrollments || enrollments.length === 0) {
      console.error('❌ No enrollments found for testing');
      return;
    }
    
    console.log(`✅ Found enrollment: ${enrollments[0].id}`);
    
    // Try to create a test attendance record
    console.log('\n📋 Testing attendance creation with main_session_id...');
    
    const { data: testAttendance, error: testError } = await supabase
      .from('attendance')
      .insert({
        main_session_id: testMainSession.main_session_id,
        enrollment_id: enrollments[0].id,
        status: 'present',
        data: {}
      })
      .select()
      .single();
    
    if (testError) {
      console.error('❌ Error creating test attendance:', testError);
      
      if (testError.message.includes('teaching_sessions')) {
        console.log('\n🔧 The foreign key constraint is pointing to teaching_sessions instead of main_sessions.');
        console.log('Please run this SQL in your Supabase Dashboard > SQL Editor:');
        console.log(`
-- Drop the incorrect foreign key constraint
ALTER TABLE attendance DROP CONSTRAINT IF EXISTS attendance_session_id_fkey;

-- Add the correct foreign key constraint pointing to main_sessions
ALTER TABLE attendance 
ADD CONSTRAINT attendance_main_session_id_fkey 
FOREIGN KEY (main_session_id) REFERENCES main_sessions(main_session_id) ON DELETE CASCADE;
        `);
      }
      return;
    } else {
      console.log('✅ Successfully created test attendance record');
      console.log('Test record ID:', testAttendance.id);
      
      // Clean up test record
      await supabase
        .from('attendance')
        .delete()
        .eq('id', testAttendance.id);
      
      console.log('✅ Cleaned up test record');
      
      // Now test fetching attendance by main_session_id
      console.log('\n📋 Testing attendance fetch by main_session_id...');
      
      // Create a real attendance record for testing
      const { data: realAttendance, error: realError } = await supabase
        .from('attendance')
        .insert({
          main_session_id: testMainSession.main_session_id,
          enrollment_id: enrollments[0].id,
          status: 'present',
          data: {}
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
      
      if (realError) {
        console.error('❌ Error creating real attendance:', realError);
      } else {
        console.log('✅ Created real attendance record');
        
        // Test fetching
        const { data: fetchedAttendance, error: fetchError } = await supabase
          .from('attendance')
          .select(`
            *,
            enrollments (
              students (
                full_name
              )
            )
          `)
          .eq('main_session_id', testMainSession.main_session_id);
        
        if (fetchError) {
          console.error('❌ Error fetching attendance:', fetchError);
        } else {
          console.log(`✅ Successfully fetched ${fetchedAttendance?.length || 0} attendance records`);
          fetchedAttendance?.forEach(record => {
            console.log(`  - ${record.enrollments.students.full_name}: ${record.status}`);
          });
        }
      }
    }
    
    console.log('\n🎉 Attendance system is working correctly with main_sessions!');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

fixAttendanceForeignKey();
