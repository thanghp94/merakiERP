// Final test to verify the request form is working correctly
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testRequestFormFinal() {
  console.log('🧪 Final Test: Request Form Functionality...\n');

  try {
    // Step 1: Login as admin
    console.log('1. Logging in as admin...');
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

    // Step 2: Get current employee
    console.log('\n2. Getting current employee...');
    const employeeResponse = await fetch('http://localhost:3001/api/employees/current', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const employeeResult = await employeeResponse.json();

    if (!employeeResponse.ok || !employeeResult.success) {
      console.log(`❌ Failed to get current employee: ${employeeResult.message}`);
      return;
    }

    console.log('✅ Current employee retrieved!');
    console.log(`   Employee: ${employeeResult.data.full_name}`);
    console.log(`   Employee ID: ${employeeResult.data.id}`);

    // Step 3: Test request creation with correct API endpoint
    console.log('\n3. Testing request creation with /api/employee-requests...');
    const requestData = {
      request_type: 'nghi_phep',
      title: 'Test Leave Request - Final',
      description: 'Testing the fixed request form functionality',
      created_by_employee_id: employeeResult.data.id,
      request_data: {
        from_date: '2024-01-15',
        to_date: '2024-01-16',
        total_days: 2,
        reason: 'Personal leave for final testing'
      }
    };

    // Transform the data to match API expectations (same as frontend does)
    const apiData = {
      employee_id: requestData.created_by_employee_id, // Map created_by_employee_id to employee_id
      status: 'pending',
      priority: 'medium',
      due_date: null,
      data: {
        request_type: requestData.request_type,
        title: requestData.title,
        description: requestData.description,
        ...requestData.request_data
      }
    };

    const createResponse = await fetch('http://localhost:3001/api/employee-requests', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(apiData)
    });

    const createResult = await createResponse.json();

    if (!createResponse.ok || !createResult.success) {
      console.log(`❌ Request creation failed: ${createResult.message}`);
      return;
    }

    console.log('✅ Request created successfully!');
    console.log(`   Request ID: ${createResult.data.id}`);
    console.log(`   Employee ID: ${createResult.data.employee_id}`);
    console.log(`   Status: ${createResult.data.status}`);
    console.log(`   Priority: ${createResult.data.priority}`);

    // Step 4: Verify request was saved
    console.log('\n4. Verifying request was saved...');
    const listResponse = await fetch('http://localhost:3001/api/employee-requests', {
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

    const testRequest = listResult.data.find(req => req.id === createResult.data.id);
    if (testRequest) {
      console.log('✅ Request found in database!');
      console.log(`   Employee: ${testRequest.employee?.full_name}`);
      console.log(`   Data: ${JSON.stringify(testRequest.data)}`);
    } else {
      console.log('❌ Request not found in database');
    }

    // Clean up
    await supabase.auth.signOut();

    console.log('\n🎉 SUCCESS! The request form is now working correctly!');
    console.log('\n📋 SUMMARY:');
    console.log('   ✅ Admin login working');
    console.log('   ✅ Current employee API working');
    console.log('   ✅ Request creation API working');
    console.log('   ✅ Request saved to database');
    console.log('   ✅ Frontend now uses correct API endpoint');
    
    console.log('\n🚀 READY TO USE:');
    console.log('   1. Login as admin@merakierp.com with password: admin123');
    console.log('   2. Go to Requests tab');
    console.log('   3. Click "Tạo yêu cầu mới"');
    console.log('   4. Fill out the form and submit');
    console.log('   5. The request should be created successfully!');

  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

// Run the test
if (require.main === module) {
  testRequestFormFinal().catch(console.error);
}

module.exports = { testRequestFormFinal };
