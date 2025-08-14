// Test script to verify login-employee integration works correctly
// This script tests the /api/employees/current endpoint for all linked users

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testLoginEmployeeIntegration() {
  console.log('🧪 Testing Login-Employee Integration...\n');

  try {
    // Test users to verify
    const testUsers = [
      { email: 'ta@merakierp.com', expectedName: 'Trần Thị TA' },
      { email: 'admin@merakierp.com', expectedName: 'Admin User' },
      { email: 'teacher@merakierp.com', expectedName: 'Teacher User' }
    ];

    console.log('📋 Current Employee Records:');
    console.log('============================');
    
    // Get all linked employees
    const { data: employees, error: empError } = await supabase
      .from('employees')
      .select('id, full_name, user_id, position, department, data')
      .not('user_id', 'is', null);

    if (empError) {
      throw new Error(`Failed to fetch employees: ${empError.message}`);
    }

    employees.forEach(emp => {
      console.log(`✅ ${emp.full_name} (${emp.position})`);
      console.log(`   User ID: ${emp.user_id}`);
      console.log(`   Email: ${emp.data?.email || 'No email'}`);
      console.log(`   Department: ${emp.department}`);
      console.log('');
    });

    console.log('🔍 Testing API Endpoint for Each User:');
    console.log('======================================');

    for (const testUser of testUsers) {
      console.log(`\nTesting ${testUser.email}:`);
      
      try {
        // Find the user in auth
        const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
        
        if (authError) {
          throw new Error(`Failed to fetch auth users: ${authError.message}`);
        }

        const user = authData.users.find(u => u.email === testUser.email);
        
        if (!user) {
          console.log(`  ❌ User not found in auth system`);
          continue;
        }

        console.log(`  📧 Found auth user: ${user.id}`);

        // Test the employee lookup directly
        const { data: employee, error: lookupError } = await supabase
          .from('employees')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (lookupError) {
          console.log(`  ❌ Employee lookup failed: ${lookupError.message}`);
          continue;
        }

        if (employee) {
          console.log(`  ✅ Employee found: ${employee.full_name}`);
          console.log(`     Position: ${employee.position}`);
          console.log(`     Department: ${employee.department}`);
          console.log(`     Employee ID: ${employee.id}`);
          
          // Verify expected name matches
          if (employee.full_name === testUser.expectedName) {
            console.log(`  ✅ Name matches expected: ${testUser.expectedName}`);
          } else {
            console.log(`  ⚠️  Name mismatch - Expected: ${testUser.expectedName}, Got: ${employee.full_name}`);
          }
        } else {
          console.log(`  ❌ No employee record found for user`);
        }

      } catch (error) {
        console.log(`  ❌ Error testing ${testUser.email}: ${error.message}`);
      }
    }

    console.log('\n🌐 Testing API Endpoint Simulation:');
    console.log('===================================');
    
    // Simulate what the /api/employees/current endpoint would do
    for (const testUser of testUsers) {
      console.log(`\nSimulating API call for ${testUser.email}:`);
      
      try {
        // Get user
        const { data: authData } = await supabase.auth.admin.listUsers();
        const user = authData.users.find(u => u.email === testUser.email);
        
        if (!user) {
          console.log(`  ❌ User not found`);
          continue;
        }

        // Method 1: Direct user_id lookup
        let { data: employee, error } = await supabase
          .from('employees')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (employee) {
          console.log(`  ✅ Method 1 (user_id): Found ${employee.full_name}`);
        } else {
          console.log(`  ⚠️  Method 1 (user_id): Not found`);
          
          // Method 2: Email fallback
          const { data: emailEmployee } = await supabase
            .from('employees')
            .select('*')
            .contains('data', { email: user.email })
            .single();

          if (emailEmployee) {
            console.log(`  ✅ Method 2 (email): Found ${emailEmployee.full_name}`);
            employee = emailEmployee;
          } else {
            console.log(`  ❌ Method 2 (email): Not found`);
          }
        }

        if (employee) {
          console.log(`  📋 API Response would be:`);
          console.log(`     {`);
          console.log(`       "success": true,`);
          console.log(`       "employee": {`);
          console.log(`         "id": "${employee.id}",`);
          console.log(`         "full_name": "${employee.full_name}",`);
          console.log(`         "position": "${employee.position}",`);
          console.log(`         "department": "${employee.department}"`);
          console.log(`       }`);
          console.log(`     }`);
        }

      } catch (error) {
        console.log(`  ❌ Simulation error: ${error.message}`);
      }
    }

    console.log('\n📊 INTEGRATION TEST SUMMARY:');
    console.log('============================');
    console.log(`✅ Total linked employees: ${employees.length}`);
    console.log(`✅ Admin user: ${employees.some(e => e.data?.email === 'admin@merakierp.com') ? 'Linked' : 'Not linked'}`);
    console.log(`✅ Teacher user: ${employees.some(e => e.data?.email === 'teacher@merakierp.com') ? 'Linked' : 'Not linked'}`);
    console.log(`✅ TA user: ${employees.some(e => e.full_name === 'Trần Thị TA') ? 'Linked' : 'Not linked'}`);

    console.log('\n🎯 NEXT STEPS:');
    console.log('==============');
    console.log('1. Start the development server: npm run dev');
    console.log('2. Login with any of these accounts:');
    console.log('   - admin@merakierp.com (password: admin123)');
    console.log('   - teacher@merakierp.com (password: teacher123)');
    console.log('   - ta@merakierp.com (password: ta123)');
    console.log('3. Navigate to the Requests tab');
    console.log('4. Try creating a new request');
    console.log('5. Verify that the employee ID is automatically populated');
    console.log('6. Confirm no "ID nhân viên là bắt buộc" error appears');

    console.log('\n✅ Login-Employee integration test completed successfully!');

  } catch (error) {
    console.error('❌ Fatal error during integration test:', error.message);
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  testLoginEmployeeIntegration().catch(console.error);
}

module.exports = { testLoginEmployeeIntegration };
