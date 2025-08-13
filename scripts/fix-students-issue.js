const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function fixStudentsIssue() {
  console.log('🔧 Fixing Students Loading Issue...\n');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.log('❌ Missing environment variables');
    return;
  }
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  try {
    // First, test basic connection to students table
    console.log('🔍 Testing students table access...');
    const { data: testData, error: testError } = await supabase
      .from('students')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.log('❌ Cannot access students table:', testError.message);
      
      if (testError.message.includes('relation "students" does not exist')) {
        console.log('💡 Students table does not exist. Creating it...');
        // The table should be created by the schema, but let's check if we need to run it
        return;
      }
      
      if (testError.message.includes('permission denied') || testError.code === 'PGRST301') {
        console.log('💡 This is likely an RLS (Row Level Security) issue');
        console.log('🔧 Attempting to create sample students with proper permissions...');
      }
    } else {
      console.log('✅ Students table is accessible');
    }
    
    // Check current students count
    const { data: existingStudents, error: countError } = await supabase
      .from('students')
      .select('*');
    
    if (countError) {
      console.log('❌ Error fetching students:', countError.message);
    } else {
      console.log(`📊 Current students count: ${existingStudents?.length || 0}`);
      
      if (existingStudents && existingStudents.length > 0) {
        console.log('✅ Students exist in database:');
        existingStudents.slice(0, 3).forEach(student => {
          console.log(`  - ${student.full_name} (${student.email})`);
        });
        console.log('\n💡 Students exist but may not be loading in the UI due to authentication/RLS issues');
        return;
      }
    }
    
    // If no students exist, create sample ones
    console.log('🔄 Creating sample students...');
    
    const sampleStudents = [
      {
        full_name: 'Nguyễn Văn An',
        email: 'nguyen.van.an@example.com',
        phone: '0901234567',
        status: 'active',
        data: {
          parent: {
            name: 'Nguyễn Thị Bình',
            phone: '0901234568'
          },
          current_english_level: 'Beginner',
          expected_campus: 'Cơ sở 1',
          program: 'GrapeSEED'
        }
      },
      {
        full_name: 'Trần Thị Bảo',
        email: 'tran.thi.bao@example.com',
        phone: '0902345678',
        status: 'active',
        data: {
          parent: {
            name: 'Trần Văn Cường',
            phone: '0902345679'
          },
          current_english_level: 'Intermediate',
          expected_campus: 'Cơ sở 2',
          program: 'Pre-WSC'
        }
      },
      {
        full_name: 'Lê Minh Đức',
        email: 'le.minh.duc@example.com',
        phone: '0903456789',
        status: 'active',
        data: {
          parent: {
            name: 'Lê Thị Hoa',
            phone: '0903456780'
          },
          current_english_level: 'Advanced',
          expected_campus: 'Cơ sở 1',
          program: 'WSC'
        }
      }
    ];
    
    const { data: newStudents, error: insertError } = await supabase
      .from('students')
      .insert(sampleStudents)
      .select();
    
    if (insertError) {
      console.log('❌ Error creating students:', insertError.message);
      console.log('Error details:', insertError);
      
      if (insertError.code === 'PGRST301') {
        console.log('\n💡 RLS Policy Issue Detected!');
        console.log('🔧 Possible solutions:');
        console.log('   1. Check if RLS policies allow INSERT for your user role');
        console.log('   2. Ensure you are authenticated as admin/teacher');
        console.log('   3. Run: node scripts/apply-rls-policies.js');
        console.log('   4. Check database/rls-policies.sql for proper policies');
      }
    } else {
      console.log(`✅ Created ${newStudents?.length || 0} sample students`);
      newStudents?.forEach(student => {
        console.log(`  - ${student.full_name}`);
      });
    }
    
    // Final test - try to fetch all students
    console.log('\n🔍 Final test - fetching all students...');
    const { data: finalStudents, error: finalError } = await supabase
      .from('students')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (finalError) {
      console.log('❌ Final fetch failed:', finalError.message);
    } else {
      console.log(`✅ Final fetch successful: ${finalStudents?.length || 0} students found`);
    }
    
  } catch (error) {
    console.log('❌ Unexpected error:', error.message);
  }
}

fixStudentsIssue().catch(console.error);
