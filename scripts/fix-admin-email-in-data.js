const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixAdminEmail() {
  console.log('🔧 Adding email to Admin User data field...\n');

  try {
    // 1. Find the Admin User
    console.log('1. Looking for Admin User...');
    const { data: adminUsers, error: findError } = await supabase
      .from('employees')
      .select('*')
      .ilike('full_name', '%admin%');

    if (findError) {
      console.error('❌ Error finding admin user:', findError);
      return;
    }

    if (!adminUsers || adminUsers.length === 0) {
      console.log('❌ No admin user found');
      return;
    }

    console.log(`✅ Found ${adminUsers.length} admin user(s)`);
    
    // Find the one with work schedules (most likely the correct admin)
    const adminWithSchedules = adminUsers.find(user => 
      user.data && user.data.work_schedules && user.data.work_schedules.length > 0
    );
    
    const targetAdmin = adminWithSchedules || adminUsers[0];
    console.log(`   Using admin: ${targetAdmin.full_name} (ID: ${targetAdmin.id})`);
    console.log(`   Current data:`, JSON.stringify(targetAdmin.data, null, 2));

    // 2. Update the admin user's data to include email
    console.log('\n2. Adding email to admin user data...');
    
    const updatedData = {
      ...targetAdmin.data,
      email: 'admin@merakierp.com'
    };

    const { data: updatedAdmin, error: updateError } = await supabase
      .from('employees')
      .update({ data: updatedData })
      .eq('id', targetAdmin.id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Error updating admin user:', updateError);
      return;
    }

    console.log('✅ Successfully added email to admin user data!');
    console.log('   Updated data:', JSON.stringify(updatedAdmin.data, null, 2));

    // 3. Test the API endpoint
    console.log('\n3. Testing the updated API endpoint...');
    try {
      const response = await fetch(`http://localhost:3000/api/employees?email=admin@merakierp.com`);
      const result = await response.json();
      
      if (result.success && result.data && result.data.length > 0) {
        console.log('✅ API endpoint now works!');
        console.log(`   Found ${result.data.length} employee(s) with email admin@merakierp.com`);
        console.log('   Employee:', {
          id: result.data[0].id,
          full_name: result.data[0].full_name,
          has_work_schedules: result.data[0].data?.work_schedules?.length || 0
        });
      } else {
        console.log('⚠️  API endpoint still not working:', result.message);
      }
    } catch (fetchError) {
      console.log('⚠️  Could not test API endpoint (server might not be running)');
      console.log('   Error:', fetchError.message);
    }

    console.log('\n🎉 Admin email fix complete!');
    console.log('\n📋 Summary:');
    console.log('   - Added email "admin@merakierp.com" to admin user data field');
    console.log('   - PersonalTab should now be able to find the admin user');
    console.log('   - Work schedules should now display in the Personal tab');

  } catch (error) {
    console.error('❌ Script failed:', error);
  }
}

fixAdminEmail();
