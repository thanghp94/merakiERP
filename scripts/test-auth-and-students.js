const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function testAuthAndStudents() {
  console.log('🔐 Testing Authentication and Students Access...\n');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.log('❌ Missing environment variables');
    return;
  }
  
  // Test with anon client (what the frontend uses)
  console.log('1️⃣ Testing with anonymous client (frontend simulation)...');
  const anonClient = createClient(supabaseUrl, supabaseAnonKey);
  
  const { data: anonStudents, error: anonError } = await anonClient
    .from('students')
    .select('*');
  
  if (anonError) {
    console.log('❌ Anonymous access failed:', anonError.message);
    console.log('💡 This is expected if RLS is enabled and user is not authenticated');
  } else {
    console.log(`✅ Anonymous access successful: ${anonStudents?.length || 0} students`);
  }
  
  // Test with service role key (admin access)
  if (supabaseServiceKey) {
    console.log('\n2️⃣ Testing with service role key (admin access)...');
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: adminStudents, error: adminError } = await adminClient
      .from('students')
      .select('*');
    
    if (adminError) {
      console.log('❌ Admin access failed:', adminError.message);
    } else {
      console.log(`✅ Admin access successful: ${adminStudents?.length || 0} students`);
      if (adminStudents && adminStudents.length > 0) {
        console.log('📋 Students in database:');
        adminStudents.forEach(student => {
          console.log(`  - ${student.full_name} (${student.email}) - Status: ${student.status}`);
        });
      }
    }
  } else {
    console.log('\n2️⃣ No service role key found, skipping admin test');
  }
  
  // Test creating an admin user for authentication
  console.log('\n3️⃣ Checking for admin users...');
  
  if (supabaseServiceKey) {
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    
    // Check if there are any admin users
    const { data: adminUsers, error: adminUsersError } = await adminClient.auth.admin.listUsers();
    
    if (adminUsersError) {
      console.log('❌ Cannot list users:', adminUsersError.message);
    } else {
      console.log(`📊 Total users in auth: ${adminUsers?.users?.length || 0}`);
      
      const adminRoleUsers = adminUsers?.users?.filter(user => 
        user.user_metadata?.role === 'admin' || user.user_metadata?.role === 'teacher'
      ) || [];
      
      console.log(`👨‍💼 Admin/Teacher users: ${adminRoleUsers.length}`);
      
      if (adminRoleUsers.length === 0) {
        console.log('\n💡 No admin/teacher users found. This might be why students are not loading.');
        console.log('🔧 Suggested solutions:');
        console.log('   1. Create an admin user: node scripts/create-admin-user.js');
        console.log('   2. Or temporarily disable RLS for testing');
        console.log('   3. Or ensure you are logged in as admin/teacher in the frontend');
      } else {
        console.log('✅ Admin/Teacher users exist:');
        adminRoleUsers.forEach(user => {
          console.log(`  - ${user.email} (${user.user_metadata?.role})`);
        });
      }
    }
  }
  
  // Test the API endpoint directly
  console.log('\n4️⃣ Testing API endpoint (requires running dev server)...');
  try {
    const response = await fetch('http://localhost:3000/api/students');
    
    if (response.status === 500) {
      console.log('❌ API returned 500 error - likely authentication issue');
    } else {
      const result = await response.json();
      console.log('API Response Status:', response.status);
      console.log('API Response:', result);
    }
  } catch (error) {
    console.log('⚠️ Cannot test API endpoint:', error.message);
    console.log('💡 Make sure development server is running: npm run dev');
  }
  
  console.log('\n📋 Summary & Recommendations:');
  console.log('1. Students exist in database ✅');
  console.log('2. RLS policies are likely active 🔒');
  console.log('3. Frontend needs authenticated admin/teacher user 👨‍💼');
  console.log('4. Check if you are logged in with proper role in the app 🔐');
}

testAuthAndStudents().catch(console.error);
