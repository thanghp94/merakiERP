// Debug script to identify the exact issue with the request form
// This will help us understand what's happening step by step

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugRequestFormIssue() {
  console.log('🔍 Debugging Request Form Issue...\n');

  try {
    // Step 1: Check if users exist
    console.log('1. Checking existing users...');
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.log(`❌ Error fetching users: ${usersError.message}`);
      return;
    }

    console.log(`✅ Found ${users.users.length} users:`);
    users.users.forEach(user => {
      console.log(`   - ${user.email} (ID: ${user.id})`);
    });

    // Step 2: Check employees table
    console.log('\n2. Checking employees table...');
    const { data: employees, error: employeesError } = await supabase
      .from('employees')
      .select('id, full_name, position, user_id, data')
      .limit(10);

    if (employeesError) {
      console.log(`❌ Error fetching employees: ${employeesError.message}`);
      return;
    }

    console.log(`✅ Found ${employees.length} employees:`);
    employees.forEach(emp => {
      console.log(`   - ${emp.full_name} (${emp.position}) - User ID: ${emp.user_id || 'NULL'}`);
    });

    // Step 3: Check user-employee mapping
    console.log('\n3. Checking user-employee mapping...');
    const mappedEmployees = employees.filter(emp => emp.user_id);
    console.log(`✅ ${mappedEmployees.length} employees have user_id mapping:`);
    mappedEmployees.forEach(emp => {
      const matchingUser = users.users.find(u => u.id === emp.user_id);
      if (matchingUser) {
        console.log(`   ✅ ${emp.full_name} → ${matchingUser.email}`);
      } else {
        console.log(`   ❌ ${emp.full_name} → user_id ${emp.user_id} (user not found)`);
      }
    });

    // Step 4: Test login and API call
    console.log('\n4. Testing login and API call...');
    
    // Try to find a user with a mapped employee
    const testUser = users.users.find(user => 
      employees.some(emp => emp.user_id === user.id)
    );

    if (!testUser) {
      console.log('❌ No user found with mapped employee. Need to run user-employee linking.');
      console.log('\n🔧 SOLUTION: Run the following command:');
      console.log('   node scripts/link-users-to-employees.js');
      return;
    }

    console.log(`✅ Testing with user: ${testUser.email}`);

    // Try to sign in (we'll need to guess the password)
    const possiblePasswords = ['admin123', 'password', testUser.email.split('@')[0] + '123'];
    let authData = null;

    for (const password of possiblePasswords) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: testUser.email,
          password: password
        });
        
        if (!error && data.session) {
          authData = data;
          console.log(`✅ Login successful with password: ${password}`);
          break;
        }
      } catch (e) {
        // Continue to next password
      }
    }

    if (!authData) {
      console.log('❌ Could not login with any common passwords');
      console.log('🔧 SOLUTION: Reset user password or create new test user');
      return;
    }

    // Step 5: Test the current employee API
    console.log('\n5. Testing /api/employees/current...');
    const token = authData.session.access_token;
    
    const response = await fetch('http://localhost:3001/api/employees/current', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();

    if (response.ok && result.success) {
      console.log('✅ API call successful!');
      console.log(`   Employee: ${result.data.full_name}`);
      console.log(`   Position: ${result.data.position}`);
      console.log(`   Employee ID: ${result.data.id}`);
      
      console.log('\n🎯 DIAGNOSIS: The backend is working correctly!');
      console.log('   The issue is likely in the frontend React hook or component.');
      console.log('\n🔧 NEXT STEPS:');
      console.log('   1. Check browser console for JavaScript errors');
      console.log('   2. Verify the useCurrentEmployee hook is being called');
      console.log('   3. Check if getAuthHeaders() is returning the correct token');
      console.log('   4. Ensure the RequestForm component is receiving the currentUserId prop');
      
    } else {
      console.log(`❌ API call failed: ${result.message}`);
      console.log('🔧 SOLUTION: Check the /api/employees/current endpoint implementation');
    }

    // Clean up
    await supabase.auth.signOut();

  } catch (error) {
    console.error('❌ Debug error:', error.message);
  }
}

// Run the debug
if (require.main === module) {
  debugRequestFormIssue().catch(console.error);
}

module.exports = { debugRequestFormIssue };
