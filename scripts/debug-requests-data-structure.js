// Debug script to check the actual data structure returned by the requests API
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugRequestsDataStructure() {
  console.log('🔍 Debugging Requests Data Structure...\n');

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

    // Step 2: Fetch requests from API
    console.log('\n2. Fetching requests from /api/employee-requests...');
    const response = await fetch('http://localhost:3001/api/employee-requests', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      console.log(`❌ Failed to fetch requests: ${result.message}`);
      return;
    }

    console.log('✅ Requests fetched successfully!');
    console.log(`   Total requests: ${result.data.length}`);

    // Step 3: Analyze the data structure
    if (result.data.length > 0) {
      console.log('\n3. Analyzing data structure...');
      const firstRequest = result.data[0];
      
      console.log('📋 First request structure:');
      console.log('   Keys:', Object.keys(firstRequest));
      console.log('   ID:', firstRequest.id);
      console.log('   Status:', firstRequest.status);
      console.log('   Priority:', firstRequest.priority);
      console.log('   Created at:', firstRequest.created_at);
      console.log('   Employee ID:', firstRequest.employee_id);
      
      if (firstRequest.data) {
        console.log('   Data field keys:', Object.keys(firstRequest.data));
        console.log('   Data.title:', firstRequest.data.title);
        console.log('   Data.request_type:', firstRequest.data.request_type);
        console.log('   Data.description:', firstRequest.data.description);
      }
      
      if (firstRequest.employee) {
        console.log('   Employee field keys:', Object.keys(firstRequest.employee));
        console.log('   Employee.full_name:', firstRequest.employee.full_name);
        console.log('   Employee.position:', firstRequest.employee.position);
      }

      console.log('\n📄 Full first request object:');
      console.log(JSON.stringify(firstRequest, null, 2));
    } else {
      console.log('\n⚠️  No requests found in database');
    }

    // Clean up
    await supabase.auth.signOut();

  } catch (error) {
    console.error('❌ Debug error:', error.message);
  }
}

// Run the debug
if (require.main === module) {
  debugRequestsDataStructure().catch(console.error);
}

module.exports = { debugRequestsDataStructure };
