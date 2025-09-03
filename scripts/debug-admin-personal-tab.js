const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugAdminPersonalTab() {
  console.log('🔍 Debugging Admin Personal Tab Issue...\n');

  try {
    // 1. Check what columns exist in employees table
    console.log('1. Checking employees table structure...');
    const { data: employees, error: employeeError } = await supabase
      .from('employees')
      .select('*')
      .limit(1);

    if (employeeError) {
      console.error('❌ Error fetching employees:', employeeError);
      return;
    }

    if (employees && employees.length > 0) {
      console.log('✅ Employees table columns:', Object.keys(employees[0]));
    }

    // 2. Look for admin user specifically
    console.log('\n2. Looking for admin user by email...');
    
    // Check if email column exists
    if (employees && employees.length > 0 && 'email' in employees[0]) {
      const { data: adminByEmail, error: emailError } = await supabase
        .from('employees')
        .select('*')
        .eq('email', 'admin@merakierp.com');

      if (emailError) {
        console.error('❌ Error searching by email:', emailError);
      } else {
        console.log(`   Found ${adminByEmail.length} employees with email 'admin@merakierp.com'`);
        if (adminByEmail.length > 0) {
          console.log('   Admin employee data:', JSON.stringify(adminByEmail[0], null, 2));
        }
      }
    } else {
      console.log('   ⚠️  Email column does not exist in employees table');
    }

    // 3. Look for admin user by name or other fields
    console.log('\n3. Looking for admin user by name...');
    const { data: adminByName, error: nameError } = await supabase
      .from('employees')
      .select('*')
      .ilike('full_name', '%admin%');

    if (nameError) {
      console.error('❌ Error searching by name:', nameError);
    } else {
      console.log(`   Found ${adminByName.length} employees with 'admin' in name`);
      adminByName.forEach((emp, index) => {
        console.log(`   Employee ${index + 1}:`, {
          id: emp.id,
          full_name: emp.full_name,
          email: emp.email || 'No email field',
          has_work_schedules: emp.data && emp.data.work_schedules ? emp.data.work_schedules.length : 0
        });
      });
    }

    // 4. Check all employees to see the data structure
    console.log('\n4. Checking all employees (first 5)...');
    const { data: allEmployees, error: allError } = await supabase
      .from('employees')
      .select('*')
      .limit(5);

    if (allError) {
      console.error('❌ Error fetching all employees:', allError);
    } else {
      console.log(`   Total employees found: ${allEmployees.length}`);
      allEmployees.forEach((emp, index) => {
        console.log(`   Employee ${index + 1}:`, {
          id: emp.id,
          full_name: emp.full_name,
          email: emp.email || 'No email field',
          has_data: !!emp.data,
          has_work_schedules: emp.data && emp.data.work_schedules ? emp.data.work_schedules.length : 0
        });
      });
    }

    // 5. Test the API endpoint that PersonalTab uses
    console.log('\n5. Testing /api/employees endpoint...');
    try {
      const response = await fetch(`http://localhost:3000/api/employees?email=admin@merakierp.com`);
      const result = await response.json();
      console.log('   API Response:', JSON.stringify(result, null, 2));
    } catch (fetchError) {
      console.log('   ⚠️  Could not test API endpoint (server might not be running)');
      console.log('   Error:', fetchError.message);
    }

  } catch (error) {
    console.error('❌ Script failed:', error);
  }
}

debugAdminPersonalTab();
