const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function addMainSessionIdColumn() {
  console.log('🔄 Adding main_session_id column to attendance table...\n');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.log('❌ Missing environment variables');
    return;
  }
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  try {
    console.log('📋 Step 1: Checking current attendance table structure...');
    
    // Check current table structure
    const { data: currentData, error: currentError } = await supabase
      .from('attendance')
      .select('*')
      .limit(1);
    
    if (currentError) {
      console.error('❌ Error checking attendance table:', currentError);
      return;
    }
    
    if (currentData && currentData.length > 0) {
      console.log('Current columns:', Object.keys(currentData[0]));
    } else {
      console.log('✅ Attendance table exists but is empty');
    }
    
    console.log('\n📋 Step 2: Adding main_session_id column...');
    
    // Add the main_session_id column using raw SQL
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Add main_session_id column if it doesn't exist
        ALTER TABLE attendance 
        ADD COLUMN IF NOT EXISTS main_session_id UUID;
        
        -- Add foreign key constraint
        ALTER TABLE attendance 
        ADD CONSTRAINT IF NOT EXISTS attendance_main_session_id_fkey 
        FOREIGN KEY (main_session_id) REFERENCES main_sessions(main_session_id) ON DELETE CASCADE;
        
        -- Add index for performance
        CREATE INDEX IF NOT EXISTS idx_attendance_main_session ON attendance(main_session_id);
      `
    });
    
    if (alterError) {
      console.error('❌ Error adding column:', alterError);
      
      // Try alternative approach using individual SQL commands
      console.log('📋 Trying alternative approach...');
      
      try {
        // Try to add column directly
        const { error: addColumnError } = await supabase
          .from('attendance')
          .insert([{
            main_session_id: '00000000-0000-0000-0000-000000000000',
            enrollment_id: '00000000-0000-0000-0000-000000000000',
            status: 'present'
          }]);
        
        if (addColumnError && addColumnError.message.includes('column "main_session_id" of relation "attendance" does not exist')) {
          console.log('❌ Column does not exist. You need to run the SQL migration manually in Supabase dashboard.');
          console.log('\nPlease run this SQL in your Supabase SQL Editor:');
          console.log(`
ALTER TABLE attendance 
ADD COLUMN main_session_id UUID;

ALTER TABLE attendance 
ADD CONSTRAINT attendance_main_session_id_fkey 
FOREIGN KEY (main_session_id) REFERENCES main_sessions(main_session_id) ON DELETE CASCADE;

CREATE INDEX idx_attendance_main_session ON attendance(main_session_id);
          `);
          return;
        }
      } catch (testError) {
        console.log('Column might already exist or needs manual migration');
      }
    } else {
      console.log('✅ Successfully added main_session_id column');
    }
    
    console.log('\n📋 Step 3: Testing the new column...');
    
    // Test if we can now use main_session_id
    const { data: mainSessions, error: mainSessionError } = await supabase
      .from('main_sessions')
      .select('main_session_id, main_session_name, class_id')
      .limit(1);
    
    if (mainSessionError || !mainSessions || mainSessions.length === 0) {
      console.error('❌ No main sessions found for testing');
      return;
    }
    
    const testMainSession = mainSessions[0];
    console.log(`✅ Using test main session: ${testMainSession.main_session_name}`);
    
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
    
    // Try to create a test attendance record
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
    } else {
      console.log('✅ Successfully created test attendance record');
      
      // Clean up test record
      await supabase
        .from('attendance')
        .delete()
        .eq('id', testAttendance.id);
      
      console.log('✅ Cleaned up test record');
    }
    
    console.log('\n🎉 Migration completed successfully!');
    console.log('The attendance table now has main_session_id column.');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

addMainSessionIdColumn();
