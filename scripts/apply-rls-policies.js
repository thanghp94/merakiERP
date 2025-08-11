const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

// Use service role key for admin operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1bmtnamFyd3Fxa3Bib2huZXFuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDc1MDIwOSwiZXhwIjoyMDcwMzI2MjA5fQ.G-lQ5F__laAz3Q9e5GRi_6DluA2kAjDCOX8hqBNOwXI';

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY is required for RLS setup');
  console.log('📝 Please add SUPABASE_SERVICE_ROLE_KEY to your .env.local file');
  console.log('   You can find this key in Supabase Dashboard > Settings > API');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyRLSPolicies() {
  console.log('🔒 Applying Row Level Security Policies...\n');

  try {
    // Read the RLS policies SQL file
    const sqlPath = path.join(__dirname, '../database/rls-policies.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    console.log('📄 Reading RLS policies from:', sqlPath);
    console.log('📊 SQL content length:', sqlContent.length, 'characters\n');

    // Split SQL into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log('🔧 Found', statements.length, 'SQL statements to execute\n');

    let successCount = 0;
    let errorCount = 0;

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      if (statement.length < 10) continue; // Skip very short statements
      
      console.log(`${i + 1}/${statements.length}: Executing...`);
      console.log(`   ${statement.substring(0, 80)}${statement.length > 80 ? '...' : ''}`);

      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        
        if (error) {
          // Try direct execution if RPC fails
          const { error: directError } = await supabase
            .from('_temp_table_that_does_not_exist')
            .select('*');
          
          // Since we can't execute raw SQL directly, we'll use a different approach
          console.log('⚠️  Cannot execute SQL directly via client. Please run manually in Supabase SQL Editor.');
          break;
        } else {
          console.log('   ✅ Success');
          successCount++;
        }
      } catch (err) {
        console.log('   ❌ Error:', err.message);
        errorCount++;
      }
    }

    console.log('\n📊 Summary:');
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);

    if (errorCount === 0) {
      console.log('\n🎉 All RLS policies applied successfully!');
    } else {
      console.log('\n⚠️  Some policies failed. Please check the errors above.');
    }

    console.log('\n📋 Manual Setup Instructions:');
    console.log('   1. Go to Supabase Dashboard > SQL Editor');
    console.log('   2. Copy and paste the content from database/rls-policies.sql');
    console.log('   3. Execute the SQL to apply all RLS policies');
    console.log('   4. Verify policies are active in Authentication > Policies');

  } catch (error) {
    console.error('❌ Failed to apply RLS policies:', error);
  }
}

// Alternative: Test RLS setup
async function testRLSSetup() {
  console.log('🧪 Testing RLS Setup...\n');

  try {
    // Test 1: Check if RLS is enabled on tables
    const tables = ['students', 'employees', 'classes', 'sessions', 'attendance'];
    
    for (const table of tables) {
      console.log(`Checking RLS status for ${table}...`);
      
      // Try to query the table (this will fail if RLS is properly enabled and no policies match)
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);

      if (error) {
        if (error.message.includes('row-level security')) {
          console.log(`   ✅ RLS is enabled on ${table}`);
        } else {
          console.log(`   ❓ Unexpected error on ${table}:`, error.message);
        }
      } else {
        console.log(`   ⚠️  RLS may not be properly configured on ${table} (query succeeded)`);
      }
    }

    console.log('\n🎯 RLS Test completed!');
    console.log('   Note: Some queries may succeed if you have admin privileges');

  } catch (error) {
    console.error('❌ RLS test failed:', error);
  }
}

// Run the appropriate function based on command line argument
const command = process.argv[2];

if (command === 'test') {
  testRLSSetup();
} else {
  applyRLSPolicies();
}
