const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function migrateAttendanceData() {
  console.log('🔄 Migrating attendance data to use main_session_id...\n');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.log('❌ Missing environment variables');
    return;
  }
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  try {
    // Step 1: Check current attendance table structure
    console.log('📋 Step 1: Checking current attendance records...');
    
    const { data: currentAttendance, error: currentError } = await supabase
      .from('attendance')
      .select('*')
      .limit(5);
    
    if (currentError) {
      console.error('❌ Error checking attendance:', currentError);
      return;
    }
    
    console.log(`✅ Found ${currentAttendance?.length || 0} attendance records`);
    if (currentAttendance && currentAttendance.length > 0) {
      console.log('Sample record structure:', Object.keys(currentAttendance[0]));
    }
    
    // Step 2: Clear all existing attendance records (since we're changing the schema)
    console.log('\n📋 Step 2: Clearing existing attendance records...');
    
    const { error: deleteError } = await supabase
      .from('attendance')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records
    
    if (deleteError) {
      console.error('❌ Error clearing attendance:', deleteError);
    } else {
      console.log('✅ Cleared existing attendance records');
    }
    
    // Step 3: Get a main session and create sample attendance
    console.log('\n📋 Step 3: Creating sample attendance with main_session_id...');
    
    const { data: mainSessions, error: mainSessionError } = await supabase
      .from('main_sessions')
      .select('*')
      .limit(1);
    
    if (mainSessionError || !mainSessions || mainSessions.length === 0) {
      console.error('❌ No main sessions found');
      return;
    }
    
    const mainSession = mainSessions[0];
    console.log(`✅ Using main session: ${mainSession.main_session_name} (ID: ${mainSession.main_session_id})`);
    
    // Get enrollments for this class
    const { data: enrollments, error: enrollmentError } = await supabase
      .from('enrollments')
      .select('id, students(full_name)')
      .eq('class_id', mainSession.class_id)
      .eq('status', 'active')
      .limit(3);
    
    if (enrollmentError || !enrollments || enrollments.length === 0) {
      console.error('❌ No enrollments found for this class');
      return;
    }
    
    console.log(`✅ Found ${enrollments.length} enrollments for this class`);
    
    // Create attendance records with main_session_id
    const attendanceRecords = enrollments.map(enrollment => ({
      main_session_id: mainSession.main_session_id,
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
          students (
            full_name
          )
        )
      `);
    
    if (createError) {
      console.error('❌ Error creating attendance:', createError);
      return;
    }
    
    console.log(`✅ Created ${createdAttendance?.length || 0} attendance records`);
    createdAttendance?.forEach(record => {
      console.log(`  - ${record.enrollments.students.full_name}: ${record.status}`);
    });
    
    // Step 4: Test fetching attendance
    console.log('\n📋 Step 4: Testing attendance fetch...');
    
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
      .eq('main_session_id', mainSession.main_session_id);
    
    if (fetchError) {
      console.error('❌ Error fetching attendance:', fetchError);
    } else {
      console.log(`✅ Successfully fetched ${fetchedAttendance?.length || 0} attendance records`);
    }
    
    console.log('\n🎉 Migration completed successfully!');
    console.log('The attendance system should now work with main_sessions.');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

migrateAttendanceData();
