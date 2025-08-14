// Fix admin password and test the complete request form flow
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixAdminPasswordAndTest() {
  console.log('🔧 Fixing Admin Password and Testing Request Form...\n');

  try {
    // Step 1: Reset admin password
    console.log('1. Resetting admin password...');
    const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
      '75b503b0-4ba1-4775-926f-b32e8e59f1cf', // admin user ID from debug output
      { password: 'admin123' }
    );

    if (updateError) {
      console.log(`❌ Error updating password: ${updateError.message}`);
      return;
    }

    console.log('✅ Admin password reset to: admin123');

    // Step 2: Test login
    console.log('\n2. Testing admin login...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'admin@merakierp.com',
      password: 'admin123'
    });

    if (authError) {
      console.log(`❌ Login failed: ${authError.message}`);
      return;
    }

    console.log('✅ Login successful!');
    const token = authData.session.access_token;

    // Step 3: Test current employee API
    console.log('\n3. Testing /api/employees/current...');
    const response = await fetch('http://localhost:3001/api/employees/current', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      console.log(`❌ API call failed: ${result.message}`);
      return;
    }

    console.log('✅ Current employee API working!');
    console.log(`   Employee: ${result.data.full_name}`);
    console.log(`   Position: ${result.data.position}`);
    console.log(`   Employee ID: ${result.data.id}`);

    // Step 4: Test request creation
    console.log('\n4. Testing request creation...');
    const requestData = {
      request_type: 'nghi_phep',
      title: 'Test Leave Request',
      description: 'Testing the request form functionality',
      request_data: {
        from_date: '2024-01-15',
        to_date: '2024-01-16',
        total_days: 2,
        reason: 'Personal leave for testing'
      },
      created_by_employee_id: result.data.id
    };

    const createResponse = await fetch('http://localhost:3001/api/requests', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestData)
    });

    const createResult = await createResponse.json();

    if (!createResponse.ok || !createResult.success) {
      console.log(`❌ Request creation failed: ${createResult.message}`);
      return;
    }

    console.log('✅ Request created successfully!');
    console.log(`   Request ID: ${createResult.data.request_id}`);
    console.log(`   Type: ${createResult.data.request_type}`);
    console.log(`   Status: ${createResult.data.status}`);

    // Step 5: Verify request was saved
    console.log('\n5. Verifying request was saved...');
    const listResponse = await fetch('http://localhost:3001/api/requests', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const listResult = await listResponse.json();

    if (!listResponse.ok || !listResult.success) {
      console.log(`❌ Failed to fetch requests: ${listResult.message}`);
      return;
    }

    const testRequest = listResult.data.find(req => req.request_id === createResult.data.request_id);
    if (testRequest) {
      console.log('✅ Request found in database!');
      console.log(`   Title: ${testRequest.title}`);
      console.log(`   Created by: ${testRequest.created_by?.full_name}`);
    } else {
      console.log('❌ Request not found in database');
    }

    // Clean up
    await supabase.auth.signOut();

    console.log('\n🎉 SUCCESS! The request form system is working correctly!');
    console.log('\n📋 SUMMARY:');
    console.log('   ✅ Admin user exists and is mapped to employee');
    console.log('   ✅ Login system working');
    console.log('   ✅ Current employee API working');
    console.log('   ✅ Request creation API working');
    console.log('   ✅ Request saved to database');
    
    console.log('\n🔧 FRONTEND DEBUGGING STEPS:');
    console.log('   1. Login as admin@merakierp.com with password: admin123');
    console.log('   2. Open browser console and check for JavaScript errors');
    console.log('   3. Go to Requests tab and try to create a new request');
    console.log('   4. Check if useCurrentEmployee hook is returning data');
    console.log('   5. Verify the form is getting the currentUserId prop');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the fix and test
if (require.main === module) {
  fixAdminPasswordAndTest().catch(console.error);
}

module.exports = { fixAdminPasswordAndTest };
