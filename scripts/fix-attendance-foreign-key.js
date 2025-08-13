const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lunkgjarwqqkpbohneqn.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1bmtnamFyd3Fxa3Bib2huZXFuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDc1MDIwOSwiZXhwIjoyMDcwMzI2MjA5fQ.G-lQ5F__laAz3Q9e5GRi_6DluA2kAjDCOX8hqBNOwXI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixAttendanceForeignKey() {
  try {
    console.log('🔧 Fixing attendance foreign key relationship...\n');
    
    // Step 1: Check current foreign key constraints
    console.log('1. Checking current foreign key constraints...');
    const { data: constraints, error: constraintsError } = await supabase
      .rpc('sql', {
        query: `
          SELECT 
            tc.table_name, 
            kcu.column_name, 
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name 
          FROM 
            information_schema.table_constraints AS tc 
            JOIN information_schema.key_column_usage AS kcu
              ON tc.constraint_name = kcu.constraint_name
            JOIN information_schema.constraint_column_usage AS ccu
              ON ccu.constraint_name = tc.constraint_name
          WHERE tc.constraint_type = 'FOREIGN KEY' 
            AND tc.table_name = 'attendance';
        `
      });
    
    if (constraintsError) {
      console.error('Error checking constraints:', constraintsError);
    } else {
      console.log('Current foreign key constraints for attendance table:');
      console.log(constraints);
    }
    
    // Step 2: Check if the foreign key exists and recreate if needed
    console.log('\n2. Ensuring foreign key constraint exists...');
    
    const { data: recreateResult, error: recreateError } = await supabase
      .rpc('sql', {
        query: `
          -- Drop the constraint if it exists
          ALTER TABLE attendance DROP CONSTRAINT IF EXISTS attendance_main_session_id_fkey;
          
          -- Recreate the constraint
          ALTER TABLE attendance 
          ADD CONSTRAINT attendance_main_session_id_fkey 
          FOREIGN KEY (main_session_id) 
          REFERENCES main_sessions(main_session_id) 
          ON DELETE CASCADE;
        `
      });
    
    if (recreateError) {
      console.error('Error recreating foreign key:', recreateError);
    } else {
      console.log('✅ Foreign key constraint recreated successfully');
    }
    
    // Step 3: Refresh the schema cache (this might help Supabase recognize the relationship)
    console.log('\n3. Testing the relationship with a simple query...');
    
    const { data: testData, error: testError } = await supabase
      .from('attendance')
      .select(`
        id,
        main_session_id,
        main_sessions!inner (
          main_session_id,
          main_session_name
        )
      `)
      .limit(1);
    
    if (testError) {
      console.error('❌ Relationship test failed:', testError);
      
      // Try alternative approach - use explicit join
      console.log('\n4. Trying alternative approach with explicit join...');
      
      const { data: altData, error: altError } = await supabase
        .rpc('sql', {
          query: `
            SELECT 
              a.id,
              a.main_session_id,
              a.status,
              ms.main_session_name,
              ms.lesson_id,
              ms.scheduled_date
            FROM attendance a
            LEFT JOIN main_sessions ms ON a.main_session_id = ms.main_session_id
            LIMIT 5;
          `
        });
      
      if (altError) {
        console.error('❌ Alternative approach failed:', altError);
      } else {
        console.log('✅ Alternative approach works! Data:');
        console.log(altData);
      }
      
    } else {
      console.log('✅ Relationship test successful! Data:');
      console.log(testData);
    }
    
    console.log('\n🎉 Foreign key fix completed!');
    
  } catch (error) {
    console.error('❌ Fix failed:', error);
  }
}

fixAttendanceForeignKey();
